import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secure helper for webhook validation
function randomSecret(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");

    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      throw new Error("Unipile credentials missing in Environment Variables");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. ROBUST AUTH CHECK
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // 2. ROLE CHECK (RPC has_any_admin_role is safer)
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { agent_key, label, provider = "whatsapp" } = body ?? {};

    if (!agent_key) {
      return new Response(JSON.stringify({ error: "agent_key is required" }), { status: 400, headers: corsHeaders });
    }

    // 3. TARGETED UPSERT BY agent_key (UNIQUE constraint guarantees one row per agent)
    // Prefer the row that already has a unipile_account_id, otherwise the most recent.
    const { data: existingChannels } = await admin
      .from("messaging_channels")
      .select("id, label, metadata, unipile_account_id, updated_at, created_at")
      .eq("agent_key", agent_key)
      .order("unipile_account_id", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1);

    const existingChannel = existingChannels?.[0];

    let channelId: string;
    let webhookSecret: string;

    if (existingChannel) {
      channelId = existingChannel.id;
      webhookSecret = (existingChannel.metadata as any)?.webhook_secret || randomSecret();

      const { error: updErr } = await admin
        .from("messaging_channels")
        .update({
          status: "pending",
          label: label || existingChannel.label,
          metadata: { ...(existingChannel.metadata as any), webhook_secret: webhookSecret },
        })
        .eq("id", channelId);
      if (updErr) throw updErr;
    } else {
      // True first-time create. UNIQUE(agent_key) prevents future duplicates.
      webhookSecret = randomSecret();
      const { data: newChannel, error: insErr } = await admin
        .from("messaging_channels")
        .upsert(
          {
            agent_key,
            provider,
            label: label || agent_key,
            status: "pending",
            created_by: user.id,
            metadata: { webhook_secret: webhookSecret },
          },
          { onConflict: "agent_key" },
        )
        .select("id")
        .single();

      if (insErr) throw insErr;
      channelId = newChannel.id;
    }

    // 4. CONSTRUCT WEBHOOK URLS
    const successUrl = `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channelId}&cs=${webhookSecret}&kind=success`;
    const notifyUrl = `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channelId}&cs=${webhookSecret}`;

    // 5. UNIPILE HANDSHAKE
    const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;

    // Using the modern Hosted Accounts Link endpoint
    const linkRes = await fetch(`${dsnBase}/api/v1/hosted/accounts/link`, {
      method: "POST",
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "create",
        providers: ["WHATSAPP"],
        api_url: dsnBase,
        notify_url: notifyUrl,
        name: `GroUp-${agent_key}`,
        success_redirect_url: successUrl,
      }),
    });

    const linkData = await linkRes.json();
    if (!linkRes.ok) throw new Error(linkData.message || "Unipile API Handshake Failed");

    return new Response(JSON.stringify({ url: linkData.url, channel_id: channelId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Connection Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
