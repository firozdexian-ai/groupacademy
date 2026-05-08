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

    // Dynamic persona resolution from the central ai_agents registry (standard pattern).
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    let model = "google/gemini-2.5-flash";
    if (SUPA_URL && SERVICE_KEY) {
      try {
        const admin = createClient(SUPA_URL, SERVICE_KEY);
        const { data: agentCfg } = await admin
          .from("ai_agents")
          .select("system_prompt, model, is_active")
          .eq("agent_key", "talent-auth")
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
          { role: "user", content: `CONTEXT: ${JSON.stringify(context)}\nRespond in JSON.` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for institutional consistency
      }),
    });

    if (!response.ok) throw new Error("AI_GATEWAY_FAULT");

    const data = await response.json();
    let parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    // HUD: CTO_OVERRIDE_GATE
    // Intercepts the AI response to inject hardcoded human verification logic.
    if (parsed.action === "verify_human") {
      const randomQuiz = QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
      parsed.quiz = { answer: randomQuiz.a };
      parsed.reply = `${parsed.reply}\n\nQuestion: ${randomQuiz.q}`;
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
    console.error("[Sentinel] AUTH_AGENT_FAULT:", err.message);
    return new Response(JSON.stringify({ error: "INTERNAL_AUTH_FAULT" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
