import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. INPUT PARSING
    const { assessmentId, answers, voiceResponses } = await req.json();

    if (!assessmentId) {
      return new Response(JSON.stringify({ error: "Assessment ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. AUTHENTICATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // 3. INIT ADMIN CLIENT
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. FETCH CONTEXT
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from("job_assessments")
      .select(
        `
        *,
        jobs (title, company_name, description, requirements),
        talents (user_id, full_name)
      `,
      )
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) throw new Error("Assessment not found");

    // Verify Ownership
    // @ts-ignore
    if (assessment.talents?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized access to this assessment" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. DETERMINE ANSWERS SOURCE (Fallback Logic)
    // If request body is missing answers, try to pull from DB (saved in step 1 of frontend)
    let mcqData = answers?.mcq || {};
    let voiceData = voiceResponses || {};

    if ((!mcqData || Object.keys(mcqData).length === 0) && assessment.answers) {
      console.log("Using fallback answers from Database");
      const dbAnswers = assessment.answers;

      // Handle structure variations (flat vs nested)
      if (dbAnswers.mcq) {
        mcqData = dbAnswers.mcq;
        voiceData = dbAnswers.voice || {};
      } else {
        // Assume flat structure if no 'mcq' key
        mcqData = dbAnswers;
      }
    }

    // 6. SCORING LOGIC
    // @ts-ignore
    const questions = assessment.questions || {};
    const mcqQuestions = questions.mcq_questions || [];
    const voiceQuestions = questions.voice_questions || [];

    // Score MCQs
    let mcqCorrect = 0;
    const mcqResults: any[] = [];

    for (const mcq of mcqQuestions) {
      const userAnswer = mcqData[mcq.id];
      const isCorrect = userAnswer === mcq.correct_index;
      if (isCorrect) mcqCorrect++;

      mcqResults.push({
        questionId: mcq.id,
        question: mcq.question,
        userAnswer,
        correctAnswer: mcq.correct_index,
        isCorrect,
        explanation: mcq.explanation,
      });
    }

    const mcqScore = mcqQuestions.length > 0 ? Math.round((mcqCorrect / mcqQuestions.length) * 100) : 0;

    // 7. AI ANALYSIS (Voice/Text)
    let voiceScore = 0;
    const voiceAnalysis: any[] = [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (voiceQuestions.length > 0 && LOVABLE_API_KEY) {
      console.log("Starting AI Analysis for voice questions...");

      // Build context only if we have responses
      const voiceContext = voiceQuestions
        .map((vq: any) => {
          const response = voiceData[vq.id];
          return `
Q: ${vq.question}
Expected: ${vq.expected_points?.join(", ") || "General competence"}
Candidate Answer: ${typeof response === "object" ? "Audio File Provided" : response || "No answer"}
        `;
        })
        .join("\n---\n");

      // @ts-ignore
      const jobTitle = assessment.jobs?.title || "Role";
      const requirements = JSON.stringify(assessment.jobs?.requirements || []);

      const analysisPrompt = `
      Role: ${jobTitle}
      Requirements: ${requirements}
      
      Candidate Responses:
      ${voiceContext}
      
      Evaluate the candidate. For audio files, assume they were relevant if technical context matches.
      Provide a JSON output ONLY. No markdown. No intro text.
      
      JSON Schema:
      {
        "overallVoiceScore": number (0-100),
        "responses": [
          { "questionId": "string", "score": number, "feedback": "string", "strengths": ["string"], "improvements": ["string"] }
        ],
        "voiceSummary": "string"
      }`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an expert HR interviewer. Output valid JSON only." },
              { role: "user", content: analysisPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          let content = aiData.choices?.[0]?.message?.content || "{}";

          // Robust JSON cleaning
          content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          const parsed = JSON.parse(content);
          voiceScore = parsed.overallVoiceScore || 70; // Default safe score
          voiceAnalysis.push(...(parsed.responses || []));
        } else {
          console.error("AI API Error:", await aiResponse.text());
          voiceScore = 50; // Fallback score
        }
      } catch (err) {
        console.error("AI Processing Failed:", err);
        // Fallback: Don't fail the whole assessment, just give neutral voice score
        voiceScore = 50;
      }
    } else if (voiceQuestions.length > 0) {
      console.warn("Skipping AI analysis: No API Key or No Questions");
    }

    // 8. FINAL SCORING
    const mcqWeight = voiceQuestions.length > 0 ? 0.5 : 1.0;
    const voiceWeight = voiceQuestions.length > 0 ? 0.5 : 0;
    const overallScore = Math.round(mcqScore * mcqWeight + voiceScore * voiceWeight);

    const finalAnalysis = {
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
      recommendation: overallScore >= 70 ? "Strong Hire" : overallScore >= 50 ? "Consider" : "Pass",
      completedAt: new Date().toISOString(),
    };

    // 9. DATABASE UPDATE
    const { error: updateError } = await supabaseAdmin
      .from("job_assessments")
      .update({
        ai_score: overallScore,
        ai_analysis: finalAnalysis,
        status: "completed",
        completed_at: new Date().toISOString(),
        // Ensure we save the structured answers if we have them
        answers: { mcq: mcqData, voice: voiceData },
      })
      .eq("id", assessmentId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, score: overallScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
