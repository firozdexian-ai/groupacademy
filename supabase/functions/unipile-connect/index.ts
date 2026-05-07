// Unipile hosted-auth link generator (per-channel WhatsApp connect)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function randomSecret(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");
    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      return new Response(JSON.stringify({ error: "Unipile credentials missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { agent_key, label, region, language, provider = "whatsapp" } = body ?? {};
    if (!agent_key || !label) {
      return new Response(JSON.stringify({ error: "agent_key and label required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create or reuse a pending channel row
    const webhookSecret = randomSecret();
    const { data: channel, error: chErr } = await admin.from("messaging_channels").insert({
      agent_key,
      provider,
      label,
      region: region ?? null,
      language: language ?? null,
      status: "pending",
      created_by: userId,
      metadata: { webhook_secret: webhookSecret },
    }).select("id").single();
    if (chErr) throw chErr;

    const successUrl = `${SUPABASE_URL.replace(".supabase.co", ".supabase.co")}/functions/v1/unipile-webhook?c=${channel.id}&cs=${webhookSecret}&kind=success`;
    const notifyUrl = `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channel.id}&cs=${webhookSecret}`;
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;
    const linkRes = await fetch(`${dsnBase}/api/v1/hosted/accounts/link`, {
      method: "POST",
      headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
      body: JSON.stringify({
        type: "create",
        providers: [provider === "whatsapp" ? "WHATSAPP" : "WHATSAPP"],
        api_url: dsnBase,
        expiresOn,
        notify_url: notifyUrl,
        name: channel.id,
        success_redirect_url: successUrl,
      }),
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok) {
      await admin.from("messaging_channels").delete().eq("id", channel.id);
      return new Response(JSON.stringify({ error: "Unipile link failed", details: linkData }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ url: linkData.url, channel_id: channel.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
