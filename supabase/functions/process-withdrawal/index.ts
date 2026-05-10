// Secure Financial Executor: Handles state transitions and ledger refunds for withdrawals
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verify caller identity and role
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id);

    const hasAdmin = roles?.some((r) => r.role === "admin" || r.role === "super_admin");
    if (!hasAdmin) throw new Error("Forbidden: Admin access required");

    // 2. Parse request
    const { withdrawal_id, action, admin_notes } = await req.json();
    if (!withdrawal_id || !action) throw new Error("Missing required fields");

    if (!["approved", "paid", "rejected"].includes(action)) {
      throw new Error("Invalid action");
    }

    // 3. Fetch withdrawal record in escrow
    const { data: request, error: fetchError } = await adminClient
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (fetchError || !request) throw new Error("Withdrawal request not found");

    // Prevent state machine violations
    if (request.status === "paid" || request.status === "rejected") {
      throw new Error(`Cannot process a request that is already ${request.status}`);
    }
    if (action === "paid" && request.status !== "approved") {
      throw new Error("Request must be approved before it can be marked as paid");
    }

    // 4. Handle Ledger Math for Rejections (Refund)
    if (action === "rejected") {
      // Refund credits via RPC, fallback to direct ledger insert if signature mismatch
      const { error: refundError } = await adminClient.rpc("add_credits", {
        p_talent_id: request.talent_id,
        p_amount: request.amount_credits,
        p_type: "refund",
        p_reference: `Refund for rejected withdrawal ${withdrawal_id}`,
      });

      if (refundError) {
        console.warn("RPC failed, falling back to direct ledger insert", refundError);
        const { error: insertError } = await adminClient.from("credit_transactions").insert({
          talent_id: request.talent_id,
          amount: request.amount_credits, // positive amount to refund
          type: "refund",
          status: "completed",
          description: `Refund for rejected withdrawal: ${admin_notes || "No reason provided"}`,
        });
        if (insertError) throw new Error("Failed to process refund ledger entry");
      }
    }

    // 5. Update the withdrawal request status
    const { error: updateError } = await adminClient
      .from("withdrawal_requests")
      .update({
        status: action,
        admin_notes: admin_notes || request.admin_notes,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id);

    if (updateError) throw new Error("Failed to update withdrawal status");

    return new Response(JSON.stringify({ ok: true, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Executor Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
