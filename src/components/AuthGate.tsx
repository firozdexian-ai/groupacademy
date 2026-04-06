import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, RefreshCw, AlertCircle } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { usePWADetect } from "@/hooks/usePWADetect";

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
  // Added to support the AI vs Classic preference
  authType?: "ai" | "classic";
}

export function AuthGate({ children, redirectTo, message, authType = "ai" }: AuthGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPWA } = usePWADetect();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const authTimeout = isPWA ? TIMEOUTS.PWA_AUTH : TIMEOUTS.AUTH;

  const handleRedirect = useCallback(() => {
    const returnUrl = redirectTo || location.pathname + location.search;
    const loginPath = authType === "classic" ? "/auth/classic" : "/auth";
    navigate(`${loginPath}?returnTo=${encodeURIComponent(returnUrl)}`);
  }, [navigate, redirectTo, location, authType]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        setUser(null);
      } else {
        setUser(session.user);
      }
    } catch (err: any) {
      console.error("[AuthGate] Auth check error:", err);

      // Standardize session clearing for expired/invalid tokens
      if (err.message?.includes("refresh_token_not_found") || err.status === 400) {
        await supabase.auth.signOut();
        handleRedirect();
        return;
      }

      setError("Unable to verify your session. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [handleRedirect]);

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

    checkAuth();
    return () => subscription.unsubscribe();
  }, [checkAuth]);

  // Progressive loading timer logic
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {seconds > 10 ? "This is taking a bit longer..." : "Verifying your access..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <CardTitle>Session Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={checkAuth} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleRedirect} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Unlock GroUp Academy</CardTitle>
            <CardDescription>{message || "Please sign in to continue your career journey."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleRedirect} className="w-full py-6 text-lg font-semibold">
              Sign In Now
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
