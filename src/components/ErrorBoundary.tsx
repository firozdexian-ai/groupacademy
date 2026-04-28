import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Zap, ShieldAlert } from "lucide-react";
import { trackError } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Containment Perimeter (ErrorBoundary)
 * CTO Reference: Authoritative fail-safe for unhandled runtime exceptions.
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // SYNC: Transition state to containment mode
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // PROTOCOL: Administrative Telemetry Ingress
    console.error("[Containment_Perimeter] Fault_Detected:", error);
    trackError(error, {
      component: "Neural_Boundary",
      action: "Containment_Triggered",
      stack: errorInfo.componentStack || undefined,
    });
  }

  private handleSystemReload = () => {
    window.location.reload();
  };

  private handleAbortToBase = () => {
    window.location.href = "/app/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "min-h-[400px] w-full flex items-center justify-center p-6 bg-background/95 backdrop-blur-md animate-in fade-in duration-700",
            this.props.className,
          )}
        >
          <Card className="max-w-md w-full rounded-[32px] border-2 border-rose-500/20 bg-rose-500/5 shadow-2xl overflow-hidden">
            {/* HUD: FAULT_HEADER */}
            <CardHeader className="text-center p-8 pb-4">
              <div className="relative mx-auto mb-6">
                <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border-2 border-rose-500/20">
                  <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
                </div>
                <Zap className="absolute -top-2 -right-2 h-5 w-5 text-rose-500 fill-current opacity-40" />
              </div>
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                Logic_Fault_Detected
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic mt-4">
                Perimeter_Containment_Active // ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-4 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-muted/10 border border-border/5 mb-2">
                <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic text-center">
                  An unexpected exception occurred within the neural thread. The system has isolated the node to prevent
                  global instability.
                </p>
              </div>

              {/* HUD: RECOVERY_COMMANDS */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleSystemReload}
                  size="xl"
                  className="w-full h-14 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-primary/10 transition-all active:scale-95 gap-3"
                >
                  <RefreshCw className="h-4 w-4" /> REINITIALIZE_NODE
                </Button>

                <Button
                  onClick={this.handleAbortToBase}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest hover:bg-muted/10 transition-all gap-3"
                >
                  <Home className="h-4 w-4" /> ABORT_TO_COMMAND_DECK
                </Button>
              </div>

              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-rose-500/30 text-center mt-4">
                Telemetry_Synced_With_Faculty_Registry
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
