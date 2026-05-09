import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";

/**
 * GroUp Academy: Neural Chat Orchestrator (V2.0.29)
 * CTO Audit: Bulletproof stream parser syntax and enforced Pre-Flight Credit Checks.
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

  const saveTrajectory = useCallback(
    async (newMessages: AgentMessage[], additionalCredits: number = 0) => {
      if (!session) return;
      const updatePayload: any = {
        messages: newMessages as unknown as any,
        updated_at: new Date().toISOString(),
      };

      if (additionalCredits > 0) {
        updatePayload.credits_charged = (session.credits_charged || 0) + additionalCredits;
      }

      await supabase.from("agent_chat_sessions").update(updatePayload).eq("id", session.id);
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
      console.error("SESSION_REGISTRY_FAULT:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [talent?.id]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("agent_chat_sessions").select("*").eq("id", sessionId).single();
      if (error) throw error;

      const sessionData: AgentSession = {
        ...data,
        messages: (data.messages as unknown as AgentMessage[]) || [],
      };

      setSession(sessionData);
      setMessages(sessionData.messages);

      const { data: agentConfig } = await supabase
        .from("ai_agents")
        .select("credit_cost")
        .eq("agent_key", sessionData.agent_key)
        .maybeSingle();

      if (agentConfig) setPerResponseCost(agentConfig.credit_cost);
    } catch (err) {
      console.error("SESSION_INGRESS_FAULT:", err);
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
        console.error("AGENT_INITIALIZATION_FAULT:", err);
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
        // Pre-Flight Credit Check
        if (perResponseCost > 0) {
          const { data: creditData } = await supabase
            .from("talent_credits")
            .select("balance")
            .eq("talent_id", talent.id)
            .single();

          if (!creditData || creditData.balance < perResponseCost) {
            toast.error(`FISCAL_DEFICIT: ${perResponseCost} CR required to process. Please recharge.`);
            setMessages(messages);
            setIsStreaming(false);
            return;
          }
        }

        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        if (!authSession?.access_token) throw new Error("AUTH_SYNC_REQUIRED");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
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
        if (!reader) throw new Error("STREAM_TRANSMISSION_FAULT");

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        let assistantBuffer = "";

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
                // BULLETPROOF PARSER SYNTAX HERE - No optional chaining
                const token =
                  parsed.choices && parsed.choices && parsed.choices.delta ? parsed.choices.delta.content : null;
                if (token) {
                  assistantBuffer += token;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantBuffer };
                    return updated;
                  });
                }
              } catch (e) {
                /* Fragmented JSON handling */
              }
            }
          }
        }

        if (perResponseCost > 0 && assistantBuffer) {
          const { data: creditHandshake, error: deductionError } = await supabase.rpc("deduct_credits" as any, {
            p_amount: perResponseCost,
            p_service_type: "AI_AGENT_CHAT",
            p_reference_id: session.id,
            p_description: `Neural_Node: ${session.agent_key}`,
            p_talent_id: talent.id,
          });

          if (deductionError) {
            console.warn("Post-stream deduction delayed or failed", deductionError);
          } else if (creditHandshake && !(creditHandshake as any).success) {
            toast.error("FISCAL_DEFICIT: Credits exhausted during sync.");
          }
        }

        await saveTrajectory([...currentTrajectory, { role: "assistant", content: assistantBuffer }], perResponseCost);
      } catch (err) {
        console.error("NEURAL_SYNC_FAULT:", err);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveTrajectory, perResponseCost, talent?.id],
  );

  const endSession = useCallback(async () => {
    if (!session) return;
    await supabase.from("agent_chat_sessions").update({ is_active: false }).eq("id", session.id);
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
