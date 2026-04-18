import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";

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

  // CTO: Fetching agent metadata from DB for live branding/pricing
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

  const staticAgent = useMemo(() => (agentKey ? getAgentById(agentKey) : null), [agentKey]);

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
        iconName: "MessageSquare",
        avatarUrl: null,
        creditCost: 1,
      };
    }
    return null;
  }, [dbAgent, staticAgent]);

  useEffect(() => {
    if (isLoadingDbAgent || isLoadingSessions) return;

    if (!activeAgent && !isLoadingDbAgent && agentKey) {
      toast.error("Specialist not found");
      navigate("/app/agents");
      return;
    }

    const initializeSession = async () => {
      if (!agentKey) return;
      try {
        const result = await startOrResumeSession(agentKey);
        if (result) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Session Init Failure:", err);
        toast.error("Could not establish connection");
        navigate("/app/agents");
      }
    };

    initializeSession();
  }, [agentKey, isLoadingDbAgent, isLoadingSessions, activeAgent, navigate, startOrResumeSession]);

  if (!agentKey) return null;

  // CTO FIX: Standardized Loading Shell
  if (isInitializing || isLoadingDbAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-[80dvh] space-y-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          <MessageSquare className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          Establishing Secure Channel...
        </p>
      </div>
    );
  }

  if (!activeAgent) return null;

  const IconComponent = getIcon(activeAgent.iconName) || MessageSquare;

  return (
    /** * CTO ARCHITECTURAL NOTE:
     * fixed inset-0 + padding-top/bottom is the only way to stop mobile "bounce"
     * 60px = Top Navigation | 65px = Bottom Nav Bar
     */
    <div className="fixed inset-0 top-[60px] bottom-[65px] flex flex-col overflow-hidden bg-background z-10">
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden shadow-2xl bg-card">
        {session ? (
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
            onBack={() => navigate("/app/agents")}
            onEndSession={async () => {
              await endSession();
              navigate("/app/agents");
            }}
            perResponseCost={activeAgent.creditCost || perResponseCost}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-destructive/30 mb-4" />
            <h3 className="font-bold text-lg">Session Interrupted</h3>
            <p className="text-sm text-muted-foreground mb-6">We lost the handshake with the AI specialist.</p>
            <Button onClick={() => window.location.reload()}>Re-establish Connection</Button>
          </div>
        )}
      </main>
    </div>
  );
}
