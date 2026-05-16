import { useEffect, useMemo, useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/errorTracking";
import { Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  current: number;
  longest: number;
  className?: string;
}

/**
 * GroUp Academy: Technical Engagement Activity Streak Indicator (StreakBadge)
 * An authoritative operational badge tracking candidate learning streaks, engagement velocity, and records.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function StreakBadge({ current, longest, className }: StreakBadgeProps) {
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute numerical limits defensively using strict fallback verification matrices
  const streakMetricsModel = useMemo(() => {
    const castedCurrentStreakNum = Number(current) || 0;
    const castedLongestStreakNum = Number(longest) || 0;

    // Core limit rule: Suppress the visualization panel for metrics less than 2 tracking iterations
    const shouldRender = castedCurrentStreakNum >= 2;

    return {
      current: castedCurrentStreakNum,
      longest: Math.max(castedCurrentStreakNum, castedLongestStreakNum),
      shouldRender,
    };
  }, [current, longest]);

  // Monitor performance indicator milestones down global telemetry logs
  useEffect(() => {
    if (streakMetricsModel.shouldRender) {
      trackEvent("engagement_streak_badge_rendered", {
        currentStreakDays: streakMetricsModel.current,
        historicalBestDays: streakMetricsModel.longest,
      });
    }
  }, [streakMetricsModel.shouldRender, streakMetricsModel.current, streakMetricsModel.longest]);

  if (!streakMetricsModel.shouldRender) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "inline-flex items-center gap-1 px-2 h-5.5 rounded text-[10px] font-extrabold tracking-wide uppercase border border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 select-none leading-none shadow-xs shrink-0 cursor-help font-mono transition-transform duration-300 hover:scale-[1.02]",
              className,
            )}
          >
            <Flame className="h-3.5 w-3.5 stroke-[2.5] text-amber-500 fill-amber-500/10 shrink-0" />
            <span className="pt-0.5 block">{streakMetricsModel.current}d</span>
          </Badge>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="rounded-lg border border-border/40 bg-popover/95 backdrop-blur-md px-2.5 py-1.5 shadow-md font-bold text-xs animate-in fade-in duration-100 select-none"
        >
          <p className="text-[10px] font-mono font-bold tracking-tight text-popover-foreground uppercase leading-none">
            Continuous Engagement Streak:{" "}
            <span className="text-primary font-black">{streakMetricsModel.current} Days</span> &bull; Historical Peak:{" "}
            {streakMetricsModel.longest}d
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default StreakBadge;
