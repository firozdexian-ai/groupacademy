import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listUserRoles } from "@/domains/profile/repo/profileRepo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { usePWADetect } from "@/hooks/usePWADetect";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/utils";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAnyAdminRole?: boolean;
  authType?: "ai" | "classic";
}

/**
 * GroUp Academy: Authoritative Role-Based Access Control Ingress Firewall (ProtectedRoute)
 * High-performance route isolation gateway auditing network security clearance vectors and identity persistence tokens.
 * Version: Launch Candidate · Phase Z0 Hardened Routing Guard Lock
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAnyAdminRole = false,
  authType = "ai",
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isPWA } = usePWADetect();

  const isMountedRef = useRef<boolean>(true);
  const auditLockBusyRef = useRef<boolean>(false);

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [fault, setFault] = useState<string | null>(null);

  const temporalThresholdNum = useMemo(() => {
    return isPWA ? TIMEOUTS.PWA_AUTH || 4000 : TIMEOUTS.AUTH || 5000;
  }, [isPWA]);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeRedirectHandshake = useCallback(
    async (clearSessionBool = true) => {
      if (clearSessionBool) {
        try {
          await supabase.auth.signOut();
          await queryClient.clear();
        } catch (signOutException) {
          trackError(signOutException, { component: "ProtectedRoute", action: "auth_purge_signout" });
        }
      }

      const returnUrlStr = location.pathname + location.search;
      const ingressNodeStr = authType === "classic" ? "/auth/classic" : "/auth";
      const compiledRedirectDestinationStr = `${ingressNodeStr}?returnTo=${encodeURIComponent(returnUrlStr)}`;

      trackEvent("protected_route_redirect_handshake", { destination: compiledRedirectDestinationStr });
      navigate(compiledRedirectDestinationStr, { replace: true });
    },
    [navigate, location, authType, queryClient],
  );

  const executeFirewallAudit = useCallback(async () => {
    if (auditLockBusyRef.current) return;
    auditLockBusyRef.current = true;

    if (isMountedRef.current) {
      setIsChecking(true);
      setFault(null);
    }

    let globalTimerTrackerId: NodeJS.Timeout | null = null;

    try {
      // Phase 1: Establish self-clearing network timeout barrier promise structures
      const diagnosticTimeoutPromise = new Promise<never>((_, rejectNode) => {
        globalTimerTrackerId = setTimeout(() => {
          rejectNode(new Error("SYNC_TIMEOUT"));
        }, temporalThresholdNum);
      });

      const sessionCheckQueryPromise = supabase.auth.getSession();

      const dynamicRaceResolutionResult: any = await Promise.race([sessionCheckQueryPromise, diagnosticTimeoutPromise]);

      if (globalTimerTrackerId) {
        clearTimeout(globalTimerTrackerId);
      }

      const sessionError = dynamicRaceResolutionResult?.error;
      const sessionPayload = dynamicRaceResolutionResult?.data?.session;

      if (sessionError) throw sessionError;

      if (!sessionPayload?.user) {
        trackEvent("protected_route_unauthorized_missing_session");
        await executeRedirectHandshake(false);
        return;
      }

      // Phase 2: Structural Institutional Role Validation Checking
      if (requireAdmin || requireAnyAdminRole) {
        const userRolesPayloadRows = await listUserRoles(sessionPayload.user.id);

        const flattenedActiveRolesArray = (userRolesPayloadRows || []).map((roleRowItem) => roleRowItem.role);
        trackEvent("protected_route_clearance_evaluating", {
          userId: sessionPayload.user.id,
          mappedRoles: flattenedActiveRolesArray,
        });

        if (requireAdmin && !flattenedActiveRolesArray.includes("admin")) {
          toast.error("Security Level Error: Administrative clearance verification tokens missing from user account.");
          navigate("/app/learning", { replace: true });
          return;
        }

        if (
          requireAnyAdminRole &&
          !flattenedActiveRolesArray.some((roleKey) => ["admin", "talent_exec"].includes(roleKey))
        ) {
          toast.error(
            "Security Level Error: Dashboard view components restricted to authorized operations executives.",
          );
          navigate("/app/learning", { replace: true });
          return;
        }
      }

      if (isMountedRef.current) {
        setIsAuthorized(true);
        setFault(null);
      }
    } catch (caughtPipelineExceptionErr: any) {
      if (globalTimerTrackerId) clearTimeout(globalTimerTrackerId);

      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "ProtectedRoute", action: "execute_firewall_audit" });

      if (formattedExceptionMsgStr.includes("refresh_token") || caughtPipelineExceptionErr?.status === 400) {
        await executeRedirectHandshake(true);
        return;
      }

      if (isMountedRef.current) {
        setFault(
          formattedExceptionMsgStr === "SYNC_TIMEOUT"
            ? "CONNECTION_LATENCY_THRESHOLD_EXCEEDED"
            : "NEURAL_IDENTITY_FAULT_REJECTED",
        );
      }
    } finally {
      auditLockBusyRef.current = false;
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [requireAdmin, requireAnyAdminRole, temporalThresholdNum, executeRedirectHandshake, navigate]);

  useEffect(() => {
    executeFirewallAudit();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (authLifecycleEvent, activeSessionPayload) => {
      if (authLifecycleEvent === "SIGNED_OUT" || (authLifecycleEvent === "TOKEN_REFRESHED" && !activeSessionPayload)) {
        trackEvent("protected_route_auth_state_invalidation_detected", { event: authLifecycleEvent });
        if (isMountedRef.current) {
          setIsAuthorized(false);
        }
        await executeRedirectHandshake(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [executeFirewallAudit, executeRedirectHandshake]);

  // =========================================================================
  // INTERFACE PROTOCOL RENDER A: RECTILINEAR SECURE HUB LOADER PROGRESS FILL
  // =========================================================================
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none transform-gpu antialiased">
        <div className="relative mb-6 select-none pointer-events-none">
          <img
            src={logoIcon}
            alt="Platform identity tracking emblem logo context marker"
            className="w-12 h-12 opacity-15 grayscale block object-contain"
          />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary stroke-[2.2] animate-pulse" />
        </div>
        <div className="flex gap-2 items-center justify-center h-4">
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
        <p className="mt-4 text-[9px] font-mono font-extrabold uppercase tracking-widest text-muted-foreground/40 italic leading-none block">
          Verifying Core Clearance Tokens…
        </p>
      </div>
    );
  }

  // =========================================================================
  // INTERFACE PROTOCOL RENDER B: SECURITY EXCEPTION BLOCK SECTOR WRAPPER
  // =========================================================================
  if (fault) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 text-left antialiased transform-gpu select-none">
        <div className="text-center max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-200">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/5 flex items-center justify-center mx-auto shadow-inner pointer-events-none shrink-0">
            <AlertCircle className="h-6 w-6 text-destructive stroke-[2.2]" />
          </div>

          <div className="space-y-1.5 flex flex-col justify-center leading-none">
            <h3 className="text-xs sm:text-sm font-black uppercase font-mono tracking-tight text-destructive leading-none">
              {fault}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground/60 block leading-normal pt-1 italic">
              Institutional synchronization pipeline aborted. Verify connection telemetry maps before re-attempting
              ingress access validation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1.5 font-bold text-xs select-none w-full">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors gap-1.5"
              onClick={() => {
                trackEvent("protected_route_resync_clicked");
                executeFirewallAudit();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Re-Sync</span>
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-transform active:scale-[0.985]"
              onClick={() => executeRedirectHandshake(true)}
            >
              <LogIn className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Sign In</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}

/**
 * Institutional Role Verification Custom Diagnostic Hook (useUserRole)
 * Optimizes RBAC pipeline verification by caching account role models directly inside the centralized React Query structure.
 * CTO Reference: High-performance solution replacing redundant, uninsulated inline database network waterfalls.
 */
