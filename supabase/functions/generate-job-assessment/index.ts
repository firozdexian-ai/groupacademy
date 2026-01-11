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

    const { jobId, talentId, jobApplicationId } = await req.json();

    if (!jobId || !talentId) {
      return new Response(JSON.stringify({ error: "Job ID and Talent ID are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Admin Client for Data Operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch talent profile to verify ownership
    const { data: talent, error: talentError } = await supabaseAdmin
      .from("talents")
      .select("*, user_id")
      .eq("id", talentId)
      .single();

    if (talentError || !talent) {
      return new Response(JSON.stringify({ error: "Talent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. SECURITY: Ownership Check
    // Ensure the requesting user owns the talent profile
    if (talent.user_id !== user.id) {
      console.error(`Unauthorized access: User ${user.id} tried to generate assessment for talent ${talentId}`);
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing pending assessment
    const { data: existingAssessment } = await supabaseAdmin
      .from("job_assessments")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("talent_id", talentId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingAssessment) {
      return new Response(
        JSON.stringify({
          success: true,
          assessmentId: existingAssessment.id,
          message: "Existing assessment found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*, profession_categories(name, description)")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assessmentConfig = job.assessment_config || { question_count: 6, voice_enabled: true };
    const questionCount = assessmentConfig.question_count || 6;
    const voiceEnabled = assessmentConfig.voice_enabled !== false;
    const mcqCount = voiceEnabled ? Math.floor(questionCount * 0.6) : questionCount;
    const voiceCount = voiceEnabled ? questionCount - mcqCount : 0;

    // Build context for AI
    let candidateContext = "";
    if (talent.cv_text) {
      candidateContext = `CANDIDATE CV SUMMARY:\n${talent.cv_text.substring(0, 2000)}`;
    }
    if (talent.skills && Array.isArray(talent.skills) && talent.skills.length > 0) {
      candidateContext += `\n\nCANDIDATE SKILLS: ${talent.skills.join(", ")}`;
    }
    if (talent.experience && Array.isArray(talent.experience) && talent.experience.length > 0) {
      const expStr = talent.experience
        .map((e: any) => (typeof e === "string" ? e : `${e.title || ""} at ${e.company || ""}`))
        .join("; ");
      candidateContext += `\n\nCANDIDATE EXPERIENCE: ${expStr}`;
    }

    // @ts-ignore - Supabase join
    const professionContext = job.profession_categories
      ? `The role is in the ${job.profession_categories.name} field. ${job.profession_categories.description || ""}`
      : "";

    const prompt = `You are an expert HR interviewer creating a personalized assessment for a job application. Generate a unique assessment tailored to this specific candidate and job.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company_name}
Description: ${job.description}
Requirements: ${JSON.stringify(job.requirements || [])}
${professionContext}

${candidateContext}

IMPORTANT INSTRUCTIONS:
1. Generate exactly ${mcqCount} Multiple Choice Questions (MCQ) with 4 options each
2. ${voiceEnabled ? `Generate exactly ${voiceCount} open-ended voice/text questions for in-depth responses` : "No voice questions needed"}
3. Questions should be UNIQUE to this candidate - probe their specific background, skills gaps, and fit for this role
4. MCQs should test technical knowledge and situational judgment
5. Voice questions should be behavioral (STAR format encouraged) and role-specific
6. Difficulty should match the experience level of the role

Respond ONLY with valid JSON in this exact format:
{
  "mcq_questions": [
    {
      "id": "mcq1",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "category": "technical|situational|behavioral",
      "explanation": "Why this answer is correct"
    }
  ],
  "voice_questions": [
    {
      "id": "voice1",
      "question": "Open-ended question text",
      "category": "behavioral|situational|technical",
      "expected_points": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}`;

    console.log(`Generating personalized job assessment questions for user ${user.id}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini", // Assuming this model is available, otherwise use gpt-4o-mini or similar
        messages: [
          {
            role: "system",
            content:
              "You are an expert HR interviewer. Generate unique, personalized assessment questions. CRITICAL: Return ONLY a valid JSON object. No markdown, no code fences, no explanatory text. Just the raw JSON object starting with { and ending with }.",
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
      return new Response(JSON.stringify({ error: "Failed to generate assessment questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty AI response");
      return new Response(JSON.stringify({ error: "Failed to generate questions - empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response with robust cleaning
    let parsedContent;
    try {
      let cleanContent = content.trim();

      // Remove code fences
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      // Try to extract JSON object if there's extra text
      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }

      // Remove illegal control characters that break JSON parsing
      cleanContent = cleanContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");

      // Fix common JSON issues: truncated strings in arrays
      cleanContent = cleanContent.replace(/,\s*"[^"]*$/g, ""); // Remove trailing incomplete strings
      cleanContent = cleanContent.replace(/\[\s*"[^"]*$/g, "[]"); // Fix incomplete arrays

      try {
        parsedContent = JSON.parse(cleanContent);
      } catch (firstError) {
        // Second attempt: try to fix common structural issues
        console.log("First parse attempt failed, trying to fix JSON structure...");

        let fixedContent = cleanContent;
        // Fix logic removed for brevity - rely on prompt engineering mostly
        // Simple brace fixing
        const openBraces = (fixedContent.match(/{/g) || []).length;
        const closeBraces = (fixedContent.match(/}/g) || []).length;
        fixedContent += "}".repeat(openBraces - closeBraces);

        parsedContent = JSON.parse(fixedContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ error: "Failed to parse AI response - please try again" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create assessment record
    const { data: assessment, error: insertError } = await supabaseAdmin
      .from("job_assessments")
      .insert({
        job_id: jobId,
        talent_id: talentId,
        job_application_id: jobApplicationId || null,
        questions: parsedContent,
        status: "pending",
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Assessment insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create assessment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Successfully created job assessment:", assessment.id);

    return new Response(
      JSON.stringify({
        success: true,
        assessmentId: assessment.id,
        questions: parsedContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-job-assessment:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
