/**
 * useAgentRuntimeThread — DB-backed conversational hook for the Agentic
 * Dashboard, powered by the unified `agent-runtime` edge function and the
 * `agent_threads` / `agent_messages` memory tables.
 *
 * Drop-in replacement for `useAdminChatThread` (admin-only batches).
 * - History persisted server-side; we only render `agent_messages` rows.
 * - Server creates the thread on first turn; new id arrives via `X-Thread-Id`.
 * - SSE response streamed live; final assistant row written by the runtime,
 *   then we re-fetch the trailing rows to grab stable ids for copy/regen.
 * - Attachments are NOT supported in this batch (uploadAttachment === undefined).
 *
 * Companion: `useAdminAgentThreads` — sidebar thread list, also reading
 * `agent_threads` (subject_kind = 'admin', subject_id = auth.uid()).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAgents } from "./useAdminAgents";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/** Mirror of the legacy ChatMsg shape so the UI can swap hooks blindly. */
export type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: undefined; // dropped for this batch
  created_at?: string;
};

export interface AdminThreadSummary {
  id: string;
  agent_key: string;
  title: string | null;
  last_message_at: string;
  last_read_at: string; // synthesised — agent_threads has no per-user read marker yet
}

/** Sidebar thread list. */
export function useAdminAgentThreads() {
  const [threads, setThreads] = useState<AdminThreadSummary[]>([]);

  const reload = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("agent_threads")
      .select("id, agent_key, title, last_message_at, updated_at")
      .eq("subject_kind", "admin")
      .eq("subject_id", uid)
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false });
    setThreads(
      ((data as any[]) ?? []).map((r) => ({
        id: r.id as string,
        agent_key: r.agent_key as string,
        title: r.title as string | null,
        last_message_at: r.last_message_at as string,
        last_read_at: r.updated_at as string,
      })),
    );
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

export function useAgentRuntimeThread(
  agentKey: string | null,
): UseAgentRuntimeThreadReturn {
  const { data: agents = [] } = useAdminAgents();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const lastUserMsgRef = useRef<string>("");

  // Find or load the most recent thread for this admin+agent.
  useEffect(() => {
    if (!agentKey) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMessages([]);
      setThreadId(null);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) return;
        const { data: thread } = await supabase
          .from("agent_threads")
          .select("id")
          .eq("subject_kind", "admin")
          .eq("subject_id", uid)
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
                id: r.id as string,
                role: r.role as ChatMsg["role"],
                content: (r.content as string) ?? "",
                created_at: r.created_at as string,
              })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  const reconcileTail = useCallback(async (tid: string) => {
    // Authoritative refetch: replace local state with the canonical server
    // rows for this thread. This guarantees zero duplicates regardless of
    // optimistic placeholders, streaming order, or prior race conditions.
    const { data: rows } = await supabase
      .from("agent_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });
    if (!rows) return;
    const canonical: ChatMsg[] = (rows as any[])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        id: r.id as string,
        role: r.role as ChatMsg["role"],
        content: (r.content as string) ?? "",
        created_at: r.created_at as string,
      }));
    // Dedupe defensively by id (server is source of truth).
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
      const agent = agents.find((a) => a.key === agentKey);
      if (!agent) return;

      lastUserMsgRef.current = content;
      // Optimistic user + empty assistant placeholder.
      setMessages((prev) => [
        ...prev,
        { role: "user", content },
        { role: "assistant", content: "" },
      ]);
      setSending(true);

      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-runtime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agent_key: agentKey,
            thread_id: threadId ?? undefined,
            message: content,
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(errText || `HTTP ${resp.status}`);
        }

        const newThreadId = resp.headers.get("X-Thread-Id");
        if (newThreadId && newThreadId !== threadId) setThreadId(newThreadId);
        const activeThreadId = newThreadId ?? threadId;

        // Stream OpenAI-style SSE deltas into the trailing assistant bubble.
        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No stream");
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
              /* ignore non-JSON keep-alive frames */
            }
          }
        }

        if (activeThreadId) await reconcileTail(activeThreadId);
      } catch (err) {
        // Roll back the optimistic assistant placeholder on failure.
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && !last.id && !last.content) {
            next.pop();
          }
          return next;
        });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [agentKey, agents, sending, threadId, reconcileTail],
  );

  const clear = useCallback(async () => {
    if (threadId) {
      await supabase
        .from("agent_threads")
        .update({ is_archived: true })
        .eq("id", threadId);
    }
    setThreadId(null);
    setMessages([]);
  }, [threadId]);

  const regenerate = useCallback(async () => {
    if (!threadId || sending) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const prompt = lastUser?.content || lastUserMsgRef.current;
    if (!prompt) return;
    // Strip the trailing assistant row server-side so the runtime doesn't
    // see its own previous answer in the history window.
    const trailingAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.id);
    if (trailingAssistant?.id) {
      await supabase.from("agent_messages").delete().eq("id", trailingAssistant.id);
    }
    setMessages((prev) => {
      const next = [...prev];
      while (next.length && next[next.length - 1].role === "assistant") next.pop();
      // also drop the duplicated user we're about to re-send
      while (next.length && next[next.length - 1].role === "user") next.pop();
      return next;
    });
    await send(prompt);
  }, [threadId, messages, sending, send]);

  return {
    messages,
    loading,
    sending,
    send,
    clear,
    regenerate,
    uploadAttachment: undefined,
  };
}
