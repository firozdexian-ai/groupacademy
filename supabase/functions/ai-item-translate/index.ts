import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGS: Record<string, string> = {
  bn: "Bengali",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  hi: "Hindi",
  id: "Indonesian",
  pt: "Portuguese",
  de: "German",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return j({ error: "forbidden" }, 403);

    const { item_id, item_type, target_language } = await req.json();
    if (!item_id || !item_type || !target_language) {
      return j({ error: "missing fields" }, 400);
    }
    const langName = SUPPORTED_LANGS[target_language];
    if (!langName) return j({ error: "unsupported language" }, 400);

    const table = item_type === "quiz" ? "module_quiz_pool" : "module_scenario_pool";
    const { data: item, error: itemErr } = await admin
      .from(table)
      .select("*")
      .eq("id", item_id)
      .maybeSingle();
    if (itemErr || !item) return j({ error: "item not found" }, 404);

    const isQuiz = item_type === "quiz";
    const sourcePayload = isQuiz
      ? { question: item.question, options: item.options, explanation: item.explanation ?? "" }
      : { prompt: item.prompt, rubric: item.rubric };

    const tool = isQuiz
      ? {
          type: "function",
          function: {
            name: "translate_quiz",
            description: "Translate quiz item preserving structure and correct answer index.",
            parameters: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                explanation: { type: "string" },
              },
              required: ["question", "options"],
              additionalProperties: false,
            },
          },
        }
      : {
          type: "function",
          function: {
            name: "translate_scenario",
            description: "Translate scenario prompt and rubric items.",
            parameters: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                rubric: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      criterion: { type: "string" },
                      weight: { type: "number" },
                    },
                    required: ["criterion", "weight"],
                  },
                },
              },
              required: ["prompt", "rubric"],
              additionalProperties: false,
            },
          },
        };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You translate ${isQuiz ? "quiz questions" : "scenario prompts and rubrics"} into ${langName}. Preserve technical terms, names, code, and numerical values. Maintain the exact structure: keep the same number of options/rubric items in the same order. Translate prose only.`,
          },
          {
            role: "user",
            content: `Translate to ${langName}:\n\n${JSON.stringify(sourcePayload, null, 2)}`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (aiResp.status === 429) return j({ error: "Rate limit exceeded, try again shortly." }, 429);
    if (aiResp.status === 402) return j({ error: "Add AI credits to continue." }, 402);
    if (!aiResp.ok) return j({ error: "AI gateway error" }, 500);

    const aiJson = await aiResp.json();
    const args = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return j({ error: "no translation returned" }, 500);
    const translated = JSON.parse(args);

    // Validate structure preservation
    if (isQuiz && Array.isArray(item.options) && translated.options?.length !== item.options.length) {
      return j({ error: "option count mismatch" }, 422);
    }
    if (!isQuiz && Array.isArray(item.rubric) && translated.rubric?.length !== item.rubric.length) {
      return j({ error: "rubric count mismatch" }, 422);
    }

    return j({
      ok: true,
      language_code: target_language,
      language_name: langName,
      source: sourcePayload,
      translated,
    });
  } catch (e) {
    console.error("ai-item-translate error", e);
    return j({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
