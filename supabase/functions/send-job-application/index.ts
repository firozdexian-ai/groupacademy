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

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
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

    const token = authHeader.replace("Bearer ", "");

    // Client to verify user identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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

    const { applicationId }: SendApplicationRequest = await req.json();

    if (!applicationId) {
      throw new Error("applicationId is required");
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Fetch application with job and talent details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from("job_applications")
      .select(
        `
        *,
        jobs (*),
        talents (*, user_id)
      `,
      )
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      console.error("Error fetching application:", fetchError);
      throw new Error("Application not found");
    }

    // 2. SECURITY: Ownership Check
    // Ensure the application belongs to the requesting user
    // We check if the talent profile associated with this application is owned by the user
    if (application.talents?.user_id !== user.id) {
      console.error(
        `Unauthorized: User ${user.id} tried to send application ${applicationId} belonging to ${application.talents?.user_id}`,
      );
      return new Response(JSON.stringify({ error: "Unauthorized access to this application" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. SECURITY: Idempotency Check (Prevent Spam)
    if (application.delivery_status === "sent") {
      console.log(`Application ${applicationId} already sent. Skipping.`);
      return new Response(JSON.stringify({ success: true, message: "Application already sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = application.jobs;
    const talent = application.talents;

    if (!job || !talent) {
      throw new Error("Invalid application data: missing job or talent info");
    }

    // Check if job accepts email applications
    if (job.application_type !== "email" || !job.application_email) {
      console.log("Job does not accept email applications, skipping");
      return new Response(JSON.stringify({ success: true, message: "Job uses link-based applications" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
              <span class="value">${talent.full_name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${talent.email}</span>
            </div>
            ${
              talent.phone
                ? `
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${talent.phone}</span>
            </div>
            `
                : ""
            }
            ${
              talent.linkedin_url
                ? `
            <div class="info-row">
              <span class="label">LinkedIn:</span>
              <span class="value"><a href="${talent.linkedin_url}">${talent.linkedin_url}</a></span>
            </div>
            `
                : ""
            }
          </div>

          ${
            application.cover_letter
              ? `
          <div class="section">
            <h2>Cover Letter</h2>
            <div class="cover-letter">
              ${application.cover_letter.replace(/\n/g, "<br>")}
            </div>
          </div>
          `
              : ""
          }

          ${
            application.cv_url
              ? `
          <div class="section">
            <h2>Resume/CV</h2>
            <p>The applicant's CV is available at:</p>
            <a href="${application.cv_url}" class="cta">View CV</a>
          </div>
          `
              : ""
          }

          ${
            talent.skills && Array.isArray(talent.skills) && talent.skills.length > 0
              ? `
          <div class="section">
            <h2>Skills</h2>
            <p>${talent.skills.join(", ")}</p>
          </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>This application was submitted via GroUp Academy Jobs Board</p>
          <p>Reply directly to the applicant at: ${talent.email}</p>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", job.application_email, "with CC:", talent.email);

    try {
      const emailResponse = await sendEmail(
        job.application_email,
        talent.email,
        talent.email,
        `New Application: ${talent.full_name} for ${job.title}`,
        emailHtml,
      );

      console.log("Email sent successfully");

      // Update application delivery status to sent
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
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError.message);

      // Check if it's a Resend domain verification error (403)
      const isDomainError = emailError.message?.includes("403") || emailError.message?.includes("verify a domain");

      // Mark as pending manual forward instead of failing completely
      await supabaseAdmin
        .from("job_applications")
        .update({
          delivery_status: isDomainError ? "pending_forward" : "failed",
          application_status: isDomainError ? "pending" : "failed",
          delivery_error: emailError.message,
        })
        .eq("id", applicationId);

      if (isDomainError) {
        // Return success - application saved, just needs manual forwarding
        return new Response(
          JSON.stringify({
            success: true,
            manual_forward_required: true,
            message: "Application saved! An admin will forward it to the employer.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw emailError;
    }
  } catch (error: any) {
    console.error("Error sending application:", error);

    // Try to update delivery status to failed
    try {
      const { applicationId } = await req.clone().json();
      if (applicationId) {
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, supabaseKey);

        await supabaseAdmin
          .from("job_applications")
          .update({
            delivery_status: "failed",
            delivery_error: error.message,
          })
          .eq("id", applicationId);
      }
    } catch (updateErr) {
      console.error("Failed to update delivery status:", updateErr);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
