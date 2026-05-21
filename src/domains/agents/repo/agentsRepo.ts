/**
 * Agents domain repository (Phase 10i.3).
 *
 * Wraps raw supabase.from(...) / supabase.rpc(...) calls for the AI Agents
 * admin and dashboard area: registry, studio, marketplace, insights, payouts,
 * triggers, brain (prompt variants), chat sessions, and runtime threads.
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Generic helpers ──────────────────────────────────────────────────────
export async function updateAiAgent(id: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("ai_agents").update(patch).eq("id", id);
  if (error) throw error;
}

export async function insertAiAgent(payload: Record<string, any>): Promise<void> {
  const { error } = await (supabase.from("ai_agents") as any).insert(payload);
  if (error) throw error;
}

export async function deactivateAiAgent(id: string): Promise<void> {
  await updateAiAgent(id, { is_active: false });
}

export async function toggleAiAgentActive(id: string, isActive: boolean): Promise<void> {
  await updateAiAgent(id, { is_active: isActive });
}

export async function insertNotification(payload: Record<string, any>): Promise<void> {
  const { error } = await (supabase.from("notifications") as any).insert(payload);
  if (error) throw error;
}

// ─── Overview ─────────────────────────────────────────────────────────────
export async function getAgentsOverview() {
  const [agentsRes, channelsRes, toolsRes, sessionsRes] = await Promise.all([
    supabase.from("ai_agents").select("agent_type,is_active,visibility,total_conversations"),
    supabase.from("agent_channels").select("id", { count: "exact", head: true }),
    supabase.from("agent_tools").select("handler_kind"),
    supabase
      .from("agent_chat_sessions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);
  if (agentsRes.error) throw agentsRes.error;
  if (channelsRes.error) throw channelsRes.error;
  if (toolsRes.error) throw toolsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  return {
    agents: agentsRes.data ?? [],
    channelCount: channelsRes.count ?? 0,
    tools: toolsRes.data ?? [],
    sessions7dCount: sessionsRes.count ?? 0,
  };
}

// ─── Studio ───────────────────────────────────────────────────────────────
export async function getStudioBundle() {
  const [agentsRes, toolsRes] = await Promise.all([
    supabase.from("ai_agents").select("*").order("display_order", { ascending: true }),
    supabase.from("agent_tools").select("*").order("category"),
  ]);
  if (agentsRes.error) throw agentsRes.error;
  if (toolsRes.error) throw toolsRes.error;
  return { agents: agentsRes.data ?? [], tools: toolsRes.data ?? [] };
}

export async function deleteAgentKnowledgeSource(id: string): Promise<void> {
  const { error } = await supabase.from("agent_knowledge_sources").delete().eq("id", id);
  if (error) throw error;
}

// ─── Insights ─────────────────────────────────────────────────────────────
export async function listAgentsForInsights() {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id,name,agent_key,active_prompt_variant,prompt_variants");
  if (error) throw error;
  return data ?? [];
}

export async function listAgentCreditEvents(sinceIso: string, limit = 10000) {
  const { data, error } = await supabase
    .from("agent_credit_events")
    .select(
      "id,agent_id,thread_id,subject_kind,event_kind,credits,llm_cost_usd,tokens_in,tokens_out,prompt_variant,created_at",
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listRecentAgentOutreach(limit = 20) {
  const { data, error } = await supabase
    .from("agent_outreach")
    .select("id, agent_id, recipient_kind, channel, status, body, credits_charged, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ─── Triggers ─────────────────────────────────────────────────────────────
export async function getTriggersBundle() {
  const [agentsRes, triggersRes, poolRes] = await Promise.all([
    supabase.from("ai_agents").select("id, name, agent_key").eq("is_active", true).order("name"),
    supabase.from("agent_triggers").select("*").order("created_at", { ascending: false }),
    supabase.from("headless_pool").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (agentsRes.error) throw agentsRes.error;
  if (triggersRes.error) throw triggersRes.error;
  if (poolRes.error) throw poolRes.error;
  return {
    agents: agentsRes.data ?? [],
    triggers: triggersRes.data ?? [],
    pool: poolRes.data ?? null,
  };
}

export async function insertAgentTrigger(payload: Record<string, any>): Promise<void> {
  const { error } = await (supabase.from("agent_triggers") as any).insert(payload);
  if (error) throw error;
}

export async function toggleAgentTrigger(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("agent_triggers").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteAgentTrigger(id: string): Promise<void> {
  const { error } = await supabase.from("agent_triggers").delete().eq("id", id);
  if (error) throw error;
}

export async function updateHeadlessPoolBalance(balance: number): Promise<void> {
  const { error } = await supabase.from("headless_pool").update({ balance }).eq("id", 1);
  if (error) throw error;
}

export async function updateHeadlessPoolMonthlyCap(cap: number): Promise<void> {
  const { error } = await supabase.from("headless_pool").update({ monthly_cap: cap }).eq("id", 1);
  if (error) throw error;
}

// ─── Payouts ──────────────────────────────────────────────────────────────
export async function markPayoutPaid(requestId: string, notes: string | null): Promise<void> {
  const { error } = await supabase.rpc("mark_payout_paid", { p_request_id: requestId, p_notes: notes });
  if (error) throw error;
}

// ─── Chat sessions ────────────────────────────────────────────────────────
export async function updateAgentChatSession(sessionId: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from("agent_chat_sessions").update(patch).eq("id", sessionId);
  if (error) throw error;
}

export async function getAgentChatSession(sessionId: string) {
  const { data, error } = await supabase.from("agent_chat_sessions").select("*").eq("id", sessionId).single();
  if (error) throw error;
  return data;
}

export async function deductCredits(args: Record<string, any>) {
  return await supabase.rpc("deduct_credits", args as any);
}

// ─── Runtime thread ──────────────────────────────────────────────────────
export async function deleteAgentMessage(id: string): Promise<void> {
  const { error } = await supabase.from("agent_messages").delete().eq("id", id);
  if (error) throw error;
}
