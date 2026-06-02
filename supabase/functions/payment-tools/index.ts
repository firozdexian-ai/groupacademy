import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ---- AuthN: require a signed-in user ----
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerUserId = userData.user.id;

    const { talent_id, amount_bdt, requested_credits, trx_id } = await req.json();

    if (!talent_id || !trx_id || !requested_credits) {
      throw new Error("Missing required fields: talent_id, requested_credits, and trx_id are required.");
    }

    // ---- AuthZ: verify caller owns this talent record ----
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: talentRow, error: talentErr } = await admin
      .from("talents")
      .select("id, user_id")
      .eq("id", talent_id)
      .maybeSingle();

    if (talentErr || !talentRow || talentRow.user_id !== callerUserId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Insert request ----
    const { data: request, error: dbError } = await admin
      .from("manual_payment_requests")
      .insert({
        talent_id,
        amount_bdt: amount_bdt || null,
        requested_credits,
        trx_id,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // ---- Notify Telegram ----
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const adminChatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

    if (botToken && adminChatId) {
      const message = `🚨 *New Payment Request*\n\n*Amount:* ৳${amount_bdt || "N/A"}\n*Credits Requested:* ${requested_credits}\n*TrxID:* \`${trx_id}\`\n\nApprove this transaction to fund the user's wallet?`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `approve_${request.id}` },
            { text: "❌ Reject", callback_data: `reject_${request.id}` },
          ],
        ],
      };
      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }),
      });
      if (!tgResponse.ok) console.warn("Telegram transmission failed:", await tgResponse.text());
    } else {
      console.warn("Telegram credentials missing in Edge Secrets. Logged to DB only.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment logged successfully and routed to Admin for verification.",
        request_id: request.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Payment Tool Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
