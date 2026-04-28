import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * GroUp Academy: Institutional Authentication Guard
 * CTO Reference: Privileged Edge Function for administrative password management.
 * Security: Implements RBAC verification and cryptographic temp-password generation.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // PHASE: CORS_Preflight_Handshake
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "AUTH_HEADER_MISSING" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HUD: Institutional Secret Ingress
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client: Identity Verification (User JWT)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client: Privileged Execution (Service Role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // PHASE: Identity_Audit
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "UNAUTHORIZED_ACCESS" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PHASE: RBAC_Verification
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(JSON.stringify({ error: "ADMIN_PRIVILEGES_REQUIRED" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PHASE: Request_Telemetry_Parsing
    const { targetUserId, targetEmail, method } = await req.json();

    if (!targetUserId || !targetEmail) {
      return new Response(JSON.stringify({ error: "TARGET_METADATA_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Sentinel] Admin ${user.email} initiating ${method} reset for ${targetEmail}`);

    if (method === "email") {
      // ACTION: Generate recovery link artifact
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`,
        },
      });

      if (linkError) throw linkError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Institutional recovery link generated.",
          resetLink: linkData.properties?.action_link,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else if (method === "temporary") {
      // ACTION: Synchronize cryptographic temporary credential
      const tempPassword = generateTempPassword();

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: tempPassword,
      });

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Temporary credential synchronized.",
          temporaryPassword: tempPassword,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "INVALID_METHOD" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Sentinel] AUTH_GUARD_FAULT:", error);
    return new Response(JSON.stringify({ error: error.message || "INTERNAL_AUTH_FAULT" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * HUD: Cryptographic Entropy Generator
 * Ensures institutional complexity: 12 chars, mixed case, numbers, and symbols.
 */
function generateTempPassword(): string {
  const length = 12;
  const charset = {
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
    lower: "abcdefghjkmnpqrstuvwxyz",
    num: "23456789",
    spec: "!@#$%",
  };
  const all = Object.values(charset).join("");

  let password =
    charset.upper[Math.floor(Math.random() * charset.upper.length)] +
    charset.lower[Math.floor(Math.random() * charset.lower.length)] +
    charset.num[Math.floor(Math.random() * charset.num.length)] +
    charset.spec[Math.floor(Math.random() * charset.spec.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
