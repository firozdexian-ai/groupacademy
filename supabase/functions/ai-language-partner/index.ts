// AI Language Partner — chat at chosen CEFR level with inline corrections
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TURNS_PER_CREDIT = 10;

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

    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPA_URL, SERVICE_KEY);

    const body = await req.json();
    const sessionId = body.session_id ?? null;
    const language = String(body.language_code || "en");
    const cefr = String(body.cefr_level || "B1");
    const userMessage = String(body.message || "").trim();
    if (!userMessage) return json({ error: "message required" }, 400);

    const { data: lang } = await admin.from("languages").select("name").eq("code", language).maybeSingle();
    if (!lang) return json({ error: "language not found" }, 404);

    // Load or create session
    let session: any;
    if (sessionId) {
      const { data } = await admin.from("language_practice_sessions").select("*").eq("id", sessionId).maybeSingle();
      session = data;
    }
    if (!session) {
      const { data, error } = await admin
        .from("language_practice_sessions")
        .insert({ user_id: userId, language_code: language, cefr_level: cefr, transcript: [], corrections: [] })
        .select("*").single();
      if (error) return json({ error: error.message }, 500);
      session = data;
    }

    const transcript: any[] = Array.isArray(session.transcript) ? session.transcript : [];
    const corrections: any[] = Array.isArray(session.corrections) ? session.corrections : [];

    const sysPrompt = `You are a friendly conversation partner helping a learner practice ${lang.name} at CEFR ${cefr}.

Rules:
- Reply in ${lang.name} only, at the user's CEFR level (${cefr}).
- Keep replies short (1-3 sentences).
- Ask a follow-up question to keep the conversation going.

Return STRICT JSON:
{
  "reply": "your message in ${lang.name}",
  "translation_en": "english translation of your reply",
  "corrections": [
    { "original": "user's phrase", "corrected": "fixed version", "explanation": "why" }
  ]
}

If the user's message is already correct, return corrections: [].`;

    const messages = [
      { role: "system", content: sysPrompt },
      ...transcript.slice(-10).map((t: any) => ({ role: t.role, content: t.content })),
      { role: "user", content: userMessage },
    ];

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) {
      if (ai.status === 429) return json({ error: "Rate limited" }, 429);
      if (ai.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: `ai_error_${ai.status}` }, 500);
    }
    const aiData = await ai.json();
    let parsed: any = {};
    try { parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = { reply: aiData.choices?.[0]?.message?.content }; }

    transcript.push({ role: "user", content: userMessage, ts: Date.now() });
    transcript.push({ role: "assistant", content: parsed.reply ?? "", translation_en: parsed.translation_en, ts: Date.now() });
    if (Array.isArray(parsed.corrections) && parsed.corrections.length > 0) {
      corrections.push(...parsed.corrections.map((c: any) => ({ ...c, ts: Date.now() })));
    }

    // Charge 1 credit per N turns (1 turn = 1 user message)
    const turnCount = transcript.filter((t) => t.role === "user").length;
    const creditAdd = turnCount % TURNS_PER_CREDIT === 0 ? 1 : 0;

    await admin
      .from("language_practice_sessions")
      .update({
        transcript,
        corrections,
        credits_spent: (Number(session.credits_spent) || 0) + creditAdd,
      })
      .eq("id", session.id);

    return json({
      ok: true,
      session_id: session.id,
      reply: parsed.reply,
      translation_en: parsed.translation_en,
      corrections: parsed.corrections ?? [],
      credits_spent: creditAdd,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
