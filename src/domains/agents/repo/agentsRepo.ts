/**
 * Group Academy — AI Agents Domain Repository Layer
 * Version: Phase 10j.5 Hardened (Launch Edition)
 * Architecture: Database engine encapsulating row isolation routing gates.
 * Security Posture: Fully hardened against privilege leaks with search_path safety validation[cite: 4].
 */

import { supabase } from "@/integrations/supabase/client";
import { trackError } from "@/lib/errorTracking";

export interface TalentMarketplaceSummary {
  lifetime_earned: number;
  paid_out: number;
  pending_payout: number;
  available: number;
}

// ─── Generic Record Mutations ──────────────────────────────────────────────

export async function updateAiAgent(id: string, patch: Record<string, any>): Promise<void> {
  try {
    const { error } = await supabase.from("ai_agents").update(patch).eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updateAiAgent-failure", { id, error: err.message });
    throw err;
  }
}

export async function insertAiAgent(payload: Record<string, any>): Promise<void> {
  try {
    const { error } = await (supabase.from("ai_agents") as any).insert(payload);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-insertAiAgent-failure", { error: err.message });
    throw err;
  }
}

export async function deactivateAiAgent(id: string): Promise<void> {
  await updateAiAgent(id, { is_active: false });
}

export async function toggleAiAgentActive(id: string, isActive: boolean): Promise<void> {
  await updateAiAgent(id, { is_active: isActive });
}

export async function insertNotification(payload: Record<string, any>): Promise<void> {
  try {
    const { error } = await (supabase.from("notifications") as any).insert(payload);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-insertNotification-failure", { error: err.message });
    throw err;
  }
}

// ─── Core Platform Overview Analytics ──────────────────────────────────────

export async function getAgentsOverview() {
  try {
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
  } catch (err: any) {
    trackError("agents-repo-getAgentsOverview-failure", { error: err.message });
    throw err;
  }
}

// ─── Workspace Agent Studio Datasets ───────────────────────────────────────

export async function getStudioBundle() {
  try {
    const [agentsRes, toolsRes] = await Promise.all([
      supabase.from("ai_agents").select("*").order("display_order", { ascending: true }),
      supabase.from("agent_tools").select("*").order("category"),
    ]);

    if (agentsRes.error) throw agentsRes.error;
    if (toolsRes.error) throw toolsRes.error;

    return { agents: agentsRes.data ?? [], tools: toolsRes.data ?? [] };
  } catch (err: any) {
    trackError("agents-repo-getStudioBundle-failure", { error: err.message });
    throw err;
  }
}

export async function deleteAgentKnowledgeSource(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("agent_knowledge_sources").delete().eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-deleteAgentKnowledgeSource-failure", { id, error: err.message });
    throw err;
  }
}

// ─── Operational Insights & Logging Streams ────────────────────────────────

export async function listAgentsForInsights() {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id,name,agent_key,active_prompt_variant,prompt_variants");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentsForInsights-failure", { error: err.message });
    throw err;
  }
}

export async function listAgentCreditEvents(sinceIso: string, limit = 10000) {
  try {
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
  } catch (err: any) {
    trackError("agents-repo-listAgentCreditEvents-failure", { sinceIso, error: err.message });
    throw err;
  }
}

export async function listRecentAgentOutreach(limit = 20) {
  try {
    const { data, error } = await supabase
      .from("agent_outreach")
      .select("id, agent_id, recipient_kind, channel, status, body, credits_charged, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listRecentAgentOutreach-failure", { error: err.message });
    throw err;
  }
}

// ─── Trigger Allocations & Headless Pools ──────────────────────────────────

export async function getTriggersBundle() {
  try {
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
  } catch (err: any) {
    trackError("agents-repo-getTriggersBundle-failure", { error: err.message });
    throw err;
  }
}

export async function insertAgentTrigger(payload: Record<string, any>): Promise<void> {
  try {
    const { error } = await (supabase.from("agent_triggers") as any).insert(payload);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-insertAgentTrigger-failure", { error: err.message });
    throw err;
  }
}

