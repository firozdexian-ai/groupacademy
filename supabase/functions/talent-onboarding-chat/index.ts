import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    type: "function",
    function: {
      name: "update_talent_profile",
      description:
        "Save a single profile field for the current talent. Call immediately whenever the user provides their name, phone, or skills.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: ["full_name", "phone", "skills"],
            description: "Which profile field to write.",
          },
          value: {
            type: "string",
            description:
              "The value. For skills, pass a comma-separated list (e.g. 'react, node, figma').",
          },
        },
        required: ["field", "value"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_career_coach",
      description:
        "Assign a domain-expert Instructor as the talent's career coach AND hand off the conversation. Call this the moment the user names their profession or career field. Returns the agent_key the client should switch to.",
      parameters: {
        type: "object",
        properties: {
          profession_id: {
            type: "string",
            description: "UUID of the profession_categories row matching the user's stated profession.",
          },
          goal: {
            type: "string",
            description: "Optional career goal (e.g. 'job', 'gig', 'study_abroad').",
          },
        },
        required: ["profession_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_professions",
      description:
        "Look up profession_categories by free-text name to obtain the profession_id needed by assign_career_coach.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Profession name or keyword (e.g. 'graphic design')." },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "unauthorized" }, 401);

    const { messages: incoming } = await req.json();

    const { data: agent } = await userClient
      .from("ai_agents")
      .select("system_prompt, name")
      .eq("agent_key", "talent-onboarding")
      .maybeSingle();

    const { data: talent } = await userClient
      .from("talents")
      .select("full_name, phone, skills, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const known = `\n\nKNOWN PROFILE:\n- full_name: ${talent?.full_name || "(missing)"}\n- phone: ${talent?.phone || "(missing)"}\n- skills: ${
      Array.isArray(talent?.skills) && talent!.skills.length
        ? (talent!.skills as any[]).join(", ")
        : "(missing)"
    }\nNever re-ask for fields already known. Ask for the next missing one. After all three are saved, congratulate the user.`;

    const systemPrompt = (agent?.system_prompt || "You are Aisha, a friendly onboarding concierge.") + known;

    const conversation: any[] = [{ role: "system", content: systemPrompt }, ...incoming];

    let handoff: { agent_key: string; instructor_id: string | null } | null = null;
    // Tool-calling loop (max 4 turns to be safe)
    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversation,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!r.ok) {
        const status = r.status;
        const text = await r.text();
        console.error("AI gateway error", status, text);
        if (status === 429 || status === 402) {
          return json({ error: status === 402 ? "credits_exhausted" : "rate_limited" }, status);
        }
        return json({ error: "ai_error" }, 500);
      }

      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) return json({ error: "no_message" }, 500);

      conversation.push(msg);

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        return json({ reply: msg.content || "" }, 200);
      }

      for (const tc of toolCalls) {
        let result: any = { ok: false, error: "unknown_tool" };
        const fname = tc.function?.name;
        try {
          const args = JSON.parse(tc.function?.arguments || "{}");
          if (fname === "update_talent_profile") {
            const { data: rpcData, error: rpcErr } = await userClient.rpc("update_talent_profile", {
              p_field: args.field,
              p_value: String(args.value ?? ""),
            });
            result = rpcErr ? { ok: false, error: rpcErr.message } : rpcData;
          } else if (fname === "assign_career_coach") {
            const { data: rpcData, error: rpcErr } = await userClient.rpc("assign_career_coach", {
              p_profession_id: args.profession_id,
              p_goal: args.goal ?? null,
            });
            result = rpcErr ? { ok: false, error: rpcErr.message } : rpcData;
            if ((result as any)?.ok && (result as any)?.agent_key) {
              (result as any).handoff = true;
            }
          } else if (fname === "search_professions") {
            const { data: rows, error: pErr } = await userClient
              .from("profession_categories")
              .select("id, name")
              .ilike("name", `%${String(args.query ?? "")}%`)
              .limit(8);
            result = pErr ? { ok: false, error: pErr.message } : { ok: true, results: rows ?? [] };
          }
        } catch (e) {
          result = { ok: false, error: String(e) };
        }
        conversation.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    return json({ reply: "Thanks! Your profile is saved." }, 200);
  } catch (e) {
    console.error("talent-onboarding-chat fault:", e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
