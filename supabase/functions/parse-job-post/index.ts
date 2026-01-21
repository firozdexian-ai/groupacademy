import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Profession categories for matching
const PROFESSION_CATEGORIES = [
  {
    id: "a1c5d82c-1a1a-4b0e-89e8-19c264a3a915",
    name: "Banking & Finance",
    keywords: ["bank", "finance", "accounting", "audit", "investment", "treasury", "credit", "loan"],
  },
  {
    id: "cd947727-350e-4fd3-813b-0034d4cf208e",
    name: "Sales & Distribution",
    keywords: ["sales", "distribution", "retail", "channel", "fmcg", "trade", "territory"],
  },
  {
    id: "5ee052f8-2aaf-45b5-8f90-731c23097fef",
    name: "Sales & Marketing",
    keywords: [
      "marketing",
      "brand",
      "digital marketing",
      "advertising",
      "pr",
      "communications",
      "social media",
      "content",
    ],
  },
  {
    id: "1e71843c-d202-4d96-834e-04fa6c784f16",
    name: "Technology & IT",
    keywords: [
      "software",
      "developer",
      "engineer",
      "it",
      "programmer",
      "data",
      "cloud",
      "tech",
      "frontend",
      "backend",
      "fullstack",
      "devops",
    ],
  },
  {
    id: "e5489921-ce14-448b-a017-b762a3b72a8d",
    name: "Human Resources",
    keywords: ["hr", "human resource", "recruitment", "talent", "training", "l&d", "payroll"],
  },
  {
    id: "a8c5f269-03bd-4589-954e-51eb1e1fbf32",
    name: "Operations & Supply Chain",
    keywords: ["operations", "supply chain", "logistics", "procurement", "warehouse", "inventory"],
  },
  {
    id: "2c541af4-1cc0-4704-81aa-78df992aad6b",
    name: "Healthcare & Pharma",
    keywords: ["health", "pharma", "medical", "hospital", "doctor", "nurse", "clinical"],
  },
  { id: "b4038064-ec0f-4814-a966-ca4c9984bca2", name: "Other", keywords: [] },
];

function matchProfessionCategory(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const category of PROFESSION_CATEGORIES) {
    if (category.keywords.length === 0) continue;
    const matchCount = category.keywords.filter((kw) => lowerText.includes(kw)).length;
    if (matchCount >= 2) {
      return category.id;
    }
  }

  // Check for design-related
  if (
    lowerText.includes("graphic") ||
    lowerText.includes("design") ||
    lowerText.includes("creative") ||
    lowerText.includes("ui") ||
    lowerText.includes("ux")
  ) {
    return "1e71843c-d202-4d96-834e-04fa6c784f16"; // Technology & IT for designers
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. SECURITY: Verify the User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client to verify user identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Extract token from header and pass to getUser() for stateless edge function auth
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobPostText } = await req.json();

    if (!jobPostText || jobPostText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Please provide job post text (minimum 50 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Parsing job post for user ${user.id}, text length: ${jobPostText.length}`);

    const systemPrompt = `You are an expert job post parser. Extract structured information from job postings copied from social media (Facebook, LinkedIn, etc.) or websites.

Return a JSON object with the following structure:
{
  "title": "string - job title (e.g., 'Junior Graphics Designer')",
  "company_name": "string - company/organization name",
  "company_about": "string or null - brief description of the company if mentioned",
  "company_website": "string or null - company website URL if mentioned",
  "location": "string or null - job location (city, area)",
  "job_type": "string - one of: full_time, part_time, contract, internship, freelance, remote",
  "experience_level": "string - one of: entry, mid, senior, executive (infer from title like 'Junior', 'Senior', etc.)",
  "salary_range_min": "number or null - minimum salary if mentioned",
  "salary_range_max": "number or null - maximum salary if mentioned",
  "salary_note": "string or null - e.g., 'Negotiable', 'Competitive'",
  "description": "string - full job description including responsibilities",
  "requirements": ["array of required qualifications/skills as strings"],
  "preferred_skills": ["array of preferred/bonus skills"],
  "application_email": "string or null - email address for applications",
  "application_url": "string or null - application link/URL",
  "deadline": "string or null - application deadline in YYYY-MM-DD format if mentioned",
  "source_platform": "string - one of: facebook, linkedin, bdjobs, website, other (infer from content style)"
}

Important:
- Extract ALL responsibilities and put them in the description
- Separate required qualifications from preferred/bonus skills
- For job_type, infer from context (most are full_time unless stated)
- For experience_level: 'Junior' or 'Entry' = 'entry', 'Senior' or 'Lead' = 'senior', 'Manager/Director/VP' = 'executive', otherwise 'mid'
- Parse salary amounts (remove BDT/Tk symbols, handle 'K' for thousands)
- Extract application email/URL if provided
- Extract company website if mentioned in the post
- Return ONLY valid JSON, no markdown or extra text`;

    const userPrompt = `Parse the following job post and extract structured information:

${jobPostText}

Return the structured JSON data.`;

    // Add timeout controller for AI call (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to parse job post with AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let parsedContent = aiData.choices?.[0]?.message?.content;

    if (!parsedContent) {
      console.error("No content in AI response");
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up JSON if wrapped in markdown
    parsedContent = parsedContent.trim();
    if (parsedContent.startsWith("```json")) {
      parsedContent = parsedContent.slice(7);
    }
    if (parsedContent.startsWith("```")) {
      parsedContent = parsedContent.slice(3);
    }
    if (parsedContent.endsWith("```")) {
      parsedContent = parsedContent.slice(0, -3);
    }
    parsedContent = parsedContent.trim();

    let parsedData;
    try {
      parsedData = JSON.parse(parsedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError, parsedContent);
      return new Response(JSON.stringify({ error: "Failed to parse job post data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match profession category
    const professionCategoryId = matchProfessionCategory(jobPostText);

    console.log("Job post parsed successfully:", {
      title: parsedData.title,
      company: parsedData.company_name,
      location: parsedData.location,
      professionCategoryId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        parsed: parsedData,
        professionCategoryId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in parse-job-post function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
