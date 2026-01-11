import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. SECURITY: Verify the User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { matchId, sessionId, talentId } = await req.json();

    if (!matchId && (!sessionId || !talentId)) {
      return new Response(JSON.stringify({ error: "Either matchId or both sessionId and talentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Admin Client for Data Operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get match details
    let match: any;

    // We need to fetch the session created_by to verify ownership
    const query = supabaseAdmin
      .from("lead_hunt_matches")
      .select("*, talent:talents(*), session:lead_hunt_sessions!inner(*)"); // !inner forces the join so we can filter by session

    if (matchId) {
      query.eq("id", matchId);
    } else {
      query.eq("session_id", sessionId).eq("talent_id", talentId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    match = data;

    // 2. SECURITY: Ownership Check
    // Ensure the session belongs to the requesting user
    if (match.session.created_by !== user.id) {
      console.error(
        `Unauthorized access: User ${user.id} tried to score match ${match.id} owned by ${match.session.created_by}`,
      );
      return new Response(JSON.stringify({ error: "Unauthorized access to this match" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scoring match ${match.id} for talent ${match.talent.full_name} by user ${user.id}`);

    const systemPrompt = `You are an expert HR consultant analyzing candidate-job fit.
Compare the candidate's profile against the job requirements and provide a detailed assessment.

Return a JSON object with:
{
  "overall_score": number (0-100),
  "breakdown": {
    "skills_match": number (0-100),
    "experience_fit": number (0-100),
    "education_fit": number (0-100),
    "potential_fit": number (0-100)
  },
  "strengths": ["array of 3-5 key strengths"],
  "gaps": ["array of 2-4 skill/experience gaps"],
  "recommendation": "string - brief hiring recommendation",
  "interview_focus": ["array of 2-3 areas to explore in interview"]
}

Be realistic and objective. A score of 70+ means strong fit, 50-70 is moderate, below 50 is weak.`;

    const userPrompt = `## Job Description
Title: ${match.session.job_title}
Company: ${match.session.company_name || "Not specified"}

${match.session.job_description}

## Candidate Profile
Name: ${match.talent.full_name}
Email: ${match.talent.email}

Skills: ${JSON.stringify(match.talent.skills || [])}

Experience: ${JSON.stringify(match.talent.experience || [])}

Education: ${JSON.stringify(match.talent.education || [])}

CV Summary: ${match.talent.cv_text?.substring(0, 3000) || "Not available"}

Analyze this candidate's fit for the position and provide your assessment.`;

    // Add timeout controller for AI call (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429 || aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service rate limit/quota exceeded." }), {
          status: aiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices[0].message.content;

    // Clean up markdown if present
    analysisText = analysisText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", analysisText);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update match with AI score
    const { error: updateError } = await supabaseAdmin
      .from("lead_hunt_matches")
      .update({
        ai_match_score: analysis.overall_score,
        ai_analysis: analysis,
        scored_at: new Date().toISOString(),
      })
      .eq("id", match.id);

    if (updateError) {
      console.error("Failed to update match:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        matchId: match.id,
        score: analysis.overall_score,
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in score-talent-match:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
