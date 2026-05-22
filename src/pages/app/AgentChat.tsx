import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, ShieldAlert, Zap } from "lucide-react";
import { AgentChatDialog } from "@/domains/agents/components/chat/AgentChatDialog";
import { useAgentRuntime } from "@/domains/agents/hooks/useAgentRuntime";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentMetadata {
  name: string;
  color: string;
  iconColor: string;
  iconName: string;
  avatarUrl: string | null;
  creditCost: number;
}

/**
 * GroUp Academy: High-Fidelity Neural Interface Hub (AgentChat)
 * Hardened responsive communication node isolating asynchronous sessions and protecting runtime state loops from mounting thrash.
 * Version: Launch Candidate · Phase Z1 Production Architecture Locked
 */
export default function AgentChat() {
  const { agentKey: unverifiedAgentKeyStr } = useParams<{ agentKey: string }>();
  const executeNavigationHook = useNavigate();

  const [isSessionInitializing, setIsSessionInitializing] = React.useState<boolean>(true);

  const { messages, isStreaming, sendMessage, startOrResumeSession, endSession, isLoadingSessions, perResponseCost } =
    useAgentRuntime();

  const { balance } = useCredits();

  // =========================================================================
  // DATA ACQUISITION WIRE: FETCH SYSTEM METADATA FROM REALTIME STORAGE
  // =========================================================================
  const { data: databaseAgentRecord, isLoading: isDatabaseAgentResolving } = useQuery({
    queryKey: ["ai-agent-telemetry-detail", unverifiedAgentKeyStr],
    queryFn: async () => {
      if (!unverifiedAgentKeyStr) return null;
      const { data: extractedAgentNode, error: agentQueryError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("agent_key", unverifiedAgentKeyStr)
        .eq("is_active", true)
        .maybeSingle();

      if (agentQueryError) throw agentQueryError;
      return extractedAgentNode;
    },
    enabled: !!unverifiedAgentKeyStr,
    staleTime: 10 * 60 * 1000,
  });

  const staticFallbackAgentNode = React.useMemo(() => {
    return unverifiedAgentKeyStr ? getAgentById(unverifiedAgentKeyStr) : null;
  }, [unverifiedAgentKeyStr]);

  const resolvedActiveAgentMetadata = React.useMemo<AgentMetadata | null>(() => {
    if (databaseAgentRecord) {
      return {
        name: databaseAgentRecord.name,
        color: databaseAgentRecord.bg_color || "bg-primary",
        iconColor: databaseAgentRecord.color || "text-primary-foreground",
        iconName: databaseAgentRecord.icon || "MessageSquare",
        avatarUrl: databaseAgentRecord.avatar_url,
        creditCost: databaseAgentRecord.credit_cost,
      };
    }
    if (staticFallbackAgentNode) {
      return {
        name: staticFallbackAgentNode.name,
        color: staticFallbackAgentNode.bgColor,
        iconColor: staticFallbackAgentNode.iconColor,
        iconName: "MessageSquare",
        avatarUrl: null,
        creditCost: 1,
      };
    }
    return null;
  }, [databaseAgentRecord, staticFallbackAgentNode]);

  // =========================================================================
  // LIFECYCLE SECTOR 1: ISOLATED ASYNC CONNECTION INITIALIZATION LOOP
  // =========================================================================
  React.useEffect(() => {
    if (isDatabaseAgentResolving || isLoadingSessions || !unverifiedAgentKeyStr) return;

    if (!resolvedActiveAgentMetadata) {
      toast.error("Specialist agent registry could not be parsed.");
      executeNavigationHook("/app/agents");
      return;
    }

    let isThreadActiveAndValid = true;

    const establishSecureAgentSessionChannel = async () => {
      try {
        const isSessionAcknowledgeVerified = await startOrResumeSession(unverifiedAgentKeyStr);
        if (isThreadActiveAndValid && isSessionAcknowledgeVerified) {
          setIsSessionInitializing(false);
        }
      } catch (fatalSessionInitException) {
        if (isThreadActiveAndValid) {
          console.error("Session Ingress Exception thrown:", fatalSessionInitException);
          toast.error("Could not construct encrypted telemetry route.");
          executeNavigationHook("/app/agents");
        }
      }
    };

    establishSecureAgentSessionChannel();

    return () => {
      isThreadActiveAndValid = false;
    };
    // Isolated dependencies strictly around infrastructure primitives to protect runtime paths from loops
  }, [
    unverifiedAgentKeyStr,
    isDatabaseAgentResolving,
    isLoadingSessions,
    !!resolvedActiveAgentMetadata,
    executeNavigationHook,
    startOrResumeSession,
  ]);

  if (!unverifiedAgentKeyStr) return null;

  // =========================================================================
  // RENDERING CONTROLLERS: STATE INTERCEPT CHECKPOINTS
  // =========================================================================
  if (isSessionInitializing || isDatabaseAgentResolving) {
    return (
      <div
        role="status"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 select-none pointer-events-none transform-gpu antialiased"
      >
        <div className="relative mb-6 block shrink-0">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" />
          <Loader2 className="h-14 w-14 animate-spin text-primary opacity-25 stroke-[1.5]" />
          <MessageSquare className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 stroke-[2]" />
        </div>
        <div className="text-center leading-none space-y-1 block">
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-primary animate-pulse">
            Configuring Uplink Path
          </p>
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
            Synchronizing Matrix Interface Maps...
          </p>
        </div>
      </div>
    );
  }

  if (!resolvedActiveAgentMetadata) {
    return (
      <div
        role="alert"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 antialiased select-none transform-gpu text-center"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto pointer-events-none">
            <ShieldAlert className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Uplink Terminated</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The communication handshake has failed to resolve. The specified neural node link is invalid or
              unreachable.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => executeNavigationHook("/app/agents")}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 cursor-pointer"
          >
            Return to Directory Roster
          </Button>
        </div>
      </div>
    );
  }

  const DynamicIconAssetNode = getIcon(resolvedActiveAgentMetadata.iconName) || MessageSquare;

  return (
    <div className="fixed inset-x-0 top-[60px] bottom-[65px] flex flex-col overflow-hidden bg-background w-full block">
      <main
        className={cn(
          "flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden transition-all duration-300 text-left antialiased transform-gpu",
          "bg-card/25 backdrop-blur-md border-x border-border/40 shadow-xs",
        )}
      >
        {!isSessionInitializing ? (
          <AgentChatDialog
            agent={{
              id: unverifiedAgentKeyStr,
              name: resolvedActiveAgentMetadata.name,
              color: resolvedActiveAgentMetadata.color,
              icon: <DynamicIconAssetNode className={cn("h-4 w-4 shrink-0", resolvedActiveAgentMetadata.iconColor)} />,
              avatarUrl: resolvedActiveAgentMetadata.avatarUrl,
            }}
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={sendMessage}
            onBack={() => executeNavigationHook("/app/agents")}
            onEndSession={async () => {
              try {
                await endSession();
              } catch (suppressedException) {
                // Safeguards redirection path context from broken background syncs
              }
              executeNavigationHook("/app/agents");
            }}
            perResponseCost={resolvedActiveAgentMetadata.creditCost || perResponseCost}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none block max-w-sm mx-auto space-y-4 leading-none">
            <div className="h-14 w-14 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive pointer-events-none transform-gpu animate-bounce">
              <ShieldAlert className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1 block leading-none">
              <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                Session Pipeline Interrupted
              </h3>
              <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal block">
                The streaming data connection channel with the active specialist node has dropped.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => window.location.reload()}
              className="w-full h-9 rounded-lg font-bold uppercase tracking-wider text-[10px] sm:text-xs gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
            >
              <Zap className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Re-establish Uplink Track</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
