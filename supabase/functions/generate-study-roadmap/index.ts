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
  educationSummary?: any;
  experienceSummary?: any;
  partTimeWorkInterest: boolean;
  familySupport: boolean;
  specialRequirements?: string;
  fullName: string;
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const requestData: RoadmapRequest = await req.json();
    const { roadmapId, fullName, targetCountries, degreeLevel, targetIntake } = requestData;

    // 1. Initial Status Update
    await supabase.from("study_abroad_roadmaps").update({ status: "processing" }).eq("id", roadmapId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI Configuration Missing");

    // 2. System Prompt Engineering
    const systemPrompt = `You are the Lead Study Abroad Consultant at GroUp Academy. 
    Your specialty is creating 12-month roadmaps for Bangladeshi students.
    
    REQUIRED JSON STRUCTURE:
    {
      "profileSummary": { "strengths": [], "gaps": [], "overallReadiness": "high|medium|low" },
      "recommendedUniversities": [{ "name": "", "country": "", "program": "", "ranking": "", "tuitionRange": "", "fitReason": "", "deadline": "", "tier": "reach|target|safety" }],
      "timeline": [{ "month": 1, "title": "", "tasks": [], "deadline": "" }],
      "documents": [{ "name": "", "required": true, "deadline": "", "tips": "" }],
      "budget": { "tuitionRange": "", "livingExpenses": "", "applicationFees": "", "testFees": "", "visaCosts": "", "totalEstimate": "" },
      "scholarships": [{ "name": "", "amount": "", "eligibility": "", "deadline": "" }]
    }
    
    CONTEXTUAL RULES:
    - Mention specific exams (IELTS, GRE, GMAT) relevant to ${targetCountries.join("/")}.
    - Address the Bangladeshi academic calendar.
    - Provide 4-5 university recommendations.
    - Timeline must cover 12 months exactly.`;

    const userContext = `Generate a roadmap for ${fullName}. 
    Goal: ${degreeLevel} in ${requestData.fieldOfStudy} 
    Targets: ${targetCountries.join(", ")}
    Intake: ${targetIntake}
    GPA: ${requestData.gpa || "N/A"}
    Work Exp: ${requestData.yearsExperience || 0} years.
    Budget: ${requestData.budgetLevel}.
    IELTS: ${requestData.hasTakenIelts ? requestData.ieltsScore : "Not yet taken"}.
    CV Data: ${requestData.cvText?.substring(0, 1500) || "No CV provided"}.`;

    // 3. AI Execution
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        response_format: { type: "json_object" }, // Enforce JSON if supported by gateway
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI Service Error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned empty content");

    // 4. Robust JSON Parsing
    let roadmapResult;
    try {
      const jsonString = content.match(/\{[\s\S]*\}/)?.[0] || content;
      roadmapResult = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error. Raw content:", content);
      throw new Error("AI Response was not valid JSON");
    }

    // 5. Final Database Update
    const { error: updateError } = await supabase
      .from("study_abroad_roadmaps")
      .update({
        roadmap_result: roadmapResult,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", roadmapId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Roadmap Edge Function Error:", error.message);

    // Attempt to set failure status if possible
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
