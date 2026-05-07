// Action-based Unipile WhatsApp connector for messaging_channels.
// Actions:
//   start_hosted_auth → upsert pending channel + return Unipile hosted-auth URL
//   verify_and_save   → fetch account from Unipile, mark channel active, register webhook
//   delete            → remove account from Unipile + delete row

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unipileBase(dsn: string) {
  const trimmed = dsn.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${trimmed}`;
}

async function unipile(dsn: string, key: string, path: string, init: RequestInit = {}) {
  const resp = await fetch(`${unipileBase(dsn)}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "X-API-KEY": key,
      accept: "application/json",
      "content-type": "application/json",
    },
  });
  const text = await resp.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: resp.ok, status: resp.status, body };
}

function rand(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");
    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      return json({ error: "UNIPILE_API_KEY / UNIPILE_DSN not configured" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) return json({ error: "No authorization header" }, 401);
    const { data: userData, error: authError } = await admin.auth.getUser(authHeader);
    if (authError || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    // Admin role check
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const {
      action = "start_hosted_auth",
      agent_key,
      account_id,
      label,
      region,
      return_to,
      provider = "whatsapp",
    } = body as {
      action?: "start_hosted_auth" | "verify_and_save" | "delete" | "reconcile";
      agent_key?: string;
      account_id?: string;
      label?: string;
      region?: string;
      return_to?: string;
      provider?: string;
    };

    if (!agent_key) return json({ error: "agent_key required" }, 400);

    // ───── delete ─────
    if (action === "delete") {
      const { data: existing } = await admin
        .from("messaging_channels")
        .select("id, unipile_account_id")
        .eq("agent_key", agent_key)
        .maybeSingle();
      if (existing?.unipile_account_id) {
        await unipile(UNIPILE_DSN, UNIPILE_API_KEY, `/api/v1/accounts/${existing.unipile_account_id}`, {
          method: "DELETE",
        }).catch(() => {});
      }
      if (existing?.id) {
        await admin.from("messaging_channels").delete().eq("id", existing.id);
      }
      return json({ ok: true });
    }

    // ───── start_hosted_auth ─────
    if (action === "start_hosted_auth") {
      // Find or create the channel row (UNIQUE on agent_key)
      const { data: existing } = await admin
        .from("messaging_channels")
        .select("id, metadata")
        .eq("agent_key", agent_key)
        .maybeSingle();

      let channelId = existing?.id as string | undefined;
      let webhookSecret: string = (existing?.metadata as any)?.webhook_secret;
      if (!webhookSecret) webhookSecret = rand(16);

      if (!channelId) {
        const { data: ins, error: insErr } = await admin
          .from("messaging_channels")
          .upsert(
            {
              agent_key,
              provider,
              label: label || agent_key,
              region: region || null,
              status: "pending",
              created_by: user.id,
              metadata: { webhook_secret: webhookSecret },
            },
            { onConflict: "agent_key" },
          )
          .select("id")
          .single();
        if (insErr) return json({ error: insErr.message }, 500);
        channelId = ins.id;
      } else {
        await admin
          .from("messaging_channels")
          .update({
            label: label || undefined,
            region: region || undefined,
            status: "pending",
            metadata: { ...(existing?.metadata as any), webhook_secret: webhookSecret },
          })
          .eq("id", channelId);
      }

      const expiresOn = new Date(Date.now() + 30 * 60_000).toISOString();
      const successUrl =
        return_to ||
        `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channelId}&cs=${webhookSecret}&kind=success`;

      const r = await unipile(UNIPILE_DSN, UNIPILE_API_KEY, "/api/v1/hosted/accounts/link", {
        method: "POST",
        body: JSON.stringify({
          type: "create",
          providers: ["WHATSAPP"],
          api_url: unipileBase(UNIPILE_DSN),
          expiresOn,
          success_redirect_url: successUrl,
          failure_redirect_url: successUrl,
          name: `group-${agent_key}`,
        }),
      });
      if (!r.ok) {
        return json(
          { error: r.body?.title || r.body?.message || `Unipile ${r.status}` },
          400,
        );
      }
      return json({ url: r.body?.url, expiresOn, channel_id: channelId });
    }

    // Helper: activate a channel given a confirmed Unipile account_id
    const activateChannel = async (
      channelId: string,
      channelMetadata: any,
      accId: string,
      accountBody: any,
    ) => {
      const phone =
        accountBody?.connection_params?.im?.phone_number ||
        accountBody?.connection_params?.phone_number ||
        accountBody?.params?.phone_number ||
        null;

      let webhookSecret = channelMetadata?.webhook_secret;
      if (!webhookSecret) webhookSecret = rand(16);

      const { error: upErr } = await admin
        .from("messaging_channels")
        .update({
          unipile_account_id: accId,
          phone_e164: phone,
          status: "connected",
          metadata: { ...(channelMetadata ?? {}), webhook_secret: webhookSecret },
        })
        .eq("id", channelId);
      if (upErr) throw new Error(upErr.message);

      const webhookUrl = `${SUPABASE_URL}/functions/v1/unipile-webhook?c=${channelId}&cs=${webhookSecret}`;
      const registerWebhook = async () => {
        try {
          const list = await unipile(UNIPILE_DSN, UNIPILE_API_KEY, "/api/v1/webhooks");
          const items: any[] = Array.isArray(list.body?.items)
            ? list.body.items
            : Array.isArray(list.body)
              ? list.body
              : [];
          const already = items.some(
            (w) =>
              w?.request_url === webhookUrl ||
              (Array.isArray(w?.account_ids) &&
                w.account_ids.includes(accId) &&
                w?.source === "messaging"),
          );
          if (already) return;
          const wh = await unipile(UNIPILE_DSN, UNIPILE_API_KEY, "/api/v1/webhooks", {
            method: "POST",
            body: JSON.stringify({
              request_url: webhookUrl,
              source: "messaging",
              events: ["message_received"],
              account_ids: [accId],
              format: "json",
            }),
          });
          if (!wh.ok) {
            await admin
              .from("messaging_channels")
              .update({
                metadata: {
                  ...(channelMetadata ?? {}),
                  webhook_secret: webhookSecret,
                  last_error: `webhook register: ${wh.status} ${JSON.stringify(wh.body).slice(0, 200)}`,
                },
              })
              .eq("id", channelId);
          }
        } catch (e) {
          await admin
            .from("messaging_channels")
            .update({
              metadata: {
                ...(channelMetadata ?? {}),
                webhook_secret: webhookSecret,
                last_error: `webhook register: ${e instanceof Error ? e.message : String(e)}`.slice(0, 240),
              },
            })
            .eq("id", channelId);
        }
      };
      // @ts-ignore EdgeRuntime is provided by Supabase runtime
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(registerWebhook());
      } else {
        registerWebhook();
      }

      return { phone };
    };

    // ───── verify_and_save ─────
    if (action === "verify_and_save") {
      if (!account_id) return json({ error: "account_id required" }, 400);

      const { data: channel } = await admin
        .from("messaging_channels")
        .select("id, metadata")
        .eq("agent_key", agent_key)
        .maybeSingle();
      if (!channel) return json({ error: "Channel not found. Start hosted auth first." }, 404);

      const acc = await unipile(UNIPILE_DSN, UNIPILE_API_KEY, `/api/v1/accounts/${account_id}`);
      if (!acc.ok) {
        return json({ error: acc.body?.title || acc.body?.message || `Unipile ${acc.status}` }, 400);
      }
      const accProvider = acc.body?.type || acc.body?.provider;
      if (accProvider && String(accProvider).toUpperCase() !== "WHATSAPP") {
        return json({ error: `Account is ${accProvider}, not WHATSAPP` }, 400);
      }

      const { phone } = await activateChannel(channel.id, channel.metadata, account_id, acc.body);
      return json({ ok: true, phone, account_id, channel_id: channel.id });
    }

    // ───── reconcile ─────
    // Look up the WhatsApp account in Unipile by name = "group-<agent_key>" and activate.
    if (action === "reconcile") {
      const { data: channel } = await admin
        .from("messaging_channels")
        .select("id, metadata")
        .eq("agent_key", agent_key)
        .maybeSingle();
      if (!channel) return json({ error: "Channel not found. Start hosted auth first." }, 404);

      const list = await unipile(UNIPILE_DSN, UNIPILE_API_KEY, "/api/v1/accounts?limit=250");
      if (!list.ok) {
        return json({ error: list.body?.title || list.body?.message || `Unipile ${list.status}` }, 400);
      }
      const items: any[] = Array.isArray(list.body?.items)
        ? list.body.items
        : Array.isArray(list.body)
          ? list.body
          : [];
      const wantedName = `group-${agent_key}`;
      const match = items.find(
        (a) =>
          (String(a?.type || a?.provider || "").toUpperCase() === "WHATSAPP") &&
          (a?.name === wantedName || a?.name === agent_key),
      );
      if (!match?.id) {
        return json(
          { error: `No WhatsApp account in Unipile named "${wantedName}". Try Connect WhatsApp again or paste the account ID.` },
          404,
        );
      }
      const { phone } = await activateChannel(channel.id, channel.metadata, match.id, match);
      return json({ ok: true, phone, account_id: match.id, channel_id: channel.id });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("unipile-connect", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
