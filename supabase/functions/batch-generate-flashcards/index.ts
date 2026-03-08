import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateFlashcards(
  modules: any[],
  courseMap: Record<string, { title: string; programName: string }>,
  supabase: any
): Promise<{ inserted: number; skipped: number }> {
  const moduleList = modules.map((m: any, i: number) => {
    const course = courseMap[m.content_id] || { title: "Unknown", programName: "Unknown" };
    return `${i + 1}. Module ID: ${m.id}\n   Course: "${course.title}"\n   Program: "${course.programName}"\n   Module: "${m.title}"\n   Description: ${(m.description || "").slice(0, 300)}`;
  }).join("\n\n");

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an educator creating flashcards for professional learning. For each module, generate 8-12 flashcard pairs. Each card should have a clear question/concept on the front and a concise answer/explanation on the back.

Rules:
- Cover key terms, concepts, frameworks, and practical applications
- Front should be a question or key term
- Back should be a clear, concise answer (1-3 sentences)
- Progress from basic definitions to applied concepts
- Make them useful for quick review and retention`,
        },
        {
          role: "user",
          content: `Generate flashcards for these ${modules.length} modules:\n\n${moduleList}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_flashcards",
            description: "Save generated flashcards for course modules",
            parameters: {
              type: "object",
              properties: {
                modules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      module_id: { type: "string" },
                      cards: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            front: { type: "string" },
                            back: { type: "string" },
                          },
                          required: ["front", "back"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["module_id", "cards"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["modules"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_flashcards" } },
    }),
  });

  clearTimeout(timeout);

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    const text = await aiResponse.text();
    if (status === 429) throw Object.assign(new Error("Rate limited"), { status: 429 });
    if (status === 402) throw Object.assign(new Error("AI credits exhausted"), { status: 402 });
    console.error("AI error:", status, text);
    throw new Error(`AI gateway error: ${status}`);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");

  const { modules: generatedModules } = JSON.parse(toolCall.function.arguments);

  let inserted = 0;
  let skipped = 0;

  for (const mod of generatedModules) {
    if (!mod.module_id || !mod.cards?.length) { skipped++; continue; }
    
    const { error } = await supabase.from("module_resources").insert({
      module_id: mod.module_id,
      resource_type: "flashcards",
      title: "Flashcards",
      description: `${mod.cards.length} flashcard pairs for review`,
      resource_data: { cards: mod.cards },
      stage_number: 3, // Practice stage
      display_order: 1,
    });
    if (!error) inserted++;
    else { console.error("Insert error:", error); skipped++; }
  }

  return { inserted, skipped };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { school_id, batch_size = 3 } = await req.json();
    if (!school_id) throw new Error("school_id required");

    const { data: programs } = await supabase
      .from("profession_categories").select("id, name").eq("school_id", school_id);
    if (!programs?.length) return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const programIds = programs.map((p: any) => p.id);
    const programMap = Object.fromEntries(programs.map((p: any) => [p.id, p.name]));

    const { data: courses } = await supabase
      .from("content").select("id, title, profession_line_id").in("profession_line_id", programIds);
    if (!courses?.length) return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const courseIds = courses.map((c: any) => c.id);
    const courseMap = Object.fromEntries(courses.map((c: any) => [c.id, { title: c.title, programName: programMap[c.profession_line_id] || "Unknown" }]));

    const { data: allModules } = await supabase
      .from("course_modules").select("id, title, description, content_id").in("content_id", courseIds).order("created_at", { ascending: true }).limit(1000);
    const totalAll = (allModules || []).length;

    // Get modules that already have flashcards
    const { data: existingFlashcards } = await supabase
      .from("module_resources").select("module_id").eq("resource_type", "flashcards").in("module_id", (allModules || []).map((m: any) => m.id));
    const modulesWithFlashcards = new Set((existingFlashcards || []).map((r: any) => r.module_id));

    const pendingModules = (allModules || []).filter((m: any) => !modulesWithFlashcards.has(m.id));
    const batch = pendingModules.slice(0, batch_size);

    if (batch.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: totalAll }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await generateFlashcards(batch, courseMap, supabase);

    const { data: freshFlashcards } = await supabase
      .from("module_resources").select("module_id").eq("resource_type", "flashcards").in("module_id", (allModules || []).map((m: any) => m.id));
    const freshWithFlashcards = new Set((freshFlashcards || []).map((r: any) => r.module_id));
    const freshRemaining = (allModules || []).filter((m: any) => !freshWithFlashcards.has(m.id)).length;

    return new Response(
      JSON.stringify({ inserted: result.inserted, skipped: result.skipped, remaining: freshRemaining, total: totalAll }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-flashcards error:", e);
    const status = e?.status || 500;
    if (status === 429 || status === 402) {
      return new Response(JSON.stringify({ error: e.message, code: status }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
