// admin-readonly-tools — Phase D2 read-only telemetry gateway for the
// Executive Council (business-analyst, report-builder, talent-aisha,
// agent-manager). Strict RBAC: admin or super_admin only.
//
// Invoked via the central `agent-tool-execute` dispatcher, which inlines
// the validated input fields and adds `_tool_key`. Direct invocation with
// { tool_key, ...args } is also supported for debugging.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ ok: false, error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: auth, error: authErr } = await userClient.auth.getUser();
    if (authErr || !auth?.user) return j({ ok: false, error: "unauthorized" }, 401);
    const uid = auth.user.id;

    // RBAC — admin or super_admin only.
    const { data: roleRows } = await admin
      .from("user_roles").select("role").eq("user_id", uid);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return j({ ok: false, error: "forbidden_admin_only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const toolKey = String(body._tool_key ?? body.tool_key ?? "").trim();
    if (!toolKey) return j({ ok: false, error: "missing_tool_key" }, 400);

    const args = body.args && typeof body.args === "object" ? body.args : body;

    switch (toolKey) {
      case "query_platform_metrics":
        return j({ ok: true, result: await queryPlatformMetrics(admin, args) });

      case "query_agent_health":
        return j({ ok: true, result: await queryAgentHealth(admin, args) });

      case "query_agent_logs":
        return j({ ok: true, result: await queryAgentLogs(admin, args) });

      case "fetch_talent_summary":
        return j({ ok: true, result: await fetchTalentSummary(admin, args) });

      case "fetch_company_summary":
      case "export_report_csv":
        return j({
          ok: true,
          result: {
            status: "pending",
            tool_key: toolKey,
            message: "Tool logic under construction. Backend wiring coming in the next batch.",
          },
        });

      default:
        return j({ ok: false, error: `unknown_tool:${toolKey}` }, 400);
    }
  } catch (e) {
    console.error("[admin-readonly-tools] fault:", e);
    return j({ ok: false, error: String(e?.message ?? e) }, 500);
  }
});

// ---------------- Tool handlers ----------------

function windowToInterval(w: unknown): string {
  const m: Record<string, string> = {
    "1h": "1 hour", "24h": "24 hours", "1d": "1 day",
    "7d": "7 days", "30d": "30 days", "90d": "90 days", "ytd": "365 days",
  };
  return m[String(w ?? "30d")] ?? "30 days";
}

async function queryPlatformMetrics(admin: any, args: any) {
  const interval = windowToInterval(args?.window);
  const sinceISO = new Date(Date.now() - parseDays(interval) * 86400_000).toISOString();
  const metric = String(args?.metric ?? "summary");

  // High-level KPI bundle — one round-trip, all read-only counts.
  const [talents, companies, jobs, gigs, apps, newSignups] = await Promise.all([
    admin.from("talents").select("id", { count: "exact", head: true }),
    admin.from("companies").select("id", { count: "exact", head: true }),
    admin.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
    admin.from("gigs").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
    admin.from("job_applications").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
    admin.from("talents").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
  ]);

  return {
    metric,
    window: args?.window ?? "30d",
    generated_at: new Date().toISOString(),
    counts: {
      total_talents: talents.count ?? 0,
      total_companies: companies.count ?? 0,
      new_signups_in_window: newSignups.count ?? 0,
      new_jobs_in_window: jobs.count ?? 0,
      new_gigs_in_window: gigs.count ?? 0,
      new_applications_in_window: apps.count ?? 0,
    },
  };
}

async function queryAgentHealth(admin: any, args: any) {
  const sinceISO = new Date(Date.now() - parseDays(windowToInterval(args?.window ?? "24h")) * 86400_000).toISOString();
  const agentKey = args?.agent_key ? String(args.agent_key) : null;

  let q = admin.from("ai_agents").select("id, agent_key, name, agent_type, is_active, kill_switch");
  if (agentKey) q = q.eq("agent_key", agentKey);
  const { data: agents, error } = await q;
  if (error) throw error;

  const ids = (agents ?? []).map((a: any) => a.id);
  if (ids.length === 0) return { agents: [], window: args?.window ?? "24h" };

  const { data: events } = await admin
    .from("agent_credit_events")
    .select("agent_id, event_kind, credits")
    .in("agent_id", ids)
    .gte("created_at", sinceISO);

  const byAgent = new Map<string, { calls: number; errors: number; credits: number }>();
  for (const e of events ?? []) {
    const cur = byAgent.get(e.agent_id) ?? { calls: 0, errors: 0, credits: 0 };
    cur.calls += 1;
    if (String(e.event_kind ?? "").includes("error")) cur.errors += 1;
    cur.credits += Number(e.credits ?? 0);
    byAgent.set(e.agent_id, cur);
  }

  return {
    window: args?.window ?? "24h",
    agents: (agents ?? []).map((a: any) => ({
      ...a,
      stats: byAgent.get(a.id) ?? { calls: 0, errors: 0, credits: 0 },
    })),
  };
}

async function queryAgentLogs(admin: any, args: any) {
  const limit = Math.min(Number(args?.limit ?? 50), 200);
  let q = admin
    .from("agent_messages")
    .select("id, thread_id, role, content, created_at, agent_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args?.thread_id) q = q.eq("thread_id", String(args.thread_id));
  if (args?.agent_key) {
    const { data: agent } = await admin.from("ai_agents").select("id").eq("agent_key", String(args.agent_key)).maybeSingle();
    if (agent) q = q.eq("agent_id", agent.id);
  }

  const { data, error } = await q;
  if (error) throw error;
  return { messages: data ?? [], count: data?.length ?? 0 };
}

async function fetchTalentSummary(admin: any, args: any) {
  const id = String(args?.talent_id ?? "").trim();
  if (!id) throw new Error("talent_id_required");

  const [profile, credits, applications] = await Promise.all([
    admin.from("talents").select("*").eq("id", id).maybeSingle(),
    admin.from("credits_wallet").select("*").eq("talent_id", id).maybeSingle().then((r: any) => r).catch(() => ({ data: null })),
    admin.from("job_applications").select("id, job_id, status, created_at").eq("talent_id", id).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!profile.data) throw new Error("talent_not_found");

  return {
    profile: profile.data,
    credits: credits?.data ?? null,
    recent_applications: applications.data ?? [],
  };
}

// ---------------- helpers ----------------
function parseDays(intervalText: string): number {
  if (intervalText.includes("hour")) return Math.max(1, parseInt(intervalText) / 24);
  return parseInt(intervalText) || 30;
}
function j(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
