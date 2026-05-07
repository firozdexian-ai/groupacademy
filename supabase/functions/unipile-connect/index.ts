import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Auth & Admin Check
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) throw new Error("No authorization header");
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(authHeader);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { agent_key, label } = body;
    if (!agent_key) throw new Error("agent_key is required");

    // 2. Resolve Channel Row
    // We strictly look for the row we deduped in Phase 2.1
    const { data: channel, error: chErr } = await admin
      .from("messaging_channels")
      .select("id, metadata")
      .eq("agent_key", agent_key)
      .single();

    if (chErr || !channel) throw new Error(`Channel for ${agent_key} not found. Please ensure seed ran.`);

    // 3. Secret Management
    // Ensure we have a valid secret for the webhook handshake
    let webhookSecret = (channel.metadata as any)?.webhook_secret;
    if (!webhookSecret) {
      webhookSecret = crypto.randomUUID().replace(/-/g, "");
      await admin
        .from("messaging_channels")
        .update({
          metadata: { ...(channel.metadata as any), webhook_secret: webhookSecret },
        })
        .eq("id", channel.id);
    }

    // 4. Construct Clean URLs for Unipile
    // We use a clean redirect to avoid Handshake rejection
    const webhookUrl = `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channel.id}&cs=${webhookSecret}`;

    // 5. Unipile Handshake
    const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;

    // We switch to the 'link' type which is more resilient for existing accounts
    const response = await fetch(`${dsnBase}/api/v1/hosted/accounts/link`, {
      method: "POST",
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "create",
        providers: ["WHATSAPP"],
        api_url: dsnBase,
        name: `GroUp-${agent_key}`,
        notify_url: webhookUrl,
        success_redirect_url: webhookUrl + "&kind=success",
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Unipile Rejection:", result);
      throw new Error(`Unipile Handshake Failed: ${result.message || response.statusText}`);
    }

    return new Response(JSON.stringify({ url: result.url, channel_id: channel.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
