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

const ROADMAP_CREDIT_COST = 100;

// Refund credits to the talent who initiated the roadmap so a failure never charges the user.
async function refundCredits(
  supabase: ReturnType<typeof createClient>,
  roadmapId: string,
  reason: string,
) {
  try {
    const { data: roadmap } = await supabase
      .from("study_abroad_roadmaps")
      .select("talent_id")
      .eq("id", roadmapId)
      .maybeSingle();

    const talentId = (roadmap as { talent_id?: string } | null)?.talent_id;
    if (!talentId) return;

    const { data: credits } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talentId)
      .maybeSingle();

    const currentBalance = Number((credits as { balance?: number } | null)?.balance ?? 0);
    const newBalance = currentBalance + ROADMAP_CREDIT_COST;

    await supabase
      .from("talent_credits")
      .update({ balance: newBalance })
      .eq("talent_id", talentId);

    await supabase.from("credit_transactions").insert({
      talent_id: talentId,
      amount: ROADMAP_CREDIT_COST,
      balance_after: newBalance,
      transaction_type: "refund",
      service_type: "STUDY_ABROAD_ROADMAP",
      reference_id: roadmapId,
      description: `Auto-refund: ${reason}`,
    });
  } catch (refundErr) {
    console.error("Refund failed:", refundErr);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Capture body once so we can reference roadmapId in the catch path.
  let requestData: RoadmapRequest | null = null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    requestData = (await req.json()) as RoadmapRequest;
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

    // Look up the talent's home country to personalize without hardcoding regions.
    const { data: talentRow } = await supabase
      .from("talents")
      .select("country")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const homeCountry =
      (talentRow as { country?: string | null } | null)?.country?.trim() || "their home country";

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

    const systemPrompt = `You are an expert study-abroad consultant with global knowledge of international university admissions, visa processes, and scholarship opportunities. You advise students from any country planning their study-abroad journey.

CURRENT DATE: ${currentDate}

Your task is to create a COMPREHENSIVE and PERSONALIZED 12-month study abroad roadmap. Be specific, actionable, and realistic. Tailor financial figures, deadlines, and visa notes to the candidate's stated home country and target destinations.

CRITICAL INSTRUCTIONS:
1. Generate realistic university recommendations based on the profile
2. Create a month-by-month timeline starting from the current month
3. Include country-specific requirements and deadlines (use the candidate's home country for visa nuance)
4. Be honest about profile gaps and how to address them
5. Provide accurate scholarship information available to applicants from the candidate's home country

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
- Home Country: ${homeCountry}
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
        model: "google/gemini-2.5-flash",
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

      // Mark as failed and refund the user before returning a soft error.
      await supabase.from("study_abroad_roadmaps").update({ status: "failed" }).eq("id", roadmapId);
      await refundCredits(supabase, roadmapId, "AI service unavailable");

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Your credits have been refunded — please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Your credits have been refunded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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

    // Mark failed + refund (best-effort) when we have a roadmapId.
    if (requestData?.roadmapId) {
      try {
        await supabase
          .from("study_abroad_roadmaps")
          .update({ status: "failed" })
          .eq("id", requestData.roadmapId);
        await refundCredits(supabase, requestData.roadmapId, "Roadmap generation failed");
      } catch (cleanupErr) {
        console.error("Failure cleanup error:", cleanupErr);
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate roadmap",
        refunded: !!requestData?.roadmapId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
