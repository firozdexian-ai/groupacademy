// learner-scenario-evaluate (2.5.b)
// Scores a finished scenario run via Lovable AI and writes the structured
// evaluation JSON to talent_scenario_run.evaluation. Subsequent skill-profile
// updates are handled by the trigger added in 2.5.c.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ReqBody {
  run_id?: string;
  force?: boolean;
}

interface TopicScore {
  tag: string;
  score: number;
  weight?: number;
  notes?: string;
}

interface EvaluationV1 {
  version: 1;
  overall: number;
  rubric_id: string;
  evaluated_at: string;
  topics: TopicScore[];
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clamp01 = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
};

const TOOL_DEF = {
  type: "function",
  function: {
    name: "submit_evaluation",
    description:
      "Score the learner's scenario performance against each rubric topic, returning per-topic scores in [0, 1] with brief rubric notes.",
    parameters: {
      type: "object",
      properties: {
        overall: {
          type: "number",
          description: "Overall performance 0..1 (weighted blend of topics).",
        },
        topics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tag: { type: "string", description: "Topic tag from the rubric." },
              score: { type: "number", description: "0..1 mastery on this topic." },
              weight: {
                type: "number",
                description: "Optional weight (default 1).",
              },
              notes: {
                type: "string",
                description: "1-2 sentence justification grounded in the transcript.",
              },
            },
            required: ["tag", "score", "notes"],
            additionalProperties: false,
          },
        },
      },
      required: ["overall", "topics"],
      additionalProperties: false,
    },
  },
};

function buildSystemPrompt(rubric: unknown, topicTags: string[]) {
  const rubricText =
    rubric && Array.isArray(rubric) && rubric.length > 0
      ? JSON.stringify(rubric, null, 2)
      : "(no explicit rubric — use general professional communication and the topic tags as criteria)";
  return `You are an expert instructional evaluator. You score a learner's performance in a role-play scenario against a fixed rubric.

Rubric:
${rubricText}

Topic tags expected in the response (score every one of these, even if 0):
${topicTags.length ? topicTags.join(", ") : "(none — invent up to 3 topic tags from the rubric)"}

Rules:
- Score each topic strictly between 0 (no evidence / wrong) and 1 (perfect).
- Justify each score in 1-2 sentences quoting or paraphrasing the transcript.
- Be calibrated: 0.5 means partial, 0.8 means strong, 1.0 only for clearly excellent execution.
- Return your answer ONLY by calling submit_evaluation.`;
}

function flattenConversation(conv: unknown): string {
  if (!Array.isArray(conv)) return "";
  return conv
    .map((m: any) => {
      const role = (m?.role ?? "user").toString();
      const content =
        typeof m?.content === "string"
          ? m.content
          : JSON.stringify(m?.content ?? "");
      return `${role.toUpperCase()}: ${content}`;
    })
    .join("\n\n");
}

