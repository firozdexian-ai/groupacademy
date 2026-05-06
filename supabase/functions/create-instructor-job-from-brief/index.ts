/**
 * Phase 4.1 — Atomic publish: course brief → hidden instructor job.
 * Admin / content_lead only.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // RBAC check
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const allowed = (roles ?? []).some((r: any) =>
      ["admin", "super_admin", "content_lead"].includes(r.role)
    );
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const { brief_id } = await req.json();
    if (!brief_id) return json({ error: "brief_id required" }, 400);

    const { data: brief, error: bErr } = await admin
      .from("course_briefs")
      .select("*")
      .eq("id", brief_id)
      .single();
    if (bErr || !brief) return json({ error: "Brief not found" }, 404);

    if (brief.instructor_job_id) {
      return json({ ok: true, job_id: brief.instructor_job_id, message: "Already published" });
    }

    // Create the instructor job
    const description = [
      brief.summary ?? "",
      "",
      "**About this opportunity**",
      "GroUp Academy is hiring an instructor to design & deliver this course.",
      `Mode: ${brief.mode}. Language: ${brief.language}.${brief.duration_weeks ? ` Duration: ~${brief.duration_weeks} weeks.` : ""}`,
      `Compensation: ${brief.revenue_share_pct}% revenue share${brief.budget_amount ? ` + ${brief.budget_currency} ${brief.budget_amount} flat fee on hire.` : "."}`,
      "",
      "**What you'll do**",
      "- Design the syllabus and produce all course materials",
      "- Author quizzes & scenarios (AI-assisted, credit-metered)",
      "- Run live sessions or record lessons",
      "",
      "**How to apply**",
      "Submit your CV, a 2-min teaching video link in your cover letter, and any prior course portfolio.",
    ].join("\n");

    const { data: job, error: jErr } = await admin
      .from("jobs")
      .insert({
        title: `Instructor — ${brief.title}`,
        company_name: "GroUp Academy",
        description,
        job_type: "contract",
        experience_level: "mid",
        application_type: "platform",
        is_active: true,
        is_featured: false,
        salary_currency: brief.budget_currency,
        job_kind: "instructor",
        course_brief_id: brief.id,
        posted_by: u.user.id,
        requirements: brief.required_skills ?? [],
      })
      .select()
      .single();

    if (jErr) return json({ error: jErr.message }, 500);

    await admin
      .from("course_briefs")
      .update({ status: "open", instructor_job_id: job.id })
      .eq("id", brief.id);

    return json({ ok: true, job_id: job.id });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
