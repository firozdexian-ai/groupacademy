// 3.3.b — Claim a public handle for the caller's talent profile.
// JWT-required. Validates format and uniqueness, writes to talents.public_handle.

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

const HANDLE_RX = /^[a-z0-9-]{3,40}$/;
const RESERVED = new Set([
  "admin", "api", "app", "auth", "dashboard", "verify", "t", "talents",
  "settings", "public", "support", "help", "about", "terms", "privacy",
  "login", "signup", "signin", "logout", "register", "groupacademy",
  "gro10x", "blog", "jobs", "courses", "learn", "credits", "wallet",
]);

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

    const body = await req.json().catch(() => ({}));
    const handle = String(body?.handle ?? "").trim().toLowerCase();

    if (!HANDLE_RX.test(handle)) {
      return json(400, { error: "invalid_format", message: "Use 3-40 chars: a-z, 0-9, hyphen." });
    }
    if (RESERVED.has(handle)) {
      return json(400, { error: "reserved", message: "That handle is reserved." });
    }

    const { data: talent } = await sbAdmin
      .from("talents")
      .select("id, public_handle")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!talent) return json(404, { error: "no_talent" });
    if (talent.public_handle === handle) return json(200, { handle });

    const { data: clash } = await sbAdmin
      .from("talents")
      .select("id")
      .eq("public_handle", handle)
      .neq("id", talent.id)
      .maybeSingle();
    if (clash) return json(409, { error: "taken", message: "Handle already in use." });

    const { error: upErr } = await sbAdmin
      .from("talents")
      .update({ public_handle: handle })
      .eq("id", talent.id);
    if (upErr) return json(500, { error: upErr.message });

    return json(200, { handle });
  } catch (e) {
    console.error(e);
    return json(500, { error: String(e) });
  }
});
