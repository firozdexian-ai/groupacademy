import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, ShieldAlert, Zap } from "lucide-react";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentRuntime } from "@/hooks/useAgentRuntime";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Interface Hub
 * Orchestrates high-fidelity AI agent sessions with real-time credit telemetry.
 * 2026 Layout Standard: Fixed-viewport containment to prevent mobile bounce.
 */
export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    thread,
    messages,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    endSession,
    isLoadingSessions,
    perResponseCost,
  } = useAgentRuntime();
  

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

  // CTO FIX: High-Fidelity Loading Shell
  if (isInitializing || isLoadingDbAgent) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20 stroke-[1.5px]" />
          <MessageSquare className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
            Establishing Secure Channel
          </p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
            Synchronizing Neural Handshake...
          </p>
        </div>
      </div>
    );
  }

  if (!activeAgent) return null;

  const IconComponent = getIcon(activeAgent.iconName) || MessageSquare;

  return (
    /** * ARCHITECTURAL HUB:
     * fixed inset-0 + precise navigation offsets to prevent browser chrome jumping.
     */
    <div className="fixed inset-0 top-[60px] bottom-[65px] flex flex-col overflow-hidden bg-background">
      <main
        className={cn(
          "flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden transition-all duration-500",
          "bg-card/30 backdrop-blur-xl border-x border-border/40 shadow-2xl",
        )}
      >
        {!isInitializing ? (
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
          /* Error State: Diagnostic Protocol */
          <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-in fade-in zoom-in-95">
            <div className="h-24 w-24 rounded-[40px] bg-destructive/10 flex items-center justify-center mb-8 rotate-3">
              <ShieldAlert className="h-12 w-12 text-destructive shadow-sm" />
            </div>
            <h3 className="font-black uppercase tracking-tighter text-2xl mb-2">Session Interrupted</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic mb-8 max-w-[280px]">
              The secure uplink with the specialist has been severed. Registry handshake failed.
            </p>
            <Button
              size="lg"
              onClick={() => window.location.reload()}
              className="rounded-2xl px-10 font-black uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20"
            >
              <Zap className="mr-2 h-4 w-4" />
              Re-establish Connection
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
