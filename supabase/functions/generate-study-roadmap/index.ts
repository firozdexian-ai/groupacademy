import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RoadmapRequest {
  roadmapId: string;
  targetCountries: string[];
  degreeLevel: string;
  fieldOfStudy: string;
  targetIntake: string;
  budgetLevel: string;
  ieltsScore?: number;
  hasTakenIelts: boolean;
  gpa?: string;
  yearsExperience?: number;
  cvText?: string;
  educationSummary?: Record<string, unknown>;
  experienceSummary?: Record<string, unknown>;
  partTimeWorkInterest: boolean;
  familySupport: boolean;
  specialRequirements?: string;
  fullName: string;
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestData: RoadmapRequest = await req.json();
    const {
      roadmapId,
      targetCountries,
      degreeLevel,
      fieldOfStudy,
      targetIntake,
      budgetLevel,
      ieltsScore,
      hasTakenIelts,
      gpa,
      yearsExperience,
      cvText,
      educationSummary,
      experienceSummary,
      partTimeWorkInterest,
      familySupport,
      specialRequirements,
      fullName,
    } = requestData;

    // Update status to processing
    await supabase
      .from("study_abroad_roadmaps")
      .update({ status: "processing" })
      .eq("id", roadmapId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentDate = new Date().toISOString().split("T")[0];
    const countriesStr = targetCountries.join(", ");

    const systemPrompt = `You are an expert study abroad consultant with deep knowledge of international university admissions, visa processes, and scholarship opportunities. You specialize in helping Bangladeshi students plan their study abroad journey.

CURRENT DATE: ${currentDate}

Your task is to create a COMPREHENSIVE and PERSONALIZED 12-month study abroad roadmap. Be specific, actionable, and realistic.

CRITICAL INSTRUCTIONS:
1. Generate realistic university recommendations based on the profile
2. Create a month-by-month timeline starting from the current month
3. Include country-specific requirements and deadlines
4. Be honest about profile gaps and how to address them
5. Provide accurate scholarship information relevant to Bangladeshi students

OUTPUT FORMAT: You MUST respond with valid JSON matching this exact structure:
{
  "profileSummary": {
    "strengths": ["string array of 3-5 profile strengths"],
    "gaps": ["string array of areas needing improvement"],
    "overallReadiness": "high" | "medium" | "low"
  },
  "recommendedUniversities": [
    {
      "name": "University Name",
      "country": "Country",
      "program": "Program Name",
      "ranking": "World ranking or regional ranking",
      "tuitionRange": "Annual tuition in USD",
      "fitReason": "Why this is a good fit for the candidate",
      "deadline": "Application deadline",
      "tier": "reach" | "target" | "safety"
    }
  ],
  "timeline": [
    {
      "month": 1,
      "title": "Month title (e.g., Research & Test Prep)",
      "tasks": ["Array of specific actionable tasks"],
      "deadline": "Any important deadline this month"
    }
  ],
  "documents": [
    {
      "name": "Document name",
      "required": true | false,
      "deadline": "When needed",
      "tips": "Tips for preparing this document"
    }
  ],
  "budget": {
    "tuitionRange": "Annual tuition range",
    "livingExpenses": "Monthly living expenses",
    "applicationFees": "Total application fees estimate",
    "testFees": "IELTS/GRE/GMAT fees",
    "visaCosts": "Visa application costs",
    "totalEstimate": "Total first year estimate"
  },
  "scholarships": [
    {
      "name": "Scholarship name",
      "amount": "Scholarship amount or coverage",
      "eligibility": "Key eligibility criteria",
      "deadline": "Application deadline"
    }
  ]
}

IMPORTANT: Recommend 4-5 universities with a mix of reach, target, and safety schools. Create a 12-month timeline with 12 entries.`;

    const profileContext = `
CANDIDATE PROFILE:
- Name: ${fullName}
- Target Countries: ${countriesStr}
- Degree Level: ${degreeLevel}
- Field of Study: ${fieldOfStudy || "Not specified"}
- Target Intake: ${targetIntake}
- Budget Level: ${budgetLevel}
- IELTS Status: ${hasTakenIelts ? `Score: ${ieltsScore}` : "Not taken yet"}
- GPA/Academic Standing: ${gpa || "Not provided"}
- Work Experience: ${yearsExperience ? `${yearsExperience} years` : "Not specified"}
- Part-time Work Interest: ${partTimeWorkInterest ? "Yes" : "No"}
- Family/Dependent Support Needed: ${familySupport ? "Yes" : "No"}
- Special Requirements: ${specialRequirements || "None"}

${cvText ? `CV/RESUME CONTENT:\n${cvText}` : ""}
${educationSummary ? `EDUCATION DETAILS:\n${JSON.stringify(educationSummary, null, 2)}` : ""}
${experienceSummary ? `EXPERIENCE DETAILS:\n${JSON.stringify(experienceSummary, null, 2)}` : ""}

Generate a personalized study abroad roadmap for this candidate.`;

    console.log("Calling Lovable AI for roadmap generation...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: profileContext },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received, parsing...");

    // Parse JSON from response (handle markdown code blocks)
    let roadmapResult;
    try {
      let jsonStr = content;
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      roadmapResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", content.substring(0, 500));
      throw new Error("Failed to parse roadmap data");
    }

    // Validate required fields
    if (!roadmapResult.profileSummary || !roadmapResult.recommendedUniversities || !roadmapResult.timeline) {
      throw new Error("Incomplete roadmap data from AI");
    }

    // Save result to database
    const { error: updateError } = await supabase
      .from("study_abroad_roadmaps")
      .update({
        roadmap_result: roadmapResult,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", roadmapId);

    if (updateError) {
      console.error("Failed to save roadmap:", updateError);
      throw new Error("Failed to save roadmap results");
    }

    console.log("Roadmap generated successfully for:", roadmapId);

    return new Response(JSON.stringify({ success: true, roadmapId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating roadmap:", error);

    // Try to update status to failed if we have roadmapId
    try {
      const requestData = await req.clone().json();
      if (requestData.roadmapId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("study_abroad_roadmaps")
          .update({ status: "failed" })
          .eq("id", requestData.roadmapId);
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate roadmap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
