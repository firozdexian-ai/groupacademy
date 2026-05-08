// Unlocks a talent's contact for the active company wallet.
// POST { company_id, talent_id } -> { ok, contact, credits_spent, reused }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ ok: false, error: "missing_auth" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });

    const { data: userData, error: userErr } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (userErr || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);

    const body = await req.json().catch(() => ({}));
    const company_id = body?.company_id;
    const talent_id = body?.talent_id;
    if (!company_id || !talent_id) return json({ ok: false, error: "company_id_and_talent_id_required" }, 400);

    const { data, error } = await sb.rpc("unlock_talent_contact", {
      p_company_id: company_id,
      p_talent_id: talent_id,
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    return json(data, 200);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
