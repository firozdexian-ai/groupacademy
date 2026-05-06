// notify-learning-event — fanout in-app + email for cohort/session events.
// Kinds: session_reminder_t24 | session_reminder_t1 | session_reminder_t5 | session_live | recording_ready | cohort_started | cohort_completed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kind, session_id, cohort_id, payload } = await req.json();
    if (!kind) {
      return new Response(JSON.stringify({ error: "kind required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve recipients
    let recipients: string[] = [];
    let session: any = null;
    let course: any = null;

    if (session_id) {
      const { data: s } = await sb.from("course_sessions")
        .select("id,title,scheduled_date,duration_minutes,meeting_link,recording_link,cohort_id,content_id")
        .eq("id", session_id).maybeSingle();
      session = s;
      if (s) {
        const { data: ce } = await sb.from("cohort_enrollments").select("user_id").eq("cohort_id", s.cohort_id ?? "00000000-0000-0000-0000-000000000000");
        recipients = (ce ?? []).map((r: any) => r.user_id);
        if (recipients.length === 0) {
          // fallback: enrollments → students.user_id
          const { data: en } = await sb.from("enrollments").select("student_id, students(user_id)").eq("content_id", s.content_id);
          recipients = (en ?? []).map((r: any) => r.students?.user_id).filter(Boolean);
        }
        const { data: c } = await sb.from("content").select("id,title").eq("id", s.content_id).maybeSingle();
        course = c;
      }
    } else if (cohort_id) {
      const { data: ce } = await sb.from("cohort_enrollments").select("user_id").eq("cohort_id", cohort_id);
      recipients = (ce ?? []).map((r: any) => r.user_id);
    }

    recipients = Array.from(new Set(recipients));

    const titleMap: Record<string, string> = {
      session_reminder_t24: `Session tomorrow: ${session?.title ?? "your live class"}`,
      session_reminder_t1: `Starts in 1 hour: ${session?.title ?? "your live class"}`,
      session_reminder_t5: `Live in 5 minutes: ${session?.title ?? "your live class"}`,
      session_live: `🔴 Live now: ${session?.title ?? "your live class"}`,
      recording_ready: `Recording ready: ${session?.title ?? "your session"}`,
      cohort_started: `Your cohort just started`,
      cohort_completed: `Cohort completed — see you on the next one`,
    };

    const bodyText = course?.title ? `Course: ${course.title}` : "";

    if (recipients.length > 0) {
      const rows = recipients.map((uid) => ({
        user_id: uid,
        title: titleMap[kind] ?? kind,
        body: bodyText,
        link: session_id ? `/app/sessions/${session_id}/join` : cohort_id ? `/app/cohorts/${cohort_id}` : "/app/my-learning",
        kind: "learning",
        meta: { event: kind, session_id, cohort_id, ...(payload ?? {}) },
      }));
      // Insert in chunks
      for (let i = 0; i < rows.length; i += 200) {
        await sb.from("notifications").insert(rows.slice(i, i + 200));
      }
    }

    // Record dispatch (idempotent at caller level via cron-session-reminders)
    if (session_id) {
      await sb.from("notification_dispatch").upsert({
        scope: "session", scope_id: session_id, kind, payload: payload ?? {},
      }, { onConflict: "scope,scope_id,kind" });
    }

    return new Response(JSON.stringify({ ok: true, recipients: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
