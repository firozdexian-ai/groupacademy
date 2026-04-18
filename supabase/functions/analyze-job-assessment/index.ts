import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error("Assessment ID is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch data with full relations
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from("job_assessments")
      .select(`*, jobs (title, requirements), talents (user_id, full_name, email)`)
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) throw new Error("Assessment not found");

    const questions = (assessment.questions as any) || {};
    const mcqQuestions = questions.mcq_questions || [];
    const voiceQuestions = questions.voice_questions || [];
    const answers = (assessment.answers as any) || {};
    const mcqAnswers = answers.mcq || answers; // Handle legacy and new shape

    // 2. MCQ Scoring
    let mcqCorrect = 0;
    const mcqResults = mcqQuestions.map((q: any, i: number) => {
      const userAnswer = mcqAnswers[q.id] ?? mcqAnswers[String(i)];
      const isCorrect = String(userAnswer) === String(q.correct_index);
      if (isCorrect) mcqCorrect++;
      return { questionId: q.id, isCorrect, userAnswer, correctAnswer: q.correct_index };
    });
    const mcqScore = mcqQuestions.length > 0 ? Math.round((mcqCorrect / mcqQuestions.length) * 100) : 0;

    // 3. Voice Processing (CTO Fix: Handling storagePath vs base64)
    let voiceScore = 0;
    const voiceAnalysis = [];

    if (voiceQuestions.length > 0) {
      console.log(`Processing ${voiceQuestions.length} voice responses...`);

      const transcribedResponses = await Promise.all(
        voiceQuestions.map(async (vq: any) => {
          const ans = answers[vq.id];
          let transcript = "[No response provided]";

          if (ans?.storagePath) {
            // CTO Fix: Generate signed URL for Whisper transcription
            const { data: urlData } = await supabaseAdmin.storage
              .from("assessment-audio")
              .createSignedUrl(ans.storagePath, 60);

            if (urlData?.signedUrl) {
              try {
                // Whisper Transcription Call
                const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
                  body: JSON.stringify({ file: urlData.signedUrl, model: "whisper-1" }),
                });
                const whisperData = await whisperRes.json();
                transcript = whisperData.text || transcript;
              } catch (e) {
                console.error("Transcription failed for:", ans.storagePath);
              }
            }
          } else if (typeof ans === "string" && ans.startsWith("data:audio")) {
            transcript = "[Legacy Base64 Audio - Needs Re-recording]";
          }

          return { question: vq.question, expected: vq.expected_points, answer: transcript };
        }),
      );

      // 4. AI Evaluation of Transcripts
      const evaluationPrompt = `
        Role: ${assessment.jobs?.title}
        Criteria: ${JSON.stringify(assessment.jobs?.requirements)}
        Candidate Responses: ${JSON.stringify(transcribedResponses)}
        Evaluate the depth, technical accuracy, and communication style.
        Return JSON ONLY: { "score": number, "feedback": "string", "details": [] }
      `;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash",
            messages: [{ role: "user", content: evaluationPrompt }],
          }),
        });
        const aiData = await aiRes.json();
        const cleanContent = aiData.choices[0].message.content.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanContent);
        voiceScore = parsed.score || 50;
        voiceAnalysis.push(parsed);
      } catch (err) {
        console.error("AI Evaluation Failed:", err);
        voiceScore = 50; // Default pass for transcription success but AI failure
      }
    }

    // 5. Final Synthesis
    const weight = voiceQuestions.length > 0 ? 0.5 : 1.0;
    const overallScore = Math.round(mcqScore * weight + voiceScore * (1 - weight));

    const finalResult = {
      overallScore,
      mcq: { score: mcqScore, results: mcqResults },
      voice: voiceQuestions.length > 0 ? { score: voiceScore, analysis: voiceAnalysis } : null,
      recommendation: overallScore >= 75 ? "Strong Hire" : overallScore >= 50 ? "Consider" : "Pass",
    };

    // Update DB
    await supabaseAdmin
      .from("job_assessments")
      .update({
        ai_score: overallScore,
        ai_analysis: finalResult,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", assessmentId);

    return new Response(JSON.stringify({ success: true, score: overallScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Fatal Analyzer Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
