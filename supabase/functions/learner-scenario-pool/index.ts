import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const POOL_TARGET = 5;

async function generateScenario(moduleTitle: string, moduleDesc: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Design a realistic role-play scenario for a learning module. Provide a setup the learner steps into, plus a 3-criteria rubric for evaluating their handling." },
        { role: "user", content: `Module: ${moduleTitle}\nDescription: ${moduleDesc}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "scenario",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              scenario_prompt: { type: "string" },
              rubric: {
                type: "array", minItems: 3, maxItems: 3,
                items: {
                  type: "object",
                  properties: { criterion: { type: "string" }, weight: { type: "number" } },
                  required: ["criterion", "weight"], additionalProperties: false,
                },
              },
            },
            required: ["title", "scenario_prompt", "rubric"], additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "scenario" } },
    }),
  });
  if (resp.status === 429 || resp.status === 402) throw new Error(resp.status === 402 ? "AI credits exhausted" : "Rate limited");
  if (!resp.ok) throw new Error(`AI ${resp.status}`);
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: talent } = await sb.from("talents").select("id,full_name").eq("user_id", u.user.id).maybeSingle();
    if (!talent) return new Response(JSON.stringify({ error: "Not a talent" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const moduleId = body.module_id as string;
    const { data: enrolled } = await sb.rpc("is_enrolled_in_module", { _module_id: moduleId });
    if (!enrolled) return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (body.mode === "draw") {
      const { count } = await sb.from("module_scenario_pool").select("id", { count: "exact", head: true }).eq("module_id", moduleId).gte("quality_score", 0);
      if ((count ?? 0) < POOL_TARGET) {
        const { data: mod } = await sb.from("course_modules").select("title,description").eq("id", moduleId).single();
        try {
          const sc = await generateScenario(mod?.title ?? "", mod?.description ?? "");
          await sb.from("module_scenario_pool").insert({
            module_id: moduleId, title: sc.title, scenario_prompt: sc.scenario_prompt,
            rubric: sc.rubric, generated_by: "ai", created_by_talent_id: talent.id,
          });
        } catch (e) { console.error("gen scenario failed", e); }
      }
      const { data: items } = await sb.from("module_scenario_pool")
        .select("id,title,scenario_prompt,rubric")
        .eq("module_id", moduleId).gte("quality_score", 0)
        .order("times_served", { ascending: true }).limit(3);
      if (!items?.length) return new Response(JSON.stringify({ error: "No scenarios yet" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const pick = items[Math.floor(Math.random() * items.length)];
      return new Response(JSON.stringify({ scenario: pick, learner_name: talent.full_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "turn") {
      // body: scenario_prompt, conversation:[{role,content}], user_message
      const messages = [
        { role: "system", content: `You are role-playing the counterpart in this scenario. Stay in character. Be realistic, push back, ask follow-ups. Scenario: ${body.scenario_prompt}` },
        ...(body.conversation || []),
        { role: "user", content: body.user_message },
      ];
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, stream: true }),
      });
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(JSON.stringify({ error: aiResp.status === 402 ? "Credits exhausted" : "Rate limited" }),
          { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(aiResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (body.mode === "evaluate") {
      // body: scenario_id, conversation, rubric
      const evalResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Evaluate the learner's performance against the rubric. Score each criterion 0-100 with brief feedback." },
            { role: "user", content: `Rubric: ${JSON.stringify(body.rubric)}\nConversation:\n${(body.conversation || []).map((m: any) => `${m.role}: ${m.content}`).join("\n")}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "evaluation",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number" },
                  criteria: { type: "array", items: { type: "object", properties: { criterion: { type: "string" }, score: { type: "number" }, feedback: { type: "string" } }, required: ["criterion", "score", "feedback"], additionalProperties: false } },
                  summary: { type: "string" },
                },
                required: ["overall_score", "criteria", "summary"], additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "evaluation" } },
        }),
      });
      if (!evalResp.ok) return new Response(JSON.stringify({ error: `AI ${evalResp.status}` }), { status: evalResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ed = await evalResp.json();
      const evalData = JSON.parse(ed.choices[0].message.tool_calls[0].function.arguments);
      await sb.from("talent_scenario_run").insert({
        talent_id: talent.id, module_id: moduleId, scenario_id: body.scenario_id,
        conversation: body.conversation, evaluation: evalData,
      });
      return new Response(JSON.stringify({ evaluation: evalData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