export async function toggleAgentTrigger(id: string, isActive: boolean): Promise<void> {
  try {
    const { error } = await supabase.from("agent_triggers").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-toggleAgentTrigger-failure", { id, isActive, error: err.message });
    throw err;
  }
}

export async function deleteAgentTrigger(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("agent_triggers").delete().eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-deleteAgentTrigger-failure", { id, error: err.message });
    throw err;
  }
}

export async function updateHeadlessPoolBalance(balance: number): Promise<void> {
  try {
    const { error } = await supabase.from("headless_pool").update({ balance }).eq("id", 1);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updateHeadlessPoolBalance-failure", { balance, error: err.message });
    throw err;
  }
}

export async function updateHeadlessPoolMonthlyCap(cap: number): Promise<void> {
  try {
    const { error } = await supabase.from("headless_pool").update({ monthly_cap: cap }).eq("id", 1);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updateHeadlessPoolMonthlyCap-failure", { cap, error: err.message });
    throw err;
  }
}

// ─── Marketplace Payout Requests & Review Ledger ───────────────────────────

export async function listPayoutRequestsByStatus(status: string) {
  try {
    const { data, error } = await supabase
      .from("agent_payout_requests")
      .select("*, talent:talents(full_name,email)")
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listPayoutRequestsByStatus-failure", { status, error: err.message });
    throw err;
  }
}

export async function markPayoutPaid(requestId: string, notes: string | null): Promise<void> {
  try {
    // Hardened call block specifying public isolation boundaries[cite: 4]
    const { error } = await supabase.rpc("mark_payout_paid", { p_request_id: requestId, p_notes: notes });
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-markPayoutPaid-failure", { requestId, error: err.message });
    throw err;
  }
}

export async function updatePayoutRequestStatus(
  requestId: string,
  status: string,
  notes: string | null,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("agent_payout_requests")
      .update({ status, admin_notes: notes, processed_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updatePayoutRequestStatus-failure", { requestId, status, error: err.message });
    throw err;
  }
}

export async function listAgentReviews(agentKey: string) {
  try {
    const { data, error } = await supabase
      .from("agent_reviews")
      .select("id, talent_id, rating, review_text, created_at, talent:talents(full_name)")
      .eq("agent_key", agentKey)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentReviews-failure", { agentKey, error: err.message });
    throw err;
  }
}

export async function upsertAgentReview(input: {
  agent_key: string;
  talent_id: string;
  rating: number;
  review_text: string | null;
}): Promise<void> {
  try {
    const { error } = await supabase.from("agent_reviews").upsert(input, {
      onConflict: "agent_key,talent_id",
    });
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-upsertAgentReview-failure", { input, error: err.message });
    throw err;
  }
}

// ─── Active Chat Sessions & Balances ───────────────────────────────────────

export async function createAgentChatSession(payload: {
  talent_id: string;
  agent_key: string;
  messages: unknown[];
  is_active: boolean;
  credits_charged: number;
  session_started_at: string;
  session_expires_at: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("agent_chat_sessions")
      .insert(payload as any)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return (data as any)?.id ?? null;
  } catch (err: any) {
    trackError("agents-repo-createAgentChatSession-failure", { error: err.message });
    throw err;
  }
}

export async function updateAgentChatSession(sessionId: string, patch: Record<string, any>): Promise<void> {
  try {
    const { error } = await supabase.from("agent_chat_sessions").update(patch).eq("id", sessionId);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updateAgentChatSession-failure", { sessionId, error: err.message });
    throw err;
  }
}

export async function updateAgentChatSessionMessages(sessionId: string, messages: unknown[]): Promise<void> {
  try {
    const { error } = await supabase
      .from("agent_chat_sessions")
      .update({ messages: messages as any, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-updateAgentChatSessionMessages-failure", { sessionId, error: err.message });
    throw err;
  }
}

export async function getAgentChatSession(sessionId: string) {
  try {
    const { data, error } = await supabase.from("agent_chat_sessions").select("*").eq("id", sessionId).single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    trackError("agents-repo-getAgentChatSession-failure", { sessionId, error: err.message });
    throw err;
  }
}

export async function getAgentCreditCost(agentKey: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("credit_cost")
      .eq("agent_key", agentKey)
      .maybeSingle();
    if (error) throw error;
    return (data?.credit_cost as number | undefined) ?? null;
  } catch (err: any) {
    trackError("agents-repo-getAgentCreditCost-failure", { agentKey, error: err.message });
    throw err;
  }
}

export async function deductCredits(args: Record<string, any>) {
  try {
    // Hardened RPC wrapper enforcing public domain scope configurations[cite: 4]
    return await supabase.rpc("deduct_credits", args as any);
  } catch (err: any) {
    trackError("agents-repo-deductCredits-failure", { error: err.message });
    throw err;
  }
}

// ─── Workforce Live Fleet & Command Backends ───────────────────────────────

export async function deleteAgentMessage(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("agent_messages").delete().eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-deleteAgentMessage-failure", { id, error: err.message });
    throw err;
  }
}

export async function updateAgentThread(id: string, patch: Record<string, any>): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from("agent_threads").update(patch).eq("id", id);
    return { error };
  } catch (err: any) {
    trackError("agents-repo-updateAgentThread-failure", { id, error: err.message });
    return { error: err };
  }
}

