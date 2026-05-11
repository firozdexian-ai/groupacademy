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
  agent_key?: string;
  thread_id?: string;
  message?: string;
  context?: Record<string, unknown>;
  // WaaS — Workforce-as-a-Service flow
  instance_id?: string;
  source?: string; // e.g. "telegram"
  chat_id?: string | number;
  from_user_id?: string | number;
  text?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "UNAUTHORIZED" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    const isCronTrigger = req.headers.get("x-cron-trigger") === "true";
    const cronPass = Deno.env.get("CRON_VIP_PASS");
    const isServiceCall = !!cronPass && bearer === cronPass;

    const body = (await req.json()) as RunRequest;

    // ────────────────────────────────────────────────────────────────────
    // WaaS (Workforce-as-a-Service) flow — multi-tenant Hired Instances.
    // Triggered when the caller (typically the workforce-*-router edge
    // function) provides an `instance_id`. We do NOT touch the legacy
    // `ai_agents` table here. Auth is implicit: only trusted service-role
    // callers (other edge functions) can reach this branch in practice
    // because the router validates channel credentials before dispatch.
    // ────────────────────────────────────────────────────────────────────
    if (body?.instance_id) {
      try {
        return await runWorkforceInstance(body, admin);
      } catch (err: any) {
        console.error("[agent-runtime/waas] fault", err);
        return json({ error: err?.message || "WAAS_FAULT" }, 500);
      }
    }

    if (!body?.agent_key || !body?.message) {
      return json({ error: "agent_key and message required" }, 400);
    }

    let subjectKind = "talent";
    let subjectId: string | null = null;
    let talentRow: any = null;
    let isAdmin = false;
    let user: any = null;

    if (isServiceCall) {
      // Server-to-server (cron / system) — trust the payload's subject_id.
      const sid = (body as any).subject_id as string | undefined;
      if (!sid) return json({ error: "subject_id required for service call" }, 400);
      isAdmin = true;
      subjectKind = "admin";
      subjectId = sid;
      user = { id: sid };
    } else {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: authErr } = await userClient.auth.getUser();
      if (authErr || !userData?.user) return json({ error: "UNAUTHORIZED" }, 401);
      user = userData.user;

      const { data: adminFlag } = await admin.rpc("has_any_admin_role", { _user_id: user.id });
      isAdmin = adminFlag === true;

      if (isAdmin && (body as any).subject_kind !== "company") {
        subjectKind = "admin";
        subjectId = user.id;
      } else if ((body as any).subject_kind === "company" && (body as any).subject_id) {
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
        .select("id, full_name, country")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!talent) return json({ error: "NO_TALENT_PROFILE" }, 403);
      subjectId = talent.id;
      talentRow = talent;
    }
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
    const baseSystem = variantPrompt || agent.system_prompt || "You are a helpful assistant.";

    // Build subject context — admin caller, company workspace, or talent profile.
    let subjectCtx = "";
    if (subjectKind === "admin") {
      subjectCtx = `\n\n## Caller\nAdmin user (id: ${user.id}, email: ${user.email ?? "—"})\nYou are speaking inside the internal admin Agentic Dashboard. The caller is platform staff with full read access; do not ask them to authenticate, and prefer concise, operational answers.`;
    } else if (subjectKind === "company") {
      subjectCtx = await buildCompanyContext(admin, subjectId!, body.context);
    } else {
      subjectCtx = buildSubjectContext(talentRow);
    }
    const systemPrompt = baseSystem + subjectCtx;

    // Load tools — admins use agent_tool_bindings as the source of truth (Step 4 wiring),
    // every other subject kind keeps the legacy allowed_tools array on ai_agents.
    let tools: any[] = [];
    if (subjectKind === "admin") {
      const { data: bindings } = await admin
        .from("agent_tool_bindings")
        .select("agent_tools!inner(tool_key, name, description, input_schema, default_credit_cost, min_level, handler_kind, handler_ref, is_active, status)")
        .eq("agent_id", agent.id);
      tools = (bindings ?? [])
        .map((b: any) => b.agent_tools)
        .filter((t: any) => t && t.is_active && (t.status ?? "available") === "available");
    } else {
      const allowedToolKeys: string[] = agent.allowed_tools || [];
      tools = await loadTools(admin, allowedToolKeys, agent.agent_level);
    }

    // RAG: retrieve KB chunks if KB exists for this agent
    const ragContext = await retrieveKbContext(admin, agent.id, body.message);
    const finalSystem = ragContext
      ? `${systemPrompt}\n\n## Knowledge Base Context\n${ragContext}`
      : systemPrompt;

    const convo: any[] = [
      { role: "system", content: finalSystem },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content || "" })),
      { role: "user", content: body.message },
    ];

    const aiToolSchema = tools.length
      ? tools.map((t: any) => ({
          type: "function",
          function: {
            name: String(t.tool_key).replace(/[^a-zA-Z0-9_-]/g, "_"),
            description: t.description || `Execute ${t.tool_key}`,
            parameters: t.input_schema || { type: "object", properties: {} },
          },
        }))
      : undefined;
    const toolKeyByFn: Record<string, string> = {};
    for (const t of tools) {
      toolKeyByFn[String(t.tool_key).replace(/[^a-zA-Z0-9_-]/g, "_")] = t.tool_key;
    }

    // Tool-call execution loop (company subject only — talent agents are streamed direct
    // for now to preserve their existing behaviour). Mirrors ai-agent-chat T2 pattern.
    const invalidations = new Set<string>();
    const TOOL_INVALIDATIONS_COMPANY: Record<string, string[]> = {
      create_job: ["employer-jobs-dashboard", "gro10x-jobs"],
      publish_job: ["employer-jobs-dashboard", "gro10x-jobs", "jobs-hub"],
      pause_job: ["employer-jobs-dashboard", "gro10x-jobs"],
      close_job: ["employer-jobs-dashboard", "gro10x-jobs"],
      save_to_shortlist: ["gro10x-shortlist"],
      reveal_talent: ["gro10x-talent-unlocks", "gro10x-shortlist"],
      update_company_profile: ["gro10x-company", "company-profile"],
      invite_teammate: ["gro10x-teammates"],
      publish_company_post: ["gro10x-feed", "company-feed"],
      draft_company_post: ["gro10x-feed-drafts"],
      discard_company_draft: ["gro10x-feed-drafts"],
      start_topup: ["company-credits", "gro10x-billing"],
      // Phase B3: ATS + Gig acceptance
      move_application_stage: ["employer-pipeline", "employer-jobs-dashboard"],
      accept_gig_bid: ["employer-gig-bids", "gro10x-open-gigs", "company-credits"],
    };

    if (subjectKind === "company" && aiToolSchema) {
      const MAX_HOPS = 4;
      for (let hop = 0; hop < MAX_HOPS; hop++) {
        const hopRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: agent.model || "google/gemini-3-flash-preview",
            messages: convo,
            tools: aiToolSchema,
            tool_choice: "auto",
            stream: false,
          }),
        });
        if (!hopRes.ok) {
          if (hopRes.status === 429) return json({ error: "Rate limit exceeded, please try again." }, 429);
          if (hopRes.status === 402) return json({ error: "AI workspace credits exhausted." }, 402);
          const txt = await hopRes.text();
          console.error("[agent-runtime] hop fault", hopRes.status, txt);
          break;
        }
        const hopJson = await hopRes.json();
        const msg = hopJson.choices?.[0]?.message;
        const toolCalls = msg?.tool_calls;
        if (!toolCalls || toolCalls.length === 0) break;
        convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });
        for (const call of toolCalls) {
          const fnName = call.function?.name;
          const toolKey = toolKeyByFn[fnName];
          let parsedArgs: any = {};
          try { parsedArgs = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* ignore */ }
          let toolResult: any;
          if (!toolKey) {
            toolResult = { ok: false, error: "tool_not_bound" };
          } else {
            try {
              const r = await fetch(`${SUPABASE_URL}/functions/v1/company-agent-tools`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: authHeader!,
                  apikey: SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ tool_key: toolKey, args: parsedArgs, company_id: subjectId }),
              });
              const txt = await r.text();
              try { toolResult = JSON.parse(txt); } catch { toolResult = { ok: r.ok, raw: txt }; }
            } catch (e: any) {
              toolResult = { ok: false, error: String(e?.message || e) };
            }
          }
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(toolResult).slice(0, 8000),
          });
          const okFlag = toolResult && toolResult.ok !== false && !toolResult.error;
          if (okFlag) {
            for (const k of TOOL_INVALIDATIONS_COMPANY[toolKey] || []) invalidations.add(k);
          }
        }
      }
    }

    // Final streamed completion (no tools advertised on the final pass for company —
    // the loop above already executed any required tools).
    // ---------- Admin tool-execution loop ----------
    // Dispatches via the central `agent-tool-execute`, which forwards to
    // `admin-agent-tools` (writes) or `admin-readonly-tools` (telemetry).
    if (subjectKind === "admin" && aiToolSchema) {
      const MAX_HOPS = 4;
      for (let hop = 0; hop < MAX_HOPS; hop++) {
        const hopRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: agent.model || "google/gemini-3-flash-preview",
            messages: convo,
            tools: aiToolSchema,
            tool_choice: "auto",
            stream: false,
          }),
        });
        if (!hopRes.ok) {
          if (hopRes.status === 429) return json({ error: "Rate limit exceeded, please try again." }, 429);
          if (hopRes.status === 402) return json({ error: "AI workspace credits exhausted." }, 402);
          const txt = await hopRes.text();
          console.error("[agent-runtime/admin] hop fault", hopRes.status, txt);
          break;
        }
        const hopJson = await hopRes.json();
        const msg = hopJson.choices?.[0]?.message;
        const toolCalls = msg?.tool_calls;
        if (!toolCalls || toolCalls.length === 0) break;
        convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });
        for (const call of toolCalls) {
          const fnName = call.function?.name;
          const toolKey = toolKeyByFn[fnName];
          let parsedArgs: any = {};
          try { parsedArgs = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* ignore */ }
          let toolResult: any = { ok: false, error: "tool_not_bound" };
          if (toolKey) {
            try {
              const r = await fetch(`${SUPABASE_URL}/functions/v1/agent-tool-execute`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: authHeader!,
                  apikey: SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                  agent_key: agent.agent_key,
                  tool_key: toolKey,
                  input: parsedArgs,
                  thread_id: threadId,
                }),
              });
              const txt = await r.text();
              try { toolResult = JSON.parse(txt); } catch { toolResult = { ok: r.ok, raw: txt }; }
            } catch (e: any) {
              toolResult = { ok: false, error: String(e?.message || e) };
            }
          }
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(toolResult).slice(0, 8000),
          });
        }
      }
    }

    // Final streamed completion. Strip tools for company AND admin — both ran
    // their tool loops above, so the final pass is plain text synthesis.
    const stripToolsOnFinal = subjectKind === "company" || subjectKind === "admin";
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-3-flash-preview",
        messages: convo,
        tools: stripToolsOnFinal ? undefined : aiToolSchema,
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

    // Tee the stream: pass to client AND collect for persistence. Append an
    // invalidations frame at the end so the client can refresh React Query caches.
    const invKeys = Array.from(invalidations);
    const { readable, writable } = new TransformStream();
    pipeAndPersist(aiResp.body!, writable, admin, {
      threadId: threadId!, agentId: agent.id, agentKey: agent.agent_key,
      subjectKind, subjectId: subjectId!, variant, msgCost, invalidationKeys: invKeys,
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
  if (!talent) return "";
  const parts: string[] = ["", "## Caller Profile"];
  if (talent.full_name) parts.push(`Name: ${talent.full_name}`);
  if (talent.country) parts.push(`Country: ${talent.country}`);
  return parts.join("\n");
}

/** Build a rich company context: workspace + the resource the user is
 * currently looking at (job, applicant, gig, bid, talent). Keeps payload
 * small (one row per resource, key fields only). */
async function buildCompanyContext(
  admin: any,
  companyId: string,
  pageCtx: Record<string, unknown> | undefined,
): Promise<string> {
  const lines: string[] = ["", "## Caller Workspace"];
  const { data: company } = await admin
    .from("companies")
    .select("id, name, industry, country")
    .eq("id", companyId)
    .maybeSingle();
  if (company) {
    lines.push(`Company: ${company.name ?? "—"} (id: ${company.id})`);
    if (company.industry) lines.push(`Industry: ${company.industry}`);
    if (company.country) lines.push(`Country: ${company.country}`);
  } else {
    lines.push(`Company id: ${companyId}`);
  }

  if (!pageCtx || typeof pageCtx !== "object") return lines.join("\n");

  lines.push("", "## Page Context");
  if (typeof pageCtx.route === "string") lines.push(`Route: ${pageCtx.route}`);

  const jobId = (pageCtx.job_id as string | undefined) || undefined;
  if (jobId) {
    const { data: job } = await admin
      .from("jobs")
      .select("id, title, location, is_active, created_at")
      .eq("id", jobId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (job) {
      lines.push(`Active Job: "${job.title}" (id: ${job.id}, status: ${job.is_active ? "live" : "draft/paused"}, location: ${job.location ?? "—"})`);
    } else {
      lines.push(`Active Job id: ${jobId} (not found in this company)`);
    }
  }

  const appId = (pageCtx.application_id as string | undefined) || undefined;
  if (appId) {
    const { data: app } = await admin
      .from("job_applications")
      .select("id, application_status, talent_id, job_id, talents(full_name, headline)")
      .eq("id", appId)
      .maybeSingle();
    if (app) {
      const t = (app as any).talents;
      lines.push(`Active Applicant: ${t?.full_name ?? "—"} (application id: ${app.id}, talent id: ${app.talent_id}, job id: ${app.job_id}, stage: ${app.application_status})`);
    }
  }

  const talentId = (pageCtx.talent_id as string | undefined) || undefined;
  if (talentId) {
    const { data: t } = await admin
      .from("talents")
      .select("id, full_name, country, headline, profession")
      .eq("id", talentId)
      .maybeSingle();
    if (t) lines.push(`Active Talent: ${t.full_name ?? "—"} (id: ${t.id}, ${t.profession ?? ""}, ${t.country ?? ""})`);
  }

  const gigId = (pageCtx.gig_id as string | undefined) || undefined;
  if (gigId) {
    const { data: gig } = await admin
      .from("gigs")
      .select("id, title, status, budget_min, budget_max, currency")
      .eq("id", gigId)
      .maybeSingle();
    if (gig) lines.push(`Active Gig: "${gig.title}" (id: ${gig.id}, status: ${gig.status}, budget: ${gig.budget_min ?? "?"}–${gig.budget_max ?? "?"} ${gig.currency ?? ""})`);
  }

  const bidId = (pageCtx.bid_id as string | undefined) || undefined;
  if (bidId) {
    const { data: bid } = await admin
      .from("gig_bids")
      .select("id, gig_id, talent_id, amount, status")
      .eq("id", bidId)
      .maybeSingle();
    if (bid) lines.push(`Active Bid: id ${bid.id}, gig ${bid.gig_id}, talent ${bid.talent_id}, amount ${bid.amount}, status ${bid.status}`);
  }

  return lines.join("\n");
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
  ctx: { threadId: string; agentId: string; agentKey: string; subjectKind: string; subjectId: string; variant: string; msgCost: number; invalidationKeys?: string[] },
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

    // Append invalidations frame after the upstream stream ends so the client
    // can refresh React Query caches for any tools that mutated server state.
    const invKeys = ctx.invalidationKeys ?? [];
    if (invKeys.length > 0) {
      try {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "invalidations", keys: invKeys })}\n\n`),
        );
      } catch { /* ignore */ }
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

// ──────────────────────────────────────────────────────────────────────
// WaaS — Workforce-as-a-Service execution path.
// Loads a hired instance + its master template, assembles the hybrid
// system prompt (template base + per-instance overrides + tenant/geo
// metadata), resolves a per-(instance, chat) thread, and streams the
// completion back through the same `pipeAndPersist` plumbing the legacy
// flow uses. Channel-specific routers (Telegram, WhatsApp, etc.) are
// responsible for delivering the streamed reply back to the end user;
// for Telegram in particular the router currently fires-and-forgets and
// returns 200 to Telegram immediately, so we still need to drain the
// stream here so persistence runs.
// ──────────────────────────────────────────────────────────────────────
async function runWorkforceInstance(body: RunRequest, admin: any): Promise<Response> {
  const instanceId = body.instance_id!;
  const userText = (body.text ?? body.message ?? "").toString().trim();
  if (!userText) return json({ error: "EMPTY_MESSAGE" }, 400);

  // 1. Load instance + template (single round-trip).
  const { data: instance, error: instanceErr } = await admin
    .from("workforce_hired_instances")
    .select(`
      id, name_override, prompt_override, model_override, tenant_id, cluster_geo_id, status,
      template:workforce_master_templates(
        id, agent_key, name, base_system_prompt, default_model, capabilities, base_message_credit_cost
      )
    `)
    .eq("id", instanceId)
    .maybeSingle();

  if (instanceErr || !instance) {
    console.error("[agent-runtime/waas] instance lookup fault", instanceErr);
    return json({ error: "INSTANCE_NOT_FOUND" }, 404);
  }
  if (instance.status && instance.status !== "active") {
    return json({ error: "INSTANCE_DISABLED", status: instance.status }, 403);
  }
  const template = (instance as any).template;
  if (!template) return json({ error: "TEMPLATE_MISSING" }, 500);

  // 2. Hybrid brain assembly.
  const agentName = instance.name_override || template.name;
  const model = instance.model_override || template.default_model || "google/gemini-3-flash-preview";
  const finalPrompt =
    `${template.base_system_prompt}\n\n` +
    `[Instance Overrides & Rules]:\n${instance.prompt_override || "None"}\n\n` +
    `[Agent Name]: ${agentName}\n` +
    `[Tenant ID]: ${instance.tenant_id}\n` +
    `[Geo-Cluster]: ${instance.cluster_geo_id || "Global"}`;

  // 3. Resolve subject — channel chat id (Telegram chat / WhatsApp jid / etc.)
  const source = body.source || "headless";
  const subjectKind = source === "telegram" ? "telegram_user" : `${source}_user`;
  const subjectId = body.chat_id != null ? String(body.chat_id) : (body.from_user_id != null ? String(body.from_user_id) : "anonymous");

  // 4. Find or create thread scoped to (instance, subject).
  let threadId: string | undefined = body.thread_id;
  if (!threadId) {
    const { data: existing } = await admin
      .from("agent_threads")
      .select("id")
      .eq("instance_id", instanceId)
      .eq("subject_kind", subjectKind)
      .eq("external_subject_id", subjectId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      threadId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin
        .from("agent_threads")
        .insert({
          instance_id: instanceId,
          agent_key: template.agent_key,
          subject_kind: subjectKind,
          external_subject_id: subjectId,
          title: userText.slice(0, 60),
        })
        .select("id")
        .single();
      if (createErr || !created) {
        console.error("[agent-runtime/waas] thread create fault", createErr);
        return json({ error: "THREAD_CREATE_FAULT" }, 500);
      }
      threadId = created.id;
    }
  }

  // 5. Load short history.
  const { data: history } = await admin
    .from("agent_messages")
    .select("role, content")
    .eq("thread_id", threadId!)
    .order("created_at", { ascending: true })
    .limit(20);

  // 6. Persist user turn.
  await admin.from("agent_messages").insert({
    thread_id: threadId!, role: "user", content: userText,
  });

  // 7. Stream completion.
  const convo: any[] = [
    { role: "system", content: finalPrompt },
    ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content || "" })),
    { role: "user", content: userText },
  ];

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: convo, stream: true }),
  });

  if (!aiResp.ok) {
    if (aiResp.status === 429) return json({ error: "Rate limit exceeded, please try again." }, 429);
    if (aiResp.status === 402) return json({ error: "AI workspace credits exhausted." }, 402);
    const txt = await aiResp.text();
    console.error("[agent-runtime/waas] AI gateway error", aiResp.status, txt);
    return json({ error: "AI_GATEWAY_FAULT" }, 500);
  }

  const { readable, writable } = new TransformStream();
  pipeAndPersist(aiResp.body!, writable, admin, {
    threadId: threadId!,
    agentId: template.id,
    agentKey: template.agent_key,
    subjectKind,
    subjectId,
    variant: "waas",
    msgCost: Number(template.base_message_credit_cost ?? 0),
    invalidationKeys: [],
  }).catch((err) => console.error("[agent-runtime/waas] persist error", err));

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Thread-Id": threadId!,
      "X-Instance-Id": instanceId,
    },
  });
}
