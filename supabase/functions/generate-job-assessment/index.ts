import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { jobId, talentId, jobApplicationId } = await req.json();
    if (!jobId || !talentId) throw new Error("Job ID and Talent ID are required");

    // 1. CTO AUDIT FIX: Idempotency Check (High Priority #4)
    // Check for ANY existing assessment for this job + talent to prevent duplicates
    const { data: existingAssessment } = await supabaseAdmin
      .from("job_assessments")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("talent_id", talentId)
      .maybeSingle();

    if (existingAssessment) {
      console.log(`[Idempotency] Assessment already exists for Talent ${talentId} on Job ${jobId}`);
      return new Response(
        JSON.stringify({
          success: true,
          assessmentId: existingAssessment.id,
          status: existingAssessment.status,
          message: "Retrieved existing assessment",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Fetch Context Data
    const [{ data: talent }, { data: job }] = await Promise.all([
      supabaseAdmin.from("talents").select("*").eq("id", talentId).single(),
      supabaseAdmin.from("jobs").select("*, profession_categories(name)").eq("id", jobId).single(),
    ]);

    if (!talent || !job) throw new Error("Talent or Job record missing");
    if (talent.user_id !== user.id) throw new Error("Forbidden: Profile ownership mismatch");

    // 3. AI Prompt Construction (Personalized Interview)
    const prompt = `
      Candidate: ${talent.full_name}
      Skills: ${Array.isArray(talent.skills) ? talent.skills.join(", ") : "N/A"}
      Experience: ${JSON.stringify(talent.experience || [])}
      
      Job Title: ${job.title} at ${job.company_name}
      Category: ${job.profession_categories?.name || "General"}
      Job Requirements: ${JSON.stringify(job.requirements || [])}

      Generate a custom interview. 3 MCQs (technical) and 2 Voice questions (STAR behavior).
      Return JSON ONLY:
      {
        "mcq_questions": [{"id": "m1", "question": "...", "options": [], "correct_index": 0, "explanation": "..."}],
        "voice_questions": [{"id": "v1", "question": "...", "expected_points": []}]
      }
    `;

    // 4. AI Generation
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Expert HR Recruiter. Output JSON ONLY." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const cleanJson = aiData.choices[0].message.content.replace(/```json|```/g, "").trim();
    const parsedQuestions = JSON.parse(cleanJson);

    // 5. Insert Record
    const { data: newAssessment, error: insertError } = await supabaseAdmin
      .from("job_assessments")
      .insert({
        job_id: jobId,
        talent_id: talentId,
        job_application_id: jobApplicationId || null,
        questions: parsedQuestions,
        status: "pending",
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        assessmentId: newAssessment.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[Fatal Assessment Gen Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
