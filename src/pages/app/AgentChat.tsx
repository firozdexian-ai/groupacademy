import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";

export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    session,
    messages,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    endSession,
    isLoadingSessions,
    perResponseCost,
  } = useAgentChat();

  const { balance } = useCredits();

  // 1. Fetch Agent metadata from DB (Primary Source)
  const { data: dbAgent, isLoading: isLoadingDbAgent } = useQuery({
    queryKey: ["ai-agent-detail", agentKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("agent_key", agentKey!)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!agentKey,
    staleTime: 10 * 60 * 1000,
  });

  // 2. Fallback to static constants if DB record hasn't loaded or doesn't exist
  const staticAgent = useMemo(() => (agentKey ? getAgentById(agentKey) : null), [agentKey]);

  // 3. Construct the active agent object dynamically
  const activeAgent = useMemo(() => {
    if (dbAgent) {
      return {
        name: dbAgent.name,
        color: dbAgent.bg_color || "bg-primary",
        iconColor: dbAgent.color || "text-primary-foreground",
        iconName: dbAgent.icon || "MessageSquare",
        avatarUrl: dbAgent.avatar_url,
        creditCost: dbAgent.credit_cost,
      };
    }
    if (staticAgent) {
      return {
        name: staticAgent.name,
        color: staticAgent.bgColor,
        iconColor: staticAgent.iconColor,
        iconName: "MessageSquare", // Default for static
        avatarUrl: null,
        creditCost: 10,
      };
    }
    return null;
  }, [dbAgent, staticAgent]);

  // 4. Session initialization with improved routing logic
  useEffect(() => {
    // Only redirect if we've finished checking both DB and static records and found nothing
    if (!isLoadingDbAgent && !activeAgent && !agentKey) {
      toast.error("Agent not found");
      navigate("/app/agents");
      return;
    }

    if (isLoadingSessions || isLoadingDbAgent || !agentKey) return;

    const initializeSession = async () => {
      try {
        const newSession = await startOrResumeSession(agentKey);
        if (newSession) {
          setIsInitializing(false);
        } else {
          throw new Error("Session creation returned null");
        }
      } catch (err) {
        console.error("Session Initialization Error:", err);
        toast.error("Failed to start session");
        navigate("/app/agents");
      }
    };

    initializeSession();
  }, [agentKey, isLoadingSessions, isLoadingDbAgent, activeAgent, navigate, startOrResumeSession]);

  const handleBack = () => navigate("/app/agents");

  const handleEndSession = async () => {
    await endSession();
    toast.success("Conversation ended");
    navigate("/app/agents");
  };

  // Loading State
  if (isInitializing || isLoadingDbAgent) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to {activeAgent?.name || "Agent"}...</p>
        </div>
      </div>
    );
  }

  if (!activeAgent || !agentKey) return null;

  // Resolve Icon Component from iconMap or fallback to MessageSquare
  const IconComponent = getIcon(activeAgent.iconName) || MessageSquare;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col pb-16 md:pb-0">
      {session && (
        <AgentChatDialog
          agent={{
            id: agentKey,
            name: activeAgent.name,
            color: activeAgent.color,
            icon: <IconComponent className={`h-4 w-4 ${activeAgent.iconColor}`} />,
            avatarUrl: activeAgent.avatarUrl,
          }}
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
          onBack={handleBack}
          onEndSession={handleEndSession}
          perResponseCost={activeAgent.creditCost || perResponseCost}
        />
      )}
    </div>
  );
}
