// AI IELTS Evaluator — grades writing/speaking/reading/listening, returns 0-9 bands per criterion
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECTION_COST: Record<string, number> = {
  writing: 1, speaking: 1, reading: 1, listening: 1, full: 4,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);

    const userClient = createClient(SUPA_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPA_URL, SERVICE_KEY);

    const body = await req.json();
    const section = String(body.section || "writing");
    const promptId = body.prompt_id ?? null;
    const responseText = String(body.response_text || "");
    const audioPath = body.audio_path ?? null;

    if (!SECTION_COST[section]) return json({ error: "invalid section" }, 400);
    if (!responseText && !audioPath) return json({ error: "response required" }, 400);

    // Check daily free attempt
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayAttempts } = await admin
      .from("ielts_mock_attempts")
      .select("id, is_free_attempt")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00Z`);

    const usedFreeToday = (todayAttempts ?? []).some((a: any) => a.is_free_attempt);
    const isFree = !usedFreeToday;
    const cost = isFree ? 0 : SECTION_COST[section];

    // Fetch prompt
    let promptText = "";
    if (promptId) {
      const { data: p } = await admin.from("ielts_prompts").select("prompt_text,reference_text,task_type").eq("id", promptId).maybeSingle();
      if (p) promptText = `${p.task_type ? `[${p.task_type}] ` : ""}${p.prompt_text}`;
    }

    const sysPrompt = `You are a certified IELTS examiner. Score the candidate's ${section} response on the official 0-9 band scale.

Return STRICT JSON:
{
  "band_overall": 6.5,
  "criteria": {
    "task_response": { "band": 6.0, "feedback": "..." },
    "coherence_cohesion": { "band": 6.5, "feedback": "..." },
    "lexical_resource": { "band": 7.0, "feedback": "..." },
    "grammatical_range": { "band": 6.5, "feedback": "..." }${section === "speaking" ? ',\n    "pronunciation": { "band": 6.5, "feedback": "..." }' : ""}
  },
  "strengths": ["..."],
  "improvements": ["..."],
  "next_action": "Practice X for 15 minutes"
}

Be specific, cite exact phrases, and recommend a concrete next step.`;

    const userContent = `Section: ${section}
Prompt: ${promptText || "(generic)"}
Response:
${responseText || "(audio submission — transcript not available)"}`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) {
      if (ai.status === 429) return json({ error: "Rate limited" }, 429);
      if (ai.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: `ai_error_${ai.status}` }, 500);
    }
    const aiData = await ai.json();
    let feedback: any = {};
    try { feedback = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}"); } catch { /**/ }

    const band = Number(feedback?.band_overall ?? 0) || null;

    const { data: attempt, error: insErr } = await admin
      .from("ielts_mock_attempts")
      .insert({
        user_id: userId,
        section,
        prompt_id: promptId,
        response_text: responseText || null,
        audio_path: audioPath,
        ai_band_score: band,
        ai_feedback: feedback,
        credits_spent: cost,
        is_free_attempt: isFree,
      })
      .select("id")
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, attempt_id: attempt.id, band, feedback, credits_spent: cost, was_free: isFree });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
