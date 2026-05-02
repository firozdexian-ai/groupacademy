/**
 * useAdminChatThread — loads/persists a single per-admin per-agent thread
 * for the unified `/dashboard/chat` messenger. Persistence is client-side
 * (no edge function changes required): we replay full history when invoking
 * the agent, then store the resulting user+assistant turn.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";

export type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

export interface ThreadSummary {
  id: string;
  agent_key: string;
  title: string | null;
  last_message_at: string;
}

export function useAdminThreads() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("admin_chat_threads")
      .select("id, agent_key, title, last_message_at")
      .order("last_message_at", { ascending: false });
    setThreads((data as any) ?? []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { threads, reload };
}

export function useAdminChatThread(agentKey: string | null) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // load or create thread
  useEffect(() => {
    if (!agentKey) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      let { data: t } = await supabase
        .from("admin_chat_threads")
        .select("id")
        .eq("user_id", uid)
        .eq("agent_key", agentKey)
        .maybeSingle();
      if (!t) {
        const { data: created } = await supabase
          .from("admin_chat_threads")
          .insert({ user_id: uid, agent_key: agentKey })
          .select("id")
          .single();
        t = created;
      }
      if (cancelled || !t) return;
      setThreadId(t.id);
      const { data: msgs } = await supabase
        .from("admin_chat_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", t.id)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((msgs as any) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  const send = useCallback(
    async (text: string) => {
      if (!agentKey || !threadId || !text.trim() || sending) return;
      const agent = ADMIN_AGENTS_BY_KEY[agentKey];
      if (!agent) return;

      const userMsg: ChatMsg = { role: "user", content: text.trim() };
      const next = [...messages, userMsg];
      setMessages(next);
      setSending(true);

      // optimistic persist user msg + set title if first
      const titlePatch =
        messages.length === 0
          ? { title: userMsg.content.slice(0, 80) }
          : {};
      await supabase.from("admin_chat_messages").insert({
        thread_id: threadId,
        role: "user",
        content: userMsg.content,
      });
      if (Object.keys(titlePatch).length) {
        await supabase.from("admin_chat_threads").update(titlePatch).eq("id", threadId);
      }

      try {
        const { data, error } = await supabase.functions.invoke(agent.functionName, {
          body: { messages: next.map(({ role, content }) => ({ role, content })) },
        });
        if (error) throw error;
        const payload = data as any;
        if (payload?.error) {
          const detail = payload.detail
            ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}`
            : "";
          throw new Error(`${payload.error}${detail}`);
        }
        const reply: ChatMsg = {
          role: "assistant",
          content: payload?.content || "(no answer)",
        };
        setMessages([...next, reply]);
        await supabase.from("admin_chat_messages").insert({
          thread_id: threadId,
          role: "assistant",
          content: reply.content,
        });
      } catch (e: any) {
        const errMsg: ChatMsg = {
          role: "assistant",
          content: `_Error: ${e?.message ?? String(e)}_`,
        };
        setMessages([...next, errMsg]);
      } finally {
        setSending(false);
      }
    },
    [agentKey, threadId, messages, sending],
  );

  const clear = useCallback(async () => {
    if (!threadId) return;
    await supabase.from("admin_chat_messages").delete().eq("thread_id", threadId);
    setMessages([]);
  }, [threadId]);

  return { threadId, messages, loading, sending, send, clear };
}
