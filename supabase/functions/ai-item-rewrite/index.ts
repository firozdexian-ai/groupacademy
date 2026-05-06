// AI item rewrite — phase 3.7
// Loads a flagged quiz/scenario item, asks Lovable AI for 1–3 structured rewrites
// targeting the supplied flags, returns suggestions only (no DB write).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FLAG_GUIDANCE: Record<string, string> = {
  low_p_value: "Item is too hard for the cohort (p<0.25). Simplify wording, remove ambiguity, or weaken distractors—do NOT change the assessed concept.",
  trivial: "Item is too easy (p>0.95). Increase difficulty by adding plausible distractors or a more nuanced stem.",
  miscalibrated: "Difficulty label does not match observed performance. Adjust difficulty label and/or distractors accordingly.",
  stale: "Item barely served. Refresh wording so it feels current and motivating; keep concept identical.",
  low_rubric: "Scenario rubric scores are very low (<0.3). Tighten the prompt with explicit success criteria; rebalance rubric weights.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return json({ error: "ai_unavailable" }, 503);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await admin
    .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
  if (!roleData) return json({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const kind: "quiz" | "scenario" = body?.kind;
  const itemId: string = body?.item_id;
  const flags: string[] = Array.isArray(body?.flags) ? body.flags : [];
  const notes: string = (body?.notes ?? "").toString().slice(0, 500);
  if (!itemId || !["quiz", "scenario"].includes(kind)) return json({ error: "bad_request" }, 400);

  const flagText = flags.length
    ? flags.map((f) => `- ${f}: ${FLAG_GUIDANCE[f] ?? "Address this flag"}`).join("\n")
    : "- Improve clarity, calibration, and educational value.";

  if (kind === "quiz") {
    const { data: item } = await admin.from("module_quiz_pool")
      .select("id,module_id,question,options,correct_index,explanation,difficulty,topic_tags,times_served,times_correct")
      .eq("id", itemId).maybeSingle();
    if (!item) return json({ error: "item_not_found" }, 404);
    const pVal = (item as any).times_served > 0
      ? ((item as any).times_correct / (item as any).times_served).toFixed(2) : "n/a";

    const tools = [{
      type: "function",
      function: {
        name: "propose_quiz_rewrites",
        description: "Return 1–3 rewritten quiz items.",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array", minItems: 1, maxItems: 3,
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "Short label like 'Clarified stem' or 'Harder distractors'" },
                  question: { type: "string", maxLength: 600 },
                  options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string", maxLength: 200 } },
                  correct_index: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string", maxLength: 600 },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  change_summary: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["label", "question", "options", "correct_index", "difficulty", "change_summary", "rationale"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert assessment item writer. Rewrite quiz items so they accurately measure the same learning objective at appropriate difficulty. Keep concept identical. Always 4 options. Output via the tool only." },
          { role: "user", content: `Current item:\n${JSON.stringify(item, null, 2)}\n\nObserved p-value: ${pVal}\n\nFlags to address:\n${flagText}\n\nAuthor notes: ${notes || "(none)"}\n\nReturn 2 distinct rewrites.` },
        ],
        tools, tool_choice: { type: "function", function: { name: "propose_quiz_rewrites" } },
      }),
    });
    if (aiResp.status === 429) return json({ error: "rate_limited" }, 429);
    if (aiResp.status === 402) return json({ error: "ai_credits_exhausted" }, 402);
    if (!aiResp.ok) return json({ error: "ai_error", detail: await aiResp.text() }, 502);
    const aiJson = await aiResp.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: any[] = [];
    try { suggestions = JSON.parse(call?.function?.arguments ?? "{}").suggestions ?? []; } catch { /* */ }
    return json({ kind, item, flags, suggestions });
  }

  // scenario
  const { data: item } = await admin.from("module_scenario_pool")
    .select("id,module_id,title,scenario_prompt,rubric,difficulty,topic_tags,times_served")
    .eq("id", itemId).maybeSingle();
  if (!item) return json({ error: "item_not_found" }, 404);

  // Avg overall + per-rubric
  const { data: runs = [] } = await admin
    .from("talent_scenario_run").select("evaluation").eq("scenario_id", itemId).limit(200);
  let n = 0, sum = 0; const rubricAgg = new Map<string, { s: number; n: number }>();
  for (const r of runs ?? []) {
    const ev = (r as any).evaluation ?? {};
    const o = Number(ev?.overall_score ?? NaN);
    if (Number.isFinite(o)) { sum += o; n += 1; }
    const per = ev?.per_rubric ?? ev?.rubric_scores ?? {};
    if (per && typeof per === "object") {
      for (const [k, v] of Object.entries(per)) {
        const num = Number((v as any)?.score ?? v);
        if (!Number.isFinite(num)) continue;
        const c = rubricAgg.get(k) ?? { s: 0, n: 0 }; c.s += num; c.n += 1; rubricAgg.set(k, c);
      }
    }
  }
  const stats = {
    avg_overall: n > 0 ? +(sum / n).toFixed(2) : null,
    per_rubric: Object.fromEntries(Array.from(rubricAgg.entries()).map(([k, v]) => [k, +(v.s / v.n).toFixed(2)])),
  };

  const tools = [{
    type: "function",
    function: {
      name: "propose_scenario_rewrites",
      description: "Return 1–3 rewritten scenarios.",
      parameters: {
        type: "object",
        properties: {
          suggestions: {
            type: "array", minItems: 1, maxItems: 3,
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                title: { type: "string", maxLength: 200 },
                scenario_prompt: { type: "string", maxLength: 2000 },
                rubric: {
                  type: "array", minItems: 2, maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      criterion: { type: "string" },
                      weight: { type: "number", minimum: 0, maximum: 1 },
                      description: { type: "string" },
                    },
                    required: ["criterion", "weight", "description"],
                    additionalProperties: false,
                  },
                },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                change_summary: { type: "string" },
                rationale: { type: "string" },
              },
              required: ["label", "title", "scenario_prompt", "rubric", "difficulty", "change_summary", "rationale"],
              additionalProperties: false,
            },
          },
        },
        required: ["suggestions"],
        additionalProperties: false,
      },
    },
  }];

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an expert scenario designer. Rewrite scenarios so they elicit observable behavior matching the rubric, with explicit success criteria. Keep concept identical. Output via the tool only." },
        { role: "user", content: `Current scenario:\n${JSON.stringify(item, null, 2)}\n\nObserved stats: ${JSON.stringify(stats)}\n\nFlags to address:\n${flagText}\n\nAuthor notes: ${notes || "(none)"}\n\nReturn 2 distinct rewrites. Rubric weights should sum to ~1.0.` },
      ],
      tools, tool_choice: { type: "function", function: { name: "propose_scenario_rewrites" } },
    }),
  });
  if (aiResp.status === 429) return json({ error: "rate_limited" }, 429);
  if (aiResp.status === 402) return json({ error: "ai_credits_exhausted" }, 402);
  if (!aiResp.ok) return json({ error: "ai_error", detail: await aiResp.text() }, 502);
  const aiJson = await aiResp.json();
  const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
  let suggestions: any[] = [];
  try { suggestions = JSON.parse(call?.function?.arguments ?? "{}").suggestions ?? []; } catch { /* */ }
  return json({ kind, item, flags, stats, suggestions });
});
