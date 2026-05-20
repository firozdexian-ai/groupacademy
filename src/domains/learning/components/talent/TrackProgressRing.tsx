import { useEffect, useMemo } from "react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  done: number;
  total: number;
  size?: number;
  label?: string;
}

/**
 * GroUp Academy: Trajectory Progress Ring Controller (TrackProgressRing)
 * An authoritative performance indicator rendering high-velocity spatial metrics matrices inside lightweight SVG ring elements.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function TrackProgressRing({ done, total, size = 56, label }: Props) {
  // Clean dynamic numeric indicators defensively against unexpected runtime parameters
  const calculatedDone = typeof done === "number" && !isNaN(done) ? Math.max(0, done) : 0;
  const calculatedTotal = typeof total === "number" && !isNaN(total) ? Math.max(0, total) : 0;
  const calculatedSize = typeof size === "number" && !isNaN(size) ? Math.max(20, size) : 56;

  const percentageScoreValue = useMemo(() => {
    if (calculatedTotal <= 0) return 0;
    return Math.min(100, Math.round((calculatedDone / calculatedTotal) * 100));
  }, [calculatedDone, calculatedTotal]);

  // Monitor spatial tracking metric impressions via analytical telemetry paths
  useEffect(() => {
    if (calculatedTotal > 0) {
      trackEvent("progress_ring_node_rendered", {
        progressPercentage: percentageScoreValue,
        completedCount: calculatedDone,
        allocatedTotal: calculatedTotal,
        layoutSizePx: calculatedSize,
      });
    }
  }, [percentageScoreValue, calculatedDone, calculatedTotal, calculatedSize]);

  // 1. Core Mathematical Alignment Checklist Passthrough
  const { radius, circumference, strokeDashoffset } = useMemo(() => {
    const strokeWidthThickness = 4;
    const calculatedRadius = (calculatedSize - strokeWidthThickness - 2) / 2;
    const computedCircumference = 2 * Math.PI * calculatedRadius;

    // Bounds Check: Enforce strict percentage clamps over linear progression variables
    const safetyClampedPercentage = Math.max(0, Math.min(100, percentageScoreValue));
    const offsetStrokeAllocation = computedCircumference - (safetyClampedPercentage / 100) * computedCircumference;

    return {
      radius: calculatedRadius,
      circumference: computedCircumference,
      strokeDashoffset: offsetStrokeAllocation,
    };
  }, [calculatedSize, percentageScoreValue]);

  return (
    <div
      className="relative inline-flex items-center justify-center select-none antialiased transform-gpu shrink-0"
      style={{ width: calculatedSize, height: calculatedSize }}
    >
      {/* HUD COMPOSITE LAYER 1: HARDENED INTERACTIVE VECTOR SHIELD */}
      <svg
        width={calculatedSize}
        height={calculatedSize}
        className="-rotate-90 transform-gpu overflow-visible pointer-events-none"
      >
        {/* Background Tracker Track Base Element */}
        <circle
          cx={calculatedSize / 2}
          cy={calculatedSize / 2}
          r={radius}
          className="stroke-muted/30 dark:stroke-muted/20 fill-none"
          strokeWidth="3.5"
        />
        {/* Foreground active progressive trace metric circle line */}
        <circle
          cx={calculatedSize / 2}
          cy={calculatedSize / 2}
          r={radius}
          className="stroke-primary fill-none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 400ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* HUD COMPOSITE LAYER 2: TYPOGRAPHY METADATA DISPLAY STRIP CONTAINER */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none p-1">
        <div className="min-w-0 max-w-full text-center flex flex-col justify-center leading-none">
          <p className="text-xs sm:text-sm font-black tracking-tight tabular-nums text-foreground/90 block leading-none select-text">
            {percentageScoreValue}%
          </p>
          {label && (
            <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60 block truncate max-w-full mt-0.5 leading-none">
              {label.trim()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
