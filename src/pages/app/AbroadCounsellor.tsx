import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getActiveCounsellorByUser, listAbroadApplications } from "@/domains/abroad/repo/abroadRepo";
import { listUserRoles } from "@/domains/profile/repo/profileRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plane, ArrowRight, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
const STAGES = [
  "intake",
  "shortlisted",
  "docs_in_progress",
  "submitted",
  "offer",
  "visa",
  "enrolled",
  "declined",
] as const;

type Stage = (typeof STAGES)[number];

interface AbroadApplication {
  id: string;
  target_country: string;
  intake_term: string | null;
  stage: Stage;
  updated_at: string;
  created_at: string;
}

const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  shortlisted: "Shortlisted",
  docs_in_progress: "Docs",
  submitted: "Submitted",
  offer: "Offer",
  visa: "Visa",
  enrolled: "Enrolled",
  declined: "Declined",
};

const STAGE_COLOR: Record<Stage, string> = {
  intake: "bg-slate-500 border-slate-600",
  shortlisted: "bg-blue-500 border-blue-600",
  docs_in_progress: "bg-amber-500 border-amber-600",
  submitted: "bg-cyan-500 border-cyan-600",
  offer: "bg-emerald-500 border-emerald-600",
  visa: "bg-purple-500 border-purple-600",
  enrolled: "bg-green-600 border-green-700",
  declined: "bg-rose-500 border-rose-600",
};

/**
 * GroUp Academy: Authoritative Academic Counselor Workspace (AbroadCounsellor)
 * Hardened operational tracking deck isolating background security checks and debouncing pipeline category sorting.
 * Version: Launch Candidate · Phase Z0 Matrix Stability Locked
 */
