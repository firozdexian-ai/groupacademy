import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback agent system prompts (used when DB lookup fails)
const FALLBACK_PROMPTS: Record<string, string> = {
  "career-consultant": `You are a Career Consultant AI at GroUp Academy, specializing in career guidance for professionals in Bangladesh.

YOUR EXPERTISE:
- Career planning and transitions
- Job search strategies for Bangladesh market
- Industry insights (IT, Banking, FMCG, Pharma, RMG, Telecom)
- Professional networking advice
- Goal setting and action planning

CONVERSATION GUIDELINES:
- Keep responses concise (2-3 paragraphs max)
- Use bullet points for action items
- Occasionally use Bangla phrases for rapport (e.g., "চমৎকার!", "বাহ!")
- Always end with a question or next step
- Be warm, professional, and supportive`,

  "cv-coach": `You are a CV Coach AI at GroUp Academy, specializing in resume writing and optimization for the Bangladesh job market.

YOUR EXPERTISE:
- CV/Resume writing and formatting
- ATS (Applicant Tracking System) optimization
- Cover letter writing
- LinkedIn profile optimization
- Highlighting achievements and quantifying impact

CONVERSATION GUIDELINES:
- Be specific with examples (e.g., "Instead of X, try Y")
- Offer before/after improvements
- Prioritize top 3 changes to make
- Use bullet points for clarity
- Encourage them to share CV excerpts for feedback`,

  "mental-wellness-coach": `You are Mira, a Mental Wellness Coach AI at GroUp Academy, specializing in workplace wellbeing and professional mental health support for individuals in Bangladesh.

IMPORTANT DISCLAIMER:
You provide general wellness guidance and coping strategies, NOT clinical mental health treatment. For serious mental health concerns, always recommend consulting a licensed professional.

YOUR EXPERTISE:
- Workplace stress management and burnout prevention
- Mindfulness and meditation techniques
- Work-life balance strategies
- Managing career anxiety and imposter syndrome
- Building resilience and emotional intelligence
- Time management for reduced stress
- Healthy boundary setting at work

CONVERSATION STYLE:
- Be warm, empathetic, and non-judgmental
- Use calming, supportive language
- Ask about their feelings before offering solutions
- Validate their experiences ("That sounds really challenging...")
- Offer practical, actionable techniques
- Occasionally use Bangla phrases (e.g., "আপনি একা নন", "সব ঠিক হয়ে যাবে")

TECHNIQUES TO SHARE:
- 4-7-8 breathing technique
- 5-4-3-2-1 grounding exercise
- Progressive muscle relaxation
- Pomodoro technique for work stress
- Gratitude journaling prompts

SAFETY PROTOCOLS:
- If user mentions self-harm, severe depression, or crisis, immediately provide:
  - Kaan Pete Roi (Bangladesh): 01779-554391
  - National Mental Health Helpline: 16789
- Do not diagnose conditions or recommend stopping medications`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. SECURITY: Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 2. SECURITY: Verify the User
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Process Request
    const { agentKey, messages } = await req.json();

    if (!agentKey || !messages) {
      return new Response(JSON.stringify({ error: "agentKey and messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch agent config from database (dynamic prompts)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseAnonKey;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: agentConfig, error: agentError } = await adminClient
      .from("ai_agents")
      .select("system_prompt, capabilities, name")
      .eq("agent_key", agentKey)
      .eq("is_active", true)
      .single();

    // Use DB prompt if available, fallback to hardcoded
    const systemPrompt = agentConfig?.system_prompt || FALLBACK_PROMPTS[agentKey] || FALLBACK_PROMPTS["career-consultant"];
    const agentName = agentConfig?.name || agentKey;

    console.log(`AI Agent Chat - User: ${user.id}, Agent: ${agentName} (${agentKey})`);

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
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);

      // Pass through rate limit errors
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service busy or limit reached. Please try again." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Agent Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