async function callEvaluator(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ overall: number; topics: TopicScore[] } | { error: string; status: number }> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [TOOL_DEF],
      tool_choice: { type: "function", function: { name: "submit_evaluation" } },
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) return { error: "Rate limited, please retry shortly.", status: 429 };
    if (resp.status === 402) return { error: "AI credits exhausted. Add credits to continue.", status: 402 };
    const text = await resp.text();
    console.error("AI gateway error:", resp.status, text);
    return { error: "AI gateway error", status: 500 };
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    console.error("No tool call in evaluator response", JSON.stringify(data));
    return { error: "Evaluator returned no structured output", status: 502 };
  }

  let args: any;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error("Failed to parse evaluator arguments:", e, toolCall.function.arguments);
    return { error: "Evaluator returned invalid JSON", status: 502 };
  }

  if (!Array.isArray(args.topics) || args.topics.length === 0) {
    return { error: "Evaluator returned no topics", status: 502 };
  }

  const topics: TopicScore[] = args.topics
    .filter((t: any) => t && typeof t.tag === "string")
    .map((t: any) => ({
      tag: String(t.tag),
      score: clamp01(t.score),
      weight: typeof t.weight === "number" && t.weight >= 0 ? t.weight : 1,
      notes: typeof t.notes === "string" ? t.notes.slice(0, 600) : undefined,
    }));

  if (topics.length === 0) {
    return { error: "Evaluator returned no usable topics", status: 502 };
  }

  return {
    overall: clamp01(args.overall),
    topics,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  if (!LOVABLE_API_KEY) {
    return json(500, { error: "LOVABLE_API_KEY is not configured" });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized" });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return json(401, { error: "Unauthorized" });
  }
  const userId = claimsData.claims.sub as string;

  // Body
  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  if (!body.run_id || typeof body.run_id !== "string") {
    return json(400, { error: "run_id is required" });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load run + verify ownership via talents.user_id
  const { data: run, error: runErr } = await admin
    .from("talent_scenario_run")
    .select("id, talent_id, module_id, scenario_id, conversation, evaluation")
    .eq("id", body.run_id)
    .maybeSingle();

  if (runErr || !run) {
    console.error("run lookup error:", runErr);
    return json(404, { error: "Scenario run not found" });
  }

  const { data: talent, error: talentErr } = await admin
    .from("talents")
    .select("id, user_id")
    .eq("id", run.talent_id)
    .maybeSingle();

  if (talentErr || !talent || talent.user_id !== userId) {
    return json(403, { error: "Not allowed to evaluate this run" });
  }

  if (run.evaluation && !body.force) {
    return json(200, { evaluation: run.evaluation, cached: true });
  }

  // Load scenario rubric (optional)
  let rubric: unknown = [];
  let topicTags: string[] = [];
  let rubricId = "default_v1";
  if (run.scenario_id) {
    const { data: scenario } = await admin
      .from("module_scenario_pool")
      .select("id, rubric, topic_tags")
      .eq("id", run.scenario_id)
      .maybeSingle();
    if (scenario) {
      rubric = scenario.rubric ?? [];
      topicTags = Array.isArray(scenario.topic_tags) ? scenario.topic_tags : [];
      rubricId = `scenario:${scenario.id}`;
    }
  }

  const transcript = flattenConversation(run.conversation);
  if (!transcript.trim()) {
    return json(400, { error: "Scenario transcript is empty; cannot evaluate" });
  }

  const systemPrompt = buildSystemPrompt(rubric, topicTags);
  const userPrompt = `Transcript of the role-play (most recent last):\n\n${transcript}\n\nScore the learner now.`;

  const evalResult = await callEvaluator(systemPrompt, userPrompt);
  if ("error" in evalResult) {
    return json(evalResult.status, { error: evalResult.error });
  }

  // If scenario constrained topics, keep only those (preserve rubric integrity)
  let finalTopics = evalResult.topics;
  if (topicTags.length > 0) {
    const allowed = new Set(topicTags);
    const kept = finalTopics.filter((t) => allowed.has(t.tag));
    // Backfill any missing rubric tag with a 0 baseline so the EWMA trigger
    // sees a signal for every expected topic.
    const seen = new Set(kept.map((t) => t.tag));
    for (const tag of topicTags) {
      if (!seen.has(tag)) {
        kept.push({ tag, score: 0, weight: 1, notes: "Not addressed in transcript." });
      }
    }
    finalTopics = kept;
  }

  const evaluation: EvaluationV1 = {
    version: 1,
    overall: evalResult.overall,
    rubric_id: rubricId,
    evaluated_at: new Date().toISOString(),
    topics: finalTopics,
  };

  const { error: updateErr } = await admin
    .from("talent_scenario_run")
    .update({ evaluation })
    .eq("id", run.id);

  if (updateErr) {
    console.error("evaluation write failed:", updateErr);
    return json(500, { error: updateErr.message });
  }

  // Auto-issue skill credentials for any topics that just crossed thresholds.
  // Fire-and-forget; errors are logged but never fail the evaluation response.
  try {
    for (const t of finalTopics) {
      admin
        .rpc("issue_skill_credential", {
          _talent_id: run.talent_id,
          _module_id: run.module_id,
          _topic_tag: t.tag,
        })
        .then(({ error }: any) => {
          if (error) console.error("issue_skill_credential failed", t.tag, error);
        });
    }
  } catch (e) {
    console.error("credential mint loop failed", e);
  }

  return json(200, { evaluation, cached: false });
});
