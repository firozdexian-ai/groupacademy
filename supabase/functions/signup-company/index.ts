// Self-serve company signup: creates auth user, finds-or-creates company,
// links membership, grants 250 welcome credits. No approval needed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FREE_PROVIDERS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "proton.me", "protonmail.com", "live.com", "aol.com", "msn.com",
];

const schema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  company_id: z.string().uuid().optional().nullable(),
  company_name: z.string().trim().min(2).max(120),
  website: z.string().trim().max(200).optional().nullable(),
  industry: z.string().trim().max(80).optional().nullable(),
  company_size: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().min(2).max(80),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const data = parsed.data;
    const email = data.email.toLowerCase();
    const domain = email.split("@")[1];
    if (FREE_PROVIDERS.includes(domain)) {
      return new Response(
        JSON.stringify({ error: "Please use your work email address (no gmail/yahoo/etc)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Create auth user (auto-confirmed so they can sign in immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone,
        account_type: "company",
      },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message || "Could not create account";
      const status = msg.toLowerCase().includes("already") ? 409 : 400;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = created.user.id;

    // 2) Find or create the company (dedups against the 6,076 seeded rows)
    let companyId: string;
    if (data.company_id) {
      // User explicitly picked from the live-search dropdown — enrich + verify
      const { data: existing } = await admin
        .from("companies")
        .select("id")
        .eq("id", data.company_id)
        .maybeSingle();
      if (!existing) {
        return new Response(JSON.stringify({ error: "Selected company not found" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      companyId = existing.id;
      await admin.from("companies").update({
        website: data.website || undefined,
        industry: data.industry || undefined,
        address: data.country,
        is_verified: true,
      }).eq("id", companyId);
    } else {
      const { data: foc, error: focErr } = await admin.rpc("find_or_create_company", {
        p_name: data.company_name,
        p_website: data.website || null,
        p_industry: data.industry || null,
        p_country: data.country || null,
      });
      if (focErr) {
        console.error("find_or_create_company error:", focErr);
        return new Response(JSON.stringify({ error: focErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      companyId = foc as unknown as string;
    }

    // 3) Link the user as owner of the company workspace
    const { error: memberErr } = await admin.from("company_members").insert({
      company_id: companyId,
      user_id: userId,
      role: "owner",
      status: "active",
    });
    if (memberErr) {
      console.error("company_members insert error:", memberErr);
      return new Response(JSON.stringify({ error: "Failed to link membership" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Grant 250 welcome credits (idempotent — only first signup per company)
    const { data: granted } = await admin.rpc("grant_company_welcome_credits", {
      p_company_id: companyId,
      p_amount: 250,
    });

    // 5) Send welcome email (best-effort)
    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "company-welcome",
          recipientEmail: email,
          idempotencyKey: `company-welcome-${userId}`,
          templateData: {
            name: data.full_name,
            company: data.company_name,
            credits: granted ? 250 : 0,
          },
        },
      });
    } catch (e) {
      console.error("welcome email failed (non-fatal):", e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: userId,
        company_id: companyId,
        credits_granted: !!granted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("signup-company error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
