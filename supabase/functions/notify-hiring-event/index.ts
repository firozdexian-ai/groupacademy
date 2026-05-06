// notify-hiring-event
// Unified dispatcher for Phase 3.7 events:
//   - interview_proposed / interview_confirmed
//   - offer_sent / offer_accepted / offer_declined
//   - job_invitation
// Writes in-app notifications and best-effort transactional emails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Kind =
  | "interview_proposed"
  | "interview_confirmed"
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined"
  | "job_invitation";

const COPY: Record<
  Kind,
  { audience: "talent" | "recruiter"; title: string; message: string; emailSubject?: string; icon: string }
> = {
  interview_proposed: {
    audience: "talent",
    title: "Interview proposed",
    message: "{company} proposed interview slots for {role}. Pick a time.",
    emailSubject: "Pick your interview time for {role}",
    icon: "calendar",
  },
  interview_confirmed: {
    audience: "recruiter",
    title: "Interview confirmed",
    message: "{talent} confirmed an interview slot for {role}.",
    icon: "calendar-check",
  },
  offer_sent: {
    audience: "talent",
    title: "🎉 You received an offer",
    message: "{company} sent you an offer for {role}.",
    emailSubject: "Your offer from {company}",
    icon: "file-text",
  },
  offer_accepted: {
    audience: "recruiter",
    title: "Offer accepted",
    message: "{talent} accepted your offer for {role}.",
    icon: "check-circle",
  },
  offer_declined: {
    audience: "recruiter",
    title: "Offer declined",
    message: "{talent} declined your offer for {role}.",
    icon: "x-circle",
  },
  job_invitation: {
    audience: "talent",
    title: "You've been invited to apply",
    message: "{company} invited you to apply for {role}.",
    emailSubject: "{company} invited you to apply for {role}",
    icon: "send",
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
    const kind: Kind = body.kind;
    const ref: { application_id?: string; offer_id?: string; interview_id?: string; invitation_id?: string } = body.ref ?? {};

    const copy = COPY[kind];
    if (!copy) {
      return new Response(JSON.stringify({ error: "unknown kind" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve job + parties
    let jobId: string | null = null;
    let talentId: string | null = null;
    let companyId: string | null = null;
    let appId: string | null = ref.application_id ?? null;
    let link = "/app/applications";

    if (ref.offer_id) {
      const { data } = await admin.from("offers").select("application_id, talent_id, company_id").eq("id", ref.offer_id).maybeSingle();
      appId = data?.application_id ?? appId; talentId = data?.talent_id ?? null; companyId = data?.company_id ?? null;
      link = `/app/applications/${appId}/offer/${ref.offer_id}`;
    } else if (ref.interview_id) {
      const { data } = await admin.from("interviews").select("application_id, talent_id, company_id").eq("id", ref.interview_id).maybeSingle();
      appId = data?.application_id ?? appId; talentId = data?.talent_id ?? null; companyId = data?.company_id ?? null;
      link = `/app/applications/${appId}/interview/${ref.interview_id}`;
    } else if (ref.invitation_id) {
      const { data } = await admin.from("job_invitations").select("job_id, talent_id, company_id").eq("id", ref.invitation_id).maybeSingle();
      jobId = data?.job_id ?? null; talentId = data?.talent_id ?? null; companyId = data?.company_id ?? null;
      link = `/jobs/${jobId}?invited=${ref.invitation_id}`;
    } else if (appId) {
      const { data } = await admin.from("job_applications").select("talent_id, job_id").eq("id", appId).maybeSingle();
      talentId = data?.talent_id ?? null; jobId = data?.job_id ?? null;
      link = `/app/applications/${appId}`;
    }

    if (!jobId && appId) {
      const { data } = await admin.from("job_applications").select("job_id").eq("id", appId).maybeSingle();
      jobId = data?.job_id ?? null;
    }
    const { data: job } = jobId
      ? await admin.from("jobs").select("title, company_name, company_id").eq("id", jobId).maybeSingle()
      : { data: null as any };

    const { data: talent } = talentId
      ? await admin.from("talents").select("id, full_name, email, user_id").eq("id", talentId).maybeSingle()
      : { data: null as any };

    const vars = {
      role: job?.title ?? "the role",
      company: job?.company_name ?? "The company",
      talent: talent?.full_name ?? "The candidate",
    };

    // In-app notification
    if (copy.audience === "talent" && talentId) {
      await admin.from("notifications").insert({
        talent_id: talentId,
        type: kind,
        title: fill(copy.title, vars),
        message: fill(copy.message, vars),
        icon: copy.icon,
        link,
      });
    } else if (copy.audience === "recruiter" && (companyId || job?.company_id)) {
      // Notify recruiters via per-user notifications by talent rows tied to company members
      const cid = companyId ?? job?.company_id;
      const { data: members } = await admin
        .from("company_members")
        .select("user_id")
        .eq("company_id", cid);
      for (const m of members ?? []) {
        const { data: rt } = await admin.from("talents").select("id").eq("user_id", m.user_id).maybeSingle();
        if (rt?.id) {
          await admin.from("notifications").insert({
            talent_id: rt.id,
            type: kind,
            title: fill(copy.title, vars),
            message: fill(copy.message, vars),
            icon: copy.icon,
            link: `/gro10x/work/applications`,
          });
        }
      }
    }

    // Email (talent-targeted only for now)
    if (copy.emailSubject && copy.audience === "talent" && talent?.email) {
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            to: talent.email,
            subject: fill(copy.emailSubject, vars),
            html: `<p>Hi ${talent.full_name ?? "there"},</p><p>${fill(copy.message, vars)}</p><p><a href="https://groupacademy.online${link}">Open in Group Academy</a></p>`,
            purpose: "transactional",
            idempotency_key: `${kind}_${ref.offer_id ?? ref.interview_id ?? ref.invitation_id ?? appId}`,
          },
        });
      } catch (_) {/* best-effort */}
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
