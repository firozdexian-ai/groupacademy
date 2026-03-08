import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "talent_exec"])
      .limit(1);

    if (!roleCheck?.length) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, stripeSecretKey, stripeWebhookSecret } = await req.json();

    if (action === "check") {
      // Check env vars first, then fall back to DB
      let hasSecretKey = !!Deno.env.get("STRIPE_SECRET_KEY");
      let hasWebhookSecret = !!Deno.env.get("STRIPE_WEBHOOK_SECRET");

      if (!hasSecretKey || !hasWebhookSecret) {
        const { data: dbKeys } = await adminClient
          .from("platform_settings")
          .select("key, value")
          .in("key", ["stripe_secret_key", "stripe_webhook_secret"]);

        const map = new Map(dbKeys?.map((r: any) => [r.key, r.value]) || []);
        if (!hasSecretKey) hasSecretKey = !!map.get("stripe_secret_key");
        if (!hasWebhookSecret) hasWebhookSecret = !!map.get("stripe_webhook_secret");
      }

      return new Response(
        JSON.stringify({ hasSecretKey, hasWebhookSecret }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save-key") {
      if (!stripeSecretKey?.startsWith("sk_")) {
        return new Response(
          JSON.stringify({ error: "Invalid key format. Must start with sk_test_ or sk_live_" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate against Stripe API
      const testRes = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (!testRes.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid Stripe key — could not authenticate with Stripe" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save to platform_settings
      await adminClient
        .from("platform_settings")
        .upsert(
          { key: "stripe_secret_key", value: stripeSecretKey, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      return new Response(
        JSON.stringify({ valid: true, saved: true, message: "Stripe secret key validated and saved." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save-webhook") {
      if (!stripeWebhookSecret?.startsWith("whsec_")) {
        return new Response(
          JSON.stringify({ error: "Invalid format. Webhook secret must start with whsec_" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await adminClient
        .from("platform_settings")
        .upsert(
          { key: "stripe_webhook_secret", value: stripeWebhookSecret, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      return new Response(
        JSON.stringify({ saved: true, message: "Webhook secret saved." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "validate-key") {
      if (!stripeSecretKey?.startsWith("sk_")) {
        return new Response(
          JSON.stringify({ error: "Invalid key format. Must start with sk_test_ or sk_live_" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const testRes = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (!testRes.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid Stripe key — could not authenticate" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("update-stripe-secret error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
