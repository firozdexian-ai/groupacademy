import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, talentId } = await req.json();

    if (!jobId || !talentId) {
      return new Response(
        JSON.stringify({ error: "jobId and talentId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("title, description, requirements, preferred_skills, experience_level, job_type, company_name")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch talent details
    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select("full_name, skills, experience, education, cv_text, profession_category_id")
      .eq("id", talentId)
      .single();

    if (talentError || !talent) {
      return new Response(
        JSON.stringify({ error: "Talent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a career matching expert. Analyze how well a candidate matches a job posting.
Return a JSON object with:
- overall_match: number 0-100
- skills_match: { matched: string[], missing: string[], percentage: number }
- experience_fit: number 0-100
- education_fit: number 0-100
- recommendation: string (1-2 sentences)
- tips_to_improve: string[] (2-4 actionable tips)

Be realistic and helpful. Consider transferable skills. Focus on the most important requirements.`;

    const userPrompt = `Analyze this job-candidate match:

JOB DETAILS:
Title: ${job.title}
Company: ${job.company_name}
Experience Level: ${job.experience_level}
Job Type: ${job.job_type}
Description: ${job.description?.substring(0, 1000) || "Not specified"}
Requirements: ${JSON.stringify(job.requirements || [])}
Preferred Skills: ${JSON.stringify(job.preferred_skills || [])}

CANDIDATE PROFILE:
Name: ${talent.full_name}
Skills: ${JSON.stringify(talent.skills || [])}
Experience: ${JSON.stringify(talent.experience || [])}
Education: ${JSON.stringify(talent.education || [])}
CV Summary: ${talent.cv_text?.substring(0, 1000) || "No CV uploaded"}

Return only the JSON object, no markdown.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is busy right now. Please try again in a moment.", code: "rate_limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace.", code: "payment_required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI analysis temporarily unavailable. Try again shortly.", code: "ai_unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a default structure
      result = {
        overall_match: 50,
        skills_match: { matched: [], missing: [], percentage: 50 },
        experience_fit: 50,
        education_fit: 50,
        recommendation: "Unable to generate detailed analysis. Please try again.",
        tips_to_improve: ["Update your profile with more details", "Upload a comprehensive CV"],
      };
    }

    console.log("Match analysis completed for job:", jobId, "talent:", talentId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("score-job-match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
