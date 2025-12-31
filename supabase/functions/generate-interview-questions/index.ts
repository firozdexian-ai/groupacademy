import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, questionCount, difficulty, professionCategoryId, additionalNotes, candidateProfile } = await req.json();

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch profession category if provided
    let professionContext = '';
    if (professionCategoryId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: category } = await supabase
        .from('profession_categories')
        .select('name, description')
        .eq('id', professionCategoryId)
        .single();
      
      if (category) {
        professionContext = `The candidate is targeting the ${category.name} field. ${category.description || ''}`;
      }
    }

    // Build candidate context if provided
    let candidateContext = '';
    if (candidateProfile) {
      const parts = [];
      if (candidateProfile.skills?.length > 0) {
        parts.push(`Skills: ${candidateProfile.skills.join(', ')}`);
      }
      if (candidateProfile.experience?.length > 0) {
        parts.push(`Experience: ${candidateProfile.experience.join('; ')}`);
      }
      if (candidateProfile.education?.length > 0) {
        parts.push(`Education: ${candidateProfile.education.join('; ')}`);
      }
      if (candidateProfile.cvSummary) {
        parts.push(`CV Summary: ${candidateProfile.cvSummary.substring(0, 500)}`);
      }
      if (parts.length > 0) {
        candidateContext = `\n\nCANDIDATE PROFILE (use this to personalize questions and assess fit):\n${parts.join('\n')}`;
      }
    }

    const difficultyGuide = {
      easy: 'Ask straightforward questions suitable for entry-level candidates. Focus on basic concepts and common scenarios.',
      medium: 'Ask moderately challenging questions suitable for mid-level candidates. Include behavioral and situational questions.',
      hard: 'Ask challenging questions suitable for senior candidates. Include complex scenarios, strategic thinking, and deep technical knowledge.'
    };

    const prompt = `You are an expert HR interviewer and career coach. Analyze this job description and generate ${questionCount} interview questions.

JOB DESCRIPTION:
${jobDescription}

${professionContext}
${candidateContext}

${additionalNotes ? `ADDITIONAL CONTEXT FROM CANDIDATE: ${additionalNotes}` : ''}

DIFFICULTY LEVEL: ${difficulty}
${difficultyGuide[difficulty as keyof typeof difficultyGuide] || difficultyGuide.medium}

${candidateProfile ? 'IMPORTANT: Tailor some questions to probe the candidate\'s specific experience and skills mentioned in their profile. Ask about gaps between their background and the job requirements.' : ''}

Generate exactly ${questionCount} interview questions. For each question, provide:
1. The question itself (clear and professional)
2. The category (behavioral, technical, or situational)
3. Key points that a good answer should cover (3-5 points)

Also extract the job title and company name from the JD if mentioned.

Respond ONLY with valid JSON in this exact format:
{
  "jobTitle": "extracted job title or 'Not specified'",
  "companyName": "extracted company name or 'Not specified'",
  "questions": [
    {
      "id": "q1",
      "question": "The interview question text",
      "category": "behavioral|technical|situational",
      "expectedPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}`;

    console.log('Generating interview questions with Lovable AI...');

    // Add timeout controller for AI call (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR interviewer. Generate professional interview questions based on job descriptions. Always respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again in a few minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions - empty response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let parsedContent;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated interview questions');

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-interview-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
