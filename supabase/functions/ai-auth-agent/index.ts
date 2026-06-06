import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * GroUp Academy: Neural Onboarding Sentinel (Aisha)
 * CTO Reference: Authoritative Edge Function for managed enrollment trajectories.
 * Logic: Implements deterministic human checks and bimodal auth state management.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_NAME = "Aisha";

// HUD: Deterministic Logic Gates
const QUIZZES = [
  { q: "What is the opposite of hot?", a: "cold" },
  { q: "Which common pet animal meows?", a: "cat" },
  { q: "What color is a clear daytime sky?", a: "blue" },
  { q: "If you freeze water, what does it become?", a: "ice" },
  { q: "What is 10 plus 5? (Type the number)", a: "15" },
];

// Last-resort fallback if the ai_agents row is missing. The canonical persona
// lives in `ai_agents` under agent_key='talent-auth' and should be edited there.
const FALLBACK_SYSTEM_PROMPT = `You are ${AGENT_NAME}, a warm, friendly sign-in assistant for GroUp Academy.
Keep replies short, plain, and friendly. Never ask for or echo passwords.
RESPONSE FORMAT: JSON { "reply": string, "action": string, "quiz": null }`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context, messages } = await req.json();
    if (!context) throw new Error("CONTEXT_REQUIRED");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPA_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = SUPA_URL && SERVICE_KEY ? createClient(SUPA_URL, SERVICE_KEY) : null;
    const sessionId = context?.session_id || context?.sessionId;

    // Server-side CAPTCHA verification path. Client sends the user's answer in
    // context.user_quiz_answer; we compare against the stored expected answer
    // (never sent to the client) and return a verdict without going through AI.
    if (admin && sessionId && typeof context?.user_quiz_answer === "string") {
      const submitted = String(context.user_quiz_answer).toLowerCase().replace(/[^a-z0-9]/g, "");
      const { data: row } = await admin
        .from("aisha_conversations")
        .select("pending_quiz_answer")
        .eq("session_id", String(sessionId))
        .maybeSingle();
      const expected = (row?.pending_quiz_answer || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const passed = expected.length > 0 && submitted === expected;
      if (passed) {
        await admin
          .from("aisha_conversations")
          .update({ pending_quiz_answer: null, last_step: "quiz_passed", updated_at: new Date().toISOString() })
          .eq("session_id", String(sessionId));
        return new Response(
          JSON.stringify({
            reply: "Great. Now create a password (at least 8 characters).",
            action: "set_password",
            quiz: null,
            quiz_passed: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          reply: "Not quite — please try the human-check question again.",
          action: "verify_human",
          quiz: null,
          quiz_passed: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    // Persona resolution: pulled from the WaaS instance bound to this auth-page
    // visitor (mkt-seo-01 country-specific Marketing & SEO agent). Legacy
    // `ai_agents` lookup is removed — all front-door personas now live in
    // workforce_hired_instances + workforce_master_templates.
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    let model = "google/gemini-2.5-flash";
    const instanceId = (context as any)?.instance_id ?? (context as any)?.instanceId;
    if (SUPA_URL && SERVICE_KEY && instanceId) {
      try {
        const instAdmin = createClient(SUPA_URL, SERVICE_KEY);
        const { data: inst } = await instAdmin
          .from("workforce_hired_instances")
          .select(
            "status, kill_switch, prompt_override, model_override, name_override, " +
              "template:workforce_master_templates(base_system_prompt, default_model, is_active)",
          )
          .eq("id", instanceId)
          .maybeSingle();
        const tpl: any = inst?.template;
        const active = inst && !inst.kill_switch && inst.status === "active" && tpl?.is_active !== false;
        if (active) {
          const basePrompt = inst.prompt_override || tpl?.base_system_prompt;
          if (basePrompt) systemPrompt = basePrompt;
          const m = inst.model_override || tpl?.default_model;
          if (m) model = m;
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
          { role: "user", content: `CONTEXT: ${JSON.stringify(context)}\nRespond in JSON.` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for institutional consistency
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[Sentinel] AI_GATEWAY_FAULT:", response.status, body.slice(0, 500));
      // Graceful fallback so the auth UI never blanks out on gateway hiccups
      // (rate limits, transient 5xx, model deprecation, etc.).
      const friendly =
        response.status === 429
          ? "I'm a bit busy right now — please try again in a moment."
          : response.status === 402
            ? "AI credits are temporarily unavailable. Please try again shortly."
            : "Sorry, I had trouble responding. Please try again.";
      return new Response(
        JSON.stringify({ reply: friendly, action: "noop", quiz: null, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    let parsed: any = {};
    try {
      parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch (_e) {
      parsed = { reply: data.choices?.[0]?.message?.content || "…", action: "noop", quiz: null };
    }

    // Server-side bot check: generate a question, persist the expected answer
    // keyed by session_id, and return ONLY the question to the client.
    if (parsed.action === "verify_human") {
      const randomQuiz = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      parsed.quiz = null;
      parsed.reply = `${parsed.reply}\n\nQuestion: ${randomQuiz.q}`;
      if (admin && sessionId) {
        try {
          await admin
            .from("aisha_conversations")
            .upsert(
              {
                session_id: String(sessionId),
                pending_quiz_answer: randomQuiz.a,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "session_id" },
            );
        } catch (e) {
          console.error("[Sentinel] QUIZ_STORE_FAULT:", e);
        }
      }
    }


    // HUD: Telemetry — log conversation to aisha_conversations for the admin console.
    try {
      const sessionId = context?.session_id || context?.sessionId;
      if (sessionId) {
        const SUPA_URL = Deno.env.get("SUPABASE_URL");
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPA_URL && SERVICE_KEY) {
          const admin = createClient(SUPA_URL, SERVICE_KEY);
          const lastUser = [...(messages || [])].reverse().find((m: any) => m.role === "user");
          await admin.from("aisha_conversations").upsert(
            {
              session_id: String(sessionId),
              email: context?.email ?? null,
              name: context?.name ?? null,
              country: context?.country ?? null,
              phone: context?.phone ?? null,
              last_step: parsed.action ?? context?.step ?? null,
              message_count: (messages || []).length,
              raw_messages: (messages || []).slice(-20),
              updated_at: new Date().toISOString(),
              completed_at: parsed.action === "complete" ? new Date().toISOString() : null,
            },
            { onConflict: "session_id" },
          );
        }
      }
    } catch (logErr) {
      console.error("[Sentinel] AISHA_LOG_FAULT:", logErr);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Sentinel] AUTH_AGENT_FAULT:", err?.message, err?.stack);
    // Return 200 with a friendly fallback so the auth chat UI keeps working
    // even if the AI gateway or persona lookup throws unexpectedly.
    return new Response(
      JSON.stringify({
        reply: "Sorry, I had trouble responding. Please try again.",
        action: "noop",
        quiz: null,
        fallback: true,
        error: err?.message || "INTERNAL_AUTH_FAULT",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
