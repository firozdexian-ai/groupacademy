import * as React from "react";
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ErrorType = "network" | "server" | "timeout" | "generic" | "notFound";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: ErrorType;
  className?: string;
  compact?: boolean;
}

const errorConfig: Record<
  ErrorType,
  { icon: React.ComponentType<{ className?: string }>; defaultTitle: string; defaultDescription: string }
> = {
  network: {
    icon: WifiOff,
    defaultTitle: "Sync Blocked: Network Timeout",
    defaultDescription: "Identity registry connection lost. Verify your local uplink status and retry.",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Sync Blocked: Infrastructure Fault",
    defaultDescription: "Remote computing core exception block. Systems engineers are inspecting the trace.",
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Sync Blocked: Handshake TTL Exceeded",
    defaultDescription: "The verification sequence timed out before data streams could resolve safely.",
  },
  notFound: {
    icon: ShieldAlert,
    defaultTitle: "Sync Blocked: Missing Logic Node",
    defaultDescription: "The specified data asset does not reside within the current cluster registry mapping.",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Sync Blocked: Unhandled Pipeline Exception",
    defaultDescription: "An internal security or tracking failure tripped the structural access gateway.",
  },
};

/**
 * GroUp Academy: Fault Recovery Protocol Interface Sentinel (ErrorState)
 * Hardened responsive fallback terminal managing layout errors and processing re-synchronization loops.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Re-Initialize Handshake",
  type = "generic",
  className = "",
  compact = false,
}: ErrorStateProps) {
  const currentConfigurationMap = errorConfig[type] || errorConfig.generic;
  const DiagnosticIconNode = currentConfigurationMap.icon;

  const displayTitleTextStr = title || currentConfigurationMap.defaultTitle;
  const displayDescriptionTextStr = description || currentConfigurationMap.defaultDescription;

  // =========================================================================
  // INTERFACE PROTOCOL RENDER A: INLINE COMPACT HUD RECOVERY ROW GRID
  // =========================================================================
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2.5 p-4 text-center select-none transform-gpu antialiased animate-in fade-in duration-200 w-full max-w-sm mx-auto",
          className,
        )}
      >
        <div className="flex items-center justify-center gap-2 text-destructive leading-none w-full shrink-0">
          <DiagnosticIconNode className="h-4 w-4 stroke-[2.5] shrink-0" />
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide truncate block pt-0.5">
            {displayTitleTextStr}
          </span>
        </div>

        <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal block select-text pr-0.5 italic w-full">
          {displayDescriptionTextStr}
        </p>

        {onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 px-3 mt-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3 w-3 stroke-[2.5]" />
            <span>{retryLabel}</span>
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
      className={cn(
        "border border-dashed border-destructive/20 bg-destructive/[0.01] rounded-xl overflow-hidden w-full max-w-md mx-auto block shadow-none transition-colors duration-300 hover:border-destructive/40",
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
            className="h-10 px-5 w-full sm:w-auto rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer transform-gpu active:scale-[0.985] transition-transform"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{retryLabel}</span>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Full Page Isolated Security & Error Layout Panel (PageErrorState)
 * Locks down total window view space when root handshakes fail to sync downstream parameters.
 */
export function PageErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  type = "generic",
  showNavbar = false,
}: ErrorStateProps & { showNavbar?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground/90 selection:bg-destructive/10 flex flex-col justify-between items-center w-full transform-gpu antialiased select-none font-sans">
      {/* HUD LEVEL 1: TOP ISOLATED HEADER SIMULATION FILL */}
      {showNavbar ? (
        <div className="w-full border-b border-border/40 bg-card/60 backdrop-blur-md shrink-0 h-14 flex items-center justify-center select-none pointer-events-none">
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 w-full">
            <div className="h-6 w-24 bg-muted/30 rounded-lg" />
            <div className="h-4 w-4 bg-muted/30 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="h-1 shrink-0 select-none pointer-events-none" aria-hidden="true" />
      )}

      {/* HUD LEVEL 2: ACTIVE FAULT FRAME CORE DISPATCH CANVAS */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 min-h-0">
        <ErrorState
          title={title}
          description={description}
          onRetry={onRetry}
          retryLabel={retryLabel}
          type={type}
          className="w-full"
        />
      </main>

      {/* HUD LEVEL 3: STATIC BOTTOM BASE TELEMETRY SECURE INFRASTRUCTURE OMNIPRESENCE MARKER */}
      <footer className="w-full p-6 sm:p-8 shrink-0 text-center select-none pointer-events-none h-14 flex items-center justify-center">
        <p className="font-mono text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground/20 leading-none">
          Internal Systems Diagnostic Matrix Core // Operational Exception Block Sealed
        </p>
      </footer>
    </div>
  );
}
