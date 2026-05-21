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
