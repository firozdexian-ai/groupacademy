import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user's JWT to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for password reset operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Request from user:", user.id, user.email);

    // Check if requesting user is an admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminRole) {
      console.log("Non-admin attempted password reset:", user.email);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetUserId, targetEmail, method } = await req.json();

    if (!targetUserId || !targetEmail) {
      return new Response(
        JSON.stringify({ error: "Target user ID and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.email} resetting password for ${targetEmail} using method: ${method}`);

    if (method === "email") {
      // Generate password reset link and send via email
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`,
        },
      });

      if (linkError) {
        console.error("Link generation error:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to generate reset link: " + linkError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Note: The generateLink function generates a link but may not send the email automatically
      // depending on your Supabase configuration. The link is returned for admin to share if needed.
      console.log("Reset link generated for:", targetEmail);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password reset link generated",
          // Only include link if email sending might not work
          resetLink: linkData.properties?.action_link,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (method === "temporary") {
      // Generate a temporary password
      const tempPassword = generateTempPassword();

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { password: tempPassword }
      );

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to set temporary password: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Temporary password set for:", targetEmail);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Temporary password set",
          temporaryPassword: tempPassword,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid method. Use 'email' or 'temporary'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateTempPassword(): string {
  const length = 12;
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%";
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}
