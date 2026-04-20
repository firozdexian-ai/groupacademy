import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Fault Recovery Protocol
 * Orchestrates system feedback and re-synchronization attempts during handshake failures.
 */
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

const errorConfig: Record<ErrorType, { icon: typeof AlertCircle; defaultTitle: string; defaultDescription: string }> = {
  network: {
    icon: WifiOff,
    defaultTitle: "Sync Blocked: Network",
    defaultDescription: "Identity registry unavailable. Verify local uplink and re-initialize.",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Sync Blocked: Server",
    defaultDescription: "Backend logic node failure. Our engineers are investigating the trace.",
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Sync Blocked: Timeout",
    defaultDescription: "The handshake protocol exceeded the defined TTL limit. Retrying...",
  },
  notFound: {
    icon: ShieldAlert,
    defaultTitle: "Sync Blocked: 404",
    defaultDescription: "Requested logic artifact does not exist in the current registry.",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Sync Blocked: Unknown",
    defaultDescription: "An unhandled exception occurred during the data handshake.",
  },
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Re-Initialize Sync",
  type = "generic",
  className = "",
  compact = false,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-500",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-rose-500">
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{displayTitle}</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">{displayDescription}</p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-all"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "rounded-[40px] border-2 border-dashed border-rose-500/20 bg-rose-500/[0.02] overflow-hidden animate-in zoom-in-95 duration-500",
        className,
      )}
    >
      <CardHeader className="text-center p-10 pb-4 space-y-4">
        {/* Diagnostic Icon Hub */}
        <div className="relative mx-auto h-16 w-16 mb-2">
          <div className="absolute inset-0 bg-rose-500/10 rounded-3xl rotate-6 animate-pulse" />
          <div className="absolute inset-0 bg-background border border-rose-500/20 rounded-3xl flex items-center justify-center shadow-xl">
            <Icon className="h-8 w-8 text-rose-500" />
          </div>
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-black tracking-tighter uppercase">{displayTitle}</CardTitle>
          <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic leading-relaxed max-w-xs mx-auto">
            {displayDescription}
          </CardDescription>
        </div>
      </CardHeader>

      {onRetry && (
        <CardContent className="text-center p-10 pt-4">
          <Button
            onClick={onRetry}
            className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-[0.97]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Full page error state with optional navbar
export function PageErrorState({
  title,
  description,
  onRetry,
  type = "generic",
  showNavbar = false,
}: ErrorStateProps & { showNavbar?: boolean }) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col selection:bg-rose-500/10">
      {showNavbar && (
        <div className="border-b border-border/40 bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="h-8 w-32 bg-muted/40 rounded-xl" />
            <div className="h-4 w-4 bg-muted/40 rounded-full" />
          </div>
        </div>
      )}
      <main className="flex-1 flex items-center justify-center p-6">
        <ErrorState title={title} description={description} onRetry={onRetry} type={type} className="max-w-md w-full" />
      </main>
      <footer className="p-12 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
          Internal Diagnostics Node v2.6.01 Fault
        </p>
      </footer>
    </div>
  );
}
