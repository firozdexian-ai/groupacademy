// Per-country Destination Agent: chat + tool-calls (build_roadmap, find_programs)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHAT_COST = 1;
const ROADMAP_COST = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return json({ error: "missing token" }, 401);

    const userClient = createClient(SUPA_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPA_URL, SERVICE_KEY);

    const body = await req.json();
    const countryCode = String(body.country_code || "").toUpperCase();
    const userMessage = String(body.message || "").trim();
    const intent = String(body.intent || "chat"); // "chat" | "roadmap"
    const roadmapPayload = body.roadmap_payload ?? null;

    if (!countryCode) return json({ error: "country_code required" }, 400);

    // Fetch agent
    const { data: agent } = await admin
      .from("destination_agents")
      .select("*")
      .eq("country_code", countryCode)
      .maybeSingle();
    if (!agent) return json({ error: "agent not found" }, 404);

    // Knowledge packs
    const { data: packs } = await admin
      .from("country_knowledge_packs")
      .select("kind,title,body_markdown")
      .eq("country_code", countryCode)
      .eq("is_published", true)
      .limit(20);

    // Programs
    const { data: programs } = await admin
      .from("study_abroad_programs")
      .select("university_name,program_name,degree_type,tuition_range,application_deadline")
      .eq("country_code", countryCode)
      .eq("is_active", true)
      .limit(15);

    // Recent talent context
    const { data: history } = await admin
      .from("destination_agent_messages")
      .select("role,content")
      .eq("user_id", userId)
      .eq("country_code", countryCode)
      .order("created_at", { ascending: true })
      .limit(20);

    // ── ROADMAP TOOL CALL ──
    if (intent === "roadmap" && roadmapPayload) {
      // Persist roadmap row
      const { data: roadmapRow, error: rmErr } = await admin
        .from("study_abroad_roadmaps")
        .insert({
          talent_id: roadmapPayload.talent_id ?? null,
          email: roadmapPayload.email ?? userData.user.email ?? "",
          full_name: roadmapPayload.full_name ?? null,
          target_countries: [countryCode],
          degree_level: roadmapPayload.degree_level ?? "masters",
          field_of_study: roadmapPayload.field_of_study,
          target_intake: roadmapPayload.target_intake,
          budget_level: roadmapPayload.budget_level,
          ielts_score: roadmapPayload.ielts_score,
          has_taken_ielts: !!roadmapPayload.ielts_score,
          gpa: roadmapPayload.gpa,
          years_experience: roadmapPayload.years_experience,
          status: "processing",
        })
        .select("id")
        .single();
      if (rmErr) return json({ error: rmErr.message }, 500);

      const sysPrompt = `${agent.system_prompt}

You are generating a 12-month roadmap. Return STRICT JSON:
{
  "profileSummary": { "strengths": [], "gaps": [], "overallReadiness": "high|medium|low" },
  "recommendedUniversities": [{ "name":"", "program":"", "tier":"reach|target|safety", "tuitionRange":"", "deadline":"", "fitReason":"" }],
  "timeline": [{ "month":1, "title":"", "tasks":[], "deadline":"" }],
  "documents": [{ "name":"", "required":true, "deadline":"", "tips":"" }],
  "budget": { "tuitionRange":"", "livingExpenses":"", "applicationFees":"", "visaCosts":"", "totalEstimate":"" },
  "scholarships": [{ "name":"", "amount":"", "eligibility":"" }]
}

Country knowledge:
${(packs ?? []).map((p) => `[${p.kind}] ${p.title}: ${p.body_markdown.slice(0, 300)}`).join("\n")}

Available programs:
${(programs ?? []).map((p) => `${p.university_name} — ${p.program_name} (${p.tuition_range || "n/a"})`).join("\n")}`;

      const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: JSON.stringify(roadmapPayload) },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!ai.ok) {
        if (ai.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
        if (ai.status === 402) return json({ error: "AI credits exhausted" }, 402);
        return json({ error: `ai_error_${ai.status}` }, 500);
      }
      const aiData = await ai.json();
      let parsed: any = {};
      try {
        parsed = JSON.parse(aiData.choices?.[0]?.message?.content ?? "{}");
      } catch { parsed = { raw: aiData.choices?.[0]?.message?.content }; }

      await admin
        .from("study_abroad_roadmaps")
        .update({ roadmap_result: parsed, status: "completed", completed_at: new Date().toISOString() })
        .eq("id", roadmapRow.id);

      // Log to agent message stream
      await admin.from("destination_agent_messages").insert([
        { user_id: userId, country_code: countryCode, role: "user", content: "Build my roadmap", credits_spent: 0 },
        { user_id: userId, country_code: countryCode, role: "assistant", content: "Your roadmap is ready.", tool_payload: { roadmap_id: roadmapRow.id }, credits_spent: ROADMAP_COST },
      ]);

      return json({ ok: true, roadmap_id: roadmapRow.id, roadmap: parsed, credits_spent: ROADMAP_COST });
    }

    // ── CHAT ──
    if (!userMessage) return json({ error: "message required" }, 400);

    const sysPrompt = `${agent.system_prompt}

You are friendly, accurate, and concise. Use the country knowledge packs below when answering. If the user asks for a roadmap, suggest they tap the "Build my roadmap" button.

Country: ${agent.display_name} (${countryCode}). Default currency: ${agent.default_currency}. Intake terms: ${(agent.intake_terms ?? []).join(", ")}.

Knowledge packs:
${(packs ?? []).map((p) => `[${p.kind}] ${p.title}\n${p.body_markdown.slice(0, 500)}`).join("\n\n")}

Sample programs (${(programs ?? []).length}):
${(programs ?? []).slice(0, 8).map((p) => `- ${p.university_name} — ${p.program_name}`).join("\n")}`;

    const messages = [
      { role: "system", content: sysPrompt },
      ...(history ?? []).map((m: any) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });
    if (!ai.ok) {
      if (ai.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
      if (ai.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: `ai_error_${ai.status}` }, 500);
    }
    const aiData = await ai.json();
    const reply = aiData.choices?.[0]?.message?.content ?? "";

    await admin.from("destination_agent_messages").insert([
      { user_id: userId, country_code: countryCode, role: "user", content: userMessage, credits_spent: 0 },
      { user_id: userId, country_code: countryCode, role: "assistant", content: reply, credits_spent: CHAT_COST },
    ]);

    return json({ message: reply, credits_spent: CHAT_COST });
  } catch (e: any) {
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(b: any, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
