import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * GroUp Academy: Neural Agent Orchestrator
 * CTO Reference: Authoritative Edge Function for streaming AI persona dialogue.
 * Logic: Implements hybrid prompt resolution and crisis-aware safety protocols.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HUD: Institutional Fail-Safe Prompts
const FALLBACK_PROMPTS: Record<string, string> = {
  "career-consultant": `You are a Career Consultant AI at GroUp Academy, specializing in career guidance for professionals in Bangladesh. Keep responses concise, use bullet points, and occasionally use Bangla rapport phrases.`,
  "mental-wellness-coach": `You are Mira, a Mental Wellness Coach AI at GroUp Academy. Be empathetic and supportive. SAFETY: If crisis mentioned, provide Kaan Pete Roi (01779-554391) or 16789.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("UNAUTHORIZED_INGRESS");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // PHASE: Identity_Audit
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { agentKey, messages } = await req.json();

    // PHASE: Dynamic_Prompt_Resolution
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: agentConfig } = await adminClient
      .from("ai_agents")
      .select("system_prompt, name")
      .eq("agent_key", agentKey)
      .eq("is_active", true)
      .single();

    const systemPrompt =
      agentConfig?.system_prompt || FALLBACK_PROMPTS[agentKey] || FALLBACK_PROMPTS["career-consultant"];

    // ACTION: Initiate Streaming AI Handshake
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: "AI_QUOTA_EXCEEDED" }), { status, headers: corsHeaders });
      }
      throw new Error("AI_GATEWAY_FAULT");
    }

    // HUD: Stream binary body directly to client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err: any) {
    console.error("[Sentinel] AGENT_ORCHESTRATION_FAULT:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
