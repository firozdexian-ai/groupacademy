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
    const { sessionId, jobTitle, companyName, jobDescription, leadsRequested = 20 } = await req.json();
    
    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: 'jobDescription is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting lead hunt matching for:', jobTitle);

    // Parse job description to extract requirements
    const requirements = parseJobRequirements(jobDescription);
    console.log('Extracted requirements:', requirements);

    // Get session ID - create if not provided
    let actualSessionId = sessionId;
    if (!sessionId) {
      // Get user from auth header
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Authentication required to create lead hunt session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newSession, error: sessionError } = await supabase
        .from('lead_hunt_sessions')
        .insert({
          created_by: userId,
          job_title: jobTitle || 'Untitled Position',
          company_name: companyName,
          job_description: jobDescription,
          parsed_requirements: requirements,
          leads_requested: leadsRequested,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create lead hunt session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      actualSessionId = newSession.id;
    }

    // Fetch talents with CV data
    const { data: talents, error: talentsError } = await supabase
      .from('talents')
      .select('id, full_name, email, phone, cv_text, skills, experience, education, profession_category_id, cv_url')
      .not('cv_text', 'is', null)
      .limit(500); // Limit to control costs

    if (talentsError) {
      console.error('Failed to fetch talents:', talentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch talents' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${talents?.length || 0} talents with CV data`);

    // Score each talent using keyword matching
    const scoredTalents = talents?.map(talent => {
      const score = calculateInitialScore(talent, requirements);
      return { talent, score };
    }).filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, leadsRequested) || [];

    console.log(`Matched ${scoredTalents.length} candidates`);

    // Insert matches into database
    const matchInserts = scoredTalents.map(({ talent, score }) => ({
      session_id: actualSessionId,
      talent_id: talent.id,
      initial_score: score,
      shortlisted: false
    }));

    if (matchInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('lead_hunt_matches')
        .upsert(matchInserts, { 
          onConflict: 'session_id,talent_id',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Failed to insert matches:', insertError);
      }
    }

    // Fetch the created matches with talent details
    const { data: matches } = await supabase
      .from('lead_hunt_matches')
      .select(`
        id,
        initial_score,
        ai_match_score,
        shortlisted,
        talent:talents (
          id,
          full_name,
          email,
          phone,
          skills,
          experience,
          cv_url
        )
      `)
      .eq('session_id', actualSessionId)
      .order('initial_score', { ascending: false });

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionId: actualSessionId,
        matchCount: scoredTalents.length,
        matches: matches || [],
        requirements
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in lead-hunt-match:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseJobRequirements(jd: string): any {
  const jdLower = jd.toLowerCase();
  
  // Extract skills
  const skillPatterns = [
    // Technical
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'azure', 'docker',
    'kubernetes', 'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest api', 'git', 'ci/cd',
    'machine learning', 'data analysis', 'excel', 'power bi', 'tableau',
    // Soft skills
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'project management',
    // Business
    'sales', 'marketing', 'accounting', 'finance', 'budgeting', 'forecasting', 'strategy',
    'business development', 'client management', 'negotiation',
    // Industry specific
    'banking', 'fmcg', 'pharmaceutical', 'healthcare', 'retail', 'manufacturing', 'logistics'
  ];

  const skills = skillPatterns.filter(skill => jdLower.includes(skill));

  // Extract experience level
  let experienceYears = 0;
  const expMatch = jd.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (expMatch) {
    experienceYears = parseInt(expMatch[1]);
  }

  // Extract education requirements
  const educationKeywords = [];
  if (jdLower.includes('bachelor') || jdLower.includes('bsc') || jdLower.includes('bba')) {
    educationKeywords.push('bachelor');
  }
  if (jdLower.includes('master') || jdLower.includes('mba') || jdLower.includes('msc')) {
    educationKeywords.push('master');
  }
  if (jdLower.includes('phd') || jdLower.includes('doctorate')) {
    educationKeywords.push('phd');
  }

  return {
    skills,
    experienceYears,
    educationKeywords,
    rawKeywords: jdLower.split(/\s+/).filter(w => w.length > 4).slice(0, 50)
  };
}

function calculateInitialScore(talent: any, requirements: any): number {
  let score = 0;
  const talentText = JSON.stringify({
    skills: talent.skills,
    experience: talent.experience,
    education: talent.education,
    cv_text: talent.cv_text
  }).toLowerCase();

  // Skill matching (50% of score)
  const matchedSkills = requirements.skills.filter((skill: string) => talentText.includes(skill));
  if (requirements.skills.length > 0) {
    score += (matchedSkills.length / requirements.skills.length) * 50;
  }

  // Experience matching (30% of score)
  const expEntries = talent.experience?.length || 0;
  if (requirements.experienceYears > 0) {
    // Rough estimate: each job entry = 2 years
    const estimatedYears = expEntries * 2;
    const expRatio = Math.min(estimatedYears / requirements.experienceYears, 1);
    score += expRatio * 30;
  } else {
    score += 15; // Neutral if no exp required
  }

  // Education matching (20% of score)
  if (requirements.educationKeywords.length > 0) {
    const hasRequiredEdu = requirements.educationKeywords.some((edu: string) => 
      talentText.includes(edu)
    );
    if (hasRequiredEdu) score += 20;
  } else {
    score += 10; // Neutral if no edu required
  }

  return Math.round(score);
}
