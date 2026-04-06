import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    loadSession,
    endSession,
    recentSessions,
    isLoadingSessions,
    perResponseCost,
  } = useAgentChat();

  const { balance } = useCredits();

  const staticAgent = agentKey ? getAgentById(agentKey) : null;

  const { data: dbAgent } = useQuery({
    queryKey: ["ai-agent-detail", agentKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("avatar_url, name, bg_color, color, credit_cost")
        .eq("agent_key", agentKey!)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!agentKey,
    staleTime: 10 * 60 * 1000,
  });

  const agent = staticAgent;

  // Session initialization: auto-start or resume (no credit gate upfront)
  useEffect(() => {
    if (!agentKey || !agent) {
      navigate("/app/agents");
      return;
    }

    if (isLoadingSessions) return;

    const initializeSession = async () => {
      const newSession = await startOrResumeSession(agentKey);
      if (newSession) {
        setIsInitializing(false);
      } else {
        toast.error("Failed to start session");
        navigate("/app/agents");
      }
    };

    initializeSession();
  }, [agentKey, isLoadingSessions, agent, navigate, startOrResumeSession]);

  const handleBack = () => {
    navigate("/app/agents");
  };

  const handleEndSession = async () => {
    await endSession();
    toast.success("Conversation ended");
    navigate("/app/agents");
  };

  if (!agent || !agentKey) return null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AgentIcon = agent.icon;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col pb-16 md:pb-0">
      {session && (
        <AgentChatDialog
          agent={{
            id: agentKey,
            name: agent.name,
            color: agent.bgColor,
            icon: <AgentIcon className={`h-4 w-4 ${agent.iconColor}`} />,
            avatarUrl: dbAgent?.avatar_url,
          }}
          messages={messages}
          isStreaming={isStreaming}
          timeRemaining={0}
          isSessionExpired={false}
          onSendMessage={sendMessage}
          onBack={handleBack}
          onEndSession={handleEndSession}
          perResponseCost={perResponseCost}
        />
      )}
    </div>
  );
}
