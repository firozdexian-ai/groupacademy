import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Structural Loading Node (FeedSkeleton)
 * CTO Reference: High-fidelity ghost state for feed hydration cycles.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function FeedSkeleton() {
  // Asynchronously record rendering performance metrics via our telemetry client
  useEffect(() => {
    trackEvent("FeedSkeleton:hydration_cycle_mounted", {
      timestamp: new Date().toISOString(),
      viewportConstraint: "mobile_vertical_only",
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 touch-none select-none">
      {/* INFRASTRUCTURE: Header Banner Node Container */}
      <div className="relative overflow-hidden rounded-2xl aspect-[3/1] bg-muted/20 border border-border/30 shadow-sm backdrop-blur-sm">
        <div className="absolute inset-0 flex items-center px-4 sm:px-6 gap-4">
          <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full ring-2 ring-border/20 shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-32 sm:w-48 rounded-md" />
            <Skeleton className="h-3 w-20 sm:w-32 opacity-50 rounded-sm" />
          </div>
        </div>
      </div>

      {/* INTELLIGENCE: Strategy Carousel Node Wrapper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-2.5 w-16 opacity-40 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Horizontal Card Track Shell */}
        <div className="flex gap-4 overflow-hidden -mx-4 px-4 scrollbar-none">
          {[1, 2].map((index) => (
            <div
              key={index}
              className="shrink-0 w-[280px] sm:w-[320px] p-4 rounded-2xl border border-border/30 bg-card/40 space-y-4 shadow-inner"
            >
              <div className="flex justify-between items-start gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full rounded-sm" />
                <Skeleton className="h-3.5 w-full rounded-sm" />
                <Skeleton className="h-3.5 w-3/4 opacity-40 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEGMENTATION: Tactical Filter Node Matrix (Strict 4-Slot Single Row Layout Alignment) */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 p-1.5 bg-muted/10 dark:bg-muted/5 rounded-2xl border border-border/40 shadow-sm">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="flex-1 flex flex-col items-center py-2.5 space-y-2">
              <Skeleton className="h-4 w-4 rounded-md shrink-0" />
              <Skeleton className="h-2 w-8 rounded-full opacity-40" />
            </div>
          ))}
        </div>
      </div>

      {/* ARTIFACTS: Feed Card Pipeline Frame */}
      <div className="space-y-6 sm:space-y-8">
        {[1, 2].map((cardOffset) => (
          <Card
            key={cardOffset}
            className="overflow-hidden border border-border/30 rounded-2xl bg-card/50 shadow-sm backdrop-blur-md"
          >
            {/* Native 3:1 Promotional Canvas Placement Node */}
            <Skeleton className="aspect-[3/1] w-full rounded-none opacity-30 border-b border-border/20" />

            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-5/6 rounded-md opacity-60" />
              </div>

              {/* Attributes Node Array */}
              <div className="flex gap-2.5 items-center select-none">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>

              {/* Match Reason Logic Node Box */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 shadow-inner">
                <div className="flex gap-3 items-start">
                  <Skeleton className="h-4 w-4 rounded-full mt-0.5 shrink-0 opacity-40" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3 w-full rounded-sm" />
                    <Skeleton className="h-3 w-11/12 rounded-sm opacity-40" />
                  </div>
                </div>
              </div>

              {/* Action Node Strip Control Bar */}
              <div className="flex gap-3 pt-4 border-t border-border/20">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-11 rounded-xl opacity-50 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
