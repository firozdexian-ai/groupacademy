import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: request, error: rErr } = await admin.from("company_onboarding_requests").select("*").eq("id", request_id).single();
    if (rErr || !request) throw rErr || new Error("Not found");
    if (request.status === "approved") {
      return new Response(JSON.stringify({ error: "Already approved" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create company
    const { data: company, error: cErr } = await admin
      .from("companies")
      .insert({
        name: request.company_name,
        website: request.website,
        country: request.country,
        industry: request.industry,
      })
      .select("id")
      .single();
    if (cErr) throw cErr;

    // Pre-invite contact as owner (existing trigger auto-links on signup)
    await admin.from("company_members").insert({
      company_id: company.id,
      invite_email: request.contact_email,
      role: "owner",
      user_id: null,
    });

    // Update request
    await admin.from("company_onboarding_requests").update({
      status: "approved",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      approved_company_id: company.id,
    }).eq("id", request_id);

    // Send approval email
    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "company-onboarding-approved",
          recipientEmail: request.contact_email,
          idempotencyKey: `company-approve-${request_id}`,
          templateData: { name: request.contact_name, company: request.company_name },
        },
      });
    } catch (e) { console.error("Email failed:", e); }

    return new Response(JSON.stringify({ ok: true, company_id: company.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("approve error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
