/**
 * Phase 4.1 — AI item generation (MCQ / scenario) for instructor authoring.
 * Debits instructor credits per call.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { content_id, prompt, item_type = "mcq", count = 1 } = body ?? {};
    if (!content_id || !prompt) return json({ error: "content_id and prompt required" }, 400);

    // Verify instructor role on this course
    const { data: eng } = await admin
      .from("course_engagements")
      .select("id")
      .eq("user_id", u.user.id)
      .eq("content_id", content_id)
      .eq("status", "active")
      .maybeSingle();
    if (!eng) return json({ error: "Not an active instructor for this course" }, 403);

    const cost = item_type === "scenario" ? 0.5 * count : 0.3 * count;

    // Debit credits BEFORE the AI call
    const { error: dErr } = await admin.rpc("debit_instructor_credit", {
      _user_id: u.user.id,
      _content_id: content_id,
      _amount: cost,
      _reason: `ai_item_generate_${item_type}`,
      _ref_id: null,
    });
    if (dErr) return json({ error: dErr.message }, 402);

    const sysPrompt =
      item_type === "scenario"
        ? "You are a senior instructional designer. Generate a realistic workplace scenario for assessment, with a rubric of 3-5 evaluation criteria. Return JSON: { stem, rubric: [{label, weight, descriptors}] }."
        : "You are an expert assessment author. Generate well-formed multiple-choice items. Return JSON: { items: [{ stem, options: [{text, correct}], explanation, topic }] }.";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: `Course context / topic: ${prompt}\nProduce ${count} ${item_type} item(s).` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      // Refund on AI failure
      await admin.rpc("debit_instructor_credit", {
        _user_id: u.user.id,
        _content_id: content_id,
        _amount: -cost,
        _reason: "ai_item_generate_refund",
        _ref_id: null,
      });
      return json({ error: `AI gateway error: ${aiResp.status}` }, 502);
    }

    const ai = await aiResp.json();
    const text = ai?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

    return json({ ok: true, cost, items: parsed });
  } catch (e: any) {
    return json({ error: e.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
