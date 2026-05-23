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
    defaultTitle: "Connection lost",
    defaultDescription: "Check your internet and try again.",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Something went wrong",
    defaultDescription: "Our team has been notified. Please try again in a moment.",
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Request timed out",
    defaultDescription: "This is taking longer than usual. Please try again.",
  },
  notFound: {
    icon: ShieldAlert,
    defaultTitle: "Not found",
    defaultDescription: "We couldn't find what you were looking for.",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    defaultDescription: "Please try again. If the issue continues, contact support.",
  },
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  type = "generic",
  className = "",
  compact = false,
}: ErrorStateProps) {
  const config = errorConfig[type] || errorConfig.generic;
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2.5 p-4 text-center select-none transform-gpu antialiased animate-in fade-in duration-200 w-full max-w-sm mx-auto",
          className,
        )}
      >
        <div className="flex items-center justify-center gap-2 text-destructive leading-none w-full shrink-0">
          <Icon className="h-4 w-4 stroke-[2.5] shrink-0" />
          <span className="text-xs font-semibold truncate block">
            {displayTitle}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-normal block select-text w-full">
          {displayDescription}
        </p>

        {onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 px-3 mt-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3 w-3 stroke-[2.5]" />
            <span>{retryLabel}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "border border-dashed border-destructive/20 bg-destructive/[0.01] rounded-xl overflow-hidden w-full max-w-md mx-auto block shadow-none transition-colors duration-300 hover:border-destructive/40",
        className,
      )}
    >
      <CardHeader className="text-center p-5 sm:p-6 pb-2 sm:pb-3 border-none flex flex-col items-center justify-center space-y-4 w-full select-none leading-none shrink-0">
        <div className="relative h-11 w-11 shrink-0 pointer-events-none select-none">
          <div className="absolute inset-0 bg-destructive/10 rounded-xl rotate-6 animate-pulse" />
          <div className="absolute inset-0 bg-background border border-destructive/15 rounded-xl flex items-center justify-center shadow-xs">
            <Icon className="h-5 w-5 text-destructive stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-1.5 w-full block leading-none">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground leading-tight pt-0.5">
            {displayTitle}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-normal block select-text max-w-xs mx-auto pt-0.5">
            {displayDescription}
          </CardDescription>
        </div>
      </CardHeader>

      {onRetry && (
        <CardContent className="text-center p-5 sm:p-6 pt-2 sm:pt-3 border-none w-full flex justify-center items-center shrink-0">
          <Button
            type="button"
            onClick={onRetry}
            className="h-10 px-5 w-full sm:w-auto rounded-xl font-semibold text-sm gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer transform-gpu active:scale-[0.985] transition-transform"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{retryLabel}</span>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export function PageErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  type = "generic",
  showNavbar = false,
}: ErrorStateProps & { showNavbar?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between items-center w-full transform-gpu antialiased font-sans">
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

      <div className="h-6 shrink-0" aria-hidden="true" />
    </div>
  );
}