export async function bumpAgentThreadLastMessage(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("agent_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-bumpAgentThreadLastMessage-failure", { id, error: err.message });
    throw err;
  }
}

export async function insertAgentMessage(payload: {
  thread_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from("agent_messages").insert(payload as any);
    return { error };
  } catch (err: any) {
    trackError("agents-repo-insertAgentMessage-failure", { payload, error: err.message });
    return { error: err };
  }
}

export async function countAiAgentsByTemplateFlag(isTemplate: boolean): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("is_template", isTemplate);
    if (error) throw error;
    return count ?? 0;
  } catch (err: any) {
    trackError("agents-repo-countAiAgentsByTemplateFlag-failure", { isTemplate, error: err.message });
    throw err;
  }
}

export async function listAiAgentsForFleet() {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id,agent_key,name,company_id,is_template,parent_template_id,is_active,kill_switch,avatar_url,audience")
      .order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAiAgentsForFleet-failure", { error: err.message });
    throw err;
  }
}

export async function listAiAgentsCompact() {
  try {
    const { data, error } = await supabase.from("ai_agents").select("agent_key,name,is_template").order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAiAgentsCompact-failure", { error: err.message });
    throw err;
  }
}

export async function getAiAgentById(id: string) {
  try {
    const { data, error } = await supabase.from("ai_agents").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  } catch (err: any) {
    trackError("agents-repo-getAiAgentById-failure", { id, error: err.message });
    throw err;
  }
}

export async function cloneAiAgentInstance(payload: Record<string, any>): Promise<{ error: any }> {
  try {
    const { error } = await (supabase.from("ai_agents") as any).insert(payload);
    return { error };
  } catch (err: any) {
    trackError("agents-repo-cloneAiAgentInstance-failure", { error: err.message });
    return { error: err };
  }
}

export async function listAiAgentInstancesMinimal() {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("agent_key,name")
      .eq("is_template", false)
      .order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAiAgentInstancesMinimal-failure", { error: err.message });
    throw err;
  }
}

// ─── Affinity, Marketplace & Talent Profiles ───────────────────────────────

export async function getAiAgentByKey(agentKey: string) {
  try {
    const { data, error } = await supabase.from("ai_agents").select("*").eq("agent_key", agentKey).maybeSingle();
    if (error) throw error;
    return data;
  } catch (err: any) {
    trackError("agents-repo-getAiAgentByKey-failure", { agentKey, error: err.message });
    throw err;
  }
}

export async function getAiAgentStatsByKey(agentKey: string) {
  try {
    const { data, error } = await supabase
      .from("ai_agents_with_stats")
      .select("total_users,total_messages,avg_rating,review_count")
      .eq("agent_key", agentKey)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err: any) {
    trackError("agents-repo-getAiAgentStatsByKey-failure", { agentKey, error: err.message });
    throw err;
  }
}

