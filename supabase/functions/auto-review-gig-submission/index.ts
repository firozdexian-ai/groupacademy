// Autonomous gig submission reviewer.
// Invoked by the client immediately after a gig_submissions insert.
// Decides approve / reject / escalate and credits via auto_finalize_gig_submission.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface FinalizeArgs {
  decision: "approved" | "rejected" | "escalated";
  score?: number;
  feedback?: string;
  credit_amount?: number;
}

async function aiQualityScore(payload: { title?: string; body?: string; category: string }) {
  if (!LOVABLE_API_KEY) return null;
  const sys =
    "You score user-generated platform contributions for quality on a 0-10 scale. " +
    "Reject spam, low-effort, or off-topic content. Reward genuine, useful, well-written posts. " +
    "Reply ONLY by calling the score_submission tool.";
  const user = `Category: ${payload.category}\nTitle: ${payload.title || "(none)"}\nBody:\n${(payload.body || "").slice(0, 4000)}`;
  const body = {
    model: "google/gemini-3-flash-preview",
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    tools: [{
      type: "function",
      function: {
        name: "score_submission",
        description: "Return a quality score and short feedback.",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", description: "0-10 quality score" },
            feedback: { type: "string", description: "One short sentence shown to the talent" },
            flag: { type: "string", enum: ["ok", "spam", "low_effort", "off_topic"] },
          },
          required: ["score", "feedback", "flag"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "score_submission" } },
  };
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error("AI gateway non-ok", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    return JSON.parse(args) as { score: number; feedback: string; flag: string };
  } catch (e) {
    console.error("AI score error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "submission_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load submission + gig + ownership check
    const { data: sub, error: sErr } = await admin
      .from("gig_submissions")
      .select("id, talent_id, status, submission_data, gig_id")
      .eq("id", submission_id)
      .maybeSingle();
    if (sErr || !sub) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (sub.status !== "pending") {
      return new Response(JSON.stringify({ ok: true, skipped: "already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller owns this submission
    const { data: talentRow } = await admin
      .from("talents").select("id").eq("user_id", userData.user.id).eq("id", sub.talent_id).maybeSingle();
    if (!talentRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: gig } = await admin
      .from("gigs")
      .select("id, title, category, credit_reward, auto_approval_mode, auto_approval_config")
      .eq("id", sub.gig_id).maybeSingle();
    if (!gig) {
      return new Response(JSON.stringify({ error: "gig missing" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-farm rate limit: 5 auto-approvals per category per hour per talent
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await admin
      .from("gig_submissions")
      .select("id, gigs!inner(category)", { count: "exact", head: true })
      .eq("talent_id", sub.talent_id)
      .eq("status", "approved")
      .eq("gigs.category", gig.category)
      .gte("processed_at", since);
    if ((recentCount || 0) >= 5) {
      const finalize: FinalizeArgs = {
        decision: "escalated",
        feedback: "Rate limit reached for this category — flagged for human review.",
      };
      await admin.rpc("auto_finalize_gig_submission", {
        p_submission_id: sub.id,
        p_decision: finalize.decision,
        p_feedback: finalize.feedback,
      });
      return new Response(JSON.stringify({ ok: true, decision: "escalated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = gig.auto_approval_mode || "manual";
    const cfg = (gig.auto_approval_config || {}) as Record<string, any>;
    const data = (sub.submission_data || {}) as Record<string, any>;
    let finalize: FinalizeArgs = { decision: "escalated", feedback: "Pending human review." };

    if (mode === "manual") {
      // Leave as pending — admin queue handles it.
      return new Response(JSON.stringify({ ok: true, mode: "manual" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "link_check") {
      // job_sharing & course_resell — verify share / referral activity
      const jobId = data.job_id;
      let clicks = 0;
      if (jobId) {
        const { count } = await admin
          .from("job_share_clicks")
          .select("id", { count: "exact", head: true })
          .eq("talent_id", sub.talent_id).eq("job_id", jobId);
        clicks = count || 0;
      }
      const minClicks = Number(cfg.min_clicks ?? 1);
      if (clicks >= minClicks) {
        finalize = { decision: "approved", score: 10, feedback: `Verified ${clicks} click(s).` };
      } else {
        // Don't reject yet — leave as pending, viral tracking widget will keep counting
        return new Response(JSON.stringify({ ok: true, mode, waiting_for_clicks: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (mode === "ai_score") {
      const title = data.title || data.job_title || data.parsed_job?.title || data.post_title;
      const body = data.body || data.description || data.content || data.notes || JSON.stringify(data).slice(0, 1000);
      const ai = await aiQualityScore({ title, body, category: gig.category });
      if (!ai) {
        finalize = { decision: "escalated", feedback: "Auto-review unavailable — sent for manual review." };
      } else {
        const approveAt = Number(cfg.approve_at ?? 6);
        const rejectUnder = Number(cfg.reject_under ?? 3);
        const floor = Number(cfg.multiplier_floor ?? 0.5);
        const ceil = Number(cfg.multiplier_ceiling ?? 1.25);
        if (ai.flag === "spam" || ai.score < rejectUnder) {
          finalize = { decision: "rejected", score: ai.score, feedback: ai.feedback };
        } else if (ai.score >= approveAt) {
          // Map score 6→1.0, 10→ceil, lower bounded by floor
          const t = Math.min(1, Math.max(0, (ai.score - approveAt) / (10 - approveAt)));
          const mult = Math.max(floor, 1 + (ceil - 1) * t);
          const award = Math.round(gig.credit_reward * mult * 10) / 10;
          finalize = { decision: "approved", score: ai.score, feedback: ai.feedback, credit_amount: award };
        } else {
          finalize = { decision: "escalated", score: ai.score, feedback: ai.feedback };
        }
      }
    }

    const { data: rpcRes, error: rpcErr } = await admin.rpc("auto_finalize_gig_submission", {
      p_submission_id: sub.id,
      p_decision: finalize.decision,
      p_score: finalize.score ?? null,
      p_feedback: finalize.feedback ?? null,
      p_credit_amount: finalize.credit_amount ?? null,
    });
    if (rpcErr) {
      console.error("rpc error", rpcErr);
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, decision: finalize.decision, rpc: rpcRes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-review error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
