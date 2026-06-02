import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAccessToken } from "@/lib/auth";
import { deductCreditsRpc } from "@/domains/finance/repo/financeRepo";
import { updateAgentChatSession, getAgentChatSession, getAgentCreditCost } from "@/domains/agents/repo/agentsRepo";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";

/**
 * GroUp Academy: Agent Chat Orchestrator Data Hook
 * Architecture: Automated efficiency tracking for talent lines with fractional credit balance controls.
 */

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentSession {
  id: string;
  agent_key: string;
  messages: AgentMessage[];
  is_active: boolean;
  credits_charged: number;
  session_started_at: string;
  session_expires_at: string;
  created_at: string;
}

export interface UseAgentChatReturn {
  session: AgentSession | null;
  messages: AgentMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  startOrResumeSession: (agentKey: string) => Promise<AgentSession | null>;
  loadSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  recentSessions: AgentSession[];
  loadRecentSessions: () => Promise<void>;
  isLoadingSessions: boolean;
  perResponseCost: number;
}

export function useAgentChat(): UseAgentChatReturn {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentSessions, setRecentSessions] = useState<AgentSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [perResponseCost, setPerResponseCost] = useState<number>(1);

  const saveConversation = useCallback(
    async (newMessages: AgentMessage[], additionalCredits: number = 0) => {
      if (!session) return;
      const updatePayload: any = {
        messages: newMessages as unknown as any,
        updated_at: new Date().toISOString(),
      };

      if (additionalCredits > 0) {
        updatePayload.credits_charged = (Number(session.credits_charged) || 0) + additionalCredits;
      }

      await updateAgentChatSession(session.id, updatePayload);
    },
    [session],
  );

  const loadRecentSessions = useCallback(async () => {
    if (!talent?.id) {
      setIsLoadingSessions(false);
      return;
    }
    setIsLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from("agent_chat_sessions")
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentSessions(
        (data || []).map((s) => ({
          ...s,
          messages: (s.messages as unknown as AgentMessage[]) || [],
        })),
      );
    } catch (err) {
      console.error("Could not fetch recent sessions from repository directory:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [talent?.id]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const data = await getAgentChatSession(sessionId);

      const sessionData: AgentSession = {
        ...data,
        messages: (data.messages as unknown as AgentMessage[]) || [],
      };

      setSession(sessionData);
      setMessages(sessionData.messages);

      const cost = await getAgentCreditCost(sessionData.agent_key);
      if (cost != null) setPerResponseCost(cost);
    } catch (err) {
      console.error("Error loading chat session coordinates:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startOrResumeSession = useCallback(
    async (agentKey: string): Promise<AgentSession | null> => {
      if (!talent?.id) return null;
      setIsLoading(true);
      try {
        const { data: agentConfig } = await supabase
          .from("ai_agents")
          .select("credit_cost")
          .eq("agent_key", agentKey)
          .maybeSingle();

        const cost = agentConfig?.credit_cost ?? 1;
        setPerResponseCost(cost);

        const { data: existing } = await supabase
          .from("agent_chat_sessions")
          .select("*")
          .eq("talent_id", talent.id)
          .eq("agent_key", agentKey)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const sessionData: AgentSession = {
            ...existing,
            messages: (existing.messages as unknown as AgentMessage[]) || [],
          };
          setSession(sessionData);
          setMessages(sessionData.messages);
          return sessionData;
        }

        const now = new Date();
        const { data, error } = await supabase
          .from("agent_chat_sessions")
          .insert({
            talent_id: talent.id,
            agent_key: agentKey,
            messages: [],
            is_active: true,
            credits_charged: 0,
            session_started_at: now.toISOString(),
            session_expires_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        const newSession: AgentSession = { ...data, messages: [] };
        setSession(newSession);
        setMessages([]);
        return newSession;
      } catch (err) {
        console.error("Could not complete assistant session initialization loop:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [talent?.id],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || !content.trim() || isStreaming || !talent?.id) return;

      const userMessage: AgentMessage = { role: "user", content: content.trim() };
      const currentTrajectory = [...messages, userMessage];
      setMessages(currentTrajectory);
      setIsStreaming(true);

      try {
        // Hardened Pre-Flight Balance Check
        if (perResponseCost > 0) {
          const { data: creditData } = await supabase
            .from("talent_credits")
            .select("balance")
            .eq("talent_id", talent.id)
            .single();

          if (!creditData || creditData.balance < perResponseCost) {
            toast.error(`Insufficient balance: ${perResponseCost} credits required. Please top up your wallet.`);
            setMessages(messages); // Rollback optimistic UI
            setIsStreaming(false);
            return;
          }
        }

        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Authentication sync required.");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            agentKey: session.agent_key,
            messages: currentTrajectory.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const { message } = handleAIError(errorData, response.status);
          toast.error(message);
          setMessages(messages);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("Could not initialize text stream translation channel.");

        // Optimistic Assistant Message placeholder
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        let assistantBuffer = "";
        const invalidationKeys = new Set<string>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;
              try {
                const parsed = JSON.parse(payload);

                // Automatic cache invalidation bridge loop execution
                if (parsed?.type === "invalidations" && Array.isArray(parsed.keys)) {
                  for (const k of parsed.keys) invalidationKeys.add(String(k));
                  continue;
                }

                const token = parsed.choices?.[0]?.delta?.content || null;

                if (token) {
                  assistantBuffer += token;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantBuffer };
                    return updated;
                  });
                }
              } catch (e) {
                // Ignore fragmented JSON segments safely during live text rendering
              }
            }
          }
        }

        // Execution of tool invalidations layout lists
        if (invalidationKeys.size > 0) {
          for (const k of invalidationKeys) {
            queryClient.invalidateQueries({ queryKey: [k] });
          }
        }

        // Post-Response Credit Settlement Sync
        if (perResponseCost > 0 && assistantBuffer) {
          let handshake: any = null;
          try {
            handshake = await deductCreditsRpc({
              amount: perResponseCost,
              serviceType: "AI_AGENT_CHAT",
              referenceId: session.id,
              description: `Agent Chat: ${session.agent_key}`,
              talentId: talent.id,
            });
          } catch (deductionError) {
            console.warn("Credit settlement pipeline delay or missing transaction return:", deductionError);
          }
          if (handshake && !(handshake as any).success) {
            toast.error("Session suspended: Your credit balance has been exhausted.");
          }
        }

        await saveConversation(
          [...currentTrajectory, { role: "assistant", content: assistantBuffer }],
          perResponseCost,
        );
      } catch (err) {
        console.error("Background assistant connection dropped during stream sync loop:", err);
        setMessages(messages); // Fallback and clear incomplete optimistic response element block
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveConversation, perResponseCost, talent?.id, queryClient],
  );

  const endSession = useCallback(async () => {
    if (!session) return;
    await updateAgentChatSession(session.id, { is_active: false });
    setSession((prev) => (prev ? { ...prev, is_active: false } : null));
  }, [session]);

  useEffect(() => {
    if (talent?.id) loadRecentSessions();
  }, [talent?.id, loadRecentSessions]);

  return {
    session,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    loadSession,
    endSession,
    recentSessions,
    loadRecentSessions,
    isLoadingSessions,
    perResponseCost,
  };
}
