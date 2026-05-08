import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Gro10x — Riya: B2B Auth Concierge
 *
 * Conversational state machine that mirrors Aisha's contract so the same
 * client UI shape can drive it. Strict steps:
 *
 *   collect_email → collect_name → collect_cv (optional) → confirm_role_company
 *   → collect_goals → collect_country → collect_phone → verify_human → set_password
 *
 * Returns: { reply, action, quiz?, suggested? }
 *   - action: name of the next gate the client must satisfy
 *   - quiz: { answer } when verifying human
 *   - suggested: optional structured data (e.g. detected role/company from CV)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Riya";

const QUIZZES = [
  { q: "What is the opposite of cold?", a: "hot" },
  { q: "What is 7 plus 6? (Type the number)", a: "13" },
  { q: "Which day comes after Monday?", a: "tuesday" },
  { q: "What color is grass?", a: "green" },
];

// Last-resort fallback if the ai_agents row is missing. The canonical persona
// lives in `ai_agents` under agent_key='company-auth' and should be edited there.
const FALLBACK_SYSTEM_PROMPT = `You are ${AGENT_NAME}, the B2B onboarding concierge for Gro10x.
One question per turn. ENGLISH ONLY. Never handle passwords. Max 2 short sentences.
RESPONSE FORMAT (JSON only): { "reply": string, "action": string, "quiz": null }`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context, messages } = await req.json();
    if (!context) throw new Error("CONTEXT_REQUIRED");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("MISSING_LOVABLE_API_KEY");

    const SUPA_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Dynamic persona resolution from the central ai_agents registry (standard pattern).
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    let model = "google/gemini-2.5-flash";
    if (SUPA_URL && SERVICE_KEY) {
      try {
        const admin = createClient(SUPA_URL, SERVICE_KEY);
        const { data: agentCfg } = await admin
          .from("ai_agents")
          .select("system_prompt, model, is_active")
          .eq("agent_key", "company-auth")
          .maybeSingle();
        if (agentCfg && agentCfg.is_active !== false && agentCfg.system_prompt) {
          systemPrompt = agentCfg.system_prompt;
          if (agentCfg.model) model = agentCfg.model;
        }
      } catch (_e) { /* fall back to inline */ }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
          { role: "user", content: `CONTEXT: ${JSON.stringify(context)}\nRespond in JSON only.` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[Riya] AI gateway error:", response.status, errBody);
      throw new Error("AI_GATEWAY_FAULT");
    }

    const data = await response.json();
    let parsed: any = {};
    try {
      parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch {
      parsed = { reply: "Sorry, can you repeat that?", action: context.action || "collect_email" };
    }

    // Server-controlled human check (deterministic, can't be jailbroken)
    if (parsed.action === "verify_human") {
      const q = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      parsed.quiz = { answer: q.a };
      parsed.reply = `Quick human check!\n\n${q.q}`;
    }

    // Telemetry: upsert into riya_conversations (best-effort, non-blocking)
    try {
      if (context?.session_id) {
        const SUPA_URL = Deno.env.get("SUPABASE_URL");
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPA_URL && SERVICE_KEY) {
          const admin = createClient(SUPA_URL, SERVICE_KEY);
          await admin.from("riya_conversations").upsert({
            session_id: String(context.session_id),
            last_step: parsed.action ?? context.action ?? null,
            completed_at: parsed.action === "complete" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "session_id" });
        }
      }
    } catch (_e) { /* swallow telemetry errors */ }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Riya] AUTH_AGENT_FAULT:", err.message);
    return new Response(
      JSON.stringify({ error: "INTERNAL_AUTH_FAULT", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
