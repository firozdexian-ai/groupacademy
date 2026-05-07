// /s/:short → records share signal, redirects to canonical URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const kind = url.searchParams.get("kind") ?? "project";
  if (!slug) return new Response("missing slug", { status: 400, headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (kind === "project") {
    const { data } = await admin.from("project_public_settings").select("project_id").eq("slug", slug).maybeSingle();
    if (data?.project_id) {
      await admin.rpc("record_discovery_signal", { _kind: "project", _id: data.project_id, _signal: "share", _weight: 1, _metadata: { source: "share_link" } });
    }
  }
  return Response.redirect(`https://groupacademy.online/${kind}s/${slug}`, 302);
});
