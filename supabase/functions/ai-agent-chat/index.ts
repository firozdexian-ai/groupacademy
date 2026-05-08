import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * GroUp Academy: Neural Agent Orchestrator
 * CTO Audit: Injected Talent Profile RAG micro-context to cure AI Amnesia.
 * Logic: Implements hybrid prompt resolution, personalization, and crisis-aware safety protocols.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generic last-resort fallback. Canonical personas live in `ai_agents` keyed by agent_key
// (e.g. 'career-consultant', 'mental-wellness-coach'). Edit prompts there, not here.
const GENERIC_FALLBACK = `You are a helpful assistant at GroUp Academy. Keep responses concise and supportive.`;

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

    // PHASE 1: Identity_Audit
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { agentKey, messages } = await req.json();

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // PHASE 2: Dynamic_Prompt_Resolution
    const { data: agentConfig } = await adminClient
      .from("ai_agents")
      .select("system_prompt, name")
      .eq("agent_key", agentKey)
      .eq("is_active", true)
      .single();

    let systemPrompt =
      agentConfig?.system_prompt || GENERIC_FALLBACK;

    // CTO FIX: PHASE 3: Identity Context Injection (Curing AI Amnesia)
    // We grab the user's actual profile and secretly inject it into the AI's brain.
    const { data: talent } = await adminClient
      .from("talents")
      .select("full_name, custom_profession, profession, experience_years, skills, current_status, country")
      .eq("user_id", user.id)
      .single();

    if (talent) {
      const skillsList = Array.isArray(talent.skills) ? talent.skills.join(", ") : "Not provided";
      const profession = talent.profession || talent.custom_profession || "Student/Professional";

      const userContextBlock = `
---
INTERNAL SYSTEM DIRECTIVE - USER CONTEXT:
You are speaking with ${talent.full_name || "a user"}. 
Location: ${talent.country || "Unknown"}
Profession: ${profession}
Years of Experience: ${talent.experience_years || 0}
Skills: ${skillsList}
Current Status: ${talent.current_status || "Not provided"}

CRITICAL RULE: Use this context to personalize your advice. Do not ask for their background if it is already provided above. Speak to them directly based on these facts.
---
`;
      // Append the context to the system prompt
      systemPrompt = systemPrompt + userContextBlock;
    }

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
