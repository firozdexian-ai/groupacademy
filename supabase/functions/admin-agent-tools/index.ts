// admin-agent-tools — Phase D1 unified handler for the four admin AI tools:
//   approve_payout, reject_payout, force_run_matchmaker, award_credits
//
// Strict RBAC: requires authenticated user with `admin` or `super_admin` role.
// Routed through the central `agent-tool-execute` dispatcher, which forwards
// the original Authorization header so this function still sees the calling
// admin's JWT.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ---------- Per-tool schemas (Phase Z0 hardening) ----------
// Loose-by-default: only enforce types the downstream RPCs absolutely need.
// Relying on uuid() at the wrapper layer was over-strict — RPCs already
// validate ids and return clean errors that the LLM can self-correct on.
const idLike = z.string().min(1);
const AdminSchemas: Record<string, z.ZodTypeAny> = {
  approve_payout: z.object({
    request_id: idLike,
    notes: z.string().optional().nullable(),
    fx_rate: z.number().positive().optional().nullable(),
  }).passthrough(),
  reject_payout: z.object({
    request_id: idLike,
    notes: z.string().optional().nullable(),
  }).passthrough(),
  award_credits: z.object({
    talent_id: idLike,
    amount: z.number().positive(),
    reason: z.string().optional(),
  }).passthrough(),
  force_run_matchmaker: z.object({
    gig_id: idLike.optional().nullable(),
  }).passthrough(),
  archive_expired_jobs: z.object({}).passthrough(),
  create_agent: z.object({
    agent_key: z.string().min(2).max(64).regex(/^[a-z0-9_-]+$/i),
    name: z.string().min(2),
    description: z.string().min(2),
    system_prompt: z.string().min(10),
    category: z.string().optional(),
    audience: z.enum(["talent", "company", "admin", "public"]).optional(),
    owner_kind: z.enum(["platform", "company", "user"]).optional(),
    model: z.string().optional(),
    is_active: z.boolean().optional(),
  }).passthrough(),
  update_agent_prompt: z.object({
    agent_key: z.string().min(1),
    system_prompt: z.string().min(10),
  }).passthrough(),
  toggle_agent_status: z.object({
    agent_key: z.string().min(1),
    is_active: z.boolean().optional(),
    kill_switch: z.boolean().optional(),
  }).passthrough(),
  archive_agent: z.object({
    agent_key: z.string().min(1),
  }).passthrough(),
  notify_admin: z.object({
    title: z.string().min(2),
    message: z.string().min(2),
    type: z.string().optional(),
    link: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional(),
  }).passthrough(),
  notify_stakeholder: z.object({
    audience_type: z.enum(["admin", "talent", "business", "system"]),
    event_topic: z.string().min(1),
    message: z.string().min(2),
    title: z.string().optional().nullable(),
    agent_key: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional(),
  }).passthrough(),
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ ok: false, error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: auth } = await userClient.auth.getUser();
    if (!auth?.user) return j({ ok: false, error: "unauthorized" }, 401);
    const uid = auth.user.id;

    const { data: roleRows } = await admin
      .from("user_roles").select("role").eq("user_id", uid);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return j({ ok: false, error: "forbidden_admin_only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    // The dispatcher inlines the tool input fields directly. We also accept a
    // wrapped { tool_key, ...input } shape for direct invocation.
    const toolKey: string = String(body.tool_key ?? body._tool_key ?? "").trim();

    // The dispatcher does NOT pass tool_key — infer from URL header instead.
    // Fallback: dispatch by which keys are present in the body.
    const dispatch = toolKey || inferTool(body);
    if (!dispatch) return j({ ok: false, error: "unknown_admin_tool" }, 400);

    const schema = AdminSchemas[dispatch];
    if (schema) {
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return j({ ok: false, error: "BAD_ARGS", tool: dispatch, issues: parsed.error.issues }, 400);
      }
    }

    switch (dispatch) {
      case "approve_payout": {
        const requestId = body.request_id;
        if (!requestId) return j({ ok: false, error: "request_id_required" }, 400);
        // RPC enforces admin again — defense in depth.
        const { data, error } = await userClient.rpc("process_instructor_payout", {
          _request_id: requestId,
          _action: "approve",
          _notes: body.notes ?? null,
          _fx_rate: typeof body.fx_rate === "number" ? body.fx_rate : null,
        });
        if (error) return j({ ok: false, error: error.message }, 400);
        return j({ ok: true, result: data });
      }
      case "reject_payout": {
        const requestId = body.request_id;
        if (!requestId) return j({ ok: false, error: "request_id_required" }, 400);
        const { data, error } = await userClient.rpc("process_instructor_payout", {
          _request_id: requestId,
          _action: "reject",
          _notes: body.notes ?? null,
          _fx_rate: null,
        });
        if (error) return j({ ok: false, error: error.message }, 400);
        return j({ ok: true, result: data });
      }
      case "award_credits": {
        const talentId = body.talent_id;
        const amount = Number(body.amount);
        if (!talentId) return j({ ok: false, error: "talent_id_required" }, 400);
        if (!Number.isFinite(amount) || amount <= 0) {
          return j({ ok: false, error: "invalid_amount" }, 400);
        }
        const { data, error } = await userClient.rpc("award_credits", {
          p_talent_id: talentId,
          p_amount: amount,
          p_reason: body.reason ?? "Admin award via AI",
        });
        if (error) return j({ ok: false, error: error.message }, 400);
        return j({ ok: true, result: data });
      }
      case "force_run_matchmaker": {
        // Trigger the cron-gig-matchmaker edge function, optionally for one gig.
        const r = await fetch(`${SUPABASE_URL}/functions/v1/cron-gig-matchmaker`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
            apikey: SERVICE_ROLE,
          },
          body: JSON.stringify({ gig_id: body.gig_id ?? null, forced_by: uid }),
        });
        const text = await r.text();
        let parsed: any;
        try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
        if (!r.ok) return j({ ok: false, error: `matchmaker_${r.status}`, result: parsed }, 400);
        return j({ ok: true, result: parsed });
      }
      case "archive_expired_jobs": {
        const { data, error } = await userClient.rpc("archive_expired_jobs");
        if (error) return j({ ok: false, error: error.message }, 400);
        return j({ ok: true, result: { archived: Number(data ?? 0) } });
      }
      case "create_agent": {
        const payload: Record<string, any> = {
          agent_key: String(body.agent_key).toLowerCase(),
          name: body.name,
          description: body.description,
          system_prompt: body.system_prompt,
          category: body.category ?? "career",
          audience: body.audience ?? "admin",
          owner_kind: body.owner_kind ?? "platform",
          model: body.model ?? "google/gemini-3-flash-preview",
          is_active: body.is_active ?? true,
          allowed_tools: Array.isArray(body.allowed_tools) ? body.allowed_tools : [],
        };
        const { data, error } = await admin.from("ai_agents").insert(payload).select("id, agent_key, name").single();
        if (error) return j({ ok: false, error: error.message }, 400);
        return j({ ok: true, result: data });
      }
      case "update_agent_prompt": {
        const { data, error } = await admin
          .from("ai_agents")
          .update({ system_prompt: body.system_prompt, updated_at: new Date().toISOString() })
          .eq("agent_key", body.agent_key)
          .select("id, agent_key")
          .maybeSingle();
        if (error) return j({ ok: false, error: error.message }, 400);
        if (!data) return j({ ok: false, error: "agent_not_found" }, 404);
        return j({ ok: true, result: data });
      }
      case "toggle_agent_status": {
        const patch: Record<string, any> = { updated_at: new Date().toISOString() };
        if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
        if (typeof body.kill_switch === "boolean") patch.kill_switch = body.kill_switch;
        if (Object.keys(patch).length === 1) {
          return j({ ok: false, error: "must_provide_is_active_or_kill_switch" }, 400);
        }
        const { data, error } = await admin
          .from("ai_agents")
          .update(patch)
          .eq("agent_key", body.agent_key)
          .select("id, agent_key, is_active, kill_switch")
          .maybeSingle();
        if (error) return j({ ok: false, error: error.message }, 400);
        if (!data) return j({ ok: false, error: "agent_not_found" }, 404);
        return j({ ok: true, result: data });
      }
      case "archive_agent": {
        const { data, error } = await admin
          .from("ai_agents")
          .update({ is_active: false, kill_switch: true, updated_at: new Date().toISOString() })
          .eq("agent_key", body.agent_key)
          .select("id, agent_key")
          .maybeSingle();
        if (error) return j({ ok: false, error: error.message }, 400);
        if (!data) return j({ ok: false, error: "agent_not_found" }, 404);
        return j({ ok: true, result: { ...data, archived: true } });
      }
      case "notify_admin": {
        // Persist to admin_notifications (in-app inbox) AND best-effort fan-out
        // to the Telegram bridge so admins get a real-time ping.
        const { data, error } = await admin
          .from("admin_notifications")
          .insert({
            type: body.type ?? "agent_alert",
            title: body.title,
            message: body.message,
            link: body.link ?? null,
            metadata: { ...(body.metadata ?? {}), source_user_id: uid },
          })
          .select("id")
          .single();
        if (error) return j({ ok: false, error: error.message }, 400);

        // Fire-and-forget Telegram ping (won't fail the tool call).
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/notify-admin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              channel: "telegram",
              message: `[${body.type ?? "agent_alert"}] ${body.title}\n${body.message}`,
              context: body.metadata ?? {},
            }),
          });
        } catch (_) { /* swallow */ }

        return j({ ok: true, result: { notification_id: data.id, persisted: true } });
      }
      case "notify_stakeholder": {
        // 1. Persist to admin inbox (same pattern as notify_admin) so admins
        //    always have an audit trail even if all downstream channels fail.
        const headline = body.title || `[${body.audience_type}] ${body.event_topic}`;
        const { data: inboxRow, error: inboxErr } = await admin
          .from("admin_notifications")
          .insert({
            type: `stakeholder_${body.event_topic}`,
            title: headline,
            message: body.message,
            link: body.link ?? null,
            metadata: {
              ...(body.metadata ?? {}),
              audience_type: body.audience_type,
              event_topic: body.event_topic,
              agent_key: body.agent_key ?? null,
              source_user_id: uid,
            },
          })
          .select("id")
          .single();
        if (inboxErr) return j({ ok: false, error: inboxErr.message }, 400);

        // 2. Forward to the smart router (fire-and-wait so the agent gets a
        //    real dispatch report it can speak back to the user).
        let routerResult: any = null;
        try {
          const r = await fetch(`${SUPABASE_URL}/functions/v1/notify-stakeholder`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
              apikey: ANON_KEY,
            },
            body: JSON.stringify({
              agent_key: body.agent_key ?? null,
              audience_type: body.audience_type,
              event_topic: body.event_topic,
              title: headline,
              message: body.message,
              metadata: body.metadata ?? {},
            }),
          });
          const text = await r.text();
          try { routerResult = JSON.parse(text); } catch { routerResult = { raw: text }; }
          if (!r.ok) {
            return j({
              ok: false,
              error: `router_${r.status}`,
              result: { notification_id: inboxRow.id, router: routerResult },
            }, 400);
          }
        } catch (e) {
          console.error("[admin-agent-tools] notify-stakeholder fault:", e);
        }

        return j({
          ok: true,
          result: {
            notification_id: inboxRow.id,
            persisted: true,
            router: routerResult,
          },
        });
      }
      default:
        return j({ ok: false, error: `unknown_admin_tool:${dispatch}` }, 400);
    }
  } catch (e: any) {
    console.error("[admin-agent-tools] fault:", e);
    return j({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});

function inferTool(body: any): string | null {
  if (body == null || typeof body !== "object") return null;
  if ("request_id" in body && body.action === "reject") return "reject_payout";
  if ("request_id" in body && (body.action === "approve" || !("action" in body))) {
    return body._reject ? "reject_payout" : "approve_payout";
  }
  if ("talent_id" in body && "amount" in body) return "award_credits";
  if ("gig_id" in body) return "force_run_matchmaker";
  if (Object.keys(body).length === 0) return "archive_expired_jobs";
  return null;
}

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
