// notify-discussion-event — fanout for Phase 4.3 social events.
// Kinds: thread_reply | mention | q_answer | q_accepted | review_assigned | review_received | submission_decided | all_reviews_in
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind, recipients, link, title, body, meta, scope, scope_id } = await req.json();
    if (!kind || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "kind+recipients required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const rows = recipients.map((uid: string) => ({
      user_id: uid,
      title: title ?? kind,
      body: body ?? "",
      link: link ?? "/app/my-learning",
      kind: "learning",
      meta: { event: kind, ...(meta ?? {}) },
    }));
    for (let i = 0; i < rows.length; i += 200) {
      await sb.from("notifications").insert(rows.slice(i, i + 200));
    }
    if (scope && scope_id) {
      await sb.from("notification_dispatch").upsert({
        scope, scope_id, kind, payload: meta ?? {},
      }, { onConflict: "scope,scope_id,kind" });
    }
    return new Response(JSON.stringify({ ok: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
