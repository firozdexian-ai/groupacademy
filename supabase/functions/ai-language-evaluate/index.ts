// CEFR placement test evaluator
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPA_URL, SERVICE_KEY);

    const body = await req.json();
    const language = String(body.language_code || "en");
    const sample = String(body.writing_sample || "").trim();
    if (!sample) return json({ error: "writing_sample required" }, 400);

    const { data: lang } = await admin.from("languages").select("name").eq("code", language).maybeSingle();
    if (!lang) return json({ error: "language not found" }, 404);

    const sys = `You are a CEFR placement examiner for ${lang.name}. Estimate the writer's CEFR level (A1-C2) per skill (reading, writing, listening, speaking).

Return STRICT JSON:
{
  "overall": "B1",
  "skills": { "reading": "B1", "writing": "B1", "listening": "A2", "speaking": "B1" },
  "rationale": "brief explanation",
  "next_actions": ["..."]
}

Use a slight bias toward conservative estimates.`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: sample },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) return json({ error: `ai_error_${ai.status}` }, ai.status);
    const aiData = await ai.json();
    let parsed: any = {};
    try { parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}"); } catch { /**/ }

    const overall = String(parsed?.overall ?? "A2");
    const valid = ["A1", "A2", "B1", "B2", "C1", "C2"].includes(overall) ? overall : "A2";

    await admin.from("talent_language_levels").upsert({
      user_id: userId,
      language_code: language,
      cefr_level: valid,
      source: "placement_test",
      verified_at: new Date().toISOString(),
    }, { onConflict: "user_id,language_code" });

    return json({ ok: true, ...parsed, credits_spent: 1 });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
