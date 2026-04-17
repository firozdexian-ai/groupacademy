import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn } from "lucide-react";
import { usePWADetect } from "@/hooks/usePWADetect";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";
import logoIcon from "@/assets/logo-icon.png";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAnyAdminRole?: boolean;
  // Added to respect the user's preferred auth flow
  authType?: "ai" | "classic";
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireAnyAdminRole = false,
  authType = "ai",
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPWA } = usePWADetect();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkedRef = useRef(false);
  const authTimeout = isPWA ? TIMEOUTS.PWA_AUTH : TIMEOUTS.AUTH;

  const handleRedirect = useCallback(
    async (clearSession = true) => {
      if (clearSession) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn(e);
        }
      }
      const returnUrl = location.pathname + location.search;
      const loginPath = authType === "classic" ? "/auth/classic" : "/auth";
      navigate(`${loginPath}?returnTo=${encodeURIComponent(returnUrl)}`, { replace: true });
    },
    [navigate, location, authType],
  );

  const checkAuth = useCallback(async () => {
    if (checkedRef.current && isAuthorized) return;

    setIsChecking(true);
    setError(null);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timed out")), authTimeout),
      );

      const {
        data: { session },
        error: sessionError,
      } = (await Promise.race([supabase.auth.getSession(), timeoutPromise])) as any;

      if (sessionError) throw sessionError;

      if (!session) {
        await handleRedirect(false);
        return;
      }

      // Role check logic
      if (requireAdmin || requireAnyAdminRole) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);

        const userRoles = (roles || []).map((r) => r.role);

        if (requireAdmin && !userRoles.includes("admin")) {
          toast.error("Admin access required");
          navigate("/app/learning");
          return;
        }

        if (requireAnyAdminRole && !userRoles.some((r) => ["admin", "talent_exec"].includes(r))) {
          toast.error("Dashboard access required");
          navigate("/app/learning");
          return;
        }
      }

      setIsAuthorized(true);
      checkedRef.current = true;
    } catch (err: any) {
      console.error("[ProtectedRoute] Error:", err);

      if (err.message?.includes("refresh_token") || err.status === 400) {
        await handleRedirect(true);
        return;
      }

      setError(err.message === "Auth check timed out" ? "Connection timed out" : "Authentication error");
    } finally {
      setIsChecking(false);
    }
  }, [requireAdmin, requireAnyAdminRole, authTimeout, handleRedirect, navigate, isAuthorized]);

  useEffect(() => {
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        handleRedirect(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [checkAuth, handleRedirect]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <img src={logoIcon} alt="GroUp" className="w-12 h-12 mb-6 animate-pulse opacity-50" />
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <p className="text-destructive font-semibold mb-2">{error}</p>
          <p className="text-muted-foreground text-sm mb-6">
            We couldn't verify your session. This might be due to a poor connection.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                checkedRef.current = false;
                checkAuth();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
            <Button onClick={() => handleRedirect(true)}>
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

// Optimized Role Hook with caching and resilient error handling
export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !mounted) {
          setIsLoading(false);
          return;
        }

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (rolesError) throw rolesError;

        if (mounted && roles) {
          const roleNames = roles.map((r) => r.role);
          if (roleNames.includes("admin")) setRole("admin");
          else if (roleNames.includes("talent_exec")) setRole("talent_exec");
        }
      } catch (err: any) {
        console.error("[useUserRole] Failed to load role:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Surface a single toast so the user knows why their dashboard is empty
          toast.error("Couldn't verify your access level. Please refresh.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchRole();
    return () => {
      mounted = false;
    };
  }, []);

  return { role, isLoading, error };
};
