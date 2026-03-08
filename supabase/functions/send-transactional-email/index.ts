import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType = "welcome" | "service_complete" | "bid_accepted" | "credit_receipt";

interface EmailRequest {
  type: EmailType;
  talent_id: string;
  data?: Record<string, any>;
}

// ── Branded HTML wrapper ──
function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" style="background:#ffffff;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;">
        <!-- Header -->
        <tr><td style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">GroUp Academy</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} GroUp Academy. All rights reserved.</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">You're receiving this because you have an account with us.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" width="100%"><tr><td align="center" style="padding:24px 0 8px;">
    <a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">${text}</a>
  </td></tr></table>`;
}

// ── Templates ──
function welcomeTemplate(name: string): string {
  return wrapTemplate(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${name}! 🎉</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Your GroUp Academy account is ready. You've received <strong>250 welcome credits</strong> to explore our services.
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">Here's what you can do:</p>
    <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
      <li>Take a <strong>Career Assessment</strong> to benchmark your skills</li>
      <li>Browse <strong>curated job listings</strong> matched to your profile</li>
      <li>Enroll in <strong>professional courses</strong> across 7 academies</li>
      <li>Chat with <strong>AI career agents</strong> for personalized guidance</li>
    </ul>
    ${ctaButton("Explore Your Dashboard", "https://groupacademy.lovable.app/app/feed")}
  `);
}

function serviceCompleteTemplate(name: string, serviceName: string, summary: string): string {
  return wrapTemplate(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Your results are ready! ✅</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi ${name}, your <strong>${serviceName}</strong> has been completed.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${summary}</p>
    </div>
    ${ctaButton("View Your Results", "https://groupacademy.lovable.app/app/my-results")}
  `);
}

function bidAcceptedTemplate(name: string, gigTitle: string, creditsAwarded: number): string {
  return wrapTemplate(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Your submission was approved! 🏆</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Great news, ${name}! Your submission for <strong>"${gigTitle}"</strong> has been approved.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin:0 0 16px;">
      <p style="margin:0 0 4px;font-size:14px;color:#166534;">Credits Earned</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#15803d;">+${creditsAwarded}</p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      These credits have been added to your wallet. Use them for career services, courses, and more.
    </p>
    ${ctaButton("View Your Wallet", "https://groupacademy.lovable.app/app/transactions")}
  `);
}

function creditReceiptTemplate(name: string, amount: number, newBalance: number, transactionType: string): string {
  const typeLabel = transactionType === "purchase" ? "Credit Purchase" : transactionType === "refund" ? "Credit Refund" : "Credit Addition";
  return wrapTemplate(`
    <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${typeLabel} Receipt 🧾</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi ${name}, here's your transaction receipt.
    </p>
    <table role="presentation" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:0 0 16px;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#64748b;">Type</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Amount</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#15803d;text-align:right;">+${amount} credits</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">New Balance</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${newBalance} credits</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;color:#64748b;border-top:1px solid #e2e8f0;">Date</td>
        <td style="padding:12px 16px;font-size:14px;color:#0f172a;text-align:right;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
      </tr>
    </table>
    ${ctaButton("View Transaction History", "https://groupacademy.lovable.app/app/transactions")}
  `);
}

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, talent_id, data } = (await req.json()) as EmailRequest;

    if (!type || !talent_id) {
      return new Response(JSON.stringify({ error: "type and talent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up talent
    const { data: talent, error: talentErr } = await supabaseAdmin
      .from("talents")
      .select("full_name, email")
      .eq("id", talent_id)
      .single();

    if (talentErr || !talent?.email) {
      return new Response(JSON.stringify({ error: "Talent not found or no email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = talent.full_name || "there";

    // Build HTML + subject
    let html: string;
    let subject: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationIcon = "bell";
    let notificationLink: string | undefined;

    switch (type) {
      case "welcome":
        subject = "Welcome to GroUp Academy! 🎉";
        html = welcomeTemplate(name);
        notificationTitle = "Welcome email sent";
        notificationMessage = "Check your inbox for your welcome guide.";
        notificationIcon = "sparkles";
        notificationLink = "/app/feed";
        break;

      case "service_complete":
        subject = `Your ${data?.service_name || "service"} results are ready`;
        html = serviceCompleteTemplate(name, data?.service_name || "Service", data?.summary || "Your results are now available.");
        notificationTitle = `${data?.service_name || "Service"} completed`;
        notificationMessage = "Your results are ready to view.";
        notificationIcon = "check-circle";
        notificationLink = "/app/my-results";
        break;

      case "bid_accepted":
        subject = `Your gig submission was approved! +${data?.credits_awarded || 0} credits`;
        html = bidAcceptedTemplate(name, data?.gig_title || "Gig", data?.credits_awarded || 0);
        notificationTitle = `Gig approved: +${data?.credits_awarded || 0} credits`;
        notificationMessage = `Your submission for "${data?.gig_title || "a gig"}" earned you credits.`;
        notificationIcon = "coins";
        notificationLink = "/app/gigs";
        break;

      case "credit_receipt":
        subject = `Credit ${data?.transaction_type || "purchase"} receipt — ${data?.amount || 0} credits`;
        html = creditReceiptTemplate(name, data?.amount || 0, data?.new_balance || 0, data?.transaction_type || "purchase");
        notificationTitle = "Credit receipt sent";
        notificationMessage = `${data?.amount || 0} credits added to your account.`;
        notificationIcon = "coins";
        notificationLink = "/app/transactions";
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Send via Resend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        from: "GroUp Academy <onboarding@resend.dev>",
        to: [talent.email],
        subject,
        html,
      }),
    });

    clearTimeout(timeout);
    const resendData = await resendRes.json();

    const emailStatus = resendRes.ok ? "sent" : "failed";
    const resendId = resendData?.id || null;
    const errorMessage = resendRes.ok ? null : JSON.stringify(resendData);

    // Log to email_notifications_log
    await supabaseAdmin.from("email_notifications_log").insert({
      talent_id,
      email_type: type,
      recipient_email: talent.email,
      resend_id: resendId,
      status: emailStatus,
      error_message: errorMessage,
      metadata: data || {},
    });

    // Insert in-app notification (skip for welcome — already handled by DB trigger)
    if (type !== "welcome") {
      await supabaseAdmin.from("notifications").insert({
        talent_id,
        type: "service" as any,
        title: notificationTitle,
        message: notificationMessage,
        icon: notificationIcon,
        link: notificationLink,
      });
    }

    return new Response(
      JSON.stringify({ success: resendRes.ok, email_id: resendId, status: emailStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Email send error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
