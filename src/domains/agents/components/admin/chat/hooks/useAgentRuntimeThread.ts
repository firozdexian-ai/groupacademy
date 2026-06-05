/**
 * Group Academy — Agent Runtime Thread Hook
 * Version: Phase 10j.3 Hardened
 * Purpose: DB-backed conversational hook for administrative chat surfaces.
 * Constraints: Enforces strict subject-kind 'admin' filtering for RBAC security.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getAccessToken } from "@/lib/auth";
import { deleteAgentMessage } from "@/domains/agents/repo/agentsRepo";
import { useAdminAgents } from "./useAdminAgents";
import { trackError } from "@/lib/errorTracking";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: undefined;
  created_at?: string;
};

export interface AdminThreadSummary {
  id: string;
  agent_key: string;
  title: string | null;
  last_message_at: string;
  last_read_at: string;
}

export function useAdminAgentThreads() {
  const [threads, setThreads] = useState<AdminThreadSummary[]>([]);

  const reload = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("agent_threads")
        .select("id, agent_key, title, last_message_at, updated_at")
        .eq("subject_kind", "admin")
        .eq("subject_id", user.id)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      setThreads(
        ((data as any[]) ?? []).map((r) => ({
          id: r.id,
          agent_key: r.agent_key,
          title: r.title,
          last_message_at: r.last_message_at,
          last_read_at: r.updated_at,
        })),
      );
    } catch (err: any) {
      trackError("agents-hook-load-threads-failure", { error: err.message });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { threads, reload };
}

interface UseAgentRuntimeThreadReturn {
  messages: ChatMsg[];
  loading: boolean;
  sending: boolean;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
  regenerate: () => Promise<void>;
  uploadAttachment: undefined;
}

export function useAgentRuntimeThread(agentKey: string | null): UseAgentRuntimeThreadReturn {
  const { data: agents = [] } = useAdminAgents();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const lastUserMsgRef = useRef<string>("");

  useEffect(() => {
    if (!agentKey) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setMessages([]);
      setThreadId(null);
      try {
        const user = await getCurrentUser();
        if (!user?.id) return;

        const { data: thread } = await supabase
          .from("agent_threads")
          .select("id")
          .eq("subject_kind", "admin")
          .eq("subject_id", user.id)
          .eq("agent_key", agentKey)
          .eq("is_archived", false)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (thread?.id) {
          setThreadId(thread.id);
          const { data: rows } = await supabase
            .from("agent_messages")
            .select("id, role, content, created_at")
            .eq("thread_id", thread.id)
            .order("created_at", { ascending: true });

          if (cancelled) return;
          setMessages(
            ((rows as any[]) ?? [])
              .filter((r) => r.role === "user" || r.role === "assistant")
              .map((r) => ({
                id: r.id,
                role: r.role,
                content: r.content ?? "",
                created_at: r.created_at,
              })),
          );
        }
      } catch (err: any) {
        trackError("agents-hook-load-thread-failure", { agentKey, error: err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  const reconcileTail = useCallback(async (tid: string) => {
    const { data: rows, error } = await supabase
      .from("agent_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (error || !rows) return;

    const canonical: ChatMsg[] = (rows as any[])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content ?? "",
        created_at: r.created_at,
      }));

    const seen = new Set<string>();
    const deduped = canonical.filter((m) => {
      if (!m.id || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    setMessages(deduped);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || !agentKey || sending) return;
      const agent = agents.find((a: any) => a.key === agentKey || a.agent_key === agentKey);
      if (!agent) {
        trackError("agents-hook-send-unknown-agent", { agentKey });
        return;
      }

      lastUserMsgRef.current = content;
      setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "" }]);
      setSending(true);

      try {
        const token = await getAccessToken();
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-runtime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ agent_key: agentKey, thread_id: threadId ?? undefined, message: content }),
        });

        if (!resp.ok) throw new Error(`Status ${resp.status}`);

        const newThreadId = resp.headers.get("X-Thread-Id");
        if (newThreadId && newThreadId !== threadId) setThreadId(newThreadId);

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("Stream failure");

        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                assistantText += delta;
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last && last.role === "assistant" && !last.id) {
                    next[next.length - 1] = { ...last, content: assistantText };
                  }
                  return next;
                });
              }
            } catch {
              /* keep-alive frames */
            }
          }
        }
        if (newThreadId || threadId) await reconcileTail((newThreadId ?? threadId)!);
      } catch (err: any) {
        trackError("agents-hook-send-failure", { agentKey, error: err.message });
        setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && !m.id)));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [agentKey, agents, sending, threadId, reconcileTail],
  );

  const clear = useCallback(async () => {
    if (threadId) {
      await supabase.from("agent_threads").update({ is_archived: true }).eq("id", threadId);
    }
    setThreadId(null);
    setMessages([]);
  }, [threadId]);

  const regenerate = useCallback(async () => {
    if (!threadId || sending) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const prompt = lastUser?.content || lastUserMsgRef.current;
    if (!prompt) return;

    const trailingAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id);
    if (trailingAssistant?.id) await deleteAgentMessage(trailingAssistant.id);

    setMessages((prev) => {
      const next = [...prev];
      while (next.length && next[next.length - 1].role === "assistant") next.pop();
      while (next.length && next[next.length - 1].role === "user") next.pop();
      return next;
    });
    await send(prompt);
  }, [threadId, messages, sending, send]);

  return { messages, loading, sending, send, clear, regenerate, uploadAttachment: undefined };
}
