import { useState, useCallback, useEffect, useRef } from "react";
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
  startNewSession: (agentKey: string) => Promise<AgentSession | null>;
  loadSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  recentSessions: AgentSession[];
  loadRecentSessions: () => Promise<void>;
  isSessionExpired: boolean;
  timeRemaining: number | null;
  isLoadingSessions: boolean;
}

export function useAgentChat(): UseAgentChatReturn {
  const { talent } = useTalent();
  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentSessions, setRecentSessions] = useState<AgentSession[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate if session is expired
  const isSessionExpired = session ? new Date(session.session_expires_at) < new Date() : false;

  // Update time remaining every second
  useEffect(() => {
    if (!session || !session.is_active) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(session.session_expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0 && session.is_active) {
        // Session expired, mark as inactive
        endSession();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session]);

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
        .limit(10);

      if (error) throw error;

      // Parse messages from JSON
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
    } catch (error) {
      console.error("Failed to load session:", error);
      toast.error("Failed to load chat session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewSession = useCallback(
    async (agentKey: string): Promise<AgentSession | null> => {
      if (!talent?.id) {
        toast.error("Please complete your profile first");
        return null;
      }

      setIsLoading(true);
      try {
        // Create new session with 30-minute expiry
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

        const { data, error } = await supabase
          .from("agent_chat_sessions")
          .insert({
            talent_id: talent.id,
            agent_key: agentKey,
            messages: [],
            is_active: true,
            credits_charged: 10,
            session_started_at: now.toISOString(),
            session_expires_at: expiresAt.toISOString(),
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
    async (newMessages: AgentMessage[]) => {
      if (!session) return;

      try {
        await supabase
          .from("agent_chat_sessions")
          .update({ messages: newMessages as unknown as any })
          .eq("id", session.id);
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    },
    [session],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || !content.trim() || isStreaming) return;

      if (isSessionExpired) {
        toast.error("Session expired. Please start a new session.");
        return;
      }

      const userMessage: AgentMessage = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      let assistantContent = "";

      try {
        // SECURITY FIX: Get the actual user session token
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
            // Pass the USER token, not the Anon Key
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
          return;
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        // Add empty assistant message
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
              // Incomplete JSON, put it back
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Save messages after streaming completes
        const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
        await saveMessages(finalMessages);
      } catch (error) {
        console.error("Send message error:", error);
        toast.error("Failed to send message. Please try again.");
        // Remove the failed user message so they can try again
        setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, isSessionExpired, saveMessages],
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
    startNewSession,
    loadSession,
    endSession,
    recentSessions,
    loadRecentSessions,
    isSessionExpired,
    timeRemaining,
    isLoadingSessions,
  };
}
