// Notify outcome of a verification (in-app + best-effort email).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { verification_id } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: ver } = await admin.from("gig_verifications").select("*, talents:talent_id(user_id)").eq("id", verification_id).maybeSingle();
    if (!ver) throw new Error("verification missing");

    const userId = (ver as any).talents?.user_id;
    if (!userId) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

    const titles: Record<string, string> = {
      auto_approved: "Submission approved ✓",
      auto_revise: "Revision requested",
      escalated: "Submission under review",
      human_approved: "Submission approved (admin)",
      human_rejected: "Submission rejected",
    };

    await admin.from("notifications").insert({
      user_id: userId,
      type: "gig_verification",
      title: titles[ver.verdict] ?? "Verification update",
      message: ver.rationale?.slice(0, 240) ?? "",
      metadata: { verification_id, verdict: ver.verdict, score: ver.score, gig_kind: ver.gig_kind },
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("notify-verification-outcome", err);
    return new Response(JSON.stringify({ error: err?.message }), { status: 500, headers: corsHeaders });
  }
});
