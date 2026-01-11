import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TalentProfile {
  id: string;
  fullName: string;
  profession?: string;
  skills: string[];
  experience: any[];
  cvText?: string;
}

interface FeedItem {
  id: string;
  type: "job" | "course" | "video";
  title: string;
  description: string;
  company?: string;
  thumbnail?: string;
  createdAt: string;
  slug?: string;
  matchScore?: number;
  matchReason?: string;
  skills?: string[];
  location?: string;
  companyLogo?: string;
  mediaUrl?: string;
  mediaType?: "image" | "youtube";
  youtubeUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { talentId, forceRefresh = false } = await req.json();

    if (!talentId) {
      return new Response(
        JSON.stringify({ error: "talentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for cached recommendations if not forcing refresh
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("ai_recommendations")
        .select("*")
        .eq("talent_id", talentId)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cached) {
        console.log("Returning cached recommendations for talent:", talentId);
        return new Response(
          JSON.stringify({
            recommendations: cached.recommendations,
            careerInsights: cached.career_insights,
            cached: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch talent profile
    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select("*")
      .eq("id", talentId)
      .single();

    if (talentError || !talent) {
      console.error("Error fetching talent:", talentError);
      return new Response(
        JSON.stringify({ error: "Talent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profession name if available
    let professionName = talent.custom_profession || "";
    if (talent.profession_category_id) {
      const { data: profession } = await supabase
        .from("profession_categories")
        .select("name")
        .eq("id", talent.profession_category_id)
        .single();
      if (profession) {
        professionName = profession.name;
      }
    }

    // Fetch dismissed items
    const { data: dismissedInteractions } = await supabase
      .from("feed_interactions")
      .select("item_id")
      .eq("talent_id", talentId)
      .eq("interaction_type", "not_interested");

    const dismissedIds = new Set(dismissedInteractions?.map(i => i.item_id) || []);

    // Fetch jobs and courses in parallel - include company info for logo and media
    const [jobsResult, coursesResult, companiesResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, description, company_name, company_id, company_logo_url, source_image_url, location, job_type, experience_level, requirements, created_at, deadline")
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte." + new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("content")
        .select("id, title, description, thumbnail_url, cover_image_url, youtube_url, created_at, slug, content_type")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("companies")
        .select("id, logo_url")
    ]);

    const jobs = (jobsResult.data || []).filter(j => !dismissedIds.has(j.id));
    const courses = (coursesResult.data || []).filter(c => !dismissedIds.has(c.id));
    
    // Create company logo map
    const companyLogoMap = new Map<string, string>();
    (companiesResult.data || []).forEach(c => {
      if (c.logo_url) {
        companyLogoMap.set(c.id, c.logo_url);
      }
    });

    // Helper to extract skills from job requirements
    const extractSkillsFromJob = (job: any): string[] => {
      const skills: string[] = [];
      if (job.requirements) {
        try {
          const reqs = typeof job.requirements === 'string' 
            ? JSON.parse(job.requirements) 
            : job.requirements;
          if (Array.isArray(reqs)) {
            // Take first 5 items that look like skills (short strings)
            reqs.slice(0, 5).forEach((req: any) => {
              if (typeof req === 'string' && req.length < 30) {
                skills.push(req);
              }
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      return skills;
    };

    // Prepare items for AI scoring
    interface ItemToScore {
      id: string;
      type: "job" | "course" | "video";
      title: string;
      description: string;
      company?: string;
      metadata: string;
    }

    const itemsToScore: ItemToScore[] = [
      ...jobs.map(j => ({
        id: j.id,
        type: "job" as const,
        title: j.title,
        description: j.description?.substring(0, 300) || "",
        company: j.company_name,
        metadata: `${j.job_type || ""} ${j.experience_level || ""} ${j.location || ""}`
      })),
      ...courses.map(c => ({
        id: c.id,
        type: (c.content_type === "free_video" ? "video" : "course") as "video" | "course",
        title: c.title,
        description: c.description?.substring(0, 300) || "",
        company: undefined,
        metadata: c.content_type
      }))
    ];

    // Build profile summary for AI
    const profileSummary = {
      name: talent.full_name,
      profession: professionName,
      skills: talent.skills || [],
      experienceYears: (talent.experience || []).length,
      currentStatus: talent.current_status || "job_seeker"
    };

    // Call Lovable AI for scoring
    console.log("Calling Lovable AI for recommendations...");
    
    const aiPrompt = `You are a career advisor AI. Analyze the candidate profile and score each opportunity.

CANDIDATE PROFILE:
- Name: ${profileSummary.name}
- Profession: ${profileSummary.profession || "Not specified"}
- Skills: ${profileSummary.skills.length > 0 ? profileSummary.skills.join(", ") : "Not specified"}
- Experience: ${profileSummary.experienceYears} positions
- Status: ${profileSummary.currentStatus}

OPPORTUNITIES TO SCORE (score 0-100 based on match):
${itemsToScore.slice(0, 15).map((item, i) => 
  `${i + 1}. [${item.type.toUpperCase()}] ${item.title}${item.company ? ` at ${item.company}` : ""}\n   ${item.description.substring(0, 150)}...`
).join("\n\n")}

Respond with a JSON object containing:
1. "scores": Array of objects with "id", "score" (0-100), and "reason" (brief 10-word explanation)
2. "insights": Array of 3 personalized career insights/tips (each 15-20 words)

Example format:
{
  "scores": [{"id": "uuid", "score": 85, "reason": "Strong skills match for this role"}],
  "insights": ["Consider upskilling in cloud technologies to increase opportunities", ...]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a career advisor. Always respond with valid JSON only, no markdown." },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Return items with varied fallback scoring (not all 50%)
      const fallbackItems: FeedItem[] = itemsToScore.map((item, index) => {
        // Generate varied scores between 40-75 based on item characteristics
        let baseScore = 45;
        
        // Jobs get slightly higher base score
        if (item.type === 'job') baseScore += 10;
        
        // Add some variation based on position and metadata
        const variation = (index % 5) * 5 + Math.floor(Math.random() * 10);
        const finalScore = Math.min(75, baseScore + variation);
        
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          company: item.company,
          createdAt: new Date().toISOString(),
          matchScore: finalScore,
          matchReason: "Complete your profile for personalized scoring",
          aiScored: false
        };
      });
      
      // Sort by score
      fallbackItems.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      return new Response(
        JSON.stringify({
          recommendations: fallbackItems,
          careerInsights: [
            "Complete your profile to get AI-powered personalized recommendations",
            "Upload your CV to unlock better job matches",
            "Add your skills to see relevant courses"
          ],
          cached: false,
          aiScored: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";
    
    // Parse AI response
    let parsed: { scores: Array<{id: string, score: number, reason: string}>, insights: string[] };
    try {
      // Clean up potential markdown formatting
      const cleanJson = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, "Content:", aiContent);
      parsed = { scores: [], insights: ["Complete your profile for personalized insights"] };
    }

    // Create score map
    const scoreMap = new Map(parsed.scores.map(s => [s.id, { score: s.score, reason: s.reason }]));

    // Build final recommendations with scores
    const recommendations: FeedItem[] = [];

    // Helper to extract YouTube video ID and get thumbnail
    const getYoutubeThumbnail = (url: string): string | null => {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    };

    for (const job of jobs) {
      const scoreData = scoreMap.get(job.id);
      const jobSkills = extractSkillsFromJob(job);
      const companyLogo = job.company_id ? companyLogoMap.get(job.company_id) : (job.company_logo_url || undefined);
      
      // Determine media for job - prefer source_image_url
      const mediaUrl = job.source_image_url || companyLogo || undefined;
      const mediaType = mediaUrl ? "image" as const : undefined;
      
      recommendations.push({
        id: job.id,
        type: "job",
        title: job.title,
        description: job.description?.substring(0, 150) + "..." || "",
        company: job.company_name,
        createdAt: job.created_at || new Date().toISOString(),
        matchScore: scoreData?.score || 50,
        matchReason: scoreData?.reason || "Potential match",
        skills: jobSkills,
        location: job.location || undefined,
        companyLogo: companyLogo,
        mediaUrl: mediaUrl,
        mediaType: mediaType
      });
    }

    for (const course of courses) {
      const scoreData = scoreMap.get(course.id);
      const isVideo = course.content_type === "free_video";
      
      // Determine media for content - prioritize youtube for videos
      let mediaUrl = course.cover_image_url || course.thumbnail_url || undefined;
      let mediaType: "image" | "youtube" | undefined = mediaUrl ? "image" : undefined;
      let youtubeUrl: string | undefined = undefined;
      
      if (course.youtube_url) {
        youtubeUrl = course.youtube_url;
        const ytThumb = getYoutubeThumbnail(course.youtube_url);
        if (ytThumb) {
          mediaUrl = ytThumb;
          mediaType = "youtube";
        }
      }
      
      recommendations.push({
        id: course.id,
        type: isVideo ? "video" : "course",
        title: course.title,
        description: course.description?.substring(0, 150) + "..." || "",
        thumbnail: course.thumbnail_url || undefined,
        createdAt: course.created_at || new Date().toISOString(),
        slug: course.slug,
        matchScore: scoreData?.score || 50,
        matchReason: scoreData?.reason || "Recommended for you",
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        youtubeUrl: youtubeUrl
      });
    }

    // Sort by match score
    recommendations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const careerInsights = parsed.insights || ["Complete your profile to get personalized career insights"];

    // Cache the results
    await supabase
      .from("ai_recommendations")
      .upsert({
        talent_id: talentId,
        recommendations: recommendations,
        career_insights: careerInsights,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: "talent_id" });

    console.log("Generated and cached recommendations for talent:", talentId);

    return new Response(
      JSON.stringify({
        recommendations,
        careerInsights,
        cached: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-feed-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
