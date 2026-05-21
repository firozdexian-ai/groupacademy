/**
 * Messaging domain repository (Phase 10i.1).
 * All raw `supabase.from(...)` access for messaging surfaces flows through here.
 */
import { supabase } from "@/integrations/supabase/client";

export async function insertDirectMessage(input: {
  threadId: string;
  senderId: string;
  senderRole: string;
  body: string;
}): Promise<void> {
  const { error } = await supabase.from("direct_messages").insert({
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    body: input.body,
  });
  if (error) throw error;
}

export async function resetThreadUnread(threadId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("message_threads")
    .update({ unread_count: 0 })
    .eq("id", threadId);
  return { error };
}

export async function markThreadNotificationsRead(threadId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("is_read", false);
}

export async function updateChannelAutoReply(
  id: string,
  autoReplyEnabled: boolean,
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("messaging_channels")
    .update({ auto_reply_enabled: autoReplyEnabled })
    .eq("id", id);
  return { error };
}

/* ---------------- Phase 10j.3: WhatsApp group manager helpers ---------------- */

export async function listMessagingChannelsByKeys(keys: string[]) {
  const { data, error } = await supabase
    .from("messaging_channels")
    .select("id, agent_key, status, phone_e164")
    .in("agent_key", keys);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function listCompanyGroupConversations(companyId: string) {
  const { data, error } = await supabase
    .from("messaging_conversations")
    .select("id, channel_id, external_chat_id, peer_display_name, group_kind, metadata")
    .eq("company_id", companyId)
    .eq("is_group", true)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function deleteMessagingConversation(id: string): Promise<void> {
  const { error } = await supabase.from("messaging_conversations").delete().eq("id", id);
  if (error) throw error;
}

// ─── Phase 10j.5e: pause auto-reply on a single conversation ──────────────
export async function pauseMessagingConversationAutoReply(id: string, paused: boolean): Promise<void> {
  await supabase.from("messaging_conversations").update({ auto_reply_paused: paused }).eq("id", id);
}

// ─── Phase 10j.5g: gro10x agent threads ───────────────────────────────────
export async function listGro10xThreads(userId: string, companyId: string): Promise<any[]> {
  const { data } = await supabase
    .from("gro10x_agent_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .order("pinned", { ascending: false })
    .order("last_message_at", { ascending: false });
  return (data ?? []) as any[];
}

export async function insertGro10xThreads(rows: Array<Record<string, any>>): Promise<any[]> {
  const { data } = await supabase.from("gro10x_agent_threads").insert(rows as any).select("*");
  return (data ?? []) as any[];
}

export async function upsertGro10xThread(payload: Record<string, any>): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("gro10x_agent_threads")
    .upsert(payload as any, { onConflict: "user_id,company_id,agent_key" })
    .select("*")
    .single();
  return { data, error };
}

export async function bumpGro10xThread(payload: Record<string, any>): Promise<void> {
  await supabase
    .from("gro10x_agent_threads")
    .upsert(payload as any, { onConflict: "user_id,company_id,agent_key" });
}

export async function markGro10xThreadRead(
  userId: string,
  companyId: string,
  agentKey: string,
): Promise<void> {
  await supabase
    .from("gro10x_agent_threads")
    .update({ unread_count: 0 })
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("agent_key", agentKey);
}
