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
  isSessionExpired: boolean;
  timeRemaining: number | null;
  isLoadingSessions: boolean;
  /** Per-response credit cost for the current agent */
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

  // No more session expiration — sessions are persistent
  const isSessionExpired = false;
  const timeRemaining = null;

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

      // Load the per-response cost for this agent
      const { data: agentConfig } = await supabase
        .from("ai_agents")
        .select("credit_cost")
        .eq("agent_key", sessionData.agent_key)
        .eq("is_active", true)
        .single();
      setPerResponseCost(agentConfig?.credit_cost ?? 1);
    } catch (error) {
      console.error("Failed to load session:", error);
      toast.error("Failed to load chat session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Start a new session or resume existing one for an agent.
   * Per-response model: no upfront credit charge, no time limit.
   */
  const startOrResumeSession = useCallback(
    async (agentKey: string): Promise<AgentSession | null> => {
      if (!talent?.id) {
        toast.error("Please complete your profile first");
        return null;
      }

      setIsLoading(true);
      try {
        // Fetch agent config for per-response cost
        const { data: agentConfig } = await supabase
          .from("ai_agents")
          .select("credit_cost")
          .eq("agent_key", agentKey)
          .eq("is_active", true)
          .single();

        const creditCost = agentConfig?.credit_cost ?? 1;
        setPerResponseCost(creditCost);

        // Check for existing active session for this agent
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

        // Create new session — no upfront cost, no time limit
        const now = new Date();
        const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        await supabase.rpc("increment_agent_conversations", { p_agent_key: agentKey });

        const { data, error } = await supabase
          .from("agent_chat_sessions")
          .insert({
            talent_id: talent.id,
            agent_key: agentKey,
            messages: [],
            is_active: true,
            credits_charged: 0,
            session_started_at: now.toISOString(),
            session_expires_at: farFuture.toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        const sessionData: AgentSession = {
          ...data,
          messages: [],
        };

        setSession(sessionData);
        setMessages([]);
        return sessionData;
      } catch (error) {
        console.error("Failed to start session:", error);
        toast.error("Failed to start chat session");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [talent?.id],
  );

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      await supabase.from("agent_chat_sessions").update({ is_active: false }).eq("id", session.id);
      setSession((prev) => (prev ? { ...prev, is_active: false } : null));
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }, [session]);

  const saveMessages = useCallback(
    async (newMessages: AgentMessage[], additionalCredits: number = 0) => {
      if (!session) return;

      try {
        const updatePayload: any = { messages: newMessages as unknown as any };
        if (additionalCredits > 0) {
          updatePayload.credits_charged = (session.credits_charged || 0) + additionalCredits;
        }
        await supabase
          .from("agent_chat_sessions")
          .update(updatePayload)
          .eq("id", session.id);
        
        if (additionalCredits > 0) {
          setSession(prev => prev ? { ...prev, credits_charged: (prev.credits_charged || 0) + additionalCredits } : null);
        }
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
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

        if (!authSession?.access_token) {
          throw new Error("User not authenticated");
        }

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
          const { message, suggestion, isAIUnavailable } = handleAIError(errorData, response.status);
          
          if (isAIUnavailable) {
            const { description } = getAIUnavailableToast();
            toast.error(description);
          } else {
            toast.error(message, { description: suggestion });
          }
          setMessages(messages); // revert
          return;
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const tokenContent = parsed.choices?.[0]?.delta?.content;
              if (tokenContent) {
                assistantContent += tokenContent;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  }
                  return updated;
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Deduct credits per-response (only if cost > 0)
        if (perResponseCost > 0 && assistantContent) {
          const { data: deductResult } = await supabase.rpc("deduct_credits", {
            p_amount: perResponseCost,
            p_service_type: "AI_AGENT_CHAT",
            p_reference_id: session.id,
            p_description: `AI Agent response (${session.agent_key})`,
          });

          if (deductResult && !(deductResult as any).success) {
            console.warn("Credit deduction failed:", (deductResult as any).error);
          }
        }

        // Save messages after streaming completes
        const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
        await saveMessages(finalMessages, perResponseCost);
      } catch (error) {
        console.error("Send message error:", error);
        toast.error("Failed to send message. Please try again.");
        setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveMessages, perResponseCost],
  );

  // Load recent sessions when talent changes
  useEffect(() => {
    if (talent?.id) {
      loadRecentSessions();
    }
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
    isSessionExpired,
    timeRemaining,
    isLoadingSessions,
    perResponseCost,
  };
}
