import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateScenarios(
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
          content: `You are a learning experience designer creating realistic workplace scenarios for professional development. For each module, create ONE immersive decision-making scenario.

The scenario should:
- Present a realistic professional situation related to the module topic
- Provide context (who you are, what's happening, what's at stake)
- Offer 3-4 response options with varying effectiveness
- Each option should have feedback explaining why it's good/bad and a score (0-100)
- One option should be clearly best (score 80-100), one mediocre (40-60), one poor (0-30)`,
        },
        {
          role: "user",
          content: `Generate AI scenarios for these ${modules.length} modules:\n\n${moduleList}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_scenarios",
            description: "Save generated AI scenarios for course modules",
            parameters: {
              type: "object",
              properties: {
                modules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      module_id: { type: "string" },
                      scenario: { type: "string", description: "The scenario title/headline" },
                      context: { type: "string", description: "Detailed scenario description (2-4 sentences)" },
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            text: { type: "string", description: "The response option" },
                            feedback: { type: "string", description: "Why this is good/bad (1-2 sentences)" },
                            score: { type: "number", description: "Score 0-100" },
                          },
                          required: ["text", "feedback", "score"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["module_id", "scenario", "context", "options"],
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
      tool_choice: { type: "function", function: { name: "save_scenarios" } },
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
    if (!mod.module_id || !mod.scenario || !mod.options?.length) { skipped++; continue; }
    
    const { error } = await supabase.from("module_resources").insert({
      module_id: mod.module_id,
      resource_type: "ai_scenario",
      title: mod.scenario,
      description: mod.context,
      resource_data: { scenario: mod.scenario, context: mod.context, options: mod.options },
      stage_number: 3, // Practice stage
      display_order: 2,
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

    const { data: existingScenarios } = await supabase
      .from("module_resources").select("module_id").eq("resource_type", "ai_scenario").in("module_id", (allModules || []).map((m: any) => m.id));
    const modulesWithScenarios = new Set((existingScenarios || []).map((r: any) => r.module_id));

    const pendingModules = (allModules || []).filter((m: any) => !modulesWithScenarios.has(m.id));
    const batch = pendingModules.slice(0, batch_size);

    if (batch.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, skipped: 0, remaining: 0, total: totalAll }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await generateScenarios(batch, courseMap, supabase);

    const { data: freshScenarios } = await supabase
      .from("module_resources").select("module_id").eq("resource_type", "ai_scenario").in("module_id", (allModules || []).map((m: any) => m.id));
    const freshWithScenarios = new Set((freshScenarios || []).map((r: any) => r.module_id));
    const freshRemaining = (allModules || []).filter((m: any) => !freshWithScenarios.has(m.id)).length;

    return new Response(
      JSON.stringify({ inserted: result.inserted, skipped: result.skipped, remaining: freshRemaining, total: totalAll }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("batch-generate-scenarios error:", e);
    const status = e?.status || 500;
    if (status === 429 || status === 402) {
      return new Response(JSON.stringify({ error: e.message, code: status }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
