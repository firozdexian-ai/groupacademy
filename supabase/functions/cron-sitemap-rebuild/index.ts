// Rebuilds public/sitemap-discovery.xml entries (returns XML string; cached in storage).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const base = "https://groupacademy.online";

  const { data: projects } = await admin.from("project_public_settings").select("slug, updated_at").eq("is_public", true).limit(5000);
  const { data: companies } = await admin.from("companies").select("slug, updated_at").not("slug", "is", null).limit(5000);
  const { data: talents } = await admin.from("talents").select("public_handle, updated_at").eq("public_profile_enabled", true).limit(5000);

  const urls: string[] = [
    `${base}/projects`, `${base}/leaderboards/talents`, `${base}/leaderboards/companies`, `${base}/leaderboards/reviewers`,
  ];
  const items: string[] = urls.map(u => `<url><loc>${u}</loc></url>`);
  for (const p of projects ?? []) items.push(`<url><loc>${base}/projects/${p.slug}</loc><lastmod>${(p.updated_at ?? "").slice(0,10)}</lastmod></url>`);
  for (const c of companies ?? []) items.push(`<url><loc>${base}/c/${c.slug}/projects</loc></url>`);
  for (const t of talents ?? []) items.push(`<url><loc>${base}/t/${t.public_handle}</loc></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</urlset>`;
  await admin.storage.from("discovery-og").upload("sitemap-discovery.xml", new Blob([xml], { type: "application/xml" }), { upsert: true, contentType: "application/xml" });
  const { data: pub } = admin.storage.from("discovery-og").getPublicUrl("sitemap-discovery.xml");
  return new Response(JSON.stringify({ ok: true, url: pub.publicUrl, count: items.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
