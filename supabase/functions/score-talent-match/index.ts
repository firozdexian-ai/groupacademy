import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchId, sessionId, talentId } = await req.json();
    
    if (!matchId && (!sessionId || !talentId)) {
      return new Response(
        JSON.stringify({ error: 'Either matchId or both sessionId and talentId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get match details
    let match: any;
    if (matchId) {
      const { data, error } = await supabase
        .from('lead_hunt_matches')
        .select('*, talent:talents(*), session:lead_hunt_sessions(*)')
        .eq('id', matchId)
        .single();
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Match not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      match = data;
    } else {
      const { data, error } = await supabase
        .from('lead_hunt_matches')
        .select('*, talent:talents(*), session:lead_hunt_sessions(*)')
        .eq('session_id', sessionId)
        .eq('talent_id', talentId)
        .single();
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Match not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      match = data;
    }

    console.log(`Scoring match ${match.id} for talent ${match.talent.full_name}`);

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
Company: ${match.session.company_name || 'Not specified'}

${match.session.job_description}

## Candidate Profile
Name: ${match.talent.full_name}
Email: ${match.talent.email}

Skills: ${JSON.stringify(match.talent.skills || [])}

Experience: ${JSON.stringify(match.talent.experience || [])}

Education: ${JSON.stringify(match.talent.education || [])}

CV Summary: ${match.talent.cv_text?.substring(0, 3000) || 'Not available'}

Analyze this candidate's fit for the position and provide your assessment.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices[0].message.content;
    
    // Clean up markdown if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update match with AI score
    const { error: updateError } = await supabase
      .from('lead_hunt_matches')
      .update({
        ai_match_score: analysis.overall_score,
        ai_analysis: analysis,
        scored_at: new Date().toISOString()
      })
      .eq('id', match.id);

    if (updateError) {
      console.error('Failed to update match:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        matchId: match.id,
        score: analysis.overall_score,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in score-talent-match:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
