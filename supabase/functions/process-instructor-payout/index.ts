// Phase 4.7 — Admin processes an instructor payout request
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json().catch(() => ({}));
    const { request_id, action, notes, fx_rate } = body ?? {};
    if (!request_id || !["approve","paid","reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "request_id + action required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data, error } = await userClient.rpc("process_instructor_payout", {
      _request_id: request_id, _action: action, _notes: notes ?? null, _fx_rate: fx_rate ?? null,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Notify the instructor
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: req2 } = await service.from("instructor_payout_requests")
      .select("instructor_user_id, amount_credits, payout_method, status")
      .eq("id", request_id).maybeSingle();
    if (req2) {
      const titleMap: Record<string,string> = {
        approved: `Payout approved (${req2.amount_credits} credits)`,
        paid: `Payout paid via ${req2.payout_method}`,
        rejected: `Payout request rejected`,
      };
      await service.from("notification_dispatch").insert({
        user_id: req2.instructor_user_id,
        kind: `instructor.payout_${req2.status}`,
        title: titleMap[req2.status] ?? "Payout updated",
        payload: { request_id, status: req2.status, notes },
      });
    }

    return new Response(JSON.stringify({ ok: true, result: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
