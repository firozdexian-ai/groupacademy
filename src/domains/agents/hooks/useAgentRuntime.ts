import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAccessToken } from "@/lib/auth";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";
import type { AgentMessage } from "./useAgentChat";

/**
 * GroUp Academy: Agent OS Runtime Hook (V3.1.0 - May 2026)
 * Description: Orchestrates contextual streaming connections from agent-runtime edge instances
 * with built-in thread persistence and fractional balance validation gates.
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

export interface AgentRuntimeSubject {
  kind: "talent" | "company";
  id: string;
}

export interface AgentRuntimeContext {
  route?: string;
  job_id?: string;
  application_id?: string;
  talent_id?: string;
  gig_id?: string;
  bid_id?: string;
  [k: string]: unknown;
}

export function useAgentRuntime(
  subjectOverride?: AgentRuntimeSubject,
  contextProvider?: () => AgentRuntimeContext | undefined,
): UseAgentRuntimeReturn {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const subject: AgentRuntimeSubject | null =
    subjectOverride ?? (talent?.id ? { kind: "talent", id: talent.id } : null);

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
      if (!subject?.id) return null;
      setIsLoading(true);
      setIsLoadingSessions(true);
      try {
        const { data: agent } = await supabase
          .from("ai_agents")
          .select("id, agent_key, message_credit_cost, connection_fee")
          .eq("agent_key", agentKey)
          .maybeSingle();

        if (!agent) {
          toast.error("The requested communication agent profile could not be found.");
          return null;
        }

        agentIdRef.current = agent.id;
        agentKeyRef.current = agent.agent_key;
        setPerResponseCost(Number(agent.message_credit_cost ?? 0));
        setConnectionFee(Number(agent.connection_fee ?? 0));

        const { data: existing } = await supabase
          .from("agent_threads")
          .select("*")
          .eq("agent_id", agent.id)
          .eq("subject_kind", subject.kind)
          .eq("subject_id", subject.id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
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
        return {
          id: "",
          agent_id: agent.id,
          agent_key: agent.agent_key,
          subject_kind: subject.kind,
          subject_id: subject.id,
          title: null,
          last_message_at: null,
          created_at: new Date().toISOString(),
        };
      } catch (err) {
        console.error("Error initializing background runtime session thread:", err);
        return null;
      } finally {
        setIsLoading(false);
        setIsLoadingSessions(false);
      }
    },
    [subject?.id, subject?.kind],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || !agentKeyRef.current || !talent?.id) return;

      // Pre-Flight validation gate: Verification of fractional credit balance models
      if (perResponseCost > 0) {
        const { data: credits } = await supabase
          .from("talent_credits")
          .select("balance")
          .eq("talent_id", talent.id)
          .single();

        if (!credits || credits.balance < perResponseCost) {
          toast.error(`Insufficient balance: ${perResponseCost} credits required to submit message.`);
          return;
        }
      }

      const userMsg: AgentMessage = { role: "user", content: content.trim() };
      setFormMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
      setIsStreaming(true);

      let assistantBuffer = "";
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Authentication sync required.");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-runtime`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            agent_key: agentKeyRef.current,
            thread_id: thread?.id || undefined,
            message: userMsg.content,
            subject_kind: subject?.kind,
            subject_id: subject?.id,
            context: contextProvider?.() ?? undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const { message } = handleAIError(errorData, response.status);
          toast.error(message);
          setMessages((prev) => prev.slice(0, -2));
          return;
        }

        const newThreadId = response.headers.get("X-Thread-Id");
        if (newThreadId && (!thread || thread.id !== newThreadId)) {
          setThread({
            id: newThreadId,
            agent_id: agentIdRef.current || "",
            agent_key: agentKeyRef.current || "",
            subject_kind: subject?.kind || "talent",
            subject_id: subject?.id || "",
            title: userMsg.content.slice(0, 60),
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Could not initialize text stream translation channel.");
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
              // Automated Efficiency: Invalidation keys loop refresh client cache data natively
              if (parsed?.type === "invalidations" && Array.isArray(parsed.keys)) {
                parsed.keys.forEach((k: string) => queryClient.invalidateQueries({ queryKey: [k] }));
                continue;
              }
              const token = parsed?.choices?.[0]?.delta?.content;
              if (typeof token === "string") {
                assistantBuffer += token;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantBuffer };
                  return next;
                });
              }
            } catch {
              /* Fragment chunk boundary passthrough handling */
            }
          }
        }

        if (!assistantBuffer) setMessages((prev) => prev.slice(0, -1));
      } catch (err) {
        console.error("Runtime stream connection error:", err);
        toast.error("Connection lost: Text stream translation interrupted.");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, thread, subject?.id, subject?.kind, queryClient, talent?.id, perResponseCost, contextProvider],
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
