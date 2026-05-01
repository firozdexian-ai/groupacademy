import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me", "protonmail.com"];

const schema = z.object({
  company_name: z.string().trim().min(2).max(120),
  website: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().min(1).max(80),
  company_size: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(80),
  contact_name: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email().max(160),
  contact_phone: z.string().trim().min(7).max(20),
  use_case: z.string().trim().max(1000).optional().nullable(),
  heard_from: z.string().trim().max(80).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parsed.data;
    const emailDomain = data.contact_email.split("@")[1]?.toLowerCase();
    if (emailDomain && FREE_PROVIDERS.includes(emailDomain)) {
      return new Response(JSON.stringify({ error: "Please use a work email address" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: inserted, error } = await supabase
      .from("company_onboarding_requests")
      .insert({
        company_name: data.company_name,
        website: data.website || null,
        industry: data.industry,
        company_size: data.company_size,
        country: data.country,
        contact_name: data.contact_name,
        contact_email: data.contact_email.toLowerCase(),
        contact_phone: data.contact_phone,
        use_case: data.use_case || null,
        heard_from: data.heard_from || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    // Best-effort confirmation email (don't block on failure)
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "company-onboarding-received",
          recipientEmail: data.contact_email.toLowerCase(),
          idempotencyKey: `company-onboard-${inserted.id}`,
          templateData: { name: data.contact_name, company: data.company_name },
        },
      });
    } catch (e) {
      console.error("Email send failed (non-fatal):", e);
    }

    return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("submit-company-onboarding error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
