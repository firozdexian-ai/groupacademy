import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProcessingStage {
  progress: number;
  message: string;
}

interface ProcessingCardProps {
  title: string;
  stages: ProcessingStage[];
  /** Duration in ms to complete all stages (default: 30000) */
  duration?: number;
  /** Show error state with retry */
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * GroUp Academy: Technical Kinetic Synthesis Protocol Indicator (ProcessingCard)
 * Hardened asynchronous background progress monitor enforcing self-clearing memory hooks and flexible vector scales.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Vector Bounds Locked
 */
export function ProcessingCard({ title, stages, duration = 30000, error, onRetry, className }: ProcessingCardProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  // Phase 1: Defensively lock arrays to isolate loop trackers from memory reference drops
  const stabilizedSortedStages = useMemo(() => {
    return [...stages].sort((itemA, itemB) => itemA.progress - itemB.progress);
  }, [stages]);

  // Phase 2: Compute current stage status message dynamically to avoid desynchronized state hooks
  const currentMessageTextStr = useMemo(() => {
    if (stabilizedSortedStages.length === 0) return "Initializing calculation arrays...";
    const matchedStageObj = stabilizedSortedStages.filter((s) => s.progress <= currentProgress).pop();
    return matchedStageObj ? matchedStageObj.message : stabilizedSortedStages[0].message;
  }, [currentProgress, stabilizedSortedStages]);

  useEffect(() => {
    if (error) return;

    setCurrentProgress(0);
    const stepIntervalDurationMs = duration / 100;

    const pipelineIntervalTimerRef = setInterval(() => {
      setCurrentProgress((previousProgressNum) => {
        if (previousProgressNum >= 99) {
          clearInterval(pipelineIntervalTimerRef);
          return 99;
        }
        return previousProgressNum + 1;
      });
    }, stepIntervalDurationMs);

    return () => clearInterval(pipelineIntervalTimerRef);
  }, [duration, error]);

  // =========================================================================
  // INTERFACE PROTOCOL RENDER A: EXPORT FAULT RECOVERY SCREEN TERMINAL
  // =========================================================================
  if (error) {
    return (
      <Card
        role="alert"
        aria-live="assertive"
        className={cn(
          "w-full max-w-sm mx-auto border border-dashed border-destructive/20 bg-destructive/[0.01] rounded-xl text-left antialiased transform-gpu block animate-in fade-in duration-150 shadow-none",
          className,
        )}
      >
        <CardContent className="p-5 sm:p-6 text-center flex flex-col justify-center items-center w-full leading-none space-y-4">
          <div className="relative h-11 w-11 shrink-0 pointer-events-none select-none">
            <div className="absolute inset-0 bg-destructive/10 rounded-xl rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-background border border-destructive/15 rounded-xl flex items-center justify-center shadow-xs">
              <AlertCircle className="h-5 w-5 text-destructive stroke-[2.2]" />
            </div>
          </div>

          <div className="space-y-1.5 leading-none w-full block">
            <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5">
              Synthesis Fault Flagged
            </h2>
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground/60 leading-normal block italic pr-0.5 select-text selection:bg-destructive/5 max-w-xs mx-auto">
              {error}
            </p>
          </div>

          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="h-10 px-5 w-full sm:w-auto rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer transform-gpu active:scale-[0.985] transition-transform"
            >
              <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Re-Initialize Handshake</span>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // =========================================================================
  // INTERFACE PROTOCOL RENDER B: ACTIVE DATA ACQUISITION PROGRESS COMPONENT
  // =========================================================================
  return (
    <Card
      role="progressbar"
      aria-valuenow={currentProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full max-w-sm mx-auto rounded-xl border border-border/40 bg-card/95 backdrop-blur-md shadow-xs text-left antialiased select-none transform-gpu block overflow-hidden",
        className,
      )}
    >
      <CardContent className="p-5 sm:p-6 text-center flex flex-col justify-center items-center w-full">
        {/* HUD LEVEL 1: COMPOSITE SVG PERCENTAGE HOOP DISPATCH MATRIX */}
        <div className="relative h-16 w-16 mx-auto mb-4 shrink-0 pointer-events-none select-none">
          <svg className="w-full h-full -rotate-90 block" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-primary/10"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - currentProgress}
              strokeLinecap="round"
              className="text-primary transition-all duration-200 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="font-mono text-xs font-black tabular-nums text-primary">{currentProgress}%</span>
            <span className="font-mono text-[6px] font-extrabold uppercase tracking-widest text-muted-foreground/40 mt-0.5">
              Sync
            </span>
          </div>
        </div>

        {/* HUD LEVEL 2: CONTEXT READOUT TEXT CONTAINERS */}
        <div className="space-y-1.5 leading-none w-full block mb-5">
          <h2 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5">
            {title}
          </h2>
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 truncate block pt-0.5 max-w-xs mx-auto">
            {currentMessageTextStr}
          </p>
        </div>

        {/* HUD LEVEL 3: LINEAR METRIC GAUGES & PULSING ACCENTS */}
        <div className="w-full block space-y-4">
          <Progress value={currentProgress} className="h-1 bg-primary/10 rounded-full" />

          <div className="w-full flex items-center justify-center bg-muted/20 border border-border/10 rounded-lg p-3 gap-2 shadow-inner leading-none">
            <div className="relative h-3.5 w-3.5 shrink-0 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse stroke-[2.2]" />
              <div className="absolute inset-0 bg-primary/10 blur-md rounded-full animate-pulse" />
            </div>
            <span className="font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pt-0.5">
              Computation Status: <span className="text-primary font-black">Active Compilation Layer</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
