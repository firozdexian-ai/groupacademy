import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { usePWADetect } from "@/hooks/usePWADetect";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Access Firewall
 * CTO Reference: Authoritative gatekeeper for RBAC-protected trajectories.
 */

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAnyAdminRole?: boolean;
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
  const [fault, setFault] = useState<string | null>(null);

  const checkedRegistryRef = useRef(false);
  const temporalThreshold = isPWA ? TIMEOUTS.PWA_AUTH : TIMEOUTS.AUTH;

  const executeRedirectHandshake = useCallback(
    async (clearSession = true) => {
      if (clearSession) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn("AUTH_PURGE_FAULT:", e);
        }
      }
      const returnUrl = location.pathname + location.search;
      const ingressNode = authType === "classic" ? "/auth/classic" : "/auth";
      navigate(`${ingressNode}?returnTo=${encodeURIComponent(returnUrl)}`, { replace: true });
    },
    [navigate, location, authType],
  );

  const executeFirewallAudit = useCallback(async () => {
    if (checkedRegistryRef.current && isAuthorized) return;

    setIsChecking(true);
    setFault(null);

    try {
      const syncTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SYNC_TIMEOUT")), temporalThreshold),
      );

      const {
        data: { session },
        error: sessionError,
      } = (await Promise.race([supabase.auth.getSession(), syncTimeout])) as any;

      if (sessionError) throw sessionError;
      if (!session) return await executeRedirectHandshake(false);

      // PHASE: Institutional Role Audit
      if (requireAdmin || requireAnyAdminRole) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
        const activeRoles = (roles || []).map((r) => r.role);

        if (requireAdmin && !activeRoles.includes("admin")) {
          toast.error("ADMIN_CLEARANCE_REQUIRED");
          navigate("/app/learning");
          return;
        }

        if (requireAnyAdminRole && !activeRoles.some((r) => ["admin", "talent_exec"].includes(r))) {
          toast.error("DASHBOARD_ACCESS_DENIED");
          navigate("/app/learning");
          return;
        }
      }

      setIsAuthorized(true);
      checkedRegistryRef.current = true;
    } catch (err: any) {
      console.error("[Firewall] Audit Fault:", err);

      if (err.message?.includes("refresh_token") || err.status === 400) {
        return await executeRedirectHandshake(true);
      }

      setFault(err.message === "SYNC_TIMEOUT" ? "CONNECTION_LATENCY_THRESHOLD_EXCEEDED" : "NEURAL_IDENTITY_FAULT");
    } finally {
      setIsChecking(false);
    }
  }, [requireAdmin, requireAnyAdminRole, temporalThreshold, executeRedirectHandshake, navigate, isAuthorized]);

  useEffect(() => {
    executeFirewallAudit();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        executeRedirectHandshake(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [executeFirewallAudit, executeRedirectHandshake]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 backdrop-blur-xl">
        <div className="relative mb-8">
          <img src={logoIcon} alt="GroUp_Identity" className="w-16 h-16 animate-pulse opacity-20 grayscale" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
          Verifying_Clearance...
        </p>
      </div>
    );
  }

  if (fault) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="h-16 w-16 rounded-[22px] bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-rose-500">{fault}</h3>
            <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
              Institutional synchronization failed. Ensure neural uplink stability before re-attempting ingress.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest"
              onClick={() => {
                checkedRegistryRef.current = false;
                executeFirewallAudit();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> RE_SYNC
            </Button>
            <Button
              className="h-12 rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-primary/20"
              onClick={() => executeRedirectHandshake(true)}
            >
              <LogIn className="h-3.5 w-3.5 mr-2" /> SIGN_IN
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

/**
 * Institutional Role Hook
 * CTO Reference: Resilient diagnostic for access-level verification.
 */
export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fault, setFault] = useState<Error | null>(null);

  useEffect(() => {
    let activeNode = true;
    const fetchInstitutionalRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !activeNode) return setIsLoading(false);

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (rolesError) throw rolesError;

        if (activeNode && roles) {
          const names = roles.map((r) => r.role);
          if (names.includes("admin")) setRole("admin");
          else if (names.includes("talent_exec")) setRole("talent_exec");
        }
      } catch (err: any) {
        if (activeNode) {
          setFault(err instanceof Error ? err : new Error(String(err)));
          toast.error("IDENTITY_SYNC_FAULT: Unable to verify clearance.");
        }
      } finally {
        if (activeNode) setIsLoading(false);
      }
    };

    fetchInstitutionalRole();
    return () => {
      activeNode = false;
    };
  }, []);

  return { role, isLoading, fault };
};
