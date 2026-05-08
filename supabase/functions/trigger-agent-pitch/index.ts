// trigger-agent-pitch — AI-generated WhatsApp outreach from a Gro10x employer to an unlocked talent.
// Requires: caller must be a member of company_id, AND company must have a row in talent_contact_unlocks for talent_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");

const AISHA_SYSTEM_PROMPT = `You are Aisha, the friendly AI talent concierge at Gro10x.
Write ONE short WhatsApp message (<=400 characters, 2-4 sentences).
The company will be named in your brief; you must speak AS Aisha, not as the company.
Be warm, excited, and specific. Reference 1 concrete skill from the talent.
No emojis-spam, no markdown, no links. Sign off as Aisha — Gro10x Talent Concierge.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const token = auth.slice(7);

    const userClient = createClient(SUPA_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser(token);
    const userId = u?.user?.id;
    if (!userId) return json({ error: "unauthorized" }, 401);

    const { company_id, talent_id } = await req.json().catch(() => ({}));
    if (!company_id || !talent_id) return json({ error: "company_id and talent_id required" }, 400);

    const admin = createClient(SUPA_URL, SERVICE);

    // Membership check
    const { data: member } = await admin
      .from("company_members")
      .select("id")
      .eq("company_id", company_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return json({ error: "not a member of this company" }, 403);

    // Unlock check
    const { data: unlock } = await admin
      .from("talent_contact_unlocks")
      .select("id, email, phone")
      .eq("company_id", company_id)
      .eq("talent_id", talent_id)
      .maybeSingle();
    if (!unlock) return json({ error: "talent not unlocked by this company" }, 403);

    // Load context
    const [{ data: company }, { data: talent }] = await Promise.all([
      admin.from("companies").select("name, about, industry, country, tagline").eq("id", company_id).maybeSingle(),
      admin.from("talents").select("full_name, skills, custom_profession, country, phone").eq("id", talent_id).maybeSingle(),
    ]);
    if (!company || !talent) return json({ error: "company or talent missing" }, 404);

    const phone = (talent.phone ?? unlock.phone ?? "").replace(/\D/g, "");
    if (!phone || phone.length < 7) return json({ error: "talent has no usable phone" }, 422);

    // Pull Aisha persona prompt (talent-outreach)
    const { data: agent } = await admin
      .from("ai_agents")
      .select("system_prompt, model")
      .eq("agent_key", "talent-outreach")
      .maybeSingle();
    const systemPrompt = agent?.system_prompt
      ? `${agent.system_prompt}\n\n${AISHA_SYSTEM_PROMPT}`
      : AISHA_SYSTEM_PROMPT;

    const userBrief = [
      `COMPANY: ${company.name}${company.industry ? ` (${company.industry})` : ""}${company.country ? ` · ${company.country}` : ""}`,
      company.tagline ? `Tagline: ${company.tagline}` : "",
      company.about ? `About: ${String(company.about).slice(0, 600)}` : "",
      "",
      `TALENT: ${talent.full_name}${talent.custom_profession ? ` — ${talent.custom_profession}` : ""}${talent.country ? ` · ${talent.country}` : ""}`,
      `Skills: ${Array.isArray(talent.skills) ? talent.skills.slice(0, 8).join(", ") : ""}`,
      "",
      "Write the WhatsApp message now. Output ONLY the message text.",
    ].filter(Boolean).join("\n");

    // Generate
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agent?.model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userBrief },
        ],
      }),
    });
    if (aiRes.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("ai_gateway_error", aiRes.status, t);
      return json({ error: "AI generation failed" }, 502);
    }
    const aiData = await aiRes.json();
    const message = String(aiData.choices?.[0]?.message?.content ?? "").trim();
    if (!message) return json({ error: "AI returned empty message" }, 502);

    // Pick a connected WhatsApp Unipile channel to dispatch from
    let dispatched = false;
    let dispatchError: string | null = null;
    let externalMessageId: string | null = null;
    let externalChatId: string | null = null;

    if (UNIPILE_DSN && UNIPILE_API_KEY) {
      const { data: channel } = await admin
        .from("messaging_channels")
        .select("id, unipile_account_id, provider, status, agent_key")
        .eq("provider", "whatsapp")
        .eq("status", "connected")
        .eq("agent_key", "talent-outreach")
        .not("unipile_account_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!channel) {
        dispatchError = "no_connected_aisha_whatsapp_channel";
      } else {
        const dsnBase = UNIPILE_DSN.startsWith("http") ? UNIPILE_DSN : `https://${UNIPILE_DSN}`;
        const r = await fetch(`${dsnBase}/api/v1/chats`, {
          method: "POST",
          headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ account_id: channel.unipile_account_id, attendees_ids: [phone], text: message }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          dispatchError = (data?.title || data?.message || JSON.stringify(data)).toString().slice(0, 400);
        } else {
          dispatched = true;
          externalMessageId = data?.message_id ?? data?.id ?? null;
          externalChatId = data?.chat_id ?? data?.thread_id ?? data?.chat?.id ?? null;
        }
      }
    } else {
      dispatchError = "unipile_not_configured";
    }

    // Audit log
    await admin.from("agent_pitch_log").insert({
      company_id,
      talent_id,
      sent_by: userId,
      message,
      phone,
      dispatched,
      dispatch_error: dispatchError,
      external_message_id: externalMessageId,
      external_chat_id: externalChatId,
    });

    return json({
      ok: true,
      dispatched,
      message,
      phone,
      dispatch_error: dispatchError,
    });
  } catch (e) {
    console.error("trigger-agent-pitch", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
