import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { RefreshCw, Home, Zap, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  faultTokenIdStr: string | null;
}

/**
 * GroUp Academy: Neural Containment Perimeter Error Boundary (ErrorBoundary)
 * Authoritative fail-safe isolation layer capturing unhandled framework crashes and reporting tracing exceptions.
 * Version: Launch Candidate · Phase Z0 Hardened Containment System
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    faultTokenIdStr: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // SYNC LOCK: Transition state metrics to containment mode and freeze tracking token to eliminate layout oscillations
    const stableDeterministicTokenStr = `ERR-${Math.random().toString(36).substring(4, 10).toUpperCase()}`;
    return {
      hasError: true,
      error,
      faultTokenIdStr: stableDeterministicTokenStr,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // PROTOCOL ENGINE: Administrative Telemetry Ingress Dispatch Passage
    trackError(error, {
      component: "Neural_Boundary_Perimeter",
      action: "Containment_Triggered",
      faultToken: this.state.faultTokenIdStr || "UNKNOWN_TOKEN",
      stack: errorInfo.componentStack || undefined,
    });

    trackEvent("error_boundary_containment_activated", { token: this.state.faultTokenIdStr });
  }

  private handleSystemReloadProtocol = () => {
    trackEvent("error_boundary_node_reinitialize_clicked");
    try {
      window.location.reload();
    } catch (err) {
      window.location.href = window.location.pathname;
    }
  };

  private handleAbortToCommandDeckProtocol = () => {
    trackEvent("error_boundary_abort_to_deck_clicked");
    // Secure Fallback Pathing: Fall back to application home index cleanly
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "min-h-[400px] w-full flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-md select-none transform-gpu antialiased animate-in fade-in duration-300",
            this.className,
          )}
        >
          <Card className="max-w-md w-full rounded-xl border border-destructive/20 bg-destructive/[0.015] shadow-sm overflow-hidden">
            {/* HUD LEVEL 1: FAULT ROW PANEL HEADER CONTAINER */}
            <CardHeader className="text-center p-5 sm:p-6 pb-2 border-b border-border/5 bg-muted/5">
              <div className="relative mx-auto mb-4 select-none pointer-events-none w-fit">
                <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/5 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="h-6 w-6 text-destructive animate-pulse stroke-[2.2]" />
                </div>
                <Zap className="absolute -top-1.5 -right-1.5 h-4 w-4 text-destructive fill-destructive/10 opacity-40 stroke-[2.2]" />
              </div>

              <CardTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                System Thread Logic Fault Contained
              </CardTitle>
              <CardDescription className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/50 block leading-none pt-2 italic">
                Perimeter Isolation Map Active &bull; Trace ID: {this.state.faultTokenIdStr}
              </CardDescription>
            </CardHeader>

            {/* HUD LEVEL 2: CONTEXT DETAILED ANALYTIC ERROR HOVER DATA */}
            <CardContent className="p-5 sm:p-6 flex flex-col justify-center gap-4 font-bold text-xs text-foreground/90">
              <div className="p-3.5 rounded-xl border border-border/40 bg-background/50 select-none leading-none shadow-inner w-full block text-left">
                <p className="text-[10px] font-semibold text-muted-foreground/60 leading-normal block italic pr-0.5 uppercase tracking-normal">
                  An unhandled component runtime exception was caught within the client lifecycle thread context. The
                  boundary perimeter has isolated this structural segment to secure global interface stability.
                </p>
              </div>

              {/* HUD LEVEL 3: INTERFACE COMMAND TRIGGER SECTOR SYSTEM OPTIONS */}
              <div className="space-y-2.5 w-full font-bold text-xs select-none pt-1">
                <Button
                  type="button"
                  onClick={this.handleSystemReloadProtocol}
                  className="w-full h-10 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-transform active:scale-[0.985]"
                >
                  <RefreshCw className="h-4 w-4 stroke-[2.5]" />
                  <span>Reinitialize Sub-Workspace Node</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={this.handleAbortToCommandDeckProtocol}
                  className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors gap-1.5"
                >
                  <Home className="h-4 w-4 stroke-[2.2]" />
                  <span>Abort to Platform Central Command Deck</span>
                </Button>
              </div>

              <p className="text-[8px] font-mono font-extrabold uppercase tracking-widest text-destructive/30 text-center select-none leading-none pt-1 shrink-0 block w-full">
                Telemetry synchronized with secure verification compliance indices
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
