import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError, getAIUnavailableToast } from "@/lib/aiErrorHandler";

/**
 * GroUp Academy: General Intelligence Hook
 * CTO Reference: Governs broad-spectrum AI chat sessions and streaming node management.
 */

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseAIGeneralChatReturn {
  sessionId: string | null;
  messages: AgentMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useAIGeneralChat(initialQuery?: string): UseAIGeneralChatReturn {
  const { talent } = useTalent();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initialSent = useRef(false);

  // PROTOCOL: Auto-provision free interaction node
  useEffect(() => {
    if (!talent?.id || sessionId) return;

    const createSession = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 1440 * 60 * 1000); // 24h Lifecycle

        // Telemetry: Increment platform usage counters
        await supabase.rpc("increment_agent_conversations", { p_agent_key: "ai-general" });

        const { data, error } = await supabase
          .from("agent_chat_sessions")
          .insert({
            talent_id: talent.id,
            agent_key: "ai-general",
            messages: [],
            is_active: true,
            credits_charged: 0,
            session_started_at: now.toISOString(),
            session_expires_at: expiresAt.toISOString(),
          })
          .select("id")
          .single();

        if (error) throw error;
        setSessionId(data.id);
      } catch (err) {
        console.error("Session Provisioning Fault:", err);
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, [talent?.id, sessionId]);

  // PROTOCOL: Auto-dispatch initial inquiry if provided
  useEffect(() => {
    if (sessionId && initialQuery && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      sendMessageInternal(initialQuery);
    }
  }, [sessionId, initialQuery]);

  const saveMessages = useCallback(
    async (msgs: AgentMessage[]) => {
      if (!sessionId) return;
      try {
        await supabase
          .from("agent_chat_sessions")
          .update({ messages: msgs as unknown as any })
          .eq("id", sessionId);
      } catch (err) {
        console.error("Registry Persistence Fault:", err);
      }
    },
    [sessionId],
  );

  const sendMessageInternal = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || isStreaming) return;

      const userMessage: AgentMessage = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      let assistantContent = "";

      try {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        if (!authSession?.access_token) throw new Error("Unauthenticated Node");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            agentKey: "ai-general",
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const { message, suggestion, isAIUnavailable } = handleAIError(errorData, response.status);
          if (isAIUnavailable) {
            toast.error(getAIUnavailableToast().description);
          } else {
            toast.error(message, { description: suggestion });
          }
          return;
        }

        if (!response.body) throw new Error("Stream Body Missing");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        // Push empty assistant artifact to the UI
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        // REINFORCED: Neural Extraction Loop
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
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.role === "assistant") {
                    updated[lastIdx] = { role: "assistant", content: assistantContent };
                  }
                  return updated;
                });
              }
            } catch {
              // Fragmented JSON node: return to buffer for next cycle
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // PROTOCOL: Final session commit
        const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
        await saveMessages(finalMessages);
      } catch (error) {
        console.error("Transmission Fault:", error);
        toast.error("Neural Sync Interrupted.");
        setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, messages, isStreaming, saveMessages],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      await sendMessageInternal(content);
    },
    [sendMessageInternal],
  );

  return { sessionId, messages, isStreaming, isLoading, sendMessage };
}