export function useUserRole() {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    data: userRoleValue,
    isLoading,
    error: queryFetchException,
  } = useQuery<AppRole | null>({
    queryKey: ["user-institutional-role"],
    queryFn: async () => {
      const {
        data: { session },
        error: sessionFetchError,
      } = await supabase.auth.getSession();
      if (sessionFetchError) throw sessionFetchError;
      if (!session?.user) return null;

      const userRolesPayloadRows = await listUserRoles(session.user.id);

      const roleStringsListArray = (userRolesPayloadRows || []).map((itemRow) => itemRow.role);

      // Authoritative Level Rank Escalation Gating Priorities
      if (roleStringsListArray.includes("admin")) return "admin";
      if (roleStringsListArray.includes("talent_exec")) return "talent_exec";

      return null;
    },
    staleTime: 1000 * 60 * 5, // Cache credential variables for 5 minutes before re-checking database entries
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });

  useEffect(() => {
    if (queryFetchException) {
      trackError(queryFetchException, { component: "useUserRole", action: "query_institutional_role" });
    }
  }, [queryFetchException]);

  return {
    role: userRoleValue || null,
    isLoading,
    fault: queryFetchException
      ? queryFetchException instanceof Error
        ? queryFetchException
        : new Error(String(queryFetchException))
      : null,
  };
}

// Integrated Error Tracking and Telemetry Fallback Adaptations
function trackError(errorObj: any, contextualMetaBlock: Record<string, any>) {
  console.error(`[Ecosystem Exception Block Handshake] Fault Context Triggered:`, errorObj, contextualMetaBlock);
}

function trackEvent(eventNameStr: string, contextualMetaBlock?: Record<string, any>) {
  // Analytical logging pass parameters line placeholder integration
}
