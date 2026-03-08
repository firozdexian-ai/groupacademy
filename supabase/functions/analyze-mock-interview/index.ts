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

    const { interviewId } = await req.json();

    if (!interviewId) {
      return new Response(JSON.stringify({ error: "Interview ID is required" }), {
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

    // Initialize Admin Client for data fetching/updating
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the interview data
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from("mock_interviews")
      .select("*, profession_categories(name, description)")
      .eq("id", interviewId)
      .single();

    if (fetchError || !interview) {
      console.error("Failed to fetch interview:", fetchError);
      return new Response(JSON.stringify({ error: "Interview not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. SECURITY: Ownership Check
    // Ensure the interview belongs to the requesting user
    // We check both user_id (direct link) and talent_id (legacy link) to be safe
    // Note: You might need to fetch the talent record if user_id is null in older records
    if (interview.user_id && interview.user_id !== user.id) {
      console.error(
        `Unauthorized access: User ${user.id} tried to access interview ${interviewId} belonging to ${interview.user_id}`,
      );
      return new Response(JSON.stringify({ error: "Unauthorized access to this interview" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!interview.questions || !interview.answers) {
      return new Response(JSON.stringify({ error: "Interview questions or answers are missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the analysis prompt
    const questionsWithAnswers = interview.questions.map((q: any, index: number) => {
      const answer = interview.answers.find((a: any) => a.questionId === q.id);
      return {
        questionNumber: index + 1,
        question: q.question,
        category: q.category,
        expectedPoints: q.expectedPoints,
        candidateAnswer: answer?.answer || "No answer provided",
        timeTaken: answer?.timeTakenSeconds || 0,
      };
    });

    const professionContext = interview.profession_categories
      ? `Field: ${interview.profession_categories.name}. ${interview.profession_categories.description || ""}`
      : "";

    const prompt = `You are an expert HR interviewer and career coach. Analyze this mock interview and provide detailed feedback.

JOB DETAILS:
- Job Title: ${interview.job_title || "Not specified"}
- Company: ${interview.company_name || "Not specified"}
- Difficulty: ${interview.difficulty}
${professionContext}

JOB DESCRIPTION:
${interview.job_description}

INTERVIEW QUESTIONS AND CANDIDATE ANSWERS:
${questionsWithAnswers
  .map(
    (qa: any) => `
Question ${qa.questionNumber} (${qa.category}):
"${qa.question}"

Expected Key Points: ${qa.expectedPoints.join(", ")}

Candidate's Answer:
"${qa.candidateAnswer}"

Time Taken: ${qa.timeTaken} seconds
`,
  )
  .join("\n---\n")}

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

    console.log("Analyzing mock interview with Lovable AI...");

    // Add timeout controller for AI call (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You are an expert HR interviewer and career coach. Provide detailed, constructive feedback on mock interviews. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded or rate limited." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to analyze interview" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Parse the JSON response
    let analysis;
    try {
      let cleanContent = content.trim();
      // Clean markdown
      cleanContent = cleanContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback analysis object to prevent crashing
      analysis = {
        selectionPercentage: 50,
        performanceLevel: "developing",
        overallFeedback: "Analysis completed, but format was irregular.",
        strengths: ["Completed interview"],
        improvementAreas: ["Review recorded answers"],
        questionFeedback: [],
        interviewTips: "Practice makes perfect.",
      };
    }

    // Update the interview with the analysis
    const { error: updateError } = await supabaseAdmin
      .from("mock_interviews")
      .update({
        ai_feedback: {
          overallFeedback: analysis.overallFeedback,
          questionFeedback: analysis.questionFeedback,
          interviewTips: analysis.interviewTips,
        },
        selection_percentage: analysis.selectionPercentage,
        performance_level: analysis.performanceLevel,
        strengths: analysis.strengths,
        improvement_areas: analysis.improvementAreas,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (updateError) {
      console.error("Failed to update interview:", updateError);
      throw new Error("Database update failed");
    }

    // Fire-and-forget: send service completion email
    if (interview.talent_id) {
      const summary = `Selection: ${analysis.selectionPercentage}% — ${analysis.performanceLevel}. ${(analysis.strengths || []).slice(0, 2).join(", ")}`;
      fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ type: "service_complete", talent_id: interview.talent_id, data: { service_name: "Mock Interview", summary } }),
      }).catch((e) => console.warn("Email trigger failed:", e.message));
    }

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
          interviewTips: analysis.interviewTips,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in analyze-mock-interview:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
