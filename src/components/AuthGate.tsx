import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, RefreshCw, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { usePWADetect } from "@/hooks/usePWADetect";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Security Perimeter Node (AuthGate)
 * CTO Reference: Authoritative sentry for protected trajectory routes.
 */

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
  authType?: "ai" | "classic";
}

export function AuthGate({ children, redirectTo, message, authType = "ai" }: AuthGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPWA } = usePWADetect();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncSeconds, setSyncSeconds] = useState(0);

  const executeRedirectHandshake = useCallback(() => {
    const returnUrl = redirectTo || location.pathname + location.search;
    const ingressNode = authType === "classic" ? "/auth/classic" : "/auth";
    navigate(`${ingressNode}?returnTo=${encodeURIComponent(returnUrl)}`);
  }, [navigate, redirectTo, location, authType]);

  const executeAuthAudit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error: auditError,
      } = await supabase.auth.getSession();

      if (auditError) throw auditError;

      if (!session) {
        setUser(null);
      } else {
        setUser(session.user);
      }
    } catch (err: any) {
      console.error("[AuthGate] Audit fault detected:", err);

      // PROTOCOL: Purge stale registry nodes
      if (err.message?.includes("refresh_token_not_found") || err.status === 400) {
        await supabase.auth.signOut();
        executeRedirectHandshake();
        return;
      }

      setError("Uplink fault: Unable to verify neural identity artifacts.");
    } finally {
      setLoading(false);
    }
  }, [executeRedirectHandshake]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (session) {
        setUser(session.user);
        setLoading(false);
      }
    });

    executeAuthAudit();
    return () => subscription.unsubscribe();
  }, [executeAuthAudit]);

  // Telemetry: Progressive Loading Index
  useEffect(() => {
    if (!loading) return;
    const pulse = setInterval(() => setSyncSeconds((s) => s + 1), 1000);
    return () => clearInterval(pulse);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background/95 backdrop-blur-md">
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700">
          <div className="relative">
            <Loader2 className="h-14 w-14 animate-spin text-primary opacity-20" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 italic">
              Neural_Identity_Check
            </p>
            <p className="text-sm font-medium text-muted-foreground italic">
              {syncSeconds > 8 ? "Optimizing high-latency uplink..." : "Verifying access artifacts..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full rounded-[32px] border-2 border-rose-500/20 bg-rose-500/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center p-8 pb-4">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Registry_Fault</CardTitle>
            <CardDescription className="font-medium italic">{error}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex flex-col gap-3">
            <Button
              onClick={executeAuthAudit}
              size="xl"
              className="w-full rounded-2xl font-black uppercase italic gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCw className="h-4 w-4" /> ATTEMPT_RE_SYNC
            </Button>
            <Button
              variant="outline"
              onClick={executeRedirectHandshake}
              className="w-full h-14 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest"
            >
              RETURN_TO_INGRESS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full rounded-[40px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="text-center p-10 pb-6">
            <div className="w-20 h-20 rounded-[28px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Access_Locked
            </CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 italic mt-4">
              {message || "Initialize identity sync to continue your career trajectory."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4 flex flex-col gap-4">
            <Button
              onClick={executeRedirectHandshake}
              size="xl"
              className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-primary/40 active:scale-95 transition-all"
            >
              INITIALIZE_SYNC
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full h-12 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
            >
              ← ABORT_TO_BASE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
