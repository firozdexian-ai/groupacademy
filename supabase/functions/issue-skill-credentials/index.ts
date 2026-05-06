// 3.2.b — Issue skill credentials
// Walks the caller's talent_skill_profile and mints/upgrades credentials
// via public.issue_skill_credential(). Idempotent — safe to call after
// every quiz submit or scenario evaluation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "missing_auth" });
    const token = authHeader.replace("Bearer ", "");

    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await sbUser.auth.getUser(token);
    if (userErr || !userData?.user) return json(401, { error: "invalid_auth" });

    const { data: talent } = await sbAdmin
      .from("talents")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!talent) return json(200, { newly_issued: [], message: "no_talent" });

    // Pull all qualifying profile rows (mastery >= 0.70 AND attempts >= 4)
    const { data: profiles, error: profErr } = await sbAdmin
      .from("talent_skill_profile")
      .select("module_id, topic_tag, mastery, attempts")
      .eq("talent_id", talent.id)
      .gte("mastery", 0.7)
      .gte("attempts", 4);

    if (profErr) return json(500, { error: profErr.message });

    const newly_issued: any[] = [];
    const existing_codes = new Set<string>();

    // snapshot existing credentials so we can detect "newly issued"
    const { data: pre } = await sbAdmin
      .from("skill_credentials")
      .select("verify_code")
      .eq("talent_id", talent.id);
    pre?.forEach((c) => existing_codes.add(c.verify_code));

    for (const p of profiles ?? []) {
      const { data: cred, error } = await sbAdmin.rpc("issue_skill_credential", {
        _talent_id: talent.id,
        _module_id: p.module_id,
        _topic_tag: p.topic_tag,
      });
      if (error) {
        console.error("issue_skill_credential error", error);
        continue;
      }
      if (cred && !existing_codes.has((cred as any).verify_code)) {
        newly_issued.push(cred);
      }
    }

    return json(200, { newly_issued, evaluated: profiles?.length ?? 0 });
  } catch (e) {
    console.error(e);
    return json(500, { error: String(e) });
  }
});
