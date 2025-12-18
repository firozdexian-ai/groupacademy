import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, RefreshCw, AlertCircle } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
  message?: string;
}

export function AuthGate({ children, redirectTo, message }: AuthGateProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    setSeconds(0);

    try {
      // Race between getSession and timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), TIMEOUTS.AUTH);
      });

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      setUser(session?.user ?? null);
    } catch (err) {
      console.error("Auth check error:", err);
      setError("Unable to verify your session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    // Then check current session with timeout
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Progressive loading timer
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  // Get progressive message
  const getLoadingMessage = () => {
    if (seconds < 5) return "Checking authentication...";
    if (seconds < 10) return "Connecting to server...";
    return "This is taking longer than expected...";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            {seconds >= 5 && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{seconds}s</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">{getLoadingMessage()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle>Connection Issue</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={checkAuth} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    const returnUrl = redirectTo || window.location.pathname;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </CardTitle>
            <CardDescription>
              {message || "Please sign in to access this service. It only takes a moment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`)}
              className="w-full"
            >
              Sign In to Continue
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
