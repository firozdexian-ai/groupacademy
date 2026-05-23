import * as React from "react";
import { AlertCircle, RefreshCw, Wifi, Clock, ServerCrash, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ErrorType = "network" | "timeout" | "server" | "rate_limit" | "generic";

interface RetryErrorCardProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

const ERROR_CONFIG: Record<
  ErrorType,
  { icon: React.ComponentType<{ className?: string }>; title: string; description: string }
> = {
  network: {
    icon: Wifi,
    title: "Sync Blocked: Network Timeout",
    description: "Connectivity handshake failed. Verify your local uplink status and re-initialize.",
  },
  timeout: {
    icon: Clock,
    title: "Sync Blocked: Handshake TTL Exceeded",
    description: "The processing request exceeded the defined TTL limit parameters.",
  },
  server: {
    icon: ServerCrash,
    title: "Sync Blocked: Registry Exception",
    description: "The logical node at destination returned an internal pipeline failure.",
  },
  rate_limit: {
    icon: ShieldAlert,
    title: "Sync Blocked: Quota Exhausted",
    description: "Handshake transmission frequency exceeds current security throttling thresholds.",
  },
  generic: {
    icon: AlertCircle,
    title: "Sync Blocked: Pipeline Exception",
    description: "An unhandled execution error occurred during the core data sequence lookup.",
  },
};

/**
 * GroUp Academy: Technical Fault Recovery Terminal Core (RetryErrorCard)
 * Hardened responsive error module protecting layout elements from text truncation jumps and inline scaling jitters.
 * Version: Launch Candidate · Phase Z0 Space & State Stability Locked
 */
export function RetryErrorCard({
  type = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  isRetrying = false,
  className = "",
  compact = false,
}: RetryErrorCardProps) {
  const activeConfigurationMap = ERROR_CONFIG[type] || ERROR_CONFIG.generic;
  const DiagnosticIconNode = activeConfigurationMap.icon;

  const displayTitleTextStr = title || activeConfigurationMap.title;
  const displayDescriptionTextStr = description || activeConfigurationMap.description;

  // =========================================================================
  // INTERFACE PROTOCOL RENDER A: INLINE COMPACT HUD RECOVERY ROW GRID
  // =========================================================================
  if (compact) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-dashed border-destructive/20 bg-destructive/[0.01] text-left antialiased transform-gpu animate-in fade-in duration-200 w-full min-w-0",
          className,
        )}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 select-none pointer-events-none">
            <DiagnosticIconNode className="h-4 w-4 text-destructive stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0 leading-none space-y-1">
            <p className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wide text-destructive pt-0.5 leading-none">
              {displayTitleTextStr}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal block text-wrap select-text pr-1">
              {displayDescriptionTextStr}
            </p>
          </div>
        </div>

        {onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-8 w-full sm:w-auto rounded-lg text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 px-3 shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition-colors mt-1 sm:mt-0"
          >
            <RefreshCw className={cn("h-3 w-3 stroke-[2.5]", isRetrying && "animate-spin")} />
            <span className="inline-block pt-0.5">{isRetrying ? "Syncing..." : retryLabel}</span>
          </Button>
        )}
      </div>
    );
  }

  // =========================================================================
  // INTERFACE PROTOCOL RENDER B: FULL CARD RECOVERY COMPONENT CONTEXT
  // =========================================================================
  return (
    <Card
      role="alert"
      aria-live="assertive"
      className={cn(
        "w-full max-w-sm mx-auto border border-dashed border-destructive/20 bg-destructive/[0.01] rounded-xl overflow-hidden block shadow-none transition-colors duration-300 hover:border-destructive/40",
        className,
      )}
    >
      <CardHeader className="text-center p-5 sm:p-6 pb-2 sm:pb-3 border-none flex flex-col items-center justify-center space-y-4 w-full select-none leading-none shrink-0">
        {/* HUD LEVEL 1: ICON GLOW AND STACK INDEX CONTAINER */}
        <div className="relative h-11 w-11 shrink-0 pointer-events-none select-none">
          <div className="absolute inset-0 bg-destructive/10 rounded-xl rotate-6 animate-pulse" />
          <div className="absolute inset-0 bg-background border border-destructive/15 rounded-xl flex items-center justify-center shadow-xs">
            <DiagnosticIconNode className="h-5 w-5 text-destructive stroke-[2.2]" />
          </div>
        </div>

        {/* HUD LEVEL 2: COMPOSITE HEADINGS TEXT BOUNDS */}
        <div className="space-y-1.5 w-full block leading-none">
          <CardTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5">
            {displayTitleTextStr}
          </CardTitle>
          <CardDescription className="text-[11px] font-semibold text-muted-foreground/60 leading-normal block italic select-text selection:bg-destructive/5 max-w-xs mx-auto pt-0.5">
            {displayDescriptionTextStr}
          </CardDescription>
        </div>
      </CardHeader>

      {/* HUD LEVEL 3: BUTTON ACTION RE-SYNC INGRESS SECTOR SLOT */}
      {onRetry && (
        <CardContent className="text-center p-5 sm:p-6 pt-2 sm:pt-3 border-none w-full flex justify-center items-center shrink-0">
          <Button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              "h-10 px-5 w-full sm:w-auto rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer transform-gpu active:scale-[0.985] transition-transform disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-destructive",
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5 stroke-[2.5]", isRetrying && "animate-spin")} />
            <span>{isRetrying ? "Retrying..." : retryLabel}</span>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Utility: Error Intelligence Node Analyzer
 * Extracts standardized error key classifications from arbitrary runtime payload structures.
 */
export function getErrorType(error: unknown): ErrorType {
  if (!error) return "generic";

  const fallbackObjectAccessor = error as Record<string, unknown> | undefined;
  const processedMessageString = String(fallbackObjectAccessor?.message || "").toLowerCase();
  const processedNameString = String(fallbackObjectAccessor?.name || "").toLowerCase();

  if (
    processedNameString === "aborterror" ||
    processedMessageString.includes("timeout") ||
    processedMessageString.includes("timed out")
  ) {
    return "timeout";
  }
  if (
    processedMessageString.includes("network") ||
    processedMessageString.includes("fetch") ||
    processedMessageString.includes("failed to fetch")
  ) {
    return "network";
  }
  if (
    processedMessageString.includes("rate limit") ||
    processedMessageString.includes("429") ||
    processedMessageString.includes("too many")
  ) {
    return "rate_limit";
  }
  if (
    processedMessageString.includes("500") ||
    processedMessageString.includes("server") ||
    processedMessageString.includes("internal")
  ) {
    return "server";
  }

  return "generic";
}
