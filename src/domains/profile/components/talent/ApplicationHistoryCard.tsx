import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Clock, CheckCircle, XCircle, Send, ChevronRight, Zap, Target, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationHistory } from "@/domains/jobs";
import { formatDistanceToNow } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }
> = {
  submitted: {
    label: "SUBMITTED",
    variant: "secondary",
    icon: Send,
    color: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5",
  },
  under_review: {
    label: "REVIEWING",
    variant: "outline",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5",
  },
  shortlisted: {
    label: "MATCHED",
    variant: "default",
    icon: Target,
    color: "text-primary border-primary/20 bg-primary/5",
  },
  interview: {
    label: "INTERVIEWING",
    variant: "default",
    icon: Zap,
    color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
  },
  rejected: {
    label: "ARCHIVED",
    variant: "destructive",
    icon: XCircle,
    color: "text-destructive border-destructive/20 bg-destructive/5",
  },
  hired: {
    label: "PLACED",
    variant: "default",
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  },
};

/**
 * GroUp Academy: Application Pipeline Tracker Panel (ApplicationHistoryCard)
 * An authoritative operational utility hub monitoring real-time user-to-employer synchronization records.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ApplicationHistoryCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Monitor application historical trajectory trackers via unified telemetry indicators
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("application_pipeline_tracker_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { data: applications = [], isLoading, error: initialQueryHistoryError } = useApplicationHistory();

  // Route extraction runtime errors directly to centralized monitoring matrices
  useEffect(() => {
    if (initialQueryHistoryError) {
      trackError(initialQueryHistoryError, {
        component: "ApplicationHistoryCard",
        action: "fetch_application_history_query",
      });
    }
  }, [initialQueryHistoryError]);

  const safeApplicationsQueueList = useMemo(() => {
    if (!Array.isArray(applications)) return [];
    return applications.slice(0, 5);
  }, [applications]);

  const hasActiveApplications = useMemo(() => safeApplicationsQueueList.length > 0, [safeApplicationsQueueList]);

  const handlePipelineNavigationTrigger = async (
    navigationTargetUrlStr: string,
    pipelineEventContextObj?: Record<string, any>,
  ) => {
    if (!navigationTargetUrlStr) return;
    trackEvent("application_pipeline_navigation_requested", {
      targetUrl: navigationTargetUrlStr,
      ...pipelineEventContextObj,
    });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        navigate(navigationTargetUrlStr);
      }
    } catch (err) {
      trackError(err, {
        component: "ApplicationHistoryCard",
        action: "execute_pipeline_navigation_callback",
        targetUrl: navigationTargetUrlStr,
      });
      // Safe fallback passthrough validation sequence execution
      navigate(navigationTargetUrlStr);
    }
  };

  // =========================================================================
  // VIEW PROTOCOL STATE 1: RECTILINEAR LOADING SKELETON DISPLAY BLOCKS
  // =========================================================================
  if (isLoading) {
    return (
      <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased select-none">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/10 bg-muted/10 w-full">
          <Skeleton className="h-5 w-32 rounded bg-muted-foreground/10" />
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3.5 w-full">
          {[1, 2, 3].map((indexId) => (
            <div key={indexId} className="flex items-center gap-3.5 w-full">
              <Skeleton className="h-10 w-10 rounded-xl bg-muted-foreground/10 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-40 rounded bg-muted-foreground/10 max-w-full" />
                <Skeleton className="h-3 w-24 rounded bg-muted-foreground/10 opacity-60" />
              </div>
              <Skeleton className="h-6 w-20 rounded bg-muted-foreground/10 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden transition-colors hover:border-border/60">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING BLOCK CONNECTOR */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
        <div className="flex items-center justify-between gap-4 w-full leading-none">
          <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 flex-1 text-left">
            <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
              <Target className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
              <span>Application Pipeline Tracker</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
              Real-time trajectory synchronization with institutional enterprise partners
            </CardDescription>
          </div>

          {hasActiveApplications && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                handlePipelineNavigationTrigger("/app/jobs", { interactionScope: "view_all_pipeline_trigger" })
              }
              className="h-7 px-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer shrink-0 transition-colors flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 w-full min-w-0 flex flex-col justify-center">
        {/* HUD LEVEL 2: INGRESS ERROR CAPTURE VIEW LANE */}
        {initialQueryHistoryError ? (
          <div className="py-6 text-center select-all w-full leading-none flex flex-col justify-center items-center gap-2 font-bold text-xs">
            <XCircle className="h-5 w-5 text-rose-500 stroke-[2.5]" />
            <p className="text-[10px] font-mono font-black uppercase text-rose-600 dark:text-rose-400 break-words max-w-xs">
              {initialQueryHistoryError.message}
            </p>
          </div>
        ) : !hasActiveApplications ? (
          /* HUD LEVEL 3: RECTILINEAR COLD COLD-START COLD EMPTY INVITATION SCREEN */
          <div className="text-center py-6 space-y-4 select-none w-full flex flex-col justify-center items-center">
            <div className="h-14 w-14 bg-muted/20 border border-dashed border-border/40 rounded-xl flex items-center justify-center mx-auto transform transition-transform duration-300 hover:rotate-3 shadow-inner">
              <Briefcase className="h-5 w-5 text-muted-foreground/40 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5 leading-none text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70 leading-none">
                No applications yet
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto italic">
                Apply to your first job to start tracking your applications here.
              </p>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={() =>
                handlePipelineNavigationTrigger("/app/jobs", { interactionScope: "cold_start_discover_trigger" })
              }
              className="h-8 rounded-xl border border-border/60 font-bold uppercase text-[10px] tracking-wide shadow-sm hover:bg-accent cursor-pointer transition-colors"
            >
              Discover Target Opportunities
            </Button>
          </div>
        ) : (
          /* HUD LEVEL 4: ACTIVE RECRUITMENT TIMELINE SUB-NODE ARRAY LIST */
          <div className="space-y-2 w-full min-w-0 text-left font-bold text-xs tracking-tight">
            {safeApplicationsQueueList.map((applicationItem) => {
              if (!applicationItem || !applicationItem.id) return null;

              const activeStatusConfigurationNode =
                STATUS_CONFIG[applicationItem.applicationStatus] || STATUS_CONFIG.submitted;
              const StatusIconComponent = activeStatusConfigurationNode.icon || Send;

              return (
                <div
                  key={applicationItem.id}
                  role="button"
                  onClick={() =>
                    handlePipelineNavigationTrigger(`/app/jobs/${applicationItem.jobId}`, {
                      jobId: applicationItem.jobId,
                    })
                  }
                  className="group flex items-center justify-between gap-4 p-3 rounded-xl border border-transparent bg-background/50 hover:bg-primary/[0.01] hover:border-primary/10 transition-all cursor-pointer transform-gpu w-full min-w-0 select-none"
                >
                  {/* WORK POSITION ARTIFACT EMBLEM SHIELD */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 h-full">
                    <div className="h-9 w-9 bg-muted/40 border border-border/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-background transition-colors">
                      <Briefcase className="h-4.5 w-4.5 text-muted-foreground/60 group-hover:text-primary transition-colors stroke-[2.2]" />
                    </div>

                    <div className="flex flex-col justify-center leading-none min-w-0 flex-1 text-left space-y-1.5">
                      <span className="text-xs sm:text-sm font-bold text-foreground/90 uppercase italic tracking-wide truncate text-ellipsis select-text block pr-1 leading-none">
                        {applicationItem.jobTitle
                          ? applicationItem.jobTitle.trim()
                          : "Untitled job"}
                      </span>

                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider font-mono leading-none pt-0.5 max-w-full">
                        <span className="truncate text-ellipsis block select-text pr-0.5">
                          {applicationItem.companyName || "Company"}
                        </span>
                        <span>&bull;</span>
                        <span className="whitespace-nowrap italic text-muted-foreground/40 pl-0.5 shrink-0">
                          {applicationItem.appliedAt
                            ? formatDistanceToNow(new Date(applicationItem.appliedAt), { addSuffix: true })
                            : "Timeline unrecorded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC PIPELINE VERIFICATION STATUS BADGE CHIP */}
                  <Badge
                    variant={activeStatusConfigurationNode.variant}
                    className={cn(
                      "h-6 px-2.5 rounded font-extrabold text-[9px] tracking-wide uppercase border gap-1 flex items-center leading-none shadow-xs shrink-0 select-none",
                      activeStatusConfigurationNode.color,
                    )}
                  >
                    <StatusIconComponent className="h-3 w-3 stroke-[2.5] shrink-0" />
                    <span className="pt-0.5 block">{activeStatusConfigurationNode.label}</span>
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