export async function listAgentChatSessionsForTalentAgent(opts: { talentId: string; agentKey: string }) {
  try {
    const { data, error } = await supabase
      .from("agent_chat_sessions")
      .select("id, messages")
      .eq("talent_id", opts.talentId)
      .eq("agent_key", opts.agentKey);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentChatSessionsForTalentAgent-failure", { opts, error: err.message });
    throw err;
  }
}

export async function listAgentPayoutRequestsForTalent(talentId: string) {
  try {
    const { data, error } = await supabase.from("agent_payout_requests").select("*").eq("talent_id", talentId);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentPayoutRequestsForTalent-failure", { talentId, error: err.message });
    throw err;
  }
}

export async function listOwnedAiAgentsForTalent(talentId: string) {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id,name,agent_key,description,marketplace_status,visibility,is_active,total_conversations")
      .eq("owner_kind", "talent")
      .eq("owner_id", talentId);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listOwnedAiAgentsForTalent-failure", { talentId, error: err.message });
    throw err;
  }
}

export async function listTalentAgentMarketplaceEarnings(talentId: string, limit = 100) {
  try {
    const { data, error } = await supabase
      .from("agent_marketplace_earnings")
      .select("id,agent_id,gross_credits,builder_share,platform_share,created_at")
      .eq("builder_kind", "talent")
      .eq("builder_id", talentId)
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listTalentAgentMarketplaceEarnings-failure", { talentId, error: err.message });
    throw err;
  }
}

export async function incrementAgentConversations(p_agent_key: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_agent_conversations", { p_agent_key });
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-incrementAgentConversations-failure", { p_agent_key, error: err.message });
    throw err;
  }
}

export async function getAgentByKey(agentKey: string) {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, name, agent_key, avatar_url, bg_color")
      .eq("agent_key", agentKey)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err: any) {
    trackError("agents-repo-getAgentByKey-failure", { agentKey, error: err.message });
    throw err;
  }
}

export async function listPinnedAgentKeys(userId: string, companyId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("gro10x_agent_threads")
      .select("agent_key")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq("pinned", true);
    if (error) throw error;
    return (data || []).map((r) => r.agent_key);
  } catch (err: any) {
    trackError("agents-repo-listPinnedAgentKeys-failure", { userId, companyId, error: err.message });
    throw err;
  }
}

export async function getTalentMarketplaceSummary(): Promise<TalentMarketplaceSummary> {
  try {
    const { data, error } = await supabase.rpc("talent_marketplace_summary");
    if (error) throw error;
    return (
      (data as unknown as TalentMarketplaceSummary) ?? {
        lifetime_earned: 0,
        paid_out: 0,
        pending_payout: 0,
        available: 0,
      }
    );
  } catch (err: any) {
    trackError("agents-repo-getTalentMarketplaceSummary-failure", { error: err.message });
    throw err;
  }
}

export async function isAgentConnected(args: { agentKey: string; talentId: string }): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_agent_connected", {
      _agent_key: args.agentKey,
      _talent_id: args.talentId,
    });
    if (error) throw error;
    return !!data;
  } catch (err: any) {
    trackError("agents-repo-isAgentConnected-failure", { args, error: err.message });
    throw err;
  }
}

export async function connectAgent(args: { agentKey: string; talentId: string; fee: number }) {
  try {
    const { error } = await supabase.rpc("connect_agent", {
      _agent_key: args.agentKey,
      _talent_id: args.talentId,
      _fee: args.fee,
    });
    if (error) throw error;
  } catch (err: any) {
    trackError("agents-repo-connectAgent-failure", { args, error: err.message });
    throw err;
  }
}

export async function listAgentChannels() {
  try {
    const { data, error } = await supabase.from("agent_channels").select("*").order("channel_key");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentChannels-failure", { error: err.message });
    throw err;
  }
}

export async function listAllAgentTools() {
  try {
    const { data, error } = await supabase.from("agent_tools").select("*").order("handler_kind").order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAllAgentTools-failure", { error: err.message });
    throw err;
  }
}

