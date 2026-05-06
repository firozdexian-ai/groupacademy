// notify-review-due
// Inserts a `review_due` notification for the calling learner if they have
// topics whose `due_at <= now()`, deduped to once per UTC day.
// Called on app-open / Learning hub mount (cheap, idempotent).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve talent_id
    const { data: talent } = await admin
      .from("talents")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!talent?.id) {
      return new Response(JSON.stringify({ created: false, reason: "no_talent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count due topics
    const { count: dueCount } = await admin
      .from("talent_skill_profile")
      .select("*", { count: "exact", head: true })
      .eq("talent_id", talent.id)
      .lte("due_at", new Date().toISOString());

    if (!dueCount || dueCount === 0) {
      return new Response(JSON.stringify({ created: false, total_due: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe: skip if a review_due notification already exists today (UTC)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("talent_id", talent.id)
      .eq("type", "review_due")
      .gte("created_at", startOfDay.toISOString())
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return new Response(
        JSON.stringify({ created: false, total_due: dueCount, deduped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: insErr } = await admin.from("notifications").insert({
      talent_id: talent.id,
      type: "review_due",
      title: `${dueCount} topic${dueCount === 1 ? "" : "s"} ready to review`,
      message: "Spend a few minutes to refresh weak topics.",
      icon: "graduation-cap",
      link: "/app/learning/review",
    });
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ created: true, total_due: dueCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
