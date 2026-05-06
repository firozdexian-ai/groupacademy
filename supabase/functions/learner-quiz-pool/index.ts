import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const POOL_TARGET = 20;
const DRAW_N = 5;
const GENERATE_BATCH = 5;
const DAILY_GEN_CAP = 2;

interface DrawBody { mode: "draw"; module_id: string; }
interface SubmitBody { mode: "submit"; module_id: string; item_ids: string[]; answers: number[]; }

async function generateQuestions(moduleTitle: string, moduleDesc: string, n: number) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Generate multiple-choice quiz questions for a learning module. Each question has 4 options and exactly one correct answer. Mix difficulty. Include a brief explanation." },
        { role: "user", content: `Module: ${moduleTitle}\nDescription: ${moduleDesc}\nGenerate ${n} questions.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "quiz_questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array", minItems: n, maxItems: n,
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correct_index: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  },
                  required: ["question", "options", "correct_index", "explanation", "difficulty"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"], additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "quiz_questions" } },
    }),
  });
  if (resp.status === 429 || resp.status === 402) {
    throw new Error(resp.status === 402 ? "AI credits exhausted" : "Rate limited");
  }
  if (!resp.ok) throw new Error(`AI ${resp.status}`);
  const data = await resp.json();
  return JSON.parse(data.choices[0].message.tool_calls[0].function.arguments).questions;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: u } = await sbAdmin.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Resolve talent_id
    const { data: talent } = await sbAdmin.from("talents").select("id").eq("user_id", u.user.id).maybeSingle();
    if (!talent) return new Response(JSON.stringify({ error: "Not a talent" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json() as DrawBody | SubmitBody;
    const moduleId = body.module_id;

    // Confirm enrollment via course_modules -> enrollments
    const { data: enrolled } = await sbAdmin.rpc("is_enrolled_in_module", { _module_id: moduleId });
    if (!enrolled) return new Response(JSON.stringify({ error: "Not enrolled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (body.mode === "draw") {
      // Get pool count
      const { count } = await sbAdmin.from("module_quiz_pool").select("id", { count: "exact", head: true }).eq("module_id", moduleId).gte("quality_score", 0);

      if ((count ?? 0) < POOL_TARGET) {
        // daily cap check
        const today = new Date(); today.setUTCHours(0, 0, 0, 0);
        const { count: genToday } = await sbAdmin
          .from("module_quiz_pool").select("id", { count: "exact", head: true })
          .eq("created_by_talent_id", talent.id).gte("created_at", today.toISOString());
        if ((genToday ?? 0) < DAILY_GEN_CAP) {
          const { data: mod } = await sbAdmin.from("course_modules").select("title,description").eq("id", moduleId).single();
          try {
            const qs = await generateQuestions(mod?.title ?? "", mod?.description ?? "", GENERATE_BATCH);
            await sbAdmin.from("module_quiz_pool").insert(qs.map((q: any) => ({
              module_id: moduleId, question: q.question, options: q.options, correct_index: q.correct_index,
              explanation: q.explanation, difficulty: q.difficulty, generated_by: "ai", created_by_talent_id: talent.id,
            })));
          } catch (e) {
            console.error("gen failed", e);
            // fall through to whatever pool has
          }
        }
      }

      // Sample DRAW_N items, weighted toward less-served
      const { data: items } = await sbAdmin
        .from("module_quiz_pool")
        .select("id,question,options,difficulty,times_served")
        .eq("module_id", moduleId).gte("quality_score", 0)
        .order("times_served", { ascending: true }).limit(DRAW_N * 3);

      if (!items || items.length === 0) {
        return new Response(JSON.stringify({ error: "No questions available yet. Try again." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // shuffle the candidate set, take N
      const picked = items.sort(() => Math.random() - 0.5).slice(0, Math.min(DRAW_N, items.length));
      // bump times_served (best-effort; non-fatal)
      for (const it of picked) {
        await sbAdmin.from("module_quiz_pool")
          .update({ times_served: (it.times_served ?? 0) + 1 })
          .eq("id", it.id);
      }
      return new Response(JSON.stringify({
        items: picked.map(p => ({ id: p.id, question: p.question, options: p.options, difficulty: p.difficulty })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.mode === "submit") {
      const { data: items } = await sbAdmin.from("module_quiz_pool")
        .select("id,correct_index,explanation").in("id", body.item_ids);
      const map = new Map(items!.map(i => [i.id, i]));
      let correct = 0;
      const results = body.item_ids.map((id, idx) => {
        const it = map.get(id);
        const ok = it && body.answers[idx] === it.correct_index;
        if (ok) correct++;
        return { id, correct: !!ok, correct_index: it?.correct_index, explanation: it?.explanation };
      });
      const score = body.item_ids.length ? (correct / body.item_ids.length) * 100 : 0;

      const { data: prev } = await sbAdmin.from("talent_quiz_attempt")
        .select("attempt_no").eq("talent_id", talent.id).eq("module_id", moduleId)
        .order("attempt_no", { ascending: false }).limit(1).maybeSingle();
      const attempt_no = (prev?.attempt_no ?? 0) + 1;

      await sbAdmin.from("talent_quiz_attempt").insert({
        talent_id: talent.id, module_id: moduleId,
        item_ids: body.item_ids, answers: body.answers, score, attempt_no,
      });

      return new Response(JSON.stringify({ score, correct, total: body.item_ids.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
