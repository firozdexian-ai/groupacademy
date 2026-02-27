import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extract search keywords from talent profile for pre-filtering */
function extractKeywords(talent: any): string[] {
  const keywords: Set<string> = new Set();

  // Skill names
  if (Array.isArray(talent.skills)) {
    for (const s of talent.skills) {
      const name = typeof s === "string" ? s : s?.name;
      if (name && name.length >= 2) keywords.add(name.toLowerCase());
    }
  }

  // Job titles from experience
  if (Array.isArray(talent.experience)) {
    for (const e of talent.experience) {
      if (e?.title) keywords.add(e.title.toLowerCase());
    }
  }

  // Fields of study from education
  if (Array.isArray(talent.education)) {
    for (const e of talent.education) {
      if (e?.field) keywords.add(e.field.toLowerCase());
      if (e?.fieldOfStudy) keywords.add(e.fieldOfStudy.toLowerCase());
    }
  }

  // Custom profession
  if (talent.custom_profession) {
    keywords.add(talent.custom_profession.toLowerCase());
  }

  // Job preferences keywords
  if (talent.job_preferences) {
    const prefs = typeof talent.job_preferences === "string"
      ? JSON.parse(talent.job_preferences)
      : talent.job_preferences;
    if (prefs?.preferred_roles && Array.isArray(prefs.preferred_roles)) {
      for (const r of prefs.preferred_roles) {
        if (r) keywords.add(r.toLowerCase());
      }
    }
  }

  // Filter out very short or generic terms
  return Array.from(keywords)
    .filter((k) => k.length >= 3 && !["the", "and", "for", "not"].includes(k))
    .slice(0, 20);
}

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
      .select("id, full_name, skills, experience, education, profession_category_id, job_preferences, cv_text, custom_profession")
      .eq("user_id", user.id)
      .single();

    if (talentError || !talent) {
      return new Response(JSON.stringify({ error: "Talent profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stage 1: Keyword-based pre-filtering ──
    const keywords = extractKeywords(talent);
    console.log(`Extracted ${keywords.length} keywords:`, keywords);

    const jobFields = "id, title, company_name, description, requirements, preferred_skills, job_type, location, experience_level, profession_category_id, company_logo_url, salary_range_min, salary_range_max, deadline, is_featured, created_at";

    let candidateJobs: any[] = [];
    const seenIds = new Set<string>();

    // Query with keyword matching on title and description
    if (keywords.length > 0) {
      // Build OR filter: title.ilike.%keyword% or description.ilike.%keyword%
      const orClauses = keywords
        .slice(0, 10) // limit to top 10 keywords to keep query manageable
        .flatMap((k) => [`title.ilike.%${k}%`, `description.ilike.%${k}%`])
        .join(",");

      const { data: matchedJobs, error: matchError } = await supabase
        .from("jobs")
        .select(jobFields)
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .or(orClauses)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!matchError && matchedJobs) {
        for (const job of matchedJobs) {
          if (!seenIds.has(job.id)) {
            seenIds.add(job.id);
            candidateJobs.push(job);
          }
        }
      }
      console.log(`Keyword search returned ${candidateJobs.length} jobs`);
    }

    // Fallback: if fewer than 50 keyword matches, backfill with recent jobs
    if (candidateJobs.length < 50) {
      const backfillNeeded = 50 - candidateJobs.length;
      const { data: recentJobs, error: recentError } = await supabase
        .from("jobs")
        .select(jobFields)
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("created_at", { ascending: false })
        .limit(backfillNeeded + seenIds.size); // fetch extra to account for dedup

      if (!recentError && recentJobs) {
        for (const job of recentJobs) {
          if (!seenIds.has(job.id) && candidateJobs.length < 200) {
            seenIds.add(job.id);
            candidateJobs.push(job);
          }
        }
      }
      console.log(`After backfill: ${candidateJobs.length} total candidate jobs`);
    }

    if (candidateJobs.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Stage 2: AI Deep Ranking ──

    // Build compact profile summary
    const skills = Array.isArray(talent.skills)
      ? talent.skills.map((s: any) => (typeof s === "string" ? s : s.name || "")).filter(Boolean)
      : [];
    const experience = Array.isArray(talent.experience)
      ? talent.experience.map((e: any) => `${e.title || ""} at ${e.company || ""}`).filter((s: string) => s.trim() !== "at")
      : [];
    const education = Array.isArray(talent.education)
      ? talent.education.map((e: any) => `${e.degree || ""} in ${e.field || e.fieldOfStudy || ""}`).filter((s: string) => s.trim() !== "in")
      : [];

    const profileSummary = [
      skills.length > 0 ? `Skills: ${skills.join(", ")}` : "",
      experience.length > 0 ? `Experience: ${experience.join("; ")}` : "",
      education.length > 0 ? `Education: ${education.join("; ")}` : "",
      talent.cv_text ? `CV Summary: ${(talent.cv_text as string).slice(0, 500)}` : "",
    ].filter(Boolean).join("\n");

    // Build job summaries WITH descriptions (truncated to 300 chars)
    const jobSummaries = candidateJobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company_name,
      type: j.job_type,
      location: j.location || "Not specified",
      level: j.experience_level || "Not specified",
      description: j.description ? (j.description as string).slice(0, 300) : "",
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
            content: `You are a job matching expert. Given a candidate profile and a list of jobs, return the top 12 most relevant jobs ranked by fit.

Consider: skill overlap, experience level fit, industry relevance, transferable skills, seniority alignment, and job description content.

Scoring guidelines:
- 80-100%: Strong direct match (same role, matching skills)
- 60-79%: Good match with transferable skills or adjacent roles
- 50-59%: Partial match worth considering
- Below 50%: Only include if there's a clear transferable connection

Consider partial matches, transferable skills, and adjacent roles. A 50-60% match is still valuable to show. Score generously for adjacent relevance -- someone with marketing skills could be a decent match for a growth role.

Always try to return at least 8-12 results if enough jobs are provided. The candidate benefits from seeing a range of opportunities.`,
          },
          {
            role: "user",
            content: `CANDIDATE PROFILE:\n${profileSummary}\n\nAVAILABLE JOBS (${jobSummaries.length} jobs):\n${JSON.stringify(jobSummaries, null, 0)}`,
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
    const jobMap = new Map(candidateJobs.map((j) => [j.id, j]));
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

    console.log(`Returning ${suggestions.length} AI-ranked suggestions from ${candidateJobs.length} candidates`);

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
