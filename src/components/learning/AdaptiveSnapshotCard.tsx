import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles, ChevronRight, Clock, MessageSquare } from "lucide-react";
import { useMasterySummary } from "@/hooks/useMasterySummary";
import { formatDistanceToNowStrict } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface AdaptiveSnapshotCardProps {
  /** Filter to a single module (per-course variant) */
  moduleId?: string;
  /** Filter to a single course's content */
  contentId?: string;
  /** Compact mode hides sparkline + signal split */
  compact?: boolean;
  className?: string;
}

function MasteryRing({ value }: { value: number }) {
  const normalizedValue = typeof value === "number" && !isNaN(value) ? value : 0;
  const percentageScore = Math.round(normalizedValue * 100);
  const circleRadiusValue = 22;
  const circleCircumference = 2 * Math.PI * circleRadiusValue;
  const offsetStrokeAllocation = circleCircumference - Math.max(0, Math.min(1, normalizedValue)) * circleCircumference;

  return (
    <div className="relative h-14 w-14 shrink-0 select-none">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90 transform-gpu">
        <circle cx="28" cy="28" r={circleRadiusValue} className="stroke-muted/40 fill-none" strokeWidth="4.5" />
        <circle
          cx="28"
          cy="28"
          r={circleRadiusValue}
          className="stroke-primary fill-none transition-all duration-500 ease-out"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circleCircumference}
          strokeDashoffset={offsetStrokeAllocation}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-foreground tabular-nums tracking-tight">
        {percentageScore}%
      </div>
    </div>
  );
}

function Sparkline({ points = [] }: { points: Array<{ date: string; quiz: number; scenario: number }> }) {
  const dataPointsBuffer = Array.isArray(points) ? points : [];

  const lineValuesArray = useMemo(() => {
    return dataPointsBuffer.map((p) => Number(p?.quiz || 0) + Number(p?.scenario || 0));
  }, [dataPointsBuffer]);

  const maximumYScaleValue = useMemo(() => {
    return Math.max(1, ...lineValuesArray);
  }, [lineValuesArray]);

  const viewWidth = 140;
  const viewHeight = 28;

  // 1. Core Mathematical Hardening Safeguard: Shield structural loop operations from single point division parameters
  const stepHorizontalMultiplier = useMemo(() => {
    if (dataPointsBuffer.length <= 1) return 0;
    return viewWidth / (dataPointsBuffer.length - 1);
  }, [dataPointsBuffer.length]);

  const svgCalculatedPathString = useMemo(() => {
    if (lineValuesArray.length === 0) return "M 0 0";

    // Fallback vector mapping single point logs directly into a stable linear track
    if (lineValuesArray.length === 1) {
      const positionY = viewHeight - (lineValuesArray[0] / maximumYScaleValue) * viewHeight;
      return `M 0 ${positionY} L ${viewWidth} ${positionY}`;
    }

    return lineValuesArray
      .map((currentVal, dataIdx) => {
        const commandTag = dataIdx === 0 ? "M" : "L";
        const coordinateX = dataIdx * stepHorizontalMultiplier;
        const coordinateY = viewHeight - (currentVal / maximumYScaleValue) * viewHeight;
        return `${commandTag} ${coordinateX} ${coordinateY}`;
      })
      .join(" ");
  }, [lineValuesArray, stepHorizontalMultiplier, maximumYScaleValue]);

  if (lineValuesArray.length === 0) return null;

  return (
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="h-7 w-full overflow-visible select-none transform-gpu">
      <path
        d={svgCalculatedPathString}
        className="stroke-cyan-500 dark:stroke-cyan-400 fill-none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lineValuesArray.map((valueY, pointIdx) => {
        const coordinateX = pointIdx * stepHorizontalMultiplier;
        const coordinateY = viewHeight - (valueY / maximumYScaleValue) * viewHeight;
        return (
          <circle
            key={pointIdx}
            cx={lineValuesArray.length === 1 ? viewWidth / 2 : coordinateX}
            cy={coordinateY}
            r={1.75}
            className="fill-primary border-background shadow-sm stroke-background stroke-5"
          />
        );
      })}
    </svg>
  );
}

