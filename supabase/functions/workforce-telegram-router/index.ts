import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Extract Telegram secret-token header
    const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!secretToken) {
      return new Response(
        JSON.stringify({ error: "Missing X-Telegram-Bot-Api-Secret-Token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase service env vars not configured");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 2. Lookup instance by bot_token (we treat the secret-token header as the
    //    verification token stored in workforce_instance_credentials.bot_token)
    const { data: credential, error: credErr } = await supabase
      .from("workforce_instance_credentials")
      .select("id, instance_id, is_active")
      .eq("channel_provider", "telegram")
      .eq("bot_token", secretToken)
      .maybeSingle();

    if (credErr) {
      console.error("[workforce-telegram-router] credential lookup failed", credErr);
      return new Response(
        JSON.stringify({ error: "Credential lookup failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!credential || credential.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Bot not recognized" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const instanceId = credential.instance_id;

    // 3. Parse Telegram update
    let update: any = null;
    try {
      update = await req.json();
    } catch (_) {
      update = null;
    }

    const message = update?.message ?? update?.edited_message ?? null;
    const chatId = message?.chat?.id ?? null;
    const text = message?.text ?? message?.caption ?? null;
    const fromUserId = message?.from?.id ?? null;
    const updateId = update?.update_id ?? null;

    console.log("[workforce-telegram-router] inbound", {
      instance_id: instanceId,
      update_id: updateId,
      chat_id: chatId,
      from_user_id: fromUserId,
      text_preview: typeof text === "string" ? text.slice(0, 120) : null,
    });

    // 4. Forward to agent-runtime (best-effort, non-blocking on failure so
    //    Telegram still gets a 200 and does not retry).
    if (chatId && text) {
      try {
        const { data: forwardData, error: forwardErr } = await supabase.functions.invoke(
          "agent-runtime",
          {
            body: {
              source: "telegram",
              instance_id: instanceId,
              chat_id: chatId,
              from_user_id: fromUserId,
              update_id: updateId,
              text,
              raw_update: update,
            },
          },
        );
        if (forwardErr) {
          console.error("[workforce-telegram-router] agent-runtime invoke error", forwardErr);
        } else {
          console.log("[workforce-telegram-router] agent-runtime ok", {
            instance_id: instanceId,
            chat_id: chatId,
            response_preview: JSON.stringify(forwardData ?? {}).slice(0, 200),
          });
        }
      } catch (invokeErr) {
        console.error("[workforce-telegram-router] agent-runtime invoke threw", invokeErr);
      }
    }

    // 5. Always 200 to Telegram so it does not retry
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[workforce-telegram-router] fatal", err);
    // Still return 200 so Telegram does not flood retries; log the error.
    return new Response(
      JSON.stringify({ ok: true, handled_error: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
