import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendApplicationRequest {
  applicationId: string;
}

async function sendEmail(to: string, cc: string, replyTo: string, subject: string, html: string) {
  console.log("Sending email via Resend API...");
  console.log("To:", to);
  console.log("CC:", cc);
  console.log("Reply-To:", replyTo);
  console.log("Subject:", subject);
  
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GroUp Academy Jobs <jobs@resend.dev>",
      to: [to],
      cc: [cc],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  const responseText = await response.text();
  console.log("Resend API response status:", response.status);
  console.log("Resend API response:", responseText);

  if (!response.ok) {
    throw new Error(`Resend API error (${response.status}): ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId }: SendApplicationRequest = await req.json();
    console.log("=== Send Job Application Function Started ===");
    console.log("Processing application ID:", applicationId);

    if (!applicationId) {
      throw new Error("applicationId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application with job and professional details
    const { data: application, error: fetchError } = await supabase
      .from("job_applications")
      .select(`
        *,
        jobs (*),
        professionals (*)
      `)
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      console.error("Error fetching application:", fetchError);
      throw new Error("Application not found");
    }

    const job = application.jobs;
    const professional = application.professionals;

    // Check if job accepts email applications
    if (job.application_type !== "email" || !job.application_email) {
      console.log("Job does not accept email applications, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Job uses link-based applications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #2A7DDE, #33E1E4); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; background: #f9fafb; }
          .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h2 { color: #2A7DDE; margin-top: 0; font-size: 18px; border-bottom: 2px solid #33E1E4; padding-bottom: 10px; }
          .info-row { margin-bottom: 8px; }
          .label { font-weight: 600; color: #555; display: inline-block; min-width: 120px; }
          .value { color: #333; }
          .cover-letter { background: #f0f9ff; border-left: 4px solid #2A7DDE; padding: 15px; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .cta { display: inline-block; background: #2A7DDE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Job Application</h1>
        </div>
        <div class="content">
          <div class="section">
            <h2>Position Applied For</h2>
            <div class="info-row">
              <span class="label">Job Title:</span>
              <span class="value">${job.title}</span>
            </div>
            <div class="info-row">
              <span class="label">Company:</span>
              <span class="value">${job.company_name}</span>
            </div>
          </div>

          <div class="section">
            <h2>Applicant Information</h2>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${professional.full_name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${professional.email}</span>
            </div>
            ${professional.phone ? `
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${professional.phone}</span>
            </div>
            ` : ''}
            ${professional.linkedin_url ? `
            <div class="info-row">
              <span class="label">LinkedIn:</span>
              <span class="value"><a href="${professional.linkedin_url}">${professional.linkedin_url}</a></span>
            </div>
            ` : ''}
          </div>

          ${application.cover_letter ? `
          <div class="section">
            <h2>Cover Letter</h2>
            <div class="cover-letter">
              ${application.cover_letter.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          ${application.cv_url ? `
          <div class="section">
            <h2>Resume/CV</h2>
            <p>The applicant's CV is available at:</p>
            <a href="${application.cv_url}" class="cta">View CV</a>
          </div>
          ` : ''}

          ${professional.skills && Array.isArray(professional.skills) && professional.skills.length > 0 ? `
          <div class="section">
            <h2>Skills</h2>
            <p>${professional.skills.join(', ')}</p>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>This application was submitted via GroUp Academy Jobs Board</p>
          <p>Reply directly to the applicant at: ${professional.email}</p>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", job.application_email, "with CC:", professional.email);
    const emailResponse = await sendEmail(
      job.application_email,
      professional.email,
      professional.email,
      `New Application: ${professional.full_name} for ${job.title}`,
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    // Update application delivery status
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        delivery_status: "sent",
        application_status: "sent_to_employer"
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating delivery status:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending application:", error);

    // Try to update delivery status to failed
    try {
      const { applicationId } = await req.clone().json();
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("job_applications")
        .update({
          delivery_status: "failed",
          delivery_error: error.message
        })
        .eq("id", applicationId);
    } catch (updateErr) {
      console.error("Failed to update delivery status:", updateErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
