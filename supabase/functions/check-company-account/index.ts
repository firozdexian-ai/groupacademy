/**
 * check-company-account
 * Anon-callable. Given an email, returns:
 *   { exists: boolean, isCompany: boolean }
 * Used by Riya (Gro10x auth chat) to detect returning users so we can
 * pivot from signup → sign-in instead of asking for a name.
 *
 * No PII leaks beyond a boolean. Email enumeration is already possible
 * via auth.signUp errors, so this matches the existing risk surface.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Look up the user by email via the admin API
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;
    const target = list.users.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
    );

    if (!target) {
      return new Response(JSON.stringify({ exists: false, isCompany: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Is this user a member of any company?
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", target.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({ exists: true, isCompany: !!member?.company_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[check-company-account]", err);
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
