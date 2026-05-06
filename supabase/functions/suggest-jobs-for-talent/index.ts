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

    const deadlineFilter = "deadline.is.null,deadline.gte.now()";

    // PASS 1: Mandatory Local/Country Match
    const locationQuery = aliases.map((a) => `location.ilike.%${a}%`).join(",");
    const { data: localJobs } = await supabase
      .from("jobs")
      .select(jobFields)
      .eq("is_active", true)
      .or(deadlineFilter)
      .or(locationQuery)
      .limit(60);
    addJobs(localJobs);

    // PASS 2: Remote Jobs
    const { data: remoteJobs } = await supabase
      .from("jobs")
      .select(jobFields)
      .eq("is_active", true)
      .or(deadlineFilter)
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
        .or(deadlineFilter)
        .or(keywordQuery)
        .limit(30);
      addJobs(keyJobs);
    }

    // Compute mastery snapshot per candidate (cap to top 60 to control RPC load)
    const masteryById = new Map<string, any>();
    const toScore = candidateJobs.slice(0, 60);
    await Promise.all(
      toScore.map(async (j) => {
        try {
          const { data } = await supabase.rpc("score_talent_job_mastery", {
            _talent_id: talent.id,
            _job_id: j.id,
          });
          if (data && !data.error) masteryById.set(j.id, data);
        } catch (_) {}
      })
    );

    // Sort candidates by mastery_score desc so highest-signal jobs lead the AI prompt
    candidateJobs.sort((a, b) => {
      const ma = masteryById.get(a.id)?.mastery_score || 0;
      const mb = masteryById.get(b.id)?.mastery_score || 0;
      return mb - ma;
    });

    const jobSummaries = candidateJobs.map((j) => {
      const isLocal = aliases.some((a) => j.location?.toLowerCase().includes(a.toLowerCase()));
      const isRemote = j.location?.toLowerCase().includes("remote");
      const m = masteryById.get(j.id);
      return {
        id: j.id,
        title: j.title,
        company: j.company_name,
        location: j.location,
        is_geographically_relevant: isLocal || isRemote,
        verified_mastery_score: m?.mastery_score || 0,
        verified_credentials: (m?.verified_credentials || []).length,
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
            CRITICAL RULES (in order):
            1. The candidate is in ${talentCountry}. Jobs where "is_geographically_relevant" is true MUST rank higher than non-relevant jobs.
            2. Jobs with "verified_mastery_score" >= 60 OR "verified_credentials" >= 1 are STRONG matches — boost them and surface first.
            3. Non-relevant jobs (different country, not remote) MUST NOT exceed 55%, even with perfect skill match.
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
      .map((m: any) => {
        const mastery = masteryById.get(m.job_id);
        const credentialCount = (mastery?.verified_credentials || []).length;
        const masteryScore = mastery?.mastery_score || 0;
        const baseScore = Number(m.match_score) || 0;
        const finalScore = Math.min(
          100,
          Math.round(baseScore * (1 + 0.4 * masteryScore / 100) + credentialCount * 5)
        );
        const matchReason: "verified_skill" | "keyword" | "location_only" =
          credentialCount > 0 || masteryScore >= 60
            ? "verified_skill"
            : baseScore >= 60
            ? "keyword"
            : "location_only";
        return {
          ...m,
          match_score: finalScore,
          base_match_score: baseScore,
          match_reason: matchReason,
          verified_match: mastery || null,
          job: jobMap.get(m.job_id),
        };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score);

    // Persist top suggestions for the Jobs Hub rail (replace previous batch)
    try {
      await supabase.from("ai_job_recommendations").delete().eq("talent_id", talent.id);
      if (suggestions.length > 0) {
        const rows = suggestions.slice(0, 12).map((s: any) => ({
          talent_id: talent.id,
          job_id: s.job_id,
          match_score: s.match_score,
          reason: s.reason,
          match_reason: s.match_reason,
          verified_match: s.verified_match,
        }));
        await supabase.from("ai_job_recommendations").insert(rows);
      }
    } catch (e) {
      console.error("persist recs failed", e);
    }

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
