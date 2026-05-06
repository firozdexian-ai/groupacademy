// Lightweight in-app notification for review assignment lifecycle events.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { reviewer_id, assignment_id, kind } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    await admin.from("notifications").insert({
      user_id: reviewer_id,
      type: `review_${kind}`,
      title: "Review assignment",
      body: "You have a new review item.",
      data: { assignment_id, kind },
    }).throwOnError().catch(() => {});
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
