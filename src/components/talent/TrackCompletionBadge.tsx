import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/errorTracking";
import { Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackCompletionBadgeProps {
  count: number;
  className?: string;
}

/**
 * GroUp Academy: Syllabus Track Completion Badge Counter (TrackCompletionBadge)
 * An authoritative operational badge tracking verified aggregate completed training paths down user rows.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function TrackCompletionBadge({ count, className }: TrackCompletionBadgeProps) {
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute quantity thresholds defensively through strict fallback casting structures
  const badgingMetricsModel = useMemo(() => {
    const castedQuantityNum = Number(count) || 0;
    const shouldRender = castedQuantityNum > 0;
    const pluralizedLabelSuffixStr = castedQuantityNum === 1 ? "" : "s";

    return {
      quantity: castedQuantityNum,
      shouldRender,
      label: `${castedQuantityNum} Track${pluralizedLabelSuffixStr}`,
    };
  }, [count]);

  // Monitor metric badge impressions down global telemetry logs
  useEffect(() => {
    if (badgingMetricsModel.shouldRender) {
      trackEvent("track_completion_badge_rendered", { totalTracksCount: badgingMetricsModel.quantity });
    }
  }, [badgingMetricsModel.shouldRender, badgingMetricsModel.quantity]);

  if (!badgingMetricsModel.shouldRender) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5.5 rounded text-[10px] font-extrabold tracking-wide uppercase border border-transparent bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 select-none leading-none shadow-xs shrink-0 cursor-help transform-gpu antialiased font-mono",
        className,
      )}
      title={`${badgingMetricsModel.label} — verified completion on your profile.`}
    >
      <Layers className="h-3 w-3 stroke-[2.5] shrink-0" />
      <span className="pt-0.5 block">{badgingMetricsModel.label}</span>
    </Badge>
  );
}
