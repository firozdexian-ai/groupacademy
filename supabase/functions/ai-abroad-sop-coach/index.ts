// SOP drafting + critique for study abroad applications
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);

    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json();
    const mode = String(body.mode || "draft"); // draft | critique
    const programName = String(body.program_name || "");
    const country = String(body.country || "");
    const profile = String(body.profile || "");
    const existing = String(body.existing_sop || "");

    const sys = `You are a senior admissions consultant. ${mode === "critique"
      ? `Critique the SOP below for ${programName} (${country}). Return JSON: { "score": 0-100, "strengths": [], "weaknesses": [], "rewrite_suggestions": [] }.`
      : `Draft a 600-800 word Statement of Purpose for ${programName} (${country}) based on the candidate profile. Return JSON: { "sop": "...", "key_themes": [] }.`}`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: mode === "critique" ? existing : `Profile:\n${profile}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) return json({ error: `ai_error_${ai.status}` }, ai.status);
    const aiData = await ai.json();
    let parsed: any = {};
    try { parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = { raw: aiData.choices?.[0]?.message?.content }; }

    return json({ ok: true, ...parsed, credits_spent: 1 });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
