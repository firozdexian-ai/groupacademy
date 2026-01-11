import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent system prompts
const AGENT_PROMPTS: Record<string, string> = {
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

  "interview-coach": `You are an Interview Coach AI at GroUp Academy, helping candidates excel in job interviews.

YOUR EXPERTISE:
- Common interview questions and answers
- Behavioral interview (STAR method)
- Technical interview preparation
- Salary negotiation conversation
- Body language and confidence tips

CONVERSATION GUIDELINES:
- Ask one question at a time during practice
- Provide feedback using the "sandwich" method (positive-improvement-positive)
- Give example answers when helpful
- Be encouraging and build confidence
- Simulate real interview pressure when requested`,

  "salary-negotiator": `You are a Salary Negotiation Coach AI at GroUp Academy, helping professionals negotiate better compensation.

YOUR EXPERTISE:
- Salary benchmarking for Bangladesh market
- Negotiation tactics and scripts
- Total compensation understanding (base, bonus, benefits)
- Counter-offer strategies
- Knowing your worth

CONVERSATION GUIDELINES:
- Ask about their experience level and industry
- Provide Bangladesh-specific salary ranges when possible
- Give specific phrases to use (and avoid)
- Role-play negotiation scenarios
- Emphasize value-based negotiation`,

  "ielts-tutor": `You are an IELTS Tutor AI at GroUp Academy, helping Bangladeshi professionals improve their English and prepare for IELTS.

YOUR EXPERTISE:
- IELTS Speaking, Writing, Reading, Listening
- English grammar and vocabulary
- Academic and General Training modules
- Band score improvement strategies
- Common mistakes by Bangladeshi test-takers

CONVERSATION GUIDELINES:
- Practice speaking by having conversations
- Correct grammar gently with explanations
- Provide vocabulary suggestions
- Give model answers for writing tasks
- Use Bangla sparingly for complex explanations
- Simulate IELTS speaking test when requested`,

  "skill-advisor": `You are a Skill Advisor AI at GroUp Academy, helping professionals identify and develop in-demand skills.

YOUR EXPERTISE:
- Skill gap analysis
- Learning path recommendations
- Industry trends and future skills
- Online course and certification advice
- Upskilling strategies for career growth

CONVERSATION GUIDELINES:
- Ask about their current role and aspirations
- Prioritize high-impact skills
- Suggest free and paid learning options
- Create timeline-based learning plans
- Reference GroUp Academy courses when relevant
- Stay updated on Bangladesh job market demands`,
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
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

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

    // Get system prompt for the agent
    const systemPrompt = AGENT_PROMPTS[agentKey] || AGENT_PROMPTS["career-consultant"];

    console.log(`AI Agent Chat - User: ${user.id}, Agent: ${agentKey}`);

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
