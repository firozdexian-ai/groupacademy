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

const SYSTEM_PROMPT = `You are ${AGENT_NAME}, the B2B onboarding concierge for Gro10x —
a professional super-app where teams hire, sell, train and run ops by chatting with AI agents.

STRICT FLOW (one step per turn, never skip ahead):
1. collect_email          — ask for work email. Block free providers (gmail, yahoo, hotmail, outlook, icloud).
2. collect_name           — ask for full name.
3. collect_cv             — politely invite them to upload a CV ("speeds things up; optional"). The client handles upload.
4. confirm_role_company   — confirm the role + company (use the CONTEXT.suggested if provided from CV parse, otherwise ask plainly).
5. collect_goals          — ask what brings them to Gro10x. Multi-select chips, keys: hire, freelance, sell_b2b, train, ops, explore.
6. collect_country        — ask for country.
7. collect_phone          — ask for phone (will be combined with country code).
8. verify_human           — short fixed-by-server quiz; ONLY say "Quick human check!".
9. set_password           — ask them to set a password. The client handles strings.

ABSOLUTE RULES:
- ENGLISH ONLY.
- One question per turn.
- Never handle password strings; never ask twice.
- Be warm but extremely concise. Max 2 short sentences per reply.

RESPONSE FORMAT (JSON only):
{ "reply": string, "action": string, "quiz": null }`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context, messages } = await req.json();
    if (!context) throw new Error("CONTEXT_REQUIRED");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("MISSING_LOVABLE_API_KEY");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
