import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to check if user is an admin
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "talent_exec"])
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    const { assessmentId } = await req.json();

    if (!assessmentId) {
      return new Response(JSON.stringify({ error: "Assessment ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Analyzing assessment: ${assessmentId} for user: ${user.id}`);

    // Initialize Supabase Admin client (needed to update analysis)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, supabaseServiceKey);

    // Fetch the assessment with profession category
    const { data: assessment, error: fetchError } = await supabaseAdmin
      .from("career_assessments")
      .select(
        `
        *,
        profession_categories (name, description)
      `,
      )
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      return new Response(JSON.stringify({ error: "Assessment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's talent_id for ownership check
    const { data: talent } = await supabaseAuth
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const userTalentId = talent?.id;

    // 2. SECURITY: Ownership Check (IDOR Prevention)
    // Allow access if:
    // - User owns via user_id
    // - User owns via talent_id
    // - User is an admin
    const isOwnerByUserId = assessment.user_id === user.id;
    const isOwnerByTalentId = userTalentId && assessment.talent_id === userTalentId;
    const isAdmin = await checkIsAdmin(supabaseAdmin, user.id);

    if (!isOwnerByUserId && !isOwnerByTalentId && !isAdmin) {
      console.error(`Unauthorized access attempt: User ${user.id} tried to access assessment ${assessmentId}`);
      return new Response(JSON.stringify({ error: "Unauthorized access to this assessment" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the questions to understand context
    const { data: questions } = await supabaseAdmin
      .from("assessment_questions")
      .select("id, question_text, category, options")
      .eq("is_active", true);

    // Build context for AI
    // @ts-ignore - Supabase type join handling
    const professionName = assessment.profession_categories?.name || "General";
    const answersWithContext = Object.entries(assessment.answers || {})
      .map(([questionId, answer]) => {
        const question = questions?.find((q) => q.id === questionId);
        if (!question) return null;

        let answerText = answer;
        if (typeof answer === "string" && Array.isArray(question.options)) {
          const option = question.options.find((o: any) => o.value === answer);
          answerText = option?.label || answer;
        } else if (Array.isArray(answer)) {
          answerText = answer
            .map((a) => {
              const option = question.options?.find((o: any) => o.value === a);
              return option?.label || a;
            })
            .join(", ");
        }

        return {
          category: question.category,
          question: question.question_text,
          answer: answerText,
        };
      })
      .filter(Boolean);

    // Group answers by category
    const groupedAnswers = answersWithContext.reduce((acc: any, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const prompt = `You are a professional career counselor analyzing a Career Readiness Assessment for someone in the ${professionName} field.

Assessment Results:
- Overall Score: ${assessment.percentage}%
- Readiness Level: ${assessment.readiness_level}
- Profession: ${professionName}

Detailed Responses by Category:
${Object.entries(groupedAnswers)
  .map(
    ([category, items]: [string, any]) => `
${category.toUpperCase().replace(/_/g, " ")}:
${items.map((item: any) => `- Q: ${item.question}\n  A: ${item.answer}`).join("\n")}
`,
  )
  .join("\n")}

Based on this assessment, provide a JSON response with the following structure:
{
  "strengths": ["3-4 specific strengths identified from their responses"],
  "improvement_areas": ["3-4 specific areas needing improvement"],
  "recommendations": ["4-5 actionable recommendations tailored to ${professionName}"],
  "career_tips": "A motivational paragraph (2-3 sentences) specific to their readiness level and profession",
  "suggested_courses": ["2-3 relevant course topics they should consider"]
}

Be specific, actionable, and encouraging. Focus on practical advice for the Bangladesh job market. Keep the language professional but accessible.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

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
              "You are a career counselor. Always respond with valid JSON only, no markdown formatting or code blocks.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429 || aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service busy or quota exceeded." }), {
          status: aiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("Failed to generate analysis");
    }

    const aiData = await aiResponse.json();
    let aiAnalysis;
    try {
      const content = aiData.choices?.[0]?.message?.content || "";
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      aiAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return fallback without crashing
      return new Response(
        JSON.stringify({
          error: "Analysis generated but format was invalid",
          partial: aiData.choices?.[0]?.message?.content,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update the assessment with AI analysis
    const { error: updateError } = await supabaseAdmin
      .from("career_assessments")
      .update({
        ai_analysis: aiAnalysis,
        improvement_areas: aiAnalysis.improvement_areas || [],
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Failed to update assessment:", updateError);
      throw new Error("Database update failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: aiAnalysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in analyze-career-assessment:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
