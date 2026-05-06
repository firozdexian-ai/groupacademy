// Authoring review digest — phase 3.6
// Modes:
//   single  → returns digest for one module_id
//   course  → returns digest for all modules in one content_id
//   weekly  → loops every published course, sends emails to primary instructor and admins
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Body {
  mode?: "single" | "course" | "weekly";
  module_id?: string;
  content_id?: string;
  days?: number;
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: allow either a real user with admin role, or a service-role caller (cron).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  let isService = token === serviceKey;
  let uid: string | null = null;
  if (!isService) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);
    uid = userData.user.id;
    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    if (!roleData) return json({ error: "forbidden" }, 403);
  }

  let body: Body = {};
  try { body = await req.json(); } catch { /* default */ }
  const mode = body.mode ?? "single";
  const days = Math.min(Math.max(body.days ?? 7, 1), 90);

  const fetchDigest = async (moduleId: string) => {
    const { data, error } = await admin.rpc("get_authoring_review_digest", {
      _module_id: moduleId, _days: days,
    });
    if (error) throw new Error(error.message);
    return data as any;
  };

  if (mode === "single") {
    if (!body.module_id) return json({ error: "module_id required" }, 400);
    return json(await fetchDigest(body.module_id));
  }

  if (mode === "course") {
    if (!body.content_id) return json({ error: "content_id required" }, 400);
    const { data: mods = [] } = await admin
      .from("course_modules").select("id").eq("content_id", body.content_id);
    const digests = [];
    for (const m of mods ?? []) digests.push(await fetchDigest((m as any).id));
    return json({ content_id: body.content_id, modules: digests });
  }

  if (mode === "weekly") {
    // Iterate every published course, group by primary instructor, send one email per instructor.
    const { data: courses = [] } = await admin
      .from("content")
      .select("id,title,is_published")
      .eq("is_published", true);
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - days * 86400_000);
    const sent: any[] = [];

    for (const c of courses ?? []) {
      const courseId = (c as any).id;
      const { data: mods = [] } = await admin
        .from("course_modules").select("id").eq("content_id", courseId);
      if (!(mods?.length)) continue;

      const digests: any[] = [];
      for (const m of mods!) {
        try { digests.push(await fetchDigest((m as any).id)); } catch (_) { /* skip */ }
      }
      const flagged = digests.filter(d => {
        const s = d?.summary ?? {};
        return (s.flagged_quiz ?? 0) + (s.flagged_scenarios ?? 0) > 0;
      });
      if (!flagged.length) continue;

      const owner = digests.find(d => d?.owner)?.owner ?? null;
      const recipientEmail = owner?.email ?? null;
      const recipientName = owner?.full_name ?? "Instructor";
      const totalFlagged = flagged.reduce(
        (n, d) => n + (d?.summary?.flagged_quiz ?? 0) + (d?.summary?.flagged_scenarios ?? 0), 0,
      );

      // Log the digest regardless of email send (admins always have visibility).
      await admin.from("authoring_digest_log").insert({
        content_id: courseId,
        instructor_id: owner?.instructor_id ?? null,
        recipient_email: recipientEmail,
        module_ids: flagged.map(d => d?.module?.id).filter(Boolean),
        items_flagged: totalFlagged,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        channel: recipientEmail ? "email" : "in_app",
        metadata: { course_title: (c as any).title, modules: flagged.length },
      });

      if (!body.dry_run && recipientEmail) {
        try {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "authoring-review-digest",
              recipientEmail,
              idempotencyKey: `authoring-digest-${courseId}-${periodStart.toISOString().slice(0,10)}`,
              templateData: {
                name: recipientName,
                courseTitle: (c as any).title,
                totalFlagged,
                modulesCount: flagged.length,
                modules: flagged.slice(0, 5).map(d => ({
                  title: d?.module?.title ?? "Module",
                  flaggedQuiz: d?.summary?.flagged_quiz ?? 0,
                  flaggedScenarios: d?.summary?.flagged_scenarios ?? 0,
                })),
              },
            },
          });
        } catch (e) {
          console.warn("digest email failed", courseId, (e as any)?.message);
        }
      }

      sent.push({
        content_id: courseId, recipient: recipientEmail, items_flagged: totalFlagged,
      });
    }

    return json({ ok: true, sent_count: sent.length, sent });
  }

  return json({ error: "invalid_mode" }, 400);
});
