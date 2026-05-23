import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, LogIn, RefreshCw, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { usePWADetect } from "@/hooks/usePWADetect";
import { cn } from "@/lib/utils";

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
  authType?: "ai" | "classic";
}

/**
 * GroUp Academy: Authoritative Session Access Control Gate (AuthGate)
 * Architectural security boundary intercepting untrusted path navigation and evaluating profile credentials.
 * Version: Launch Candidate · Phase Z0 Hardened Routing Guard Lock
 */
export function AuthGate({ children, redirectTo, message, authType = "ai" }: AuthGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isPWA } = usePWADetect();

  const isMountedRef = useRef<boolean>(true);
  const auditLockBusyRef = useRef<boolean>(false);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncSeconds, setSyncSeconds] = useState(0);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("auth_gate_guard_mounted", { path: location.pathname });
    return () => {
      isMountedRef.current = false;
    };
  }, [location.pathname]);

  const executeRedirectHandshake = useCallback(() => {
    const returnUrl = redirectTo || location.pathname + location.search;
    const ingressNode = authType === "classic" ? "/auth/classic" : "/auth";
    const secureRoutingDestinationStr = `${ingressNode}?returnTo=${encodeURIComponent(returnUrl)}`;

    trackEvent("auth_gate_redirect_handshake_executed", { destination: secureRoutingDestinationStr });
    navigate(secureRoutingDestinationStr);
  }, [navigate, redirectTo, location, authType]);

  const executeAuthAudit = useCallback(async () => {
    if (auditLockBusyRef.current) return;
    auditLockBusyRef.current = true;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Execute security check against local and remote GoTrue token instances
      const {
        data: { session },
        error: auditError,
      } = await supabase.auth.getSession();
      if (auditError) throw auditError;

      if (!session) {
        if (isMountedRef.current) setUser(null);
      } else {
        if (isMountedRef.current) {
          setUser(session.user);
          trackEvent("auth_gate_session_verified", { userId: session.user.id });
        }
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "AuthGate", action: "execute_auth_audit" });

      // Clean out broken/expired refresh structures instantly to block token cycling loops
      if (formattedExceptionMsgStr.includes("refresh_token_not_found") || caughtPipelineExceptionErr?.status === 400) {
        try {
          await supabase.auth.signOut();
          await queryClient.clear();
        } catch (signOutErr) {
          trackError(signOutErr, { component: "AuthGate", action: "sign_out_cleanup_fallback" });
        }
        executeRedirectHandshake();
        return;
      }

      if (isMountedRef.current) {
        setError("We couldn't verify your session. Please sign in again.");
      }
    } finally {
      auditLockBusyRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [executeRedirectHandshake, queryClient]);

  // Unified Subscriber Pass: Listen natively to active configuration token stream variations
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (authEvent, sessionPayload) => {
      trackEvent("auth_gate_state_changed", { event: authEvent });

      if (authEvent === "SIGNED_OUT") {
        if (isMountedRef.current) {
          setUser(null);
          setLoading(false);
        }
        await queryClient.clear();
      } else if (sessionPayload) {
        if (isMountedRef.current) {
          setUser(sessionPayload.user);
          setLoading(false);
        }
      }
    });

    executeAuthAudit();

    return () => {
      subscription.unsubscribe();
    };
  }, [executeAuthAudit, queryClient]);

  // Telemetry Performance Tracker: Self-clearing loading interval block allocation
  useEffect(() => {
    if (!loading) {
      setSyncSeconds(0);
      return;
    }

    const metricPulseTimer = setInterval(() => {
      if (isMountedRef.current) {
        setSyncSeconds((prevSeconds) => prevSeconds + 1);
      }
    }, 1000);

    return () => {
      clearInterval(metricPulseTimer);
    };
  }, [loading]);

  // =========================================================================
  // ROUTE RENDER A: LOADING PROGRESSIVE TELEMETRY FRAME
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background/95 backdrop-blur-md select-none transition-colors duration-200">
        <div className="flex flex-col items-center justify-center gap-5 text-center animate-in fade-in duration-300">
          <div className="relative transform-gpu select-none pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin text-primary stroke-[2.5] opacity-20" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse stroke-[2.2]" />
          </div>
          <div className="space-y-1 flex flex-col justify-center leading-none">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary block leading-none">
              Auditing Session Vector
            </span>
            <p className="text-xs font-semibold text-muted-foreground/60 block leading-none pt-1 tabular-nums italic">
              {syncSeconds > 6 ? "Network congestion detected — processing records…" : "Verifying tracking parameters…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROUTE RENDER B: GATEWAY INTERCEPT TIMEOUT ERROR FRAME
  // =========================================================================
  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 text-left antialiased transform-gpu select-none">
        <Card className="max-w-md w-full rounded-xl border border-destructive/20 bg-destructive/[0.015] shadow-sm overflow-hidden">
          <CardHeader className="text-center p-5 sm:p-6 pb-2 border-b border-border/5 bg-muted/5">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3 stroke-[2.2]" />
            <CardTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
              Registry Interface Exception
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground/70 block leading-normal pt-1.5 italic max-w-full select-text">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-2.5 font-bold text-xs select-none">
            <Button
              type="button"
              onClick={executeAuthAudit}
              className="w-full sm:flex-[2] h-10 rounded-xl font-bold uppercase text-[10px] tracking-wide gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-transform active:scale-[0.985]"
            >
              <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Retry Registry Audit</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={executeRedirectHandshake}
              className="w-full sm:flex-1 h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // ROUTE RENDER C: SESSION COLD START MISSING REDIRECTION ACTION TERMINAL
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 text-left antialiased transform-gpu select-none">
        <Card className="max-w-md w-full rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
          <CardHeader className="text-center p-6 sm:p-8 pb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mx-auto mb-4 shadow-inner shrink-0 pointer-events-none">
              <ShieldCheck className="h-7 w-7 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide leading-none">
              Authorized Ingress Required
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-normal pt-2 italic">
              {message || "Establish secure identity credential bindings to interact with this route network path."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-2 flex flex-col gap-3 font-bold text-xs select-none">
            <Button
              type="button"
              onClick={executeRedirectHandshake}
              className="w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-transform active:scale-[0.985] flex items-center justify-center"
            >
              <span>Initialize Sign-In Sequence</span>
              <Zap className="h-3.5 w-3.5 fill-primary-foreground/10 stroke-[2.5]" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                trackEvent("auth_gate_home_fallback_clicked");
                navigate("/");
              }}
              className="w-full h-9 rounded-xl text-muted-foreground/40 hover:text-foreground font-bold uppercase text-[9px] tracking-widest shrink-0 transition-colors cursor-pointer"
            >
              &larr; Fallback to Public Root Index
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorize layout entry cleanly across nested client contexts if security layers match definitions
  return <>{children}</>;
}

export default AuthGate;
