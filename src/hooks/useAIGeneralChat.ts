import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError, getAIUnavailableToast } from "@/lib/aiErrorHandler";

/**
 * GroUp Academy: General Intelligence Hook (V2.1.28)
 * CTO Reference: Authoritative controller for free-tier AI streaming sessions.
 * Phase: Z0 Code Freeze Hardened.
 * Architecture: Talent Line - Automated Efficiency.
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

  // --- PROTOCOL: AUTOMATIC_SESSION_PROVISIONING ---
  useEffect(() => {
    if (!talent?.id || sessionId) return;

    const initializeNode = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 1440 * 60 * 1000); // 24h Registry Lifecycle

        // Telemetry: Synchronize platform-level usage counters for the Digital Workforce
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
          .maybeSingle();

        if (error) throw error;
        if (data) setSessionId(data.id);
      } catch (err) {
        console.error("[Digital Workforce] SESSION_PROVISIONING_FAULT:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNode();
  }, [talent?.id, sessionId]);

  // --- PROTOCOL: DEEP_LINK_INQUIRY_SYNC ---
  useEffect(() => {
    if (sessionId && initialQuery && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      executeNeuralSync(initialQuery);
    }
  }, [sessionId, initialQuery, messages.length]);

  const commitTrajectory = useCallback(
    async (msgs: AgentMessage[]) => {
      if (!sessionId) return;
      try {
        await supabase
          .from("agent_chat_sessions")
          .update({
            messages: msgs as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
      } catch (err) {
        console.error("[Digital Workforce] REGISTRY_PERSISTENCE_FAULT:", err);
      }
    },
    [sessionId],
  );

  const executeNeuralSync = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || isStreaming) return;

      const userArtifact: AgentMessage = { role: "user", content: content.trim() };
      const activeTrajectory = [...messages, userArtifact];
      setMessages(activeTrajectory);
      setIsStreaming(true);

      let assistantBuffer = "";

      try {
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
            agentKey: "ai-general",
            messages: activeTrajectory.map((m) => ({ role: m.role, content: m.content })),
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

        if (!response.body) throw new Error("STREAM_BODY_MISSING");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let transmissionBuffer = "";

        // UI HUD: Provision Assistant Message Node
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          transmissionBuffer += decoder.decode(value, { stream: true });

          let nlIndex: number;
          while ((nlIndex = transmissionBuffer.indexOf("\n")) !== -1) {
            let line = transmissionBuffer.slice(0, nlIndex);
            transmissionBuffer = transmissionBuffer.slice(nlIndex + 1);

            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;

              try {
                const parsed = JSON.parse(payload);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  assistantBuffer += token;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (updated[lastIdx]?.role === "assistant") {
                      updated[lastIdx] = { ...updated[lastIdx], content: assistantBuffer };
                    }
                    return updated;
                  });
                }
              } catch (e) {
                // Buffer fragmented JSON node for next cycle
                transmissionBuffer = line + "\n" + transmissionBuffer;
                break;
              }
            }
          }
        }

        const finalTrajectory = [...activeTrajectory, { role: "assistant" as const, content: assistantBuffer }];
        await commitTrajectory(finalTrajectory);
      } catch (err) {
        console.error("[Digital Workforce] TRANSMISSION_FAULT:", err);
        toast.error("NEURAL_SYNC_INTERRUPTED");
        setMessages((prev) => prev.slice(0, -1)); // Rollback incomplete node
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, messages, isStreaming, commitTrajectory],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      await executeNeuralSync(content);
    },
    [executeNeuralSync],
  );

  return { sessionId, messages, isStreaming, isLoading, sendMessage };
}