export function AdaptiveSnapshotCard({ moduleId, contentId, compact = false, className }: AdaptiveSnapshotCardProps) {
  const queryClient = useQueryClient();

  // Monitor retention summary panels view tracking paths via telemetry logs
  useEffect(() => {
    trackEvent("adaptive_mastery_snapshot_card_mounted", { moduleId, contentId, isCompactMode: compact });
  }, [moduleId, contentId, compact]);

  // Server state caching lookup configuration segment
  const { data, isLoading: loading, error: queryFetchError } = useMasterySummary({ moduleId, contentId, days: 7 });

  // Route internal query exception metrics straight to background tracking terminals
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "AdaptiveSnapshotCard",
        action: "fetch_mastery_summary_hook_endpoint",
        moduleId,
        contentId,
      });
    }
  }, [queryFetchError, moduleId, contentId]);

  const nextDueLabel = useMemo(() => {
    if (!data?.totals?.next_due_at) return null;
    try {
      return formatDistanceToNowStrict(new Date(data.totals.next_due_at), { addSuffix: true });
    } catch (formatErr) {
      trackError(formatErr, {
        component: "AdaptiveSnapshotCard",
        action: "calculate_format_distance_next_due",
        nextDueValue: data.totals.next_due_at,
      });
      return null;
    }
  }, [data?.totals?.next_due_at]);

  if (loading) {
    return (
      <Card
        className={cn(
          "border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none animate-pulse w-full",
          className,
        )}
      >
        <CardContent className="p-4 space-y-3.5 w-full">
          <Skeleton className="h-12 w-full rounded-xl opacity-60" />
          {!compact && <Skeleton className="h-6 w-full rounded-lg opacity-40" />}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalTrackedTopicsCount = Number(data.totals?.tracked_topics || 0);
  const totalDueNowItemsCount = Number(data.totals?.due_now || 0);

  // Cold-start Initial Interaction UI Frame Node
  if (totalTrackedTopicsCount === 0) {
    return (
      <Card
        className={cn(
          "border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl select-none w-full",
          className,
        )}
      >
        <CardContent className="p-4 flex items-center gap-3.5 text-left w-full">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="h-4.5 w-4.5 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground/80 leading-normal flex-1 select-text">
            Execute an ecosystem review quiz or operational workspace scenario to initialize your automated mastery
            tracking ledger indices.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleReviewNavigationTrigger = () => {
    trackEvent("adaptive_mastery_review_cta_clicked", { moduleId, contentId, pendingCount: totalDueNowItemsCount });
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
  };

  return (
    <Card
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl select-none sm:select-text antialiased transform-gpu w-full overflow-hidden",
        className,
      )}
    >
      <CardContent className="p-4 space-y-4 w-full min-w-0">
        {/* Fixed Structural Summary Metric Header Strip */}
        <div className="flex items-center gap-3.5 w-full min-w-0">
          <MasteryRing value={Number(data.totals?.avg_mastery || 0)} />

          <div className="flex-1 min-w-0 text-left flex flex-col justify-center leading-none">
            <p className="text-sm font-bold text-foreground/90 tracking-tight leading-tight truncate pr-1">
              {totalTrackedTopicsCount.toLocaleString()}{" "}
              {totalTrackedTopicsCount === 1 ? "Core Knowledge Topic" : "Core Knowledge Topics"} Logged
            </p>
            <div className="text-[11px] font-bold text-muted-foreground/80 mt-1 leading-none truncate max-w-full tracking-tight flex items-center gap-1 flex-wrap w-full">
              {totalDueNowItemsCount > 0 ? (
                <span className="text-primary font-extrabold bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 animate-pulse tabular-nums shrink-0 uppercase tracking-wider text-[9px]">
                  {totalDueNowItemsCount} tasks outstanding
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 uppercase tracking-wider text-[9px]">
                  Ecosystem Fully Synchronized
                </span>
              )}
              {nextDueLabel && (
                <span className="truncate text-muted-foreground/60 font-medium normal-case">
                  &bull; next review target {nextDueLabel}
                </span>
              )}
            </div>
          </div>

          {totalDueNowItemsCount > 0 && (
            <Button
              asChild
              size="sm"
              type="button"
              className="h-7 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl shadow-sm cursor-pointer select-none active:scale-95 transition-transform shrink-0 gap-1"
            >
              <Link to="/app/learning/review" onClick={handleReviewNavigationTrigger}>
                <span>Reconcile</span>
                <ChevronRight className="h-3.5 w-3.5 text-primary-foreground stroke-[2.5]" />
              </Link>
            </Button>
          )}
        </div>

        {/* Dynamic Critical Action Weakest Vectors Block */}
        {Array.isArray(data.weakest) && data.weakest.length > 0 && (
          <div className="space-y-1.5 border-t border-border/10 pt-3 w-full min-w-0 text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 pl-0.5 block select-none leading-none">
              Strategic Revision Gap Markers
            </span>
            <div className="space-y-1 w-full min-w-0">
              {data.weakest.map((weakNodeItem: any, index: number) => {
                if (!weakNodeItem || !weakNodeItem.topic_tag) return null;
                const calculatedRowKey = `${weakNodeItem.module_id || "mod"}_${weakNodeItem.topic_tag}_row_${index}`;

                return (
                  <Link
                    key={calculatedRowKey}
                    to="/app/learning/review"
                    onClick={handleReviewNavigationTrigger}
                    className="flex items-center gap-3 text-xs font-bold text-foreground/80 hover:text-primary tracking-tight hover:bg-primary/5 rounded-xl px-2 py-1.5 border border-transparent hover:border-primary/10 transition-all w-full min-w-0 group"
                  >
                    <Brain className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.2] group-hover:scale-105 transition-transform" />
                    <span className="truncate flex-1 capitalize text-ellipsis select-text font-semibold text-muted-foreground group-hover:text-foreground">
                      {weakNodeItem.topic_tag.replace(/_/g, " ")}
                      {weakNodeItem.module_title && (
                        <span className="text-muted-foreground/50 font-medium tracking-normal text-[11px] font-sans normal-case block sm:inline sm:pl-1">
                          &mdash; in {weakNodeItem.module_title}
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold font-mono text-[11px] tracking-wide text-rose-600 dark:text-rose-400 bg-rose-500/5 border border-rose-500/10 px-1.5 py-0.5 rounded shadow-sm tabular-nums shrink-0">
                      {Math.round(weakNodeItem.mastery * 100)}% Index
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Byte Stream Transformation Metrics Sparkline Section */}
        {!compact && data.signal_split_30d && (
          <div className="border-t border-border/10 pt-3 space-y-2 select-none w-full animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider pl-0.5 leading-none w-full">
              <span>Metric Horizon Matrix (Last 7 Days)</span>
              <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                <span className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded border">
                  <Clock className="h-2.5 w-2.5 text-primary stroke-[2.2]" />
                  <span>{data.signal_split_30d.quiz || 0} quizzes submitted</span>
                </span>
                <span className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded border">
                  <MessageSquare className="h-2.5 w-2.5 text-primary stroke-[2.2]" />
                  <span>{data.signal_split_30d.scenario || 0} scenarios run</span>
                </span>
              </div>
            </div>
            <div className="w-full pt-1 overflow-visible">
              <Sparkline points={data.sparkline} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
