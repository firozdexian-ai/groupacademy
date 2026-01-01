import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { assessmentId, answers, voiceResponses } = await req.json();

    if (!assessmentId || !answers) {
      return new Response(
        JSON.stringify({ error: 'Assessment ID and answers are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the assessment with job and talent data
    const { data: assessment, error: assessmentError } = await supabase
      .from('job_assessments')
      .select(`
        *,
        jobs (title, company_name, description, requirements),
        talents (full_name, email, cv_text, skills)
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment fetch error:', assessmentError);
      return new Response(
        JSON.stringify({ error: 'Assessment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (assessment.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          score: assessment.ai_score,
          analysis: assessment.ai_analysis,
          message: 'Assessment already completed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = assessment.questions;
    const mcqQuestions = questions.mcq_questions || [];
    const voiceQuestions = questions.voice_questions || [];

    // Score MCQ questions
    let mcqCorrect = 0;
    const mcqResults: any[] = [];
    for (const mcq of mcqQuestions) {
      const userAnswer = answers.mcq?.[mcq.id];
      const isCorrect = userAnswer === mcq.correct_index;
      if (isCorrect) mcqCorrect++;
      mcqResults.push({
        questionId: mcq.id,
        question: mcq.question,
        userAnswer: userAnswer,
        correctAnswer: mcq.correct_index,
        isCorrect,
        explanation: mcq.explanation
      });
    }

    const mcqScore = mcqQuestions.length > 0 
      ? Math.round((mcqCorrect / mcqQuestions.length) * 100) 
      : 0;

    // Analyze voice/text responses with AI
    let voiceScore = 0;
    const voiceAnalysis: any[] = [];
    
    if (voiceQuestions.length > 0 && voiceResponses) {
      const voiceContext = voiceQuestions.map((vq: any) => {
        const response = voiceResponses[vq.id];
        return `
Question: ${vq.question}
Expected Points: ${vq.expected_points?.join(', ')}
Candidate Response: ${response?.text || response || 'No response provided'}
        `;
      }).join('\n---\n');

      const analysisPrompt = `Analyze these interview responses for a ${assessment.jobs?.title} position at ${assessment.jobs?.company_name}.

JOB REQUIREMENTS:
${JSON.stringify(assessment.jobs?.requirements || [])}

CANDIDATE RESPONSES:
${voiceContext}

For each response, provide:
1. A score out of 100
2. Key strengths shown
3. Areas for improvement
4. Overall assessment

Then provide an overall voice section score (0-100) and summary.

Respond ONLY with valid JSON:
{
  "responses": [
    {
      "questionId": "voice1",
      "score": 75,
      "strengths": ["point 1", "point 2"],
      "improvements": ["area 1"],
      "feedback": "Brief feedback"
    }
  ],
  "overallVoiceScore": 80,
  "voiceSummary": "Overall assessment of candidate's communication and responses"
}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: 'You are an expert HR interviewer analyzing candidate responses. Be fair but thorough. Always respond with valid JSON only.'
              },
              { role: 'user', content: analysisPrompt }
            ],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.slice(7);
            } else if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.slice(3);
            }
            if (cleanContent.endsWith('```')) {
              cleanContent = cleanContent.slice(0, -3);
            }
            
            const parsedAnalysis = JSON.parse(cleanContent.trim());
            voiceScore = parsedAnalysis.overallVoiceScore || 0;
            voiceAnalysis.push(...(parsedAnalysis.responses || []));
          }
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Continue with MCQ score only
        voiceScore = 50; // Default neutral score if AI fails
      }
    }

    // Calculate overall score
    const mcqWeight = voiceQuestions.length > 0 ? 0.5 : 1.0;
    const voiceWeight = voiceQuestions.length > 0 ? 0.5 : 0;
    const overallScore = Math.round(mcqScore * mcqWeight + voiceScore * voiceWeight);

    // Build analysis object
    const aiAnalysis = {
      overallScore,
      mcq: {
        score: mcqScore,
        correct: mcqCorrect,
        total: mcqQuestions.length,
        results: mcqResults
      },
      voice: voiceQuestions.length > 0 ? {
        score: voiceScore,
        analysis: voiceAnalysis
      } : null,
      recommendation: overallScore >= 70 
        ? 'Strong candidate - recommend for interview'
        : overallScore >= 50 
          ? 'Moderate fit - consider for interview with reservations'
          : 'Below expectations - may not be the best fit',
      completedAt: new Date().toISOString()
    };

    // Update assessment
    const { error: updateError } = await supabase
      .from('job_assessments')
      .update({
        answers: { mcq: answers.mcq, voice: voiceResponses },
        voice_recordings: voiceResponses ? Object.keys(voiceResponses).length : null,
        ai_score: overallScore,
        ai_analysis: aiAnalysis,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Assessment update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save assessment results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully analyzed job assessment:', assessmentId, 'Score:', overallScore);

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: overallScore,
        analysis: aiAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-job-assessment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
