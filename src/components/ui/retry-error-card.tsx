import * as React from "react";
import { AlertCircle, RefreshCw, Wifi, Clock, ServerCrash, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Fault Recovery Terminal
 * High-fidelity diagnostic feedback node for managing data handshake failures.
 */
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

const ERROR_CONFIG: Record<ErrorType, { icon: typeof AlertCircle; title: string; description: string }> = {
  network: {
    icon: Wifi,
    title: "Sync Blocked: Network",
    description: "Connectivity handshake failed. Verify local uplink and re-initialize.",
  },
  timeout: {
    icon: Clock,
    title: "Sync Blocked: Timeout",
    description: "The protocol exceeded the defined TTL limit. Request aborted.",
  },
  server: {
    icon: ServerCrash,
    title: "Sync Blocked: Registry",
    description: "Logic node at destination returned an internal exception (500).",
  },
  rate_limit: {
    icon: ShieldAlert,
    title: "Sync Blocked: Quota",
    description: "Handshake frequency exceeds security parameters. Please wait.",
  },
  generic: {
    icon: AlertCircle,
    title: "Sync Blocked: Unknown",
    description: "An unhandled exception occurred during the data sequence.",
  },
};

export function RetryErrorCard({
  type = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Re-initialize Sync",
  isRetrying = false,
  className = "",
  compact = false,
}: RetryErrorCardProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-2xl border-2 border-rose-500/20 bg-rose-500/[0.03] animate-in fade-in slide-in-from-top-1 duration-300",
          className,
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <Icon className="h-5 w-5 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 leading-none mb-1">
            {displayTitle}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight truncate">
            {displayDescription}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-all"
          >
            {isRetrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                {retryLabel}
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "max-w-md mx-auto rounded-[40px] border-2 border-dashed border-rose-500/20 bg-rose-500/[0.02] shadow-2xl animate-in zoom-in-95 duration-500",
        className,
      )}
    >
      <CardHeader className="text-center p-10 pb-4 space-y-5">
        {/* Diagnostic Icon Hub */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 bg-rose-500/10 rounded-[28px] rotate-6 animate-pulse" />
          <div className="absolute inset-0 bg-background border border-rose-500/20 rounded-[28px] flex items-center justify-center shadow-xl">
            <Icon className="h-10 w-10 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none">{displayTitle}</CardTitle>
          <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic leading-relaxed max-w-[280px] mx-auto">
            {displayDescription}
          </CardDescription>
        </div>
      </CardHeader>

      {onRetry && (
        <CardContent className="text-center p-10 pt-4">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              "h-12 w-full rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
              "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98]",
              isRetrying && "opacity-80",
            )}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-3 animate-spin" />
                Syncing Registry...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-3" />
                {retryLabel}
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Utility: Error Intelligence Node
 * Detects failure type from protocol artifacts.
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return "generic";

  const message = error?.message?.toLowerCase() || "";
  const name = error?.name?.toLowerCase() || "";

  if (name === "aborterror" || message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) return "network";
  if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) return "rate_limit";
  if (message.includes("500") || message.includes("server") || message.includes("internal")) return "server";

  return "generic";
}
