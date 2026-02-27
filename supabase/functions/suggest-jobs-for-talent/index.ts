import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch talent profile
    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select("id, full_name, skills, experience, education, profession_category_id, job_preferences, cv_text")
      .eq("user_id", user.id)
      .single();

    if (talentError || !talent) {
      return new Response(JSON.stringify({ error: "Talent profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company_name, requirements, preferred_skills, job_type, location, experience_level, profession_category_id, company_logo_url, salary_range_min, salary_range_max, deadline, is_featured, created_at")
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .order("created_at", { ascending: false })
      .limit(50);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build compact profile summary
    const skills = Array.isArray(talent.skills)
      ? talent.skills.map((s: any) => (typeof s === "string" ? s : s.name || "")).filter(Boolean)
      : [];
    const experience = Array.isArray(talent.experience)
      ? talent.experience.map((e: any) => `${e.title || ""} at ${e.company || ""}`).filter((s: string) => s.trim() !== "at")
      : [];
    const education = Array.isArray(talent.education)
      ? talent.education.map((e: any) => `${e.degree || ""} in ${e.field || ""}`).filter((s: string) => s.trim() !== "in")
      : [];

    const profileSummary = [
      skills.length > 0 ? `Skills: ${skills.join(", ")}` : "",
      experience.length > 0 ? `Experience: ${experience.join("; ")}` : "",
      education.length > 0 ? `Education: ${education.join("; ")}` : "",
      talent.cv_text ? `CV Summary: ${(talent.cv_text as string).slice(0, 500)}` : "",
    ].filter(Boolean).join("\n");

    // Build compact job summaries
    const jobSummaries = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company_name,
      type: j.job_type,
      location: j.location || "Not specified",
      level: j.experience_level || "Not specified",
      requirements: j.requirements || "",
      preferred_skills: Array.isArray(j.preferred_skills) ? j.preferred_skills.join(", ") : "",
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
            content: `You are a job matching expert. Given a candidate profile and a list of jobs, return the top 10 most relevant jobs ranked by fit. Consider: skill overlap, experience level fit, industry relevance, transferable skills, and seniority alignment. Be selective - only include genuinely relevant jobs. If fewer than 10 are relevant, return fewer.`,
          },
          {
            role: "user",
            content: `CANDIDATE PROFILE:\n${profileSummary}\n\nAVAILABLE JOBS:\n${JSON.stringify(jobSummaries, null, 0)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_jobs",
              description: "Return the top matching jobs ranked by fit",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job_id: { type: "string", description: "The job ID" },
                        match_score: { type: "number", description: "Match score 0-100" },
                        reason: { type: "string", description: "One-line reason why this job is a good fit (max 15 words)" },
                      },
                      required: ["job_id", "match_score", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_jobs" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const matches = parsed.matches || [];

    // Enrich with full job data
    const jobMap = new Map(jobs.map((j) => [j.id, j]));
    const suggestions = matches
      .filter((m: any) => jobMap.has(m.job_id))
      .map((m: any) => {
        const job = jobMap.get(m.job_id)!;
        return {
          job_id: m.job_id,
          match_score: m.match_score,
          reason: m.reason,
          job: {
            id: job.id,
            title: job.title,
            company_name: job.company_name,
            company_logo_url: job.company_logo_url,
            location: job.location,
            job_type: job.job_type,
            experience_level: job.experience_level,
            is_featured: job.is_featured,
            created_at: job.created_at,
            deadline: job.deadline,
            salary_range_min: job.salary_range_min,
            salary_range_max: job.salary_range_max,
          },
        };
      });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("suggest-jobs-for-talent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
