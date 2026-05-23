import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Mic,
  DollarSign,
  Briefcase,
  ArrowRight,
  Loader2,
  Zap,
  Target,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceHistory, ServiceHistoryItem } from "@/hooks/useServiceHistory";
import { formatDistanceToNow } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

const SERVICE_CONFIG: Record<
  ServiceHistoryItem["type"],
  {
    icon: any;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  career_assessment: {
    icon: Target,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/10",
    label: "NEURAL_ASSESSMENT",
  },
  mock_interview: {
    icon: Mic,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/10",
    label: "AI_VIRTUAL_INTERVIEW",
  },
  salary_analysis: {
    icon: DollarSign,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/10",
    label: "CAPITAL_BENCHMARK",
  },
  portfolio: {
    icon: Briefcase,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/10",
    label: "BRAND_PROVISIONING",
  },
};

/**
 * GroUp Academy: Institutional Service Engagement Ledger Tracker (ServiceHistoryCard)
 * An authoritative operational utility hub parsing history engagement milestones and psychometric yield outputs.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to protect against background thread data drift
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("service_history_card_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { history = [], isLoading } = useServiceHistory();
  const queryHistoryError: Error | null = null;

  // Route extraction runtime errors directly to centralized monitoring matrices
  useEffect(() => {
    if (queryHistoryError) {
      trackError(queryHistoryError, {
        component: "ServiceHistoryCard",
        action: "fetch_service_history_query",
      });
    }
  }, [queryHistoryError]);

  const safeRecentHistoryList = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return history.filter((item) => item && item.type in SERVICE_CONFIG).slice(0, 5);
  }, [history]);

  const hasHistoryArtifacts = useMemo(() => safeRecentHistoryList.length > 0, [safeRecentHistoryList]);

  const handleArtifactNavigationTrigger = async (targetHrefUrlStr: string, itemRecordId: string) => {
    if (!targetHrefUrlStr) return;
    trackEvent("service_history_item_navigation_requested", { artifactId: itemRecordId, targetUrl: targetHrefUrlStr });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["service-history"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        navigate(targetHrefUrlStr);
      }
    } catch (err) {
      trackError(err, {
        component: "ServiceHistoryCard",
        action: "execute_artifact_navigation_callback",
        targetUrl: targetHrefUrlStr,
      });
      // Safe fallback passthrough validation sequence execution
      navigate(targetHrefUrlStr);
    }
  };

  // =========================================================================
  // VIEW PROTOCOL STATE 1: CORE RECTILINEAR DATA HYDRATION SKELETON LAYER
  // =========================================================================
  if (isLoading) {
    return (
      <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased select-none">
        <CardContent className="p-5 py-10 flex flex-col items-center justify-center gap-3 w-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary italic animate-pulse leading-none">
            Synchronizing historical pipeline records…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (queryHistoryError) {
    return (
      <Card className="w-full text-left rounded-xl border border-rose-500/15 bg-rose-500/[0.015] shadow-sm antialiased font-bold text-xs">
        <CardContent className="p-4 flex gap-3 items-start leading-none select-text">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 stroke-[2.5] mt-0.5" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 select-none leading-none">
              Ecosystem Ingress Sync Fault
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 max-w-full break-words leading-normal font-mono pr-1">
              {queryHistoryError.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasHistoryArtifacts) return null;

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden animate-in fade-in duration-300">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING BLOCK CONNECTOR */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
        <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 text-left">
          <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
            <Zap className="h-4 w-4 text-primary fill-primary/10 stroke-[2.2] shrink-0 animate-pulse" />
            <span>Verified Service Artifacts</span>
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
            Institutional career engagement histories and performance yield records
          </CardDescription>
        </div>
      </CardHeader>

      {/* HUD LEVEL 2: MAP ROW SEGMENT ITEMS STACK LIST */}
      <CardContent className="p-4 sm:p-5 space-y-2 w-full min-w-0 flex flex-col justify-center font-bold text-xs tracking-tight">
        {safeRecentHistoryList.map((historyItem) => {
          const matchingConfigNode = SERVICE_CONFIG[historyItem.type];
          const VisualIconComponent = matchingConfigNode.icon || Target;
          const isItemStatusComplete = historyItem.status === "completed";

          return (
            <div
              key={historyItem.id}
              role="button"
              onClick={() => handleArtifactNavigationTrigger(historyItem.href, historyItem.id)}
              className="group/item flex items-center justify-between gap-4 p-3 rounded-xl border border-transparent bg-background/50 hover:bg-primary/[0.01] hover:border-primary/10 transition-all cursor-pointer transform-gpu w-full min-w-0 select-none"
            >
              {/* BRAND ADAPTIVE SCHEMATIC EMBLEM HOVER CHIP */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1 h-full">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 ease-out transform group-hover/item:scale-102 select-none",
                    matchingConfigNode.bgColor,
                  )}
                >
                  <VisualIconComponent className={cn("h-4.5 w-4.5 stroke-[2.2]", matchingConfigNode.color)} />
                </div>

                {/* ELEMENT B: TYPOGRAPHY DESCRIPTION METADATA BOX LAYOUT */}
                <div className="flex flex-col justify-center leading-none min-w-0 flex-1 text-left space-y-1.5">
                  <span className="text-xs sm:text-sm font-bold text-foreground/90 uppercase italic tracking-wide truncate text-ellipsis select-text block pr-1 leading-none group-hover/item:text-primary transition-colors">
                    {historyItem.title ? historyItem.title.trim() : "Untitled item"}
                  </span>

                  <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider font-mono leading-none pt-0.5 tabular-nums">
                    <span className="italic select-none block truncate text-ellipsis max-w-[140px] pr-0.5">
                      {historyItem.date
                        ? formatDistanceToNow(new Date(historyItem.date), { addSuffix: true })
                        : "Timeline unrecorded"}
                    </span>
                    <span>&bull;</span>

                    <Badge
                      variant={isItemStatusComplete ? "default" : "secondary"}
                      className={cn(
                        "rounded px-1.5 h-4 text-[8px] font-black tracking-wide border border-transparent uppercase select-none shadow-xs shrink-0 leading-none pt-0.5",
                        isItemStatusComplete
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {historyItem.status || "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ARTIFACT METRIC SCORE SECTION ELEMENT */}
              {historyItem.score !== undefined && (
                <div className="flex flex-col items-end gap-0.5 text-right shrink-0 leading-none pr-1 tabular-nums">
                  <span className="text-[8px] font-mono font-extrabold text-muted-foreground/30 uppercase tracking-wider select-none leading-none">
                    Output
                  </span>
                  <span className="text-sm font-black tracking-tighter text-primary block leading-none pt-0.5">
                    {historyItem.score}%
                  </span>
                </div>
              )}

              {/* ACTION TRIGGER VECTOR ARROW */}
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all shrink-0 p-0 border-none shadow-none select-none">
                <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
