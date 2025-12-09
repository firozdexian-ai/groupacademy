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
    const { analysisId } = await req.json();

    if (!analysisId) {
      return new Response(
        JSON.stringify({ error: "Analysis ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from("salary_analyses")
      .select("*, profession_categories(name, description)")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      console.error("Error fetching analysis:", fetchError);
      return new Response(
        JSON.stringify({ error: "Analysis not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cvContent = analysis.cv_text || "No CV provided - analyze based on job description only";
    const professionName = analysis.profession_categories?.name || "General";

    const prompt = `You are an expert HR consultant and salary negotiation specialist for the Bangladesh job market.

Analyze the following CV and Job Description to provide comprehensive salary insights.

## CV Content:
${cvContent}

## Job Description:
${analysis.job_description}

## Target Role: ${analysis.job_title || "Not specified"}
## Company: ${analysis.company_name || "Not specified"}
## Profession Category: ${professionName}

Please provide a detailed analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary of the candidate's market position",
  "market_salary_range": {
    "currency": "BDT",
    "min_monthly": <number>,
    "max_monthly": <number>,
    "median_monthly": <number>,
    "experience_level": "entry|mid|senior|executive",
    "market_context": "Brief explanation of how this range was determined for Bangladesh market"
  },
  "skills_analysis": {
    "matching_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2"],
    "skills_gap_score": <number 0-100>,
    "recommendations": ["recommendation1", "recommendation2"]
  },
  "negotiation_tips": [
    {
      "tip": "Specific negotiation tip",
      "rationale": "Why this works"
    }
  ],
  "market_insights": {
    "demand_level": "high|medium|low",
    "growth_trajectory": "growing|stable|declining",
    "key_employers": ["company1", "company2"],
    "industry_trends": ["trend1", "trend2"]
  },
  "action_plan": [
    "Specific action item 1",
    "Specific action item 2"
  ],
  "overall_readiness_score": <number 0-100>,
  "salary_positioning": "below_market|at_market|above_market"
}

Focus on the Bangladesh job market context. Be realistic and practical with salary ranges based on current Bangladesh market conditions.`;

    console.log("Calling Lovable AI for salary analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert HR consultant specializing in the Bangladesh job market. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the AI response
    let parsedAnalysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Provide fallback analysis
      parsedAnalysis = {
        summary: "Analysis completed. Please review the insights below.",
        market_salary_range: {
          currency: "BDT",
          min_monthly: 30000,
          max_monthly: 80000,
          median_monthly: 50000,
          experience_level: "mid",
          market_context: "Based on general market trends in Bangladesh"
        },
        skills_analysis: {
          matching_skills: [],
          missing_skills: [],
          skills_gap_score: 50,
          recommendations: ["Review the job requirements carefully"]
        },
        negotiation_tips: [
          { tip: "Research market rates thoroughly", rationale: "Knowledge is power in negotiations" }
        ],
        market_insights: {
          demand_level: "medium",
          growth_trajectory: "stable",
          key_employers: [],
          industry_trends: []
        },
        action_plan: ["Complete your profile for better analysis"],
        overall_readiness_score: 50,
        salary_positioning: "at_market"
      };
    }

    // Update the analysis record
    const { error: updateError } = await supabase
      .from("salary_analyses")
      .update({
        ai_analysis: parsedAnalysis,
        market_salary_range: parsedAnalysis.market_salary_range,
        skills_gap: parsedAnalysis.skills_analysis,
        negotiation_tips: parsedAnalysis.negotiation_tips,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    if (updateError) {
      console.error("Error updating analysis:", updateError);
    }

    console.log("Salary analysis completed successfully");

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-salary function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
