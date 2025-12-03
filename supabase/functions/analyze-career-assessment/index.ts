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
    const { assessmentId } = await req.json();
    
    if (!assessmentId) {
      console.error("Missing assessmentId");
      return new Response(
        JSON.stringify({ error: "Assessment ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing assessment:", assessmentId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the assessment with profession category
    const { data: assessment, error: fetchError } = await supabase
      .from("career_assessments")
      .select(`
        *,
        profession_categories (name, description)
      `)
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      console.error("Assessment not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Assessment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the questions to understand context
    const { data: questions } = await supabase
      .from("assessment_questions")
      .select("id, question_text, category, options")
      .eq("is_active", true);

    // Build context for AI
    const professionName = assessment.profession_categories?.name || "General";
    const answersWithContext = Object.entries(assessment.answers || {}).map(([questionId, answer]) => {
      const question = questions?.find(q => q.id === questionId);
      if (!question) return null;
      
      let answerText = answer;
      if (typeof answer === "string" && Array.isArray(question.options)) {
        const option = question.options.find((o: any) => o.value === answer);
        answerText = option?.label || answer;
      } else if (Array.isArray(answer)) {
        answerText = answer.map(a => {
          const option = question.options?.find((o: any) => o.value === a);
          return option?.label || a;
        }).join(", ");
      }
      
      return {
        category: question.category,
        question: question.question_text,
        answer: answerText
      };
    }).filter(Boolean);

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
${Object.entries(groupedAnswers).map(([category, items]: [string, any]) => `
${category.toUpperCase().replace(/_/g, ' ')}:
${items.map((item: any) => `- Q: ${item.question}\n  A: ${item.answer}`).join('\n')}
`).join('\n')}

Based on this assessment, provide a JSON response with the following structure:
{
  "strengths": ["3-4 specific strengths identified from their responses"],
  "improvement_areas": ["3-4 specific areas needing improvement"],
  "recommendations": ["4-5 actionable recommendations tailored to ${professionName}"],
  "career_tips": "A motivational paragraph (2-3 sentences) specific to their readiness level and profession",
  "suggested_courses": ["2-3 relevant course topics they should consider"]
}

Be specific, actionable, and encouraging. Focus on practical advice for the Bangladesh job market. Keep the language professional but accessible.`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
            content: "You are a career counselor. Always respond with valid JSON only, no markdown formatting or code blocks."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    let aiAnalysis;
    try {
      const content = aiData.choices?.[0]?.message?.content || "";
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      aiAnalysis = JSON.parse(cleanedContent);
      console.log("AI analysis parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", aiData.choices?.[0]?.message?.content);
      
      // Fallback analysis
      aiAnalysis = {
        strengths: [
          "Shows commitment to career development by taking this assessment",
          "Demonstrates self-awareness about professional growth",
          "Actively seeking ways to improve career readiness"
        ],
        improvement_areas: [
          "Consider updating your professional profiles regularly",
          "Expand professional networking activities",
          "Focus on continuous skill development"
        ],
        recommendations: [
          "Update your LinkedIn profile and CV to reflect current skills",
          "Join professional communities in your field",
          "Set specific career goals for the next 6 months",
          "Take online courses to fill skill gaps"
        ],
        career_tips: "Your decision to assess your career readiness shows initiative. Focus on the areas identified for improvement and take small, consistent steps toward your goals.",
        suggested_courses: [
          "Professional Communication Skills",
          "Career Development Fundamentals",
          "Industry-specific Training"
        ]
      };
    }

    // Update the assessment with AI analysis
    const { error: updateError } = await supabase
      .from("career_assessments")
      .update({
        ai_analysis: aiAnalysis,
        improvement_areas: aiAnalysis.improvement_areas || []
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Failed to update assessment:", updateError);
    } else {
      console.log("Assessment updated with AI analysis");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: aiAnalysis 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-career-assessment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
