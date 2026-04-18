import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 1. Verify Authentication (CTO Security Requirement)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized access");

    const { applicationId } = await req.json();
    if (!applicationId) throw new Error("Missing applicationId");

    // 2. Fetch data with full relations
    const { data: app, error } = await supabaseAdmin
      .from("job_applications")
      .select(`*, jobs(*), talents(*)`)
      .eq("id", applicationId)
      .single();

    if (error || !app) throw new Error("Application not found");

    // 3. Security Check: Only the candidate or an Admin/TalentExec can fire this
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);

    const isAdmin = roles?.some((r) => ["admin", "talent_exec"].includes(r.role));
    const isOwner = app.talents?.user_id === user.id;

    if (!isAdmin && !isOwner) {
      throw new Error("Access denied: You do not have permission to process this application.");
    }

    // 4. Send employer notification (Only if application_email exists)
    if (app.jobs?.application_email) {
      await supabaseAdmin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "job-application-employer",
          recipientEmail: app.jobs.application_email,
          idempotencyKey: `job-app-employer-${applicationId}`,
          templateData: {
            job_title: app.jobs.title,
            company_name: app.jobs.company_name,
            applicant_name: app.talents?.full_name || "A candidate",
            cover_letter: app.cover_letter,
            cv_url: app.cv_url,
            // match_score removed - does not exist in schema
          },
        },
      });
    }

    // 5. Send confirmation to the applicant
    if (app.talents?.email) {
      await supabaseAdmin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "job-application-sent",
          recipientEmail: app.talents.email,
          idempotencyKey: `job-app-sent-${applicationId}`,
          templateData: {
            name: app.talents.full_name || "there",
            job_title: app.jobs.title,
            company_name: app.jobs.company_name,
          },
        },
      });
    }

    // 6. Update Status (Preserve existing status if already advanced)
    const statusUpdate: any = { delivery_status: "sent" };

    // Only set to sent_to_employer if it was just submitted
    if (app.application_status === "submitted" || !app.application_status) {
      statusUpdate.application_status = "sent_to_employer";
    }

    await supabaseAdmin.from("job_applications").update(statusUpdate).eq("id", applicationId);

    return new Response(
      JSON.stringify({
        success: true,
        message: app.jobs?.application_email ? "Emails dispatched" : "Logged as external redirect",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error(`[Error] send-job-application: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
