import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Fetch with an AbortController timeout */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    // Service role client for cache writes
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { job_id, application_url, mode, screenshots } = await req.json();

    if (!application_url) {
      return new Response(JSON.stringify({ error: "application_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // *** Credits are NOT deducted here anymore — moved AFTER successful processing ***

    // Check credit balance upfront (without deducting) so we can fail fast
    const { data: talentRow } = await supabaseAdmin
      .from("talents")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!talentRow) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: creditRow } = await supabaseAdmin
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talentRow.id)
      .single();

    if (!creditRow || creditRow.balance < 50) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", required: 50, available: creditRow?.balance ?? 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Check cache
    let questions: Array<{ question_text: string; field_type: string }> = [];
    let extractionMethod = "cache";

    const { data: cached } = await supabaseAdmin
      .from("external_application_questions")
      .select("questions, extraction_method")
      .eq("application_url", application_url)
      .maybeSingle();

    if (cached?.questions && Array.isArray(cached.questions) && cached.questions.length > 0) {
      questions = cached.questions as any;
      extractionMethod = "cache";
      console.log("Cache hit for", application_url, "- questions:", questions.length);
    } else if (mode === "screenshot" && screenshots?.length > 0) {
      // Step 2b: Extract from screenshots via AI Vision
      console.log("Extracting questions from", screenshots.length, "screenshots");
      questions = await extractQuestionsFromScreenshots(screenshots);
      extractionMethod = "screenshot";

      // Cache the extracted questions
      if (questions.length > 0) {
        await supabaseAdmin.from("external_application_questions").upsert(
          {
            application_url,
            job_id: job_id || null,
            questions,
            extraction_method: "screenshot",
          },
          { onConflict: "application_url" }
        );
      }
    } else {
      // Step 2a: Try Firecrawl scrape (with 10s timeout)
      console.log("Scraping", application_url);
      const firecrawlResult = await scrapeWithFirecrawl(application_url);

      if (firecrawlResult.success && firecrawlResult.questions.length > 0) {
        questions = firecrawlResult.questions;
        extractionMethod = "firecrawl";

        // Cache
        await supabaseAdmin.from("external_application_questions").upsert(
          {
            application_url,
            job_id: job_id || null,
            questions,
            extraction_method: "firecrawl",
          },
          { onConflict: "application_url" }
        );
      } else {
        // Firecrawl failed - return scrape_failed so frontend shows screenshot fallback
        console.log("Firecrawl failed or no questions found");
        extractionMethod = "scrape_failed";
      }
    }

    // Step 3: Fetch talent profile
    const { data: talent } = await supabaseAdmin
      .from("talents")
      .select("full_name, email, phone, skills, experience, education, bio, cv_text, profession_category_id")
      .eq("user_id", userId)
      .single();

    // Step 4: Fetch job details
    let jobData: any = null;
    if (job_id) {
      const { data } = await supabaseAdmin
        .from("jobs")
        .select("title, company_name, description, requirements, location, job_type, experience_level")
        .eq("id", job_id)
        .single();
      jobData = data;
    }

    // Step 5: Generate AI answers
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileSummary = buildProfileSummary(talent);
    const jobSummary = buildJobSummary(jobData);

    let qaResults: Array<{ question: string; answer: string }> = [];
    let generalSummary = "";

    if (extractionMethod === "scrape_failed") {
      // Only generate general summary — NO credit charge for fallback
      generalSummary = await generateGeneralSummary(LOVABLE_API_KEY, profileSummary, jobSummary);
      return new Response(
        JSON.stringify({
          success: true,
          scrape_failed: true,
          questions: [],
          answers: [],
          general_summary: generalSummary,
          extraction_method: extractionMethod,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate answers + summary in parallel (2 AI calls max)
    const [answers, summary] = await Promise.all([
      generateAnswers(LOVABLE_API_KEY, questions, profileSummary, jobSummary),
      generateGeneralSummary(LOVABLE_API_KEY, profileSummary, jobSummary),
    ]);

    qaResults = questions.map((q, i) => ({
      question: q.question_text,
      answer: answers[i] || "Unable to generate answer for this question.",
    }));

    // *** Deduct credits ONLY after successful processing ***
    const { data: creditResult, error: creditError } = await supabaseUser.rpc("deduct_credits", {
      p_amount: 50,
      p_service_type: "EXTERNAL_APPLICATION",
      p_reference_id: job_id || null,
      p_description: "AI Application Assistant",
    });

    if (creditError || !creditResult?.success) {
      console.error("Credit deduction failed after processing:", creditError, creditResult);
      // Still return results — user already got value, log the issue
    }

    // Track service usage (non-critical)
    try {
      await supabaseAdmin.rpc("add_talent_service", {
        p_talent_id: talentRow.id,
        p_service: "EXTERNAL_APPLICATION",
      });
    } catch (_) { /* non-critical */ }

    return new Response(
      JSON.stringify({
        success: true,
        scrape_failed: false,
        questions: questions,
        answers: qaResults,
        general_summary: summary,
        extraction_method: extractionMethod,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("prepare-external-application error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ---- Helper functions ----

async function scrapeWithFirecrawl(url: string): Promise<{ success: boolean; questions: Array<{ question_text: string; field_type: string }> }> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.error("FIRECRAWL_API_KEY not configured");
    return { success: false, questions: [] };
  }

  try {
    // 10-second timeout for Firecrawl
    const response = await fetchWithTimeout("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    }, 10000);

    if (!response.ok) {
      console.error("Firecrawl error:", response.status);
      return { success: false, questions: [] };
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || "";

    if (!markdown || markdown.length < 50) {
      return { success: false, questions: [] };
    }

    // Use AI to extract questions from the markdown (25s timeout)
    const questions = await extractQuestionsFromMarkdown(markdown);
    return { success: true, questions };
  } catch (error) {
    console.error("Firecrawl scrape error:", error);
    return { success: false, questions: [] };
  }
}

async function extractQuestionsFromMarkdown(
  markdown: string
): Promise<Array<{ question_text: string; field_type: string }>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  try {
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert at analyzing job application forms. Extract ONLY the open-ended or essay-type questions from the page content. Ignore simple fields like name, email, phone, file upload, etc. Focus on questions that require thoughtful written answers, such as:
- "Why do you want to work here?"
- "Describe your experience with X"
- "What makes you a good fit?"
- Cover letter prompts
- Any free-text question fields

Return a JSON array of objects with "question_text" and "field_type" (one of: "essay", "short_answer", "cover_letter"). Return an empty array if no such questions are found. Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Extract application questions from this page content:\n\n${markdown.slice(0, 8000)}`,
          },
        ],
      }),
    }, 25000);

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("extractQuestionsFromMarkdown error:", err);
    return [];
  }
}

async function extractQuestionsFromScreenshots(
  screenshots: string[]
): Promise<Array<{ question_text: string; field_type: string }>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  const imageContents = screenshots.slice(0, 5).map((img: string) => ({
    type: "image_url" as const,
    image_url: {
      url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
    },
  }));

  try {
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert at reading job application form screenshots. Extract ONLY the open-ended or essay-type questions visible in the screenshots. Ignore simple fields like name, email, phone, dropdowns, checkboxes, and file uploads. Focus on text input fields that require thoughtful written answers.

Return a JSON array of objects with "question_text" and "field_type" (one of: "essay", "short_answer", "cover_letter"). Return an empty array if no such questions are found. Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the application form questions from these screenshots:" },
              ...imageContents,
            ],
          },
        ],
      }),
    }, 25000);

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("extractQuestionsFromScreenshots error:", err);
    return [];
  }
}

function buildProfileSummary(talent: any): string {
  if (!talent) return "No profile data available.";
  const parts = [];
  if (talent.full_name) parts.push(`Name: ${talent.full_name}`);
  if (talent.bio) parts.push(`Bio: ${talent.bio}`);
  if (talent.skills?.length) parts.push(`Skills: ${talent.skills.join(", ")}`);
  if (talent.experience) {
    const exp = Array.isArray(talent.experience) ? talent.experience : [];
    if (exp.length > 0) {
      parts.push(
        `Experience:\n${exp
          .map((e: any) => `- ${e.title || e.position || "Role"} at ${e.company || "Company"} (${e.duration || e.years || ""})`)
          .join("\n")}`
      );
    }
  }
  if (talent.education) {
    const edu = Array.isArray(talent.education) ? talent.education : [];
    if (edu.length > 0) {
      parts.push(
        `Education:\n${edu
          .map((e: any) => `- ${e.degree || e.qualification || "Degree"} from ${e.institution || e.school || "Institution"}`)
          .join("\n")}`
      );
    }
  }
  if (talent.cv_text) parts.push(`CV Summary: ${talent.cv_text.slice(0, 2000)}`);
  return parts.join("\n\n");
}

function buildJobSummary(job: any): string {
  if (!job) return "No job details available.";
  const parts = [];
  if (job.title) parts.push(`Job Title: ${job.title}`);
  if (job.company_name) parts.push(`Company: ${job.company_name}`);
  if (job.location) parts.push(`Location: ${job.location}`);
  if (job.job_type) parts.push(`Type: ${job.job_type}`);
  if (job.description) parts.push(`Description: ${job.description.slice(0, 1500)}`);
  if (job.requirements) {
    const reqs = Array.isArray(job.requirements) ? job.requirements.join(", ") : String(job.requirements);
    parts.push(`Requirements: ${reqs.slice(0, 500)}`);
  }
  return parts.join("\n");
}

async function generateAnswers(
  apiKey: string,
  questions: Array<{ question_text: string; field_type: string }>,
  profileSummary: string,
  jobSummary: string
): Promise<string[]> {
  const questionList = questions
    .map((q, i) => `${i + 1}. [${q.field_type}] ${q.question_text}`)
    .join("\n");

  try {
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert career coach helping a candidate prepare personalized answers for a job application. Write compelling, specific, and professional answers based on the candidate's actual profile and the job description. 

Rules:
- Use first person ("I", "My")
- Reference specific skills, experiences, and achievements from the profile
- Tailor each answer to the specific job and company
- Keep short_answer type responses to 2-3 sentences
- Keep essay type responses to 3-5 paragraphs
- Keep cover_letter responses to a proper cover letter format
- Be authentic and avoid generic filler
- If profile data is limited, write the best possible answer with what's available

Return a JSON array of strings, one answer per question, in the same order. Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: `## Candidate Profile\n${profileSummary}\n\n## Job Details\n${jobSummary}\n\n## Questions to Answer\n${questionList}`,
          },
        ],
      }),
    }, 25000);

    if (!response.ok) {
      console.error("AI answer generation failed:", response.status);
      return questions.map(() => "Unable to generate answer.");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : questions.map(() => "Unable to generate answer.");
  } catch (err) {
    console.error("generateAnswers error:", err);
    return questions.map(() => "Unable to generate answer.");
  }
}

async function generateGeneralSummary(
  apiKey: string,
  profileSummary: string,
  jobSummary: string
): Promise<string> {
  try {
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a career coach. Generate a brief application summary the candidate can use when applying. Include:
1. A 2-3 sentence elevator pitch tailored to this specific role
2. 3-5 key strengths that match the job requirements
3. A brief "Why I'm a great fit" paragraph

Write in first person. Be specific to the candidate's actual background. Keep it concise and ready to copy-paste.`,
          },
          {
            role: "user",
            content: `## Candidate Profile\n${profileSummary}\n\n## Job Details\n${jobSummary}`,
          },
        ],
      }),
    }, 25000);

    if (!response.ok) return "Unable to generate summary.";

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Unable to generate summary.";
  } catch (err) {
    console.error("generateGeneralSummary error:", err);
    return "Unable to generate summary.";
  }
}