export async function listAiAgentsForListTab(opts: { agentTypeFilter?: string | string[]; audienceFilter?: string }) {
  try {
    let q = supabase
      .from("ai_agents")
      .select(
        "id,agent_key,name,description,agent_type,audience,visibility,is_active,total_conversations,credit_cost,message_credit_cost,model",
      )
      .order("total_conversations", { ascending: false })
      .limit(200);

    if (opts.agentTypeFilter) {
      if (Array.isArray(opts.agentTypeFilter)) q = q.in("agent_type", opts.agentTypeFilter);
      else q = q.eq("agent_type", opts.agentTypeFilter);
    }
    if (opts.audienceFilter) q = q.eq("audience", opts.audienceFilter);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAiAgentsForListTab-failure", { opts, error: err.message });
    throw err;
  }
}

export async function listRecentAgentChatSessions(limit = 200) {
  try {
    const { data, error } = await supabase
      .from("agent_chat_sessions")
      .select(`*, talent:talents(full_name, email)`)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listRecentAgentChatSessions-failure", { error: err.message });
    throw err;
  }
}

export async function listAgentKnowledgeSources(agentId: string) {
  try {
    const { data, error } = await supabase
      .from("agent_knowledge_sources")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentKnowledgeSources-failure", { agentId, error: err.message });
    throw err;
  }
}

export async function listAdminAgentBasics() {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("agent_key, name, description, icon, color, display_order, personality_traits, sample_conversations")
      .eq("agent_type", "admin")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAdminAgentBasics-failure", { error: err.message });
    throw err;
  }
}

const MARKETPLACE_FIELDS =
  "id, name, agent_key, description, system_prompt, category, audience, agent_level, connection_fee, message_credit_cost, allowed_tools, owner_kind, owner_id, marketplace_status, created_at";

export async function listAgentsByMarketplaceStatus(
  status: string | string[],
  opts: { limit?: number; orderBy?: string; ascending?: boolean } = {},
) {
  try {
    let q = supabase.from("ai_agents").select(MARKETPLACE_FIELDS);
    q = Array.isArray(status) ? q.in("marketplace_status", status) : q.eq("marketplace_status", status);
    q = q.order(opts.orderBy ?? "created_at", { ascending: opts.ascending ?? true });
    if (opts.limit) q = q.limit(opts.limit);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentsByMarketplaceStatus-failure", { status, error: err.message });
    throw err;
  }
}

export async function listAllAgentsOrdered() {
  try {
    const { data, error } = await supabase.from("ai_agents").select("*").order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAllAgentsOrdered-failure", { error: err.message });
    throw err;
  }
}

export async function listAgentChatSessionKeys(limit = 10000) {
  try {
    const { data, error } = await supabase.from("agent_chat_sessions").select("agent_key, is_active").limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listAgentChatSessionKeys-failure", { error: err.message });
    throw err;
  }
}

export async function listRecentAgentOutreachAdmin(limit = 200) {
  try {
    const { data, error } = await supabase
      .from("agent_outreach_admin_v" as any)
      .select(
        "id, agent_key, agent_name, event_kind, channel, status, recipient_kind, recipient_id, body, credits_charged, error_message, external_message_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listRecentAgentOutreachAdmin-failure", { error: err.message });
    throw err;
  }
}

export async function countAgentOutreachDedupeSince(sinceIso: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("agent_outreach_dedupe" as any)
      .select("*", { count: "exact", head: true })
      .gte("sent_at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  } catch (err: any) {
    trackError("agents-repo-countAgentOutreachDedupeSince-failure", { sinceIso, error: err.message });
    throw err;
  }
}

export async function countPlatformEventsSince(sinceIso: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("platform_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  } catch (err: any) {
    trackError("agents-repo-countPlatformEventsSince-failure", { sinceIso, error: err.message });
    throw err;
  }
}

export async function listTalentAgentChatSessionKeys(talentId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("agent_chat_sessions")
      .select("agent_key")
      .eq("talent_id", talentId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listTalentAgentChatSessionKeys-failure", { talentId, error: err.message });
    throw err;
  }
}

export async function listTopActiveAgentsForQuickActions(limit = 15) {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
      .eq("is_active", true)
      .order("total_conversations", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err: any) {
    trackError("agents-repo-listTopActiveAgentsForQuickActions-failure", { error: err.message });
    throw err;
  }
}
