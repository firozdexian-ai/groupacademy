// admin-agent-tools — Phase D1 unified handler for the four admin AI tools:
//   approve_payout, reject_payout, force_run_matchmaker, award_credits
//
// Strict RBAC: requires authenticated user with `admin` or `super_admin` role.
// Routed through the central `agent-tool-execute` dispatcher, which forwards
// the original Authorization header so this function still sees the calling
// admin's JWT.

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
  if ("gig_id" in body || Object.keys(body).length === 0) return "force_run_matchmaker";
  return null;
}

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
