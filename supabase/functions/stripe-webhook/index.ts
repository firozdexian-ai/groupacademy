import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function getWebhookSecret(adminClient: any): Promise<string | null> {
  // Try env var first
  const envSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (envSecret) return envSecret;

  // Fallback: read from platform_settings
  const { data } = await adminClient
    .from("platform_settings")
    .select("value")
    .eq("key", "stripe_webhook_secret")
    .single();

  return data?.value || null;
}

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",").reduce((acc: Record<string, string>, part) => {
    const [key, val] = part.split("=");
    acc[key.trim()] = val;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Check timestamp tolerance (5 min)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (Math.abs(age) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const webhookSecret = await getWebhookSecret(supabase);
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    if (!sigHeader) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
    if (!valid) {
      console.error("Invalid Stripe signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type !== "checkout.session.completed") {
      // Acknowledge other events
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object;
    const talentId = session.metadata?.talent_id;
    const credits = parseInt(session.metadata?.credits || "0");

    if (!talentId || credits <= 0) {
      console.error("Missing metadata in checkout session:", session.id);
      return new Response("Missing metadata", { status: 400 });
    }

    // Get current balance
    const { data: creditRecord } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talentId)
      .single();

    const currentBalance = creditRecord?.balance || 0;
    const newBalance = currentBalance + credits;

    // Update balance
    if (creditRecord) {
      await supabase
        .from("talent_credits")
        .update({ balance: newBalance })
        .eq("talent_id", talentId);
    } else {
      await supabase
        .from("talent_credits")
        .insert({ talent_id: talentId, balance: newBalance });
    }

    // Record fulfilled transaction
    await supabase.from("credit_transactions").insert({
      talent_id: talentId,
      amount: credits,
      balance_after: newBalance,
      transaction_type: "stripe_purchase",
      service_type: "credit_purchase",
      description: `Purchased ${credits} credits via Stripe (${session.id})`,
    });

    // Send notification
    await supabase.from("notifications").insert({
      talent_id: talentId,
      type: "reward",
      title: `${credits} credits added! 💳`,
      message: `Your purchase of ${credits} credits has been confirmed. New balance: ${newBalance} credits.`,
      icon: "coins",
      link: "/app/profile",
    });

    console.log(`Fulfilled ${credits} credits for talent ${talentId}, new balance: ${newBalance}`);

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response("Webhook handler error", { status: 500 });
  }
});