export default function AbroadCounsellor() {
  const executeNavigationHook = useNavigate();
  const queryClientInstance = useQueryClient();

  const [authorizationState, setAuthorizationState] = React.useState<boolean | null>(null);

  // =========================================================================
  // LIFECYCLE SECTOR 1: SECURED AUTHORIZATION INGRESS VERIFICATION CHANNEL
  // =========================================================================
  React.useEffect(() => {
    let isRequestThreadValid = true;

    const evaluateOperatorSecurityThreshold = async () => {
      try {
        const {
          data: { user: authedUserNode },
          error: authUserLookupError,
        } = await supabase.auth.getUser();

        if (authUserLookupError || !authedUserNode) {
          if (isRequestThreadValid) executeNavigationHook("/auth");
          return;
        }

        // Trigger parallel database handshakes simultaneously to minimize connection latency waterfall spikes
        const [counsellorRow, rolesList] = await Promise.all([
          getActiveCounsellorByUser(authedUserNode.id),
          listUserRoles(authedUserNode.id).catch(() => []),
        ]);

        if (!isRequestThreadValid) return;

        const isOperatorPlatformAdmin = (rolesList ?? []).some(
          (roleRecord) => roleRecord.role === "admin",
        );

        const isOperatorCounsellorNode = Boolean(counsellorRow);

        setAuthorizationState(isOperatorCounsellorNode || isOperatorPlatformAdmin);
      } catch (fatalSecurityPipelineCrash) {
        if (isRequestThreadValid) {
          setAuthorizationState(false);
          executeNavigationHook("/auth");
        }
      }
    };

    evaluateOperatorSecurityThreshold();

    return () => {
      isRequestThreadValid = false;
    };
  }, [executeNavigationHook]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: DATA ACQUISITION WIRE VIA TANSTACK CACHE
  // =========================================================================
  const { data: rawApplicationsDataRows = [], isLoading: isRegistryCacheResolving } = useQuery<AbroadApplication[]>({
    queryKey: ["counsellor-applications-matrix"],
    enabled: authorizationState === true,
    queryFn: async (): Promise<AbroadApplication[]> => {
      const rows = await listAbroadApplications();
      return (rows as unknown as AbroadApplication[]) ?? [];
    },
  });

  // =========================================================================
  // LIFECYCLE SECTOR 3: DEBOUNCED RENDERING DATA SEGMENT COMPILER
  // =========================================================================
  const compiledGroupedStagesPayload = React.useMemo<Record<Stage, AbroadApplication[]>>(() => {
    const defaultStructuralRecordMap = STAGES.reduce(
      (accumulatorMap, targetStageKey) => {
        accumulatorMap[targetStageKey] = [];
        return accumulatorMap;
      },
      {} as Record<Stage, AbroadApplication[]>,
    );

    if (rawApplicationsDataRows.length === 0) return defaultStructuralRecordMap;

    rawApplicationsDataRows.forEach((applicationItem) => {
      if (defaultStructuralRecordMap[applicationItem.stage]) {
        defaultStructuralRecordMap[applicationItem.stage].push(applicationItem);
      }
    });

    return defaultStructuralRecordMap;
  }, [rawApplicationsDataRows]);

  // =========================================================================
  // LIFECYCLE SECTOR 4: STATE MUTATION HANDLING SEQUENCE ACTIONS
  // =========================================================================
  const advanceApplicationStageMutation = useMutation({
    mutationFn: async ({
      applicationIdStr,
      targetNextStageKey,
    }: {
      applicationIdStr: string;
      targetNextStageKey: Stage;
    }) => {
      const { error: rpcExecutionHandshakeError } = await supabase.rpc("advance_abroad_stage", {
        _application_id: applicationIdStr,
        _next_stage: targetNextStageKey,
      });
      if (rpcExecutionHandshakeError) throw rpcExecutionHandshakeError;
    },
    onSuccess: () => {
      toast.success("Classification state successfully advanced.");
      queryClientInstance.invalidateQueries({ queryKey: ["counsellor-applications-matrix"] });
    },
    onError: (pipelineMutationException: any) => {
      toast.error(pipelineMutationException.message || "Failed to alter tracking bounds configuration mapping.");
    },
  });

  // =========================================================================
  // CONDITION RENDER BARRIERS: INGRESS ROUTING intercept SHIELDS
  // =========================================================================
  if (authorizationState === null) {
    return (
      <div className="p-4 sm:p-6 text-left block max-w-7xl mx-auto w-full antialiased">
        <Skeleton className="h-10 w-64 rounded-lg shrink-0 block" />
        <Skeleton className="h-44 w-full rounded-xl shrink-0 block mt-4" />
      </div>
    );
  }

  if (!authorizationState) {
    return (
      <div
        role="alert"
        className="min-h-[60vh] grid place-items-center bg-background text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-10 w-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Plane className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Access Credential Refused</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              This node profile is missing explicit specialist clearance parameters. Request system permissions
              validation from an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto block text-left antialiased transform-gpu w-full pb-24">
      {/* HUD LEVEL 1: ADMINISTRATIVE TOP HEADER BAR */}
      <div className="flex items-center justify-between leading-none w-full shrink-0 select-none pb-2 border-b border-border/10">
        <div className="space-y-0.5 block">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
            Counselor Workspace Dashboard
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block">
            Audit international student migration tracks and execute administrative timeline operations.
          </p>
        </div>

        <Badge
          variant="outline"
          className="font-mono text-[10px] font-extrabold uppercase tracking-wide px-2.5 h-6 rounded border border-border/60 bg-card select-none shrink-0 pointer-events-none tabular-nums pt-0.5"
        >
          {rawApplicationsDataRows.length.toString()} ACTIVE ALLOCATIONS
        </Badge>
      </div>

      {/* HUD LEVEL 2: COMPOSITE SECTOR GRID EXPLORER RUNWAY */}
      {isRegistryCacheResolving ? (
        <div className="w-full flex items-center justify-center py-12 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Syncing Registration Ledger Contexts...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 block w-full align-top">
          {STAGES.map((stageKeyToken) => {
            const correspondingStageRowsArray = compiledGroupedStagesPayload[stageKeyToken] || [];
            const isStageCategoryRosterEmpty = correspondingStageRowsArray.length === 0;

            return (
              <div
                key={`kanban-pipeline-column-node-${stageKeyToken}`}
                className="space-y-3 block bg-muted/10 border border-border/20 rounded-xl p-2.5 h-fit"
              >
                {/* Column Meta Matrix Header */}
                <div className="flex items-center justify-between select-none pointer-events-none leading-none w-full shrink-0">
                  <div className="flex items-center gap-2 max-w-[140px] sm:max-w-xs truncate">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0 block border shadow-2xs",
                        STAGE_COLOR[stageKeyToken],
                      )}
                    />
                    <span className="text-[11px] font-mono font-black uppercase tracking-wide text-foreground/80 pt-0.5 truncate block">
                      {STAGE_LABEL[stageKeyToken]}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                    {correspondingStageRowsArray.length.toString()}
                  </span>
                </div>

                {/* Column Workspace Manifest Log Stream */}
                <div className="space-y-2 block w-full max-h-[70vh] overflow-y-auto scrollbar-none">
                  {isStageCategoryRosterEmpty ? (
                    <Card className="rounded-lg border border-dashed border-border/40 bg-card/10 p-4 text-center select-none block shadow-none">
                      <p className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-wide">
                        Empty Sector
                      </p>
                    </Card>
                  ) : (
                    correspondingStageRowsArray.map((applicationNodeItem) => (
                      <Card
                        key={`application-counselor-deck-card-${applicationNodeItem.id}`}
                        className="rounded-lg border border-border/60 bg-card shadow-xs overflow-hidden block w-full transform-gpu"
                      >
                        <CardContent className="p-3 space-y-2.5 block w-full leading-none">
                          <div className="space-y-1 block">
                            <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide select-text block truncate leading-tight pt-0.5">
                              {applicationNodeItem.target_country}
                            </p>
                            <p className="font-mono text-[10px] font-bold text-muted-foreground/40 leading-none select-text block tracking-tight uppercase truncate">
                              TERM: {applicationNodeItem.intake_term ?? "PENDING"}
                              <span className="font-sans font-medium opacity-30 mx-1.5 select-none">·</span>
                              {new Date(applicationNodeItem.updated_at).toLocaleDateString("en-US", {
                                timeZone: "UTC",
                              })}
                            </p>
                          </div>

                          {/* Control Option Form Ingress Select Gateways */}
                          <div className="flex items-center gap-1.5 w-full block shrink-0 select-none">
                            <Select
                              disabled={advanceApplicationStageMutation.isPending}
                              onValueChange={(extractedNextStageKey) =>
                                advanceApplicationStageMutation.mutate({
                                  applicationIdStr: applicationNodeItem.id,
                                  targetNextStageKey: extractedNextStageKey as Stage,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-border/60 bg-background/50 shadow-none flex-1">
                                <SelectValue placeholder="ADVANCE COHORT →" />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border border-border/60 bg-popover text-popover-foreground">
                                {STAGES.filter(
                                  (filteredStageKey) => filteredStageKey !== applicationNodeItem.stage,
                                ).map((stageOptionToken) => (
                                  <SelectItem
                                    key={`option-node-ingress-${stageOptionToken}`}
                                    value={stageOptionToken}
                                    className="text-[10px] uppercase font-mono font-bold"
                                  >
                                    {STAGE_LABEL[stageOptionToken]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => executeNavigationHook(`/app/abroad/applications`)}
                              className="h-7 w-7 rounded-md border border-border/10 p-0 text-muted-foreground/50 hover:text-foreground hover:bg-accent cursor-pointer transition-colors shadow-none shrink-0 block"
                              title="Audit detail records spec file"
                            >
                              <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] mx-auto block" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
