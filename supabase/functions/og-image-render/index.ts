// Renders a 1200×630 SVG OG image for a public project, uploads to discovery-og bucket.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function escape(s: string) { return s.replace(/[<>&"']/g, c => ({ "<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;","'":"&#39;" }[c]!)); }

function svg(opts: { title: string; subtitle: string; brand: string; category?: string; budget?: string }) {
  const t = escape((opts.title ?? "").slice(0, 80));
  const s = escape((opts.subtitle ?? "").slice(0, 120));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2A7DDE"/><stop offset="1" stop-color="#33E1E4"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="#0F172A" opacity="0.92"/>
  <text x="100" y="160" font-family="Inter, sans-serif" font-size="28" fill="#33E1E4">${escape(opts.brand)}</text>
  <text x="100" y="280" font-family="Inter, sans-serif" font-size="56" font-weight="700" fill="#fff">${t}</text>
  <text x="100" y="360" font-family="Inter, sans-serif" font-size="24" fill="#cbd5e1">${s}</text>
  <text x="100" y="500" font-family="Inter, sans-serif" font-size="22" fill="#10D576">${escape(opts.category ?? "")}  ${escape(opts.budget ?? "")}</text>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { project_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: p } = await admin.from("gig_projects")
      .select("title, summary, category, budget_credits, currency_display, company_id").eq("id", project_id).maybeSingle();
    if (!p) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: corsHeaders });
    const { data: c } = await admin.from("companies").select("name").eq("id", p.company_id).maybeSingle();

    const body = svg({
      title: p.title,
      subtitle: p.summary ?? "",
      brand: c?.name ?? "Gro10x",
      category: p.category ?? undefined,
      budget: p.budget_credits ? `${p.budget_credits} ${p.currency_display}` : undefined,
    });
    const path = `projects/${project_id}.svg`;
    const { error: upErr } = await admin.storage.from("discovery-og").upload(path, new Blob([body], { type: "image/svg+xml" }), { upsert: true, contentType: "image/svg+xml" });
    if (upErr) throw upErr;
    const { data: pub } = admin.storage.from("discovery-og").getPublicUrl(path);
    await admin.from("project_public_settings").update({ og_image_url: pub.publicUrl }).eq("project_id", project_id);
    return new Response(JSON.stringify({ url: pub.publicUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
