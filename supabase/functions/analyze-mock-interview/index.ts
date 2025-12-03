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
    const { interviewId } = await req.json();

    if (!interviewId) {
      return new Response(
        JSON.stringify({ error: 'Interview ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the interview data
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('*, profession_categories(name, description)')
      .eq('id', interviewId)
      .single();

    if (fetchError || !interview) {
      console.error('Failed to fetch interview:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Interview not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!interview.questions || !interview.answers) {
      return new Response(
        JSON.stringify({ error: 'Interview questions or answers are missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the analysis prompt
    const questionsWithAnswers = interview.questions.map((q: any, index: number) => {
      const answer = interview.answers.find((a: any) => a.questionId === q.id);
      return {
        questionNumber: index + 1,
        question: q.question,
        category: q.category,
        expectedPoints: q.expectedPoints,
        candidateAnswer: answer?.answer || 'No answer provided',
        timeTaken: answer?.timeTakenSeconds || 0
      };
    });

    const professionContext = interview.profession_categories 
      ? `Field: ${interview.profession_categories.name}. ${interview.profession_categories.description || ''}`
      : '';

    const prompt = `You are an expert HR interviewer and career coach. Analyze this mock interview and provide detailed feedback.

JOB DETAILS:
- Job Title: ${interview.job_title || 'Not specified'}
- Company: ${interview.company_name || 'Not specified'}
- Difficulty: ${interview.difficulty}
${professionContext}

JOB DESCRIPTION:
${interview.job_description}

INTERVIEW QUESTIONS AND CANDIDATE ANSWERS:
${questionsWithAnswers.map((qa: any) => `
Question ${qa.questionNumber} (${qa.category}):
"${qa.question}"

Expected Key Points: ${qa.expectedPoints.join(', ')}

Candidate's Answer:
"${qa.candidateAnswer}"

Time Taken: ${qa.timeTaken} seconds
`).join('\n---\n')}

Analyze each answer and provide:
1. A score from 1-10 for each answer
2. Specific feedback for each answer
3. Points the candidate missed
4. Overall selection percentage (0-100)
5. Performance level (needs_work, developing, competent, strong, excellent)
6. Top strengths (2-3 items)
7. Areas for improvement (2-3 items)
8. General interview tips for this role

Be constructive but honest. Focus on actionable feedback.

Respond ONLY with valid JSON in this exact format:
{
  "selectionPercentage": 75,
  "performanceLevel": "competent",
  "overallFeedback": "Overall assessment of the candidate's performance...",
  "strengths": ["strength 1", "strength 2"],
  "improvementAreas": ["area 1", "area 2"],
  "questionFeedback": [
    {
      "questionId": "q1",
      "score": 7,
      "feedback": "Specific feedback for this answer...",
      "missedPoints": ["point they missed"],
      "improvementTips": "How to improve this answer..."
    }
  ],
  "interviewTips": "General tips for interviewing for this type of role..."
}`;

    console.log('Analyzing mock interview with Lovable AI...');

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
            content: 'You are an expert HR interviewer and career coach. Provide detailed, constructive feedback on mock interviews. Always respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

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
        JSON.stringify({ error: 'Failed to analyze interview' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to analyze interview - empty response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let analysis;
    try {
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
      
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', content);
      
      // Fallback analysis
      analysis = {
        selectionPercentage: 50,
        performanceLevel: 'developing',
        overallFeedback: 'We were unable to generate detailed feedback. Please try again.',
        strengths: ['Completed the interview'],
        improvementAreas: ['Practice more with similar questions'],
        questionFeedback: interview.questions.map((q: any) => ({
          questionId: q.id,
          score: 5,
          feedback: 'Unable to analyze this answer.',
          missedPoints: [],
          improvementTips: 'Review the expected key points and practice your response.'
        })),
        interviewTips: 'Practice answering questions out loud and focus on specific examples from your experience.'
      };
    }

    // Update the interview with the analysis
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        ai_feedback: {
          overallFeedback: analysis.overallFeedback,
          questionFeedback: analysis.questionFeedback,
          interviewTips: analysis.interviewTips
        },
        selection_percentage: analysis.selectionPercentage,
        performance_level: analysis.performanceLevel,
        strengths: analysis.strengths,
        improvement_areas: analysis.improvementAreas,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', interviewId);

    if (updateError) {
      console.error('Failed to update interview:', updateError);
    }

    console.log('Successfully analyzed mock interview');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          selectionPercentage: analysis.selectionPercentage,
          performanceLevel: analysis.performanceLevel,
          overallFeedback: analysis.overallFeedback,
          strengths: analysis.strengths,
          improvementAreas: analysis.improvementAreas,
          questionFeedback: analysis.questionFeedback,
          interviewTips: analysis.interviewTips
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-mock-interview:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
