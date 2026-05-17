import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Star, Users, Coins, Bot, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { AgentReviewSection } from "@/components/agents/AgentReviewSection";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface AgentProfileRecord {
  id: string;
  name: string;
  agent_key: string;
  description: string | null;
  agent_type: string | null;
  expertise_areas: string[] | null;
  bg_color: string | null;
  avatar_url: string | null;
  connection_fee: number | null;
  delivery_credit_cost: number | null;
  credit_cost: number | null;
}

interface TelemetryStats {
  users: number;
  messages: number;
  rating: number;
  reviews: number;
}

/**
 * GroUp Academy: Specialist Agent Professional Profile Node (AgentProfile)
 * Hardened responsive identity layout tracking dynamic credit costs and insulating parallel asynchronous handshakes.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AgentProfile() {
  const { agentKey: unverifiedAgentKeyStr } = useParams<{ agentKey: string }>();
  const executeNavigationHook = useNavigate();
  const { talent: authenticatedTalentNode } = useTalent();

  const [agentProfileData, setAgentProfileData] = React.useState<AgentProfileRecord | null>(null);
  const [telemetryStatsState, setTelemetryStatsState] = React.useState<TelemetryStats>({
    users: 0,
    messages: 0,
    rating: 0,
    reviews: 0,
  });

  const [isDataResolutionProcessing, setIsDataResolutionProcessing] = React.useState<boolean>(true);
  const [hasSufficientChatFootprint, setHasSufficientChatFootprint] = React.useState<boolean>(false);
  const [isUplinkConnected, setIsUplinkConnected] = React.useState<boolean>(false);
  const [isTransactionConnecting, setIsTransactionConnecting] = React.useState<boolean>(false);

  // =========================================================================
  // LIFECYCLE SECTOR 1: CONCURRENT LIFECYCLE COMPILING & FETCH INSULATION
  // =========================================================================
  React.useEffect(() => {
    if (!unverifiedAgentKeyStr) return;

    let isThreadActiveAndValid = true;
    setIsDataResolutionProcessing(true);

    const executeParallelProfileLookup = async () => {
      try {
        // Core Step A: Query primary configuration logs simultaneously
        const [agentQueryPayload, statsQueryPayload] = await Promise.all([
          supabase.from("ai_agents").select("*").eq("agent_key", unverifiedAgentKeyStr).maybeSingle(),
          supabase
            .from("ai_agents_with_stats")
            .select("total_users,total_messages,avg_rating,review_count")
            .eq("agent_key", unverifiedAgentKeyStr)
            .maybeSingle(),
        ]);

        if (!isThreadActiveAndValid) return;

        if (agentQueryPayload.error || !agentQueryPayload.data) {
          setAgentProfileData(null);
          setIsDataResolutionProcessing(false);
          return;
        }

        setAgentProfileData(agentQueryPayload.data as unknown as AgentProfileRecord);

        if (statsQueryPayload.data) {
          const statsNodeItem = statsQueryPayload.data;
          setTelemetryStatsState({
            users: Number(statsNodeItem.total_users) || 0,
            messages: Number(statsNodeItem.total_messages) || 0,
            rating: Number(statsNodeItem.avg_rating) || 0,
            reviews: Number(statsNodeItem.review_count) || 0,
          });
        }

        // Core Step B: If student parameter profile matches, verify engagement history parameters
        if (authenticatedTalentNode?.id) {
          const [sessionHistoryPayload, networkConnectionPayload] = await Promise.all([
            supabase
              .from("agent_chat_sessions")
              .select("id, messages")
              .eq("talent_id", authenticatedTalentNode.id)
              .eq("agent_key", unverifiedAgentKeyStr),
            supabase.rpc("is_agent_connected", {
              _agent_key: unverifiedAgentKeyStr,
              _talent_id: authenticatedTalentNode.id,
            }),
          ]);

          if (!isThreadActiveAndValid) return;

          const calculatedMessagesVolume = (sessionHistoryPayload.data || []).reduce(
            (accumulatedTotal, sessionRowItem: any) =>
              accumulatedTotal + (Array.isArray(sessionRowItem.messages) ? sessionRowItem.messages.length : 0),
            0,
          );

          setHasSufficientChatFootprint(calculatedMessagesVolume >= 3);
          setIsUplinkConnected(Boolean(networkConnectionPayload.data));
        }
      } catch (fatalHandshakeException) {
        if (isThreadActiveAndValid) setAgentProfileData(null);
      } finally {
        if (isThreadActiveAndValid) setIsDataResolutionProcessing(false);
      }
    };

    executeParallelProfileLookup();

    return () => {
      isThreadActiveAndValid = false;
    };
  }, [unverifiedAgentKeyStr, authenticatedTalentNode?.id]);

  // =========================================================================
  // ACTION HOOKS: TRANSACTION INTEGRATION CORES
  // =========================================================================
  const handleConnectSequenceExecution = React.useCallback(async () => {
    if (!unverifiedAgentKeyStr || !authenticatedTalentNode?.id || !agentProfileData) return;

    setIsTransactionConnecting(true);
    const numericalConnectionFeeValue = Number(agentProfileData.connection_fee ?? 0);

    try {
      const { error: rpcMutationHandshakeError } = await supabase.rpc("connect_agent", {
        _agent_key: unverifiedAgentKeyStr,
        _talent_id: authenticatedTalentNode.id,
        _fee: numericalConnectionFeeValue,
      });

      if (rpcMutationHandshakeError) throw rpcMutationHandshakeError;

      setIsUplinkConnected(true);
      executeNavigationHook(`/app/messages/${unverifiedAgentKeyStr}`);
    } catch (suppressedMutationException) {
      console.error("[AgentProfile] Connection Handshake Refused:", suppressedMutationException);
    } finally {
      setIsTransactionConnecting(false);
    }
  }, [unverifiedAgentKeyStr, authenticatedTalentNode?.id, agentProfileData, executeNavigationHook]);

  const handleReturnToMarketplace = React.useCallback(() => {
    executeNavigationHook("/app/agents");
  }, [executeNavigationHook]);

  const handleReturnHistorySequence = React.useCallback(() => {
    executeNavigationHook(-1);
  }, [executeNavigationHook]);

  const handleDirectNavigationToChat = React.useCallback(() => {
    if (unverifiedAgentKeyStr) executeNavigationHook(`/app/messages/${unverifiedAgentKeyStr}`);
  }, [unverifiedAgentKeyStr, executeNavigationHook]);

  // =========================================================================
  // RENDERING CONTROLLERS: STATE INTERCEPT CHECKPOINTS
  // =========================================================================
  if (isDataResolutionProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 text-left antialiased block w-full select-none pointer-events-none">
        <Skeleton className="h-28 w-full rounded-xl shrink-0 block" />
        <div className="flex gap-4 items-end -mt-10 px-2 block w-full">
          <Skeleton className="h-20 w-20 rounded-full border-4 border-background shrink-0 block" />
          <div className="space-y-1.5 flex-1 min-w-0 pb-1 block">
            <Skeleton className="h-4.5 w-1/3 rounded-xs block" />
            <Skeleton className="h-3.5 w-1/4 rounded-xs block" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl shrink-0 block mt-4" />
        <Skeleton className="h-32 w-full rounded-xl shrink-0 block" />
      </div>
    );
  }

  if (!agentProfileData) {
    return (
      <div
        role="alert"
        className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Specialist Missing</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The targeted specialty agent parameters could not be localized within public registry arrays.
            </p>
          </div>
          <Button
            type="button"
            variant="link"
            onClick={handleReturnToMarketplace}
            className="text-xs font-bold uppercase tracking-wider text-primary"
          >
            Return to Marketplace Index
          </Button>
        </div>
      </div>
    );
  }

  const verifiedAreasOfExpertiseList = agentProfileData.expertise_areas || [];
  const computedBrandHeadlineHexCode = agentProfileData.bg_color || "#2A7DDE";

  return (
    <div className="max-w-2xl mx-auto pb-32 block text-left antialiased transform-gpu w-full">
      {/* HUD LEVEL 1: PROFILE APPSHELL TOP NAV BAR */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 flex items-center gap-2 px-2 py-2 select-none w-full shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg cursor-pointer shrink-0"
          onClick={handleReturnHistorySequence}
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
        </Button>
        <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70 pt-0.5">
          Specialist Agent Deployment Dossier
        </p>
      </header>

      {/* HUD LEVEL 2: CORPORATE SHIELD IDENTITY HERO */}
      <section
        className="relative h-24 w-full block pointer-events-none select-none shrink-0"
        style={{ background: `linear-gradient(135deg, ${computedBrandHeadlineHexCode}, hsl(var(--primary)/0.8))` }}
      />

      <div className="px-4 -mt-10 space-y-5 block w-full">
        <div className="flex items-end gap-3.5 leading-none w-full block">
          <Avatar className="h-20 w-20 rounded-xl border-2 border-background bg-background shadow-xs shrink-0 select-none pointer-events-none">
            {agentProfileData.avatar_url && (
              <AvatarImage src={agentProfileData.avatar_url} className="object-cover block" />
            )}
            <AvatarFallback
              className="text-white text-base rounded-none uppercase block grid place-items-center w-full h-full font-bold"
              style={{ backgroundColor: computedBrandHeadlineHexCode }}
            >
              <Bot className="h-7 w-7 stroke-[2]" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 leading-none space-y-1 block select-none pb-0.5">
            <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5 truncate block pt-0.5">
              <span>{agentProfileData.name}</span>
              <CheckCircle2 className="h-4 w-4 text-primary stroke-[2.5] shrink-0" />
            </h1>
            <p className="font-mono text-[9px] font-black uppercase tracking-wide text-muted-foreground/40 leading-none block">
              {agentProfileData.agent_type === "company" ? "Enterprise Corporate Agent" : "Verified Academy Operator"}
            </p>
          </div>
        </div>

        {/* HUD LEVEL 3: TABULAR QUANTUM TELEMETRY METRICS */}
        <div className="grid grid-cols-3 gap-3 block w-full select-none pointer-events-none">
          <div className="rounded-lg border border-border/60 bg-card/40 p-2.5 text-center leading-none space-y-1 block shadow-2xs">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mx-auto stroke-[1.8]" />
            <p className="text-xs sm:text-sm font-black font-mono text-foreground tabular-nums pt-0.5 leading-none">
              {telemetryStatsState.rating ? telemetryStatsState.rating.toFixed(1) : "—"}
            </p>
            <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tight block leading-none">
              {telemetryStatsState.reviews.toLocaleString()} Reviews
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/40 p-2.5 text-center leading-none space-y-1 block shadow-2xs">
            <Users className="h-3.5 w-3.5 text-primary mx-auto stroke-[2.2]" />
            <p className="text-xs sm:text-sm font-black font-mono text-foreground tabular-nums pt-0.5 leading-none">
              {telemetryStatsState.users.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tight block leading-none">
              Roster Footprint
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/40 p-2.5 text-center leading-none space-y-1 block shadow-2xs">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600 mx-auto stroke-[2.2]" />
            <p className="text-xs sm:text-sm font-black font-mono text-foreground tabular-nums pt-0.5 leading-none">
              {telemetryStatsState.messages.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tight block leading-none">
              Messages Sent
            </p>
          </div>
        </div>

        {/* HUD LEVEL 4: TECHNICAL ABSTRACT SUMMARY */}
        {agentProfileData.description && (
          <section className="block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
              Abstract Overview
            </h2>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium block select-text whitespace-pre-wrap mt-2.5">
              {agentProfileData.description}
            </p>
          </section>
        )}

        {/* HUD LEVEL 5: DOMAIN AREA VECTORS LIST */}
        {verifiedAreasOfExpertiseList.length > 0 && (
          <section className="block w-full">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
              Utility Focus Domain Vectors
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2.5 block w-full select-none pointer-events-none">
              {verifiedAreasOfExpertiseList.map((expertiseItem) => (
                <Badge
                  key={`expertise-pill-${expertiseItem}`}
                  variant="secondary"
                  className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded border border-border/40 bg-muted/50 text-muted-foreground/60 leading-none pt-0.5"
                >
                  {expertiseItem}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* HUD LEVEL 6: UNIT ALLOCATION PRICING SCHEMA BLOCK */}
        <section className="rounded-xl border border-border/60 bg-card/30 p-3 flex items-center justify-between gap-4 leading-none w-full block select-none pointer-events-none shadow-2xs">
          <div className="leading-none space-y-1 block">
            <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide leading-none">
              Computational Transmission Draw
            </p>
            <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 pt-0.5 tabular-nums uppercase">
              <Coins className="h-4 w-4 text-primary stroke-[2]" />
              <span>
                {(agentProfileData.delivery_credit_cost || agentProfileData.credit_cost || 1).toLocaleString()} Credits
                / Pass
              </span>
            </p>
          </div>
          {agentProfileData.connection_fee !== null && agentProfileData.connection_fee > 0 && (
            <div className="text-right leading-none space-y-1 block">
              <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide leading-none">
                Initial Onboarding Fee
              </p>
              <p className="text-xs sm:text-sm font-bold font-mono text-primary tabular-nums pt-0.5 uppercase">
                {agentProfileData.connection_fee.toLocaleString()} Credits
              </p>
            </div>
          )}
        </section>

        {/* HUD LEVEL 7: SYSTEM COMMITTED STUDENT EVALUATION STREAM */}
        <div className="block w-full pt-2">
          <AgentReviewSection agentKey={unverifiedAgentKeyStr!} canReview={hasSufficientChatFootprint} />
        </div>
      </div>

      {/* HUD LEVEL 8: STICKY SUBMISSION INGRESS CONTROLLER FOOTER BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t border-border/40 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] select-none">
        <div className="max-w-2xl mx-auto w-full block">
          {isUplinkConnected ? (
            <Button
              type="button"
              onClick={handleDirectNavigationToChat}
              className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block"
            >
              <MessageCircle className="h-4 w-4 stroke-[2.5]" />
              <span>Resume Encrypted Uplink Channel</span>
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isTransactionConnecting}
              onClick={handleConnectSequenceExecution}
              className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block"
            >
              {isTransactionConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <MessageCircle className="h-4 w-4 stroke-[2.5] shrink-0" />
              )}
              <span>
                {Number(agentProfileData.connection_fee ?? 0) > 0
                  ? `Initialize Pipeline Allocation · ${agentProfileData.connection_fee} Credits`
                  : "Initialize Pipeline Allocation · Free Access Token"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
