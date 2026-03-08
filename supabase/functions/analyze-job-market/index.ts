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
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "jobId is required" }),
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
      .select(`
        title, 
        description, 
        company_name,
        company_id,
        job_type,
        experience_level,
        salary_range_min,
        salary_range_max,
        location,
        created_at,
        deadline,
        profession_category_id
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count applications for this job
    const { count: applicationCount } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);

    // Count similar jobs (same type or category)
    const { count: similarJobsCount } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("job_type", job.job_type)
      .neq("id", jobId);

    // Get company info if available
    let companyInfo = null;
    if (job.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, industry, is_verified")
        .eq("id", job.company_id)
        .single();
      companyInfo = company;
    }

    // Call Lovable AI for market analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a job market analyst for Bangladesh. Analyze a job posting and provide market intelligence.
Return a JSON object with:
- applicant_count_estimate: string (e.g., "20-50", "100+")
- competition_level: string ("Low", "Medium", "High", "Very High")
- salary_insight: { market_range: string, posted_salary_assessment: string }
- company_reputation: string (brief assessment)
- hiring_timeline_estimate: string (e.g., "1-2 weeks", "2-4 weeks")
- success_tips: string[] (3-4 actionable tips for this specific role)

Consider Bangladesh job market trends. Be specific and actionable.`;

    const userPrompt = `Analyze this job posting:

JOB DETAILS:
Title: ${job.title}
Company: ${job.company_name}
Type: ${job.job_type}
Experience Level: ${job.experience_level}
Location: ${job.location || "Not specified"}
Salary Range: ${job.salary_range_min && job.salary_range_max ? `$${job.salary_range_min.toLocaleString()} - $${job.salary_range_max.toLocaleString()}` : "Not disclosed"}
Posted: ${new Date(job.created_at).toLocaleDateString()}
Deadline: ${job.deadline ? new Date(job.deadline).toLocaleDateString() : "Not specified"}
Description: ${job.description?.substring(0, 800) || "Not specified"}

MARKET DATA:
Current Applications: ${applicationCount || 0}
Similar Active Jobs: ${similarJobsCount || 0}
Company Verified: ${companyInfo?.is_verified ? "Yes" : "No"}
Industry: ${companyInfo?.industry || "Unknown"}

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
      console.error("AI gateway error:", await aiResponse.text());
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a default structure based on available data
      const estimatedApplicants = applicationCount || 0;
      result = {
        applicant_count_estimate: estimatedApplicants < 10 ? "10-30" : estimatedApplicants < 50 ? "30-70" : "70+",
        competition_level: estimatedApplicants < 20 ? "Medium" : "High",
        salary_insight: {
          market_range: "Market rate varies",
          posted_salary_assessment: job.salary_range_min ? "Salary disclosed" : "Salary not disclosed",
        },
        company_reputation: companyInfo?.is_verified ? "Verified employer" : "Employer on platform",
        similar_jobs_count: similarJobsCount || 0,
        hiring_timeline_estimate: "2-4 weeks",
        success_tips: [
          "Apply early for better visibility",
          "Customize your cover letter",
          "Highlight relevant experience",
        ],
      };
    }

    // Add the similar_jobs_count from our query
    result.similar_jobs_count = similarJobsCount || 0;

    console.log("Market analysis completed for job:", jobId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-job-market error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
