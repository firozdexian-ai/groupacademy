import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError, getAIUnavailableToast } from "@/lib/aiErrorHandler";

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

interface UseAgentChatReturn {
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
  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentSessions, setRecentSessions] = useState<AgentSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [perResponseCost, setPerResponseCost] = useState<number>(1);

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

      const sessions = (data || []).map((s) => ({
        ...s,
        messages: (s.messages as unknown as AgentMessage[]) || [],
      }));

      setRecentSessions(sessions);
    } catch (error) {
      console.error("Failed to load recent sessions:", error);
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
    } catch (error) {
      console.error("Failed to load session:", error);
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

        const { data: existingSessions } = await supabase
          .from("agent_chat_sessions")
          .select("*")
          .eq("talent_id", talent.id)
          .eq("agent_key", agentKey)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingSessions && existingSessions.length > 0) {
          const existing = existingSessions[0];
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
        const sessionData: AgentSession = { ...data, messages: [] };
        setSession(sessionData);
        setMessages([]);
        return sessionData;
      } catch (error) {
        console.error("Session error:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [talent?.id],
  );

  const endSession = useCallback(async () => {
    if (!session) return;
    await supabase.from("agent_chat_sessions").update({ is_active: false }).eq("id", session.id);
    setSession((prev) => (prev ? { ...prev, is_active: false } : null));
  }, [session]);

  const saveMessages = useCallback(
    async (newMessages: AgentMessage[], additionalCredits: number = 0) => {
      if (!session) return;
      const updatePayload: any = { messages: newMessages as unknown as any };
      if (additionalCredits > 0) {
        updatePayload.credits_charged = (session.credits_charged || 0) + additionalCredits;
      }
      await supabase.from("agent_chat_sessions").update(updatePayload).eq("id", session.id);
    },
    [session],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || !content.trim() || isStreaming) return;

      const userMessage: AgentMessage = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      let assistantContent = "";

      try {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        if (!authSession?.access_token) throw new Error("Unauthenticated");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            agentKey: session.agent_key,
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
        if (!reader) throw new Error("No reader");

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  assistantContent += token;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                  });
                }
              } catch (e) {}
            }
          }
        }

        if (perResponseCost > 0 && assistantContent) {
          const { data: deductResult } = await supabase.rpc("deduct_credits", {
            p_amount: perResponseCost,
            p_service_type: "AI_AGENT_CHAT",
            p_reference_id: session.id,
            p_description: `AI Response: ${session.agent_key}`,
          });

          if (deductResult && !(deductResult as any).success) {
            toast.error("Insufficient credits.");
            return;
          }
        }

        await saveMessages([...newMessages, { role: "assistant", content: assistantContent }], perResponseCost);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveMessages, perResponseCost],
  );

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
