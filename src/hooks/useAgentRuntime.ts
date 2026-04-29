import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";
import type { AgentMessage } from "@/hooks/useAgentChat";

/**
 * GroUp Academy: Agent OS Runtime Hook (Phase 3)
 * Streams from the unified `agent-runtime` edge function (SSE) and persists
 * threads in `agent_threads` / `agent_messages`. Mirrors `useAgentChat` shape
 * so existing UI (AgentChatDialog) plugs in without changes.
 */

export interface AgentThread {
  id: string;
  agent_id: string;
  agent_key: string;
  subject_kind: string;
  subject_id: string;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface UseAgentRuntimeReturn {
  thread: AgentThread | null;
  messages: AgentMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  startOrResumeSession: (agentKey: string) => Promise<AgentThread | null>;
  endSession: () => Promise<void>;
  isLoadingSessions: boolean;
  perResponseCost: number;
  connectionFee: number;
}

export function useAgentRuntime(): UseAgentRuntimeReturn {
  const { talent } = useTalent();

  const [thread, setThread] = useState<AgentThread | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [perResponseCost, setPerResponseCost] = useState<number>(0);
  const [connectionFee, setConnectionFee] = useState<number>(0);

  const agentIdRef = useRef<string | null>(null);
  const agentKeyRef = useRef<string | null>(null);

  const startOrResumeSession = useCallback(
    async (agentKey: string): Promise<AgentThread | null> => {
      if (!talent?.id) return null;
      setIsLoading(true);
      setIsLoadingSessions(true);
      try {
        // Resolve agent pricing/id
        const { data: agent } = await supabase
          .from("ai_agents")
          .select("id, agent_key, message_credit_cost, connection_fee")
          .eq("agent_key", agentKey)
          .maybeSingle();

        if (!agent) {
          toast.error("Agent not found");
          return null;
        }

        agentIdRef.current = agent.id;
        agentKeyRef.current = agent.agent_key;
        setPerResponseCost(Number(agent.message_credit_cost ?? 0));
        setConnectionFee(Number(agent.connection_fee ?? 0));

        // Resume most recent thread for this (talent, agent) or start fresh on first send
        const { data: existing } = await supabase
          .from("agent_threads")
          .select("*")
          .eq("agent_id", agent.id)
          .eq("subject_kind", "talent")
          .eq("subject_id", talent.id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setThread(existing as AgentThread);
          const { data: history } = await supabase
            .from("agent_messages")
            .select("role, content")
            .eq("thread_id", existing.id)
            .order("created_at", { ascending: true });
          setMessages(
            (history ?? [])
              .filter((m: any) => m.role === "user" || m.role === "assistant")
              .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content || "" })),
          );
          return existing as AgentThread;
        }

        setThread(null);
        setMessages([]);
        return { id: "", agent_id: agent.id, agent_key: agent.agent_key, subject_kind: "talent", subject_id: talent.id, title: null, last_message_at: null, created_at: new Date().toISOString() };
      } catch (err) {
        console.error("[useAgentRuntime] init fault", err);
        return null;
      } finally {
        setIsLoading(false);
        setIsLoadingSessions(false);
      }
    },
    [talent?.id],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !agentKeyRef.current) return;

      const userMsg: AgentMessage = { role: "user", content: content.trim() };
      setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
      setIsStreaming(true);

      let assistantBuffer = "";
      try {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        if (!authSession?.access_token) throw new Error("AUTH_REQUIRED");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-runtime`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authSession.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              agent_key: agentKeyRef.current,
              thread_id: thread?.id || undefined,
              message: userMsg.content,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const { message } = handleAIError(errorData, response.status);
          toast.error(message);
          // rollback assistant placeholder + user msg
          setMessages((prev) => prev.slice(0, -2));
          return;
        }

        // Capture thread id from header (new threads)
        const newThreadId = response.headers.get("X-Thread-Id");
        if (newThreadId && (!thread || thread.id !== newThreadId)) {
          setThread((prev) =>
            prev
              ? { ...prev, id: newThreadId }
              : ({
                  id: newThreadId,
                  agent_id: agentIdRef.current || "",
                  agent_key: agentKeyRef.current || "",
                  subject_kind: "talent",
                  subject_id: talent?.id || "",
                  title: userMsg.content.slice(0, 60),
                  last_message_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                } as AgentThread),
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("STREAM_FAULT");
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).trimEnd();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const token = parsed?.choices?.[0]?.delta?.content;
              if (typeof token === "string" && token.length) {
                assistantBuffer += token;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantBuffer };
                  return next;
                });
              }
            } catch {
              /* partial chunk */
            }
          }
        }

        if (!assistantBuffer) {
          // No content streamed — drop empty assistant bubble
          setMessages((prev) => prev.slice(0, -1));
        }
      } catch (err) {
        console.error("[useAgentRuntime] stream fault", err);
        toast.error("Connection interrupted");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, thread, talent?.id],
  );

  const endSession = useCallback(async () => {
    setThread(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    setIsLoadingSessions(false);
  }, []);

  return {
    thread,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    endSession,
    isLoadingSessions,
    perResponseCost,
    connectionFee,
  };
}
