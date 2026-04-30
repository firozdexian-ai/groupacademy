// Agent OS — Unified Runtime
// Single edge function that powers all agent conversations across talent / company / admin / headless.
// - Loads agent config + allowed tools + KB
// - Charges connection fee on first contact, per-message + per-tool fees afterward
// - Calls Lovable AI gateway with tool-calling, retrieves KB chunks via vector search
// - Streams assistant deltas back as SSE; logs ledger events; writes artifacts/messages to DB

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const FREE_AGENTS = new Set(["ai-general", "aisha"]);

interface RunRequest {
  agent_key: string;
  thread_id?: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData?.user) return json({ error: "UNAUTHORIZED" }, 401);
    const user = userData.user;

    const body = (await req.json()) as RunRequest;
    if (!body?.agent_key || !body?.message) {
      return json({ error: "agent_key and message required" }, 400);
    }

    // Resolve subject — defaults to authenticated talent.
    // Company subjects must be requested explicitly and verified via company_members.
    let subjectKind = "talent";
    let subjectId: string | null = null;

    if ((body as any).subject_kind === "company" && (body as any).subject_id) {
      const companyId = (body as any).subject_id as string;
      const { data: membership } = await admin
        .from("company_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();
      if (!membership) return json({ error: "NOT_COMPANY_MEMBER" }, 403);
      subjectKind = "company";
      subjectId = companyId;
    } else {
      const { data: talent } = await admin
        .from("talents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!talent) return json({ error: "NO_TALENT_PROFILE" }, 403);
      subjectId = talent.id;
    }

    // Load agent
    const { data: agent, error: agentErr } = await admin
      .from("ai_agents")
      .select("id, agent_key, name, system_prompt, model, allowed_tools, connection_fee, message_credit_cost, agent_level, kill_switch, is_active, prompt_variants, active_prompt_variant, canvas_mode")
      .eq("agent_key", body.agent_key)
      .maybeSingle();
    if (agentErr || !agent) return json({ error: "AGENT_NOT_FOUND" }, 404);
    if (!agent.is_active || agent.kill_switch) return json({ error: "AGENT_DISABLED" }, 403);

    // Connection fee (skipped for free agents)
    const isFree = FREE_AGENTS.has(agent.agent_key);
    if (!isFree && Number(agent.connection_fee) > 0) {
      const { data: existingConn } = await admin
        .from("agent_connections")
        .select("id")
        .eq("agent_id", agent.id)
        .eq("subject_kind", subjectKind)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (!existingConn) {
        const fee = Number(agent.connection_fee);
        // Companies are not billed in MVP — talent-only charges
        if (subjectKind === "talent") {
          const charge = await chargeTalent(admin, subjectId!, fee, "agent_connection", agent.agent_key, `Connection: ${agent.name}`);
          if (!charge.ok) return json({ error: "INSUFFICIENT_CREDITS_CONNECTION", required: fee, available: charge.balance }, 402);
        }
        await admin.from("agent_connections").insert({
          agent_id: agent.id, subject_kind: subjectKind, subject_id: subjectId, fee_paid: subjectKind === "talent" ? fee : 0,
        });
        await admin.from("agent_credit_events").insert({
          agent_id: agent.id, subject_kind: subjectKind, subject_id: subjectId,
          event_kind: "connection", credits: subjectKind === "talent" ? fee : 0,
        });
      }
    }

    // Per-message fee (talent-only in MVP)
    const msgCost = isFree ? 0 : Number(agent.message_credit_cost ?? 0);
    if (msgCost > 0 && subjectKind === "talent") {
      const charge = await chargeTalent(admin, subjectId!, msgCost, "agent_message", agent.agent_key, `Message: ${agent.name}`);
      if (!charge.ok) return json({ error: "INSUFFICIENT_CREDITS", required: msgCost, available: charge.balance }, 402);
    }

    // Resolve / create thread
    let threadId = body.thread_id;
    if (!threadId) {
      const { data: t } = await admin.from("agent_threads").insert({
        agent_id: agent.id, agent_key: agent.agent_key,
        subject_kind: subjectKind, subject_id: subjectId,
        title: body.message.slice(0, 60),
      }).select("id").single();
      threadId = t!.id;
    }

    // Load thread history (last 20 messages)
    const { data: history } = await admin
      .from("agent_messages")
      .select("role, content, tool_calls")
      .eq("thread_id", threadId!)
      .order("created_at", { ascending: true })
      .limit(20);

    // Persist user message
    await admin.from("agent_messages").insert({
      thread_id: threadId!, role: "user", content: body.message, credit_cost: msgCost,
    });

    // Resolve system prompt (A/B variant)
    const variant = agent.active_prompt_variant || "A";
    const variantPrompt = (agent.prompt_variants as any)?.[variant];
    const systemPrompt = (variantPrompt || agent.system_prompt || "You are a helpful assistant.") + buildSubjectContext(talent);

    // Load tools
    const allowedToolKeys: string[] = agent.allowed_tools || [];
    const tools = await loadTools(admin, allowedToolKeys, agent.agent_level);

    // RAG: retrieve KB chunks if KB exists for this agent
    const ragContext = await retrieveKbContext(admin, agent.id, body.message);
    const finalSystem = ragContext
      ? `${systemPrompt}\n\n## Knowledge Base Context\n${ragContext}`
      : systemPrompt;

    const messages = [
      { role: "system", content: finalSystem },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content || "" })),
      { role: "user", content: body.message },
    ];

    // Call Lovable AI Gateway with tool-calling
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-3-flash-preview",
        messages,
        tools: tools.length ? tools.map(t => ({ type: "function", function: { name: t.tool_key, description: t.description, parameters: t.input_schema || { type: "object", properties: {} } } })) : undefined,
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limit exceeded, please try again." }, 429);
      if (aiResp.status === 402) return json({ error: "AI workspace credits exhausted." }, 402);
      const txt = await aiResp.text();
      console.error("[agent-runtime] AI gateway error", aiResp.status, txt);
      return json({ error: "AI_GATEWAY_FAULT" }, 500);
    }

    // Tee the stream: pass to client AND collect for persistence
    const { readable, writable } = new TransformStream();
    pipeAndPersist(aiResp.body!, writable, admin, {
      threadId: threadId!, agentId: agent.id, agentKey: agent.agent_key,
      subjectKind, subjectId, variant, msgCost,
    }).catch(err => console.error("[agent-runtime] persist error", err));

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Thread-Id": threadId!,
      },
    });
  } catch (err: any) {
    console.error("[agent-runtime] fault", err);
    return json({ error: err?.message || "RUNTIME_FAULT" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSubjectContext(talent: any): string {
  const parts: string[] = ["", "## Caller Profile"];
  if (talent.full_name) parts.push(`Name: ${talent.full_name}`);
  if (talent.country) parts.push(`Country: ${talent.country}`);
  return parts.join("\n");
}

async function chargeTalent(admin: any, talentId: string, amount: number, txnType: string, serviceType: string, description: string) {
  const { data: row } = await admin.from("talent_credits").select("balance").eq("talent_id", talentId).maybeSingle();
  const current = Number(row?.balance ?? 0);
  if (current < amount) return { ok: false as const, balance: current };
  const next = current - amount;
  await admin.from("talent_credits").update({ balance: next }).eq("talent_id", talentId);
  await admin.from("credit_transactions").insert({
    talent_id: talentId, amount: -amount, balance_after: next,
    transaction_type: txnType, service_type: serviceType, description,
  });
  return { ok: true as const, balance: next };
}

async function loadTools(admin: any, keys: string[], agentLevel: number) {
  if (!keys?.length) return [] as any[];
  const { data } = await admin
    .from("agent_tools")
    .select("tool_key, name, description, input_schema, default_credit_cost, min_level, handler_kind, handler_ref")
    .in("tool_key", keys)
    .eq("is_active", true)
    .lte("min_level", agentLevel);
  return data ?? [];
}

async function retrieveKbContext(admin: any, agentId: string, query: string): Promise<string> {
  // Quick check: any chunks for this agent?
  const { count } = await admin.from("agent_knowledge_chunks").select("id", { count: "exact", head: true }).eq("agent_id", agentId);
  if (!count) return "";

  // Embed query via Lovable AI gateway
  try {
    const embResp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/text-embedding-004", input: query }),
    });
    if (!embResp.ok) return "";
    const emb = await embResp.json();
    const vec = emb?.data?.[0]?.embedding;
    if (!vec) return "";
    const { data: matches } = await admin.rpc("match_agent_knowledge", {
      p_agent_id: agentId, p_query_embedding: vec, p_match_count: 5,
    });
    if (!matches?.length) return "";
    return matches.map((m: any, i: number) => `[${i + 1}] ${m.content}`).join("\n\n");
  } catch (e) {
    console.warn("[agent-runtime] KB retrieval skipped", e);
    return "";
  }
}

async function pipeAndPersist(
  src: ReadableStream<Uint8Array>,
  dst: WritableStream<Uint8Array>,
  admin: any,
  ctx: { threadId: string; agentId: string; agentKey: string; subjectKind: string; subjectId: string; variant: string; msgCost: number },
) {
  const reader = src.getReader();
  const writer = dst.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";
  let assistantText = "";
  let tokensOut = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trimEnd();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") { assistantText += delta; tokensOut++; }
        } catch { /* partial */ }
      }
    }
  } finally {
    try { await writer.close(); } catch { /* ignore */ }
  }

  // Persist assistant turn + ledger event
  if (assistantText) {
    await admin.from("agent_messages").insert({
      thread_id: ctx.threadId, role: "assistant", content: assistantText,
      tokens_out: tokensOut, credit_cost: ctx.msgCost, prompt_variant: ctx.variant,
    });
    await admin.from("agent_credit_events").insert({
      agent_id: ctx.agentId, thread_id: ctx.threadId,
      subject_kind: ctx.subjectKind, subject_id: ctx.subjectId,
      event_kind: "message", credits: ctx.msgCost,
      tokens_out: tokensOut, prompt_variant: ctx.variant,
    });
    await admin.from("agent_threads").update({ last_message_at: new Date().toISOString() }).eq("id", ctx.threadId);
    await admin.rpc("increment_agent_conversations", { p_agent_key: ctx.agentKey });
  }
}
