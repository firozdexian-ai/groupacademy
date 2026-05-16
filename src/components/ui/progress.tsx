import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Logic Progression Telemetry Node (Progress)
 * Hardened WAI-ARIA compliant bar protecting alignment variables against input array overflows.
 * Version: Launch Candidate · Phase Z0 Calculation Boundary Locked
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Phase 1: Defensively restrict the tracking scale value to avoid rendering bounds cracks
  const sanitizedPercentageValue = React.useMemo(() => {
    const baselineRawNum = typeof value === "number" ? value : 0;
    return Math.max(0, Math.min(100, baselineRawNum));
  }, [value]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50 select-none pointer-events-none transform-gpu antialiased shrink-0 block border border-transparent",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-transform duration-300 ease-out relative rounded-full transform-gpu",
          "after:absolute after:inset-0 after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent",
        )}
        style={{ transform: `translateX(-${100 - sanitizedPercentageValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = "Progress_Core_Progression_Node";

export { Progress };
