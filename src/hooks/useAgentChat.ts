import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";

/**
 * GroUp Academy: Neural Chat Orchestrator
 * CTO Reference: Governs streaming AI interactions, session state, and credit billing.
 */

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

// ... interfaces remain standard ...

export function useAgentChat(): UseAgentChatReturn {
  const { talent } = useTalent();
  // ... state initializations ...

  /**
   * REINFORCED: Session Ingestion
   * Restores a specific interaction node from the global registry.
   */
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

      // Calibrate per-response cost based on Agent Persona configuration
      const { data: agentConfig } = await supabase
        .from("ai_agents")
        .select("credit_cost")
        .eq("agent_key", sessionData.agent_key)
        .maybeSingle();

      if (agentConfig) setPerResponseCost(agentConfig.credit_cost);
    } catch (error) {
      console.error("Registry Ingestion Fault:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * CORE LOGIC: Send Message Protocol
   * Manages the fetch stream and final credit settlement.
   */
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
        if (!authSession?.access_token) throw new Error("Unauthorized Node");

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
          setMessages(messages); // Revert UI to last stable state
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("Stream Reader Initialization Failed");

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        // Token Extraction Loop
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

        // Post-Stream Credit Settlement
        if (perResponseCost > 0 && assistantContent) {
          const { data: deductResult } = await supabase.rpc("deduct_credits", {
            p_amount: perResponseCost,
            p_service_type: "AI_AGENT_CHAT",
            p_reference_id: session.id,
            p_description: `AI Persona Response: ${session.agent_key}`,
          });

          if (deductResult && !(deductResult as any).success) {
            toast.error("Credit Depletion: Recharge required to proceed.");
            return;
          }
        }

        // Finalize transaction in the permanent log
        await saveMessages([...newMessages, { role: "assistant", content: assistantContent }], perResponseCost);
      } catch (error) {
        console.error("Neural Transmission Fault:", error);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveMessages, perResponseCost],
  );

  // ... rest of the hook implementation ...

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
