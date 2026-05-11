// Public bootstrap endpoint for the auth/landing chat widget.
// Resolves the visitor's country (via Cloudflare/edge headers, defaults to
// Bangladesh) and lazily provisions a `mkt-seo-01` workforce instance for
// that country. Returns { country, instance_id, agent_name } so the client
// can wire its conversation to the correct WaaS instance.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_KEY = "mkt-seo-01";

const ISO_TO_NAME: Record<string, string> = {
  BD: "Bangladesh", IN: "India", PK: "Pakistan", LK: "Sri Lanka", NP: "Nepal",
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  AE: "United Arab Emirates", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait",
  MY: "Malaysia", SG: "Singapore", DE: "Germany", FR: "France", IT: "Italy",
  ES: "Spain", NL: "Netherlands", JP: "Japan", KR: "South Korea", CN: "China",
  ID: "Indonesia", PH: "Philippines", TH: "Thailand", VN: "Vietnam",
  TR: "Turkey", EG: "Egypt", NG: "Nigeria", KE: "Kenya", ZA: "South Africa",
  BR: "Brazil", MX: "Mexico", AR: "Argentina",
};

function resolveCountry(req: Request, hint?: string): string {
  if (hint && hint.trim().length > 1) return hint.trim();
  const iso =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country-code") ||
    "";
  const upper = iso.toUpperCase();
  if (upper && ISO_TO_NAME[upper]) return ISO_TO_NAME[upper];
  return "Bangladesh";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPA_URL, SERVICE_KEY);

    let body: { country_hint?: string } = {};
    try { body = await req.json(); } catch { /* GET-style call */ }

    const country = resolveCountry(req, body?.country_hint);

    // Lookup the master template for the country-specific marketing agent.
    const { data: template, error: tplErr } = await admin
      .from("workforce_master_templates")
      .select("id, name, agent_key, is_active")
      .eq("agent_key", TEMPLATE_KEY)
      .maybeSingle();

    if (tplErr || !template) {
      throw new Error(`TEMPLATE_NOT_FOUND:${TEMPLATE_KEY}`);
    }

    // Find an existing instance for this country.
    let { data: existing } = await admin
      .from("workforce_hired_instances")
      .select("id, name_override, status")
      .eq("template_id", template.id)
      .eq("cluster_geo_id", country)
      .maybeSingle();

    // Auto-provision if missing. Platform-owned instance: tenant_id = template_id (self-reference sentinel).
    if (!existing) {
      const { data: created, error: insErr } = await admin
        .from("workforce_hired_instances")
        .insert({
          template_id: template.id,
          tenant_id: template.id,
          cluster_geo_id: country,
          name_override: `${country} Marketing & SEO Agent`,
          status: "active",
        })
        .select("id, name_override, status")
        .single();
      if (insErr) throw new Error(`PROVISION_FAILED:${insErr.message}`);
      existing = created;
    }

    return new Response(
      JSON.stringify({
        country,
        instance_id: existing.id,
        agent_name: existing.name_override || template.name,
        template_key: TEMPLATE_KEY,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[marketing-agent-bootstrap] FAULT:", err.message);
    return new Response(
      JSON.stringify({
        error: err.message ?? "BOOTSTRAP_FAULT",
        // Safe fallback so the UI can still render with default copy.
        country: "Bangladesh",
        instance_id: null,
        agent_name: "Aisha",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
