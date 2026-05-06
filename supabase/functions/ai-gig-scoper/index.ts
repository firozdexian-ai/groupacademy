import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCOPER_SYSTEM = `You are an expert gig scoper for the Gro10x talent marketplace.
Given a raw work request, output a clean, actionable gig scope:
- Choose ONE recommended_kind from: "quick" (micro-action under 1hr, < 50cr), "marketplace" (project-style, 1-30 days), "content" (academy content build).
- Title: short, action-led, under 80 chars.
- Description: 2-4 sentences, plain English.
- Deliverables: 3-7 concrete items.
- acceptance_criteria: 3-6 measurable PASS/FAIL checks an AI verifier can score against.
- required_skills: 1-5 short skill tags (lowercase).
- estimated_credits: integer credits (1cr = 2 BDT). Quick: 5-50, marketplace: 50-5000, content: 50-500.
- suggested_deadline_days: integer.
- rationale: 1-2 sentences explaining the pricing + scope choice.

Return strictly via the propose_gig_scope tool.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const briefId = body.brief_id as string | undefined;
    const rawAsk = (body.raw_ask as string | undefined)?.trim();
    const context = body.context ?? {};
    if (!briefId && !rawAsk) {
      return new Response(JSON.stringify({ error: "brief_id or raw_ask required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve brief
    let brief: any;
    if (briefId) {
      const { data, error } = await supabase.from("gig_briefs").select("*").eq("id", briefId).maybeSingle();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "brief not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      brief = data;
    } else {
      const { data, error } = await supabase.from("gig_briefs").insert({
        posted_by: userId, raw_ask: rawAsk, context, status: "scoping",
      }).select("*").maybeSingle();
      if (error || !data) throw new Error(error?.message ?? "insert failed");
      brief = data;
    }

    // Call Lovable AI Gateway with tool-calling
    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SCOPER_SYSTEM },
          { role: "user", content: `Raw ask: ${brief.raw_ask}\n\nContext: ${JSON.stringify(brief.context ?? {})}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propose_gig_scope",
            description: "Return a structured gig scope.",
            parameters: {
              type: "object",
              properties: {
                recommended_kind: { type: "string", enum: ["quick","marketplace","content"] },
                title: { type: "string" },
                description: { type: "string" },
                deliverables: { type: "array", items: { type: "string" } },
                acceptance_criteria: { type: "array", items: { type: "string" } },
                required_skills: { type: "array", items: { type: "string" } },
                estimated_credits: { type: "number" },
                suggested_deadline_days: { type: "integer" },
                rationale: { type: "string" },
              },
              required: ["recommended_kind","title","description","deliverables","acceptance_criteria","estimated_credits","suggested_deadline_days","rationale"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "propose_gig_scope" } },
      }),
    });

    if (!ai.ok) {
      if (ai.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (ai.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await ai.text();
      console.error("AI error", ai.status, t);
      return new Response(JSON.stringify({ error: "ai_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await ai.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("no tool call returned");
    const args = JSON.parse(call.function.arguments);

    // Determine version
    const { count } = await supabase
      .from("gig_scope_drafts").select("id", { count: "exact", head: true }).eq("brief_id", brief.id);
    const version = (count ?? 0) + 1;

    const { data: draft, error: dErr } = await supabase.from("gig_scope_drafts").insert({
      brief_id: brief.id,
      version,
      recommended_kind: args.recommended_kind,
      title: args.title,
      description: args.description,
      deliverables: args.deliverables ?? [],
      acceptance_criteria: args.acceptance_criteria ?? [],
      required_skills: args.required_skills ?? [],
      estimated_credits: args.estimated_credits,
      suggested_deadline_days: args.suggested_deadline_days,
      rationale: args.rationale,
      model_used: "google/gemini-3-flash-preview",
    }).select("*").maybeSingle();
    if (dErr) throw new Error(dErr.message);

    await supabase.from("gig_briefs").update({ status: "scoped" }).eq("id", brief.id);

    return new Response(JSON.stringify({ brief, draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scoper error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
