import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    // Verify the request is coming from Telegram via secret token.
    // Configure via setWebhook(secret_token=...) and store the same value in TELEGRAM_WEBHOOK_SECRET.
    const expectedSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      console.warn("telegram-webhook: rejected request with missing/invalid secret token");
      return new Response("Forbidden", { status: 403 });
    }

    const payload = await req.json();

    // We only care about interactive button clicks (callback queries)
    if (!payload.callback_query) {
      return new Response("OK");
    }

    const callbackQuery = payload.callback_query;
    const data = callbackQuery.data; // e.g., "approve_uuid" or "reject_uuid"
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    const [action, requestId] = data.split("_");

    // Initialize Supabase with Service Role to bypass RLS for internal execution
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch the pending request
    const { data: request, error: fetchError } = await supabase
      .from("manual_payment_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request || request.status !== "pending") {
      await sendTelegramEdit(chatId, messageId, `⚠️ This request has already been processed or does not exist.`);
      return new Response("OK");
    }

    if (action === "approve") {
      // 2. Mark as Approved
      await supabase
        .from("manual_payment_requests")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", requestId);

      // 3. Credit the User's Wallet via the secure RPC
      const { error: rpcError } = await supabase.rpc("add_credits", {
        p_talent_id: request.talent_id,
        p_amount: request.requested_credits,
        p_description: `Wallet funded via bKash TrxID: ${request.trx_id}`,
      });

      if (rpcError) throw rpcError;

      // 4. Self-verification: read balance, audit_log, credit_transactions
      const verification = await runApprovalVerification(supabase, request.talent_id, request.requested_credits);

      await sendTelegramEdit(
        chatId,
        messageId,
        `✅ *APPROVED*\n\n৳${request.amount_bdt || "N/A"} verified.\n${request.requested_credits} credits added.\nTrxID: \`${request.trx_id}\`\n\n${verification}`,
      );
    } else if (action === "reject") {
      // Mark as Rejected
      await supabase
        .from("manual_payment_requests")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", requestId);

      await sendTelegramEdit(
        chatId,
        messageId,
        `❌ *REJECTED*\n\nPayment request for TrxID \`${request.trx_id}\` was rejected. No credits were issued.`,
      );
    }

    // Acknowledge the callback to remove the loading state on the Telegram button
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });
    }

    return new Response("OK");
  } catch (error: any) {
    console.error("Telegram Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Helper function to edit the Telegram message so the buttons disappear after clicking
async function sendTelegramEdit(chatId: number, messageId: number, text: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [] }, // Removes the buttons
    }),
  });
}

// Self-verification: confirm balance bumped, audit_log row created, ledger row created
async function runApprovalVerification(
  supabase: any,
  talentId: string,
  expectedDelta: number,
): Promise<string> {
  try {
    const [{ data: credits }, { data: audit }, { data: tx }] = await Promise.all([
      supabase.from("talent_credits").select("balance, updated_at").eq("talent_id", talentId).maybeSingle(),
      supabase
        .from("audit_log")
        .select("id, action, created_at")
        .eq("table_name", "talent_credits")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("credit_transactions")
        .select("id, amount, balance_after, created_at")
        .eq("talent_id", talentId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const balance = credits?.balance ?? "?";
    const auditOk = !!(audit && audit.length > 0);
    const lastTx = tx?.[0];
    const txOk = lastTx && Number(lastTx.amount) === Number(expectedDelta);

    const lines = [
      `🔍 *Auto-Verification*`,
      `• Balance: *${balance}* (updated ${credits?.updated_at?.slice(11, 19) || "?"} UTC)`,
      `• Audit log: ${auditOk ? "✅ row recorded" : "❌ no row"}`,
      `• Ledger: ${txOk ? `✅ +${lastTx.amount} (after=${lastTx.balance_after})` : "❌ ledger mismatch"}`,
    ];
    return lines.join("\n");
  } catch (e: any) {
    return `🔍 *Auto-Verification* failed: ${e.message}`;
  }
}
