// notify-application-status
// Dispatcher: given an application_id and a new status, writes an in-app notification
// for the talent, and (for high-signal status changes) enqueues a transactional email.
// Called from the recruiter / admin UI right after updating job_applications.application_status.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Status =
  | "submitted"
  | "sent_to_employer"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "hired";

const COPY: Record<string, { title: string; message: string; emailSubject?: string }> = {
  viewed: {
    title: "Your application was viewed",
    message: "{company} viewed your application for {role}.",
  },
  shortlisted: {
    title: "You're shortlisted",
    message: "{company} shortlisted you for {role}.",
    emailSubject: "You're shortlisted for {role} at {company}",
  },
  rejected: {
    title: "Application update",
    message: "Update on your {role} application at {company}.",
    emailSubject: "Update on your {role} application",
  },
  hired: {
    title: "🎉 You got hired",
    message: "{company} marked you as hired for {role}. Congratulations!",
    emailSubject: "🎉 You got hired at {company}",
  },
  withdrawn: {
    title: "Application withdrawn",
    message: "Your application for {role} was withdrawn.",
  },
};

function fill(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const applicationId: string | undefined = body.application_id;
    const status: Status | undefined = body.status;
    if (!applicationId || !status) {
      return new Response(JSON.stringify({ error: "application_id and status required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const copy = COPY[status];
    if (!copy) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: app } = await admin
      .from("job_applications")
      .select("id, talent_id, job_id")
      .eq("id", applicationId)
      .maybeSingle();
    if (!app?.talent_id) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_talent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job } = await admin
      .from("jobs")
      .select("id, title, company_name, company_id")
      .eq("id", app.job_id)
      .maybeSingle();

    const vars = {
      role: job?.title ?? "the role",
      company: job?.company_name ?? "The company",
    };

    // 1. In-app notification (talent_id-scoped)
    await admin.from("notifications").insert({
      talent_id: app.talent_id,
      type: `application_${status}`,
      title: fill(copy.title, vars),
      message: fill(copy.message, vars),
      icon: status === "hired" ? "trophy" : "briefcase",
      link: `/app/applications/${app.id}`,
    });

    // 2. Email (only for high-signal moves)
    if (copy.emailSubject) {
      try {
        const { data: talent } = await admin
          .from("talents")
          .select("user_id, full_name, email")
          .eq("id", app.talent_id)
          .maybeSingle();
        const email = talent?.email;
        if (email) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              to: email,
              subject: fill(copy.emailSubject, vars),
              html: `<p>Hi ${talent?.full_name ?? "there"},</p><p>${fill(copy.message, vars)}</p><p><a href="https://groupacademy.online/app/applications/${app.id}">View application</a></p>`,
              purpose: "transactional",
              idempotency_key: `app_status_${app.id}_${status}`,
            },
          });
        }
      } catch (_) {
        // best-effort; in-app notification is the primary channel
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
