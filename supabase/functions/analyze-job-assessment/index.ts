import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { assessmentId, answers, voiceResponses } = await req.json();

    if (!assessmentId || !answers) {
      return new Response(JSON.stringify({ error: "Assessment ID and answers are required" }), {
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

    // Fetch the assessment with job and talent data (including user_id for verification)
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from("job_assessments")
      .select(
        `
        *,
        jobs (title, company_name, description, requirements),
        talents (user_id, full_name, email, cv_text, skills)
      `,
      )
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error("Assessment fetch error:", assessmentError);
      return new Response(JSON.stringify({ error: "Assessment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. SECURITY: Ownership Check
    // Ensure the assessment belongs to the authenticated user
    // We check assessment.talents.user_id because job_assessments links to talents, which links to auth.users
    // @ts-ignore - Supabase type join
    if (assessment.talents?.user_id !== user.id) {
      console.error(
        `Unauthorized access: User ${user.id} tried to grade assessment ${assessmentId} belonging to ${assessment.talents?.user_id}`,
      );
      return new Response(JSON.stringify({ error: "Unauthorized access to this assessment" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (assessment.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          score: assessment.ai_score,
          analysis: assessment.ai_analysis,
          message: "Assessment already completed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const questions = assessment.questions;
    // @ts-ignore - JSON type handling
    const mcqQuestions = questions.mcq_questions || [];
    // @ts-ignore - JSON type handling
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
        explanation: mcq.explanation,
      });
    }

    const mcqScore = mcqQuestions.length > 0 ? Math.round((mcqCorrect / mcqQuestions.length) * 100) : 0;

    // Analyze voice/text responses with AI
    let voiceScore = 0;
    const voiceAnalysis: any[] = [];

    if (voiceQuestions.length > 0 && voiceResponses) {
      const voiceContext = voiceQuestions
        .map((vq: any) => {
          const response = voiceResponses[vq.id];
          return `
Question: ${vq.question}
Expected Points: ${vq.expected_points?.join(", ")}
Candidate Response: ${response?.text || response || "No response provided"}
        `;
        })
        .join("\n---\n");

      // @ts-ignore - Supabase type join
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

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert HR interviewer analyzing candidate responses. Be fair but thorough. Always respond with valid JSON only.",
              },
              { role: "user", content: analysisPrompt },
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
            // Clean markdown code blocks
            cleanContent = cleanContent
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();

            const parsedAnalysis = JSON.parse(cleanContent);
            voiceScore = parsedAnalysis.overallVoiceScore || 0;
            voiceAnalysis.push(...(parsedAnalysis.responses || []));
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        // Continue with MCQ score only, default neutral voice score to avoid failing
        voiceScore = 50;
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
        results: mcqResults,
      },
      voice:
        voiceQuestions.length > 0
          ? {
              score: voiceScore,
              analysis: voiceAnalysis,
            }
          : null,
      recommendation:
        overallScore >= 70
          ? "Strong candidate - recommend for interview"
          : overallScore >= 50
            ? "Moderate fit - consider for interview with reservations"
            : "Below expectations - may not be the best fit",
      completedAt: new Date().toISOString(),
    };

    // Update assessment
    const { error: updateError } = await supabaseAdmin
      .from("job_assessments")
      .update({
        answers: { mcq: answers.mcq, voice: voiceResponses },
        voice_recordings: voiceResponses ? Object.keys(voiceResponses).length : null,
        ai_score: overallScore,
        ai_analysis: aiAnalysis,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Assessment update error:", updateError);
      throw new Error("Failed to save assessment results");
    }

    console.log("Successfully analyzed job assessment:", assessmentId, "Score:", overallScore);

    return new Response(
      JSON.stringify({
        success: true,
        score: overallScore,
        analysis: aiAnalysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in analyze-job-assessment:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
