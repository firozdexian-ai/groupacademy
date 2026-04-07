import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { applicationId } = await req.json();

    // 1. Fetch data with full relations
    const { data: app, error } = await supabaseAdmin
      .from("job_applications")
      .select(`*, jobs(*), talents(*)`)
      .eq("id", applicationId)
      .single();

    if (error || !app) throw new Error("Application not found");

    // 2. Send employer notification via the transactional email system
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
          match_score: app.match_score,
        },
      },
    });

    // 3. Send confirmation to the applicant
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

    // 4. Update Status
    await supabaseAdmin
      .from("job_applications")
      .update({
        delivery_status: "sent",
        application_status: "sent_to_employer",
      })
      .eq("id", applicationId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
