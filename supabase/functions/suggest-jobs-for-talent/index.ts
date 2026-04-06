import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractKeywords(talent: any): string[] {
  const keywords: Set<string> = new Set();
  if (Array.isArray(talent.skills)) {
    for (const s of talent.skills) {
      const name = typeof s === "string" ? s : s?.name;
      if (name && name.length >= 2) keywords.add(name.toLowerCase());
    }
  }
  if (Array.isArray(talent.experience)) {
    for (const e of talent.experience) {
      if (e?.title) keywords.add(e.title.toLowerCase());
    }
  }
  if (talent.custom_profession) keywords.add(talent.custom_profession.toLowerCase());
  return Array.from(keywords)
    .filter((k) => k.length >= 3)
    .slice(0, 15);
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  Bangladesh: ["Bangladesh", "BD", "Dhaka", "Chittagong", "Chattogram"],
  "United Arab Emirates": ["UAE", "United Arab Emirates", "Dubai", "Abu Dhabi"],
  "United Kingdom": ["UK", "United Kingdom", "London"],
  "United States": ["USA", "United States", "US"],
};

function getCountryAliases(country: string): string[] {
  if (!country) return [];
  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (
      canonical.toLowerCase() === country.toLowerCase() ||
      aliases.some((a) => a.toLowerCase() === country.toLowerCase())
    ) {
      return aliases;
    }
  }
  return [country];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const { data: talent } = await supabase.from("talents").select("*").eq("user_id", user.id).single();
    if (!talent) throw new Error("Profile not found");

    const talentCountry = talent.country || "Bangladesh";
    const aliases = getCountryAliases(talentCountry);
    const keywords = extractKeywords(talent);

    const jobFields =
      "id, title, company_name, description, location, job_type, experience_level, company_logo_url, created_at";
    let candidateJobs: any[] = [];
    const seenIds = new Set<string>();

    const addJobs = (jobs: any[]) => {
      for (const j of jobs || []) {
        if (!seenIds.has(j.id) && candidateJobs.length < 120) {
          seenIds.add(j.id);
          candidateJobs.push(j);
        }
      }
    };

    // PASS 1: Mandatory Local/Country Match
    const locationQuery = aliases.map((a) => `location.ilike.%${a}%`).join(",");
    const { data: localJobs } = await supabase
      .from("jobs")
      .select(jobFields)
      .eq("is_active", true)
      .or(locationQuery)
      .limit(60);
    addJobs(localJobs);

    // PASS 2: Remote Jobs
    const { data: remoteJobs } = await supabase
      .from("jobs")
      .select(jobFields)
      .eq("is_active", true)
      .ilike("location", "%remote%")
      .limit(30);
    addJobs(remoteJobs);

    // PASS 3: Keyword Match (Only if needed)
    if (candidateJobs.length < 20 && keywords.length > 0) {
      const keywordQuery = keywords
        .slice(0, 5)
        .map((k) => `title.ilike.%${k}%`)
        .join(",");
      const { data: keyJobs } = await supabase
        .from("jobs")
        .select(jobFields)
        .eq("is_active", true)
        .or(keywordQuery)
        .limit(30);
      addJobs(keyJobs);
    }

    const jobSummaries = candidateJobs.map((j) => {
      const isLocal = aliases.some((a) => j.location?.toLowerCase().includes(a.toLowerCase()));
      const isRemote = j.location?.toLowerCase().includes("remote");
      return {
        id: j.id,
        title: j.title,
        company: j.company_name,
        location: j.location,
        is_geographically_relevant: isLocal || isRemote,
        desc: j.description?.slice(0, 200),
      };
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a career matcher for GroUp Academy. 
            CRITICAL RULE: The candidate is in ${talentCountry}.
            1. Jobs where "is_geographically_relevant" is true MUST be ranked higher than any other job.
            2. If a job is NOT geographically relevant (different country and not remote), its score MUST NOT exceed 55%, even with a perfect skill match.
            3. A job in ${talentCountry} with a 70% skill match is better than a job in Australia with 100% skill match.
            Rank the top 12 jobs.`,
          },
          {
            role: "user",
            content: `Profile: ${talent.custom_profession}, Skills: ${talent.skills}\nJobs: ${JSON.stringify(jobSummaries)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_jobs",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        job_id: { type: "string" },
                        match_score: { type: "number" },
                        reason: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_jobs" } },
      }),
    });

    const aiData = await aiResponse.json();
    const parsed = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    const jobMap = new Map(candidateJobs.map((j) => [j.id, j]));

    const suggestions = (parsed.matches || [])
      .filter((m: any) => jobMap.has(m.job_id))
      .map((m: any) => ({
        ...m,
        job: jobMap.get(m.job_id),
      }));

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
