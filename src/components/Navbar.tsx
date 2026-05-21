import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUserAdmin } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Menu, X, Moon, Sun, Zap, ShieldCheck } from "lucide-react";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

const AUTH_SYNC_TIMEOUT_MS = 5000;

/**
 * GroUp Academy: Institutional Navigation Command Deck Terminal (Navbar)
 * Authoritative system entry point managing identity checks, dynamic theme swaps, and navigation route pipelines.
 * Version: Launch Candidate · Phase Z0 Hardened Header Lock
 */
export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isMountedRef = useRef<boolean>(true);
  const authAbortControllerRef = useRef<AbortController | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isThemeHydrated, setIsThemeHydrated] = useState<boolean>(false);

  // Synchronize component lifecycles to insulate background operations from state drops
  useEffect(() => {
    isMountedRef.current = true;
    setIsThemeHydrated(true);
    return () => {
      isMountedRef.current = false;
      if (authAbortControllerRef.current) {
        authAbortControllerRef.current.abort();
      }
    };
  }, []);

  const verifyInstitutionalRoleProtocol = async (targetUserUuidStr: string) => {
    if (authAbortControllerRef.current) {
      authAbortControllerRef.current.abort();
    }

    const standardAbortControllerInstance = new AbortController();
    authAbortControllerRef.current = standardAbortControllerInstance;

    const pipelineTimeoutTrackerId = setTimeout(() => {
      standardAbortControllerInstance.abort();
    }, AUTH_SYNC_TIMEOUT_MS);

    try {
      const userRolePayloadData = await isUserAdmin(targetUserUuidStr);

      clearTimeout(pipelineTimeoutTrackerId);

      if (!standardAbortControllerInstance.signal.aborted && isMountedRef.current) {
        const calculatedAdminStatusBool = !!userRolePayloadData;
        setIsAdmin(calculatedAdminStatusBool);
        trackEvent("navbar_role_verification_complete", { isAdmin: calculatedAdminStatusBool });
      }
    } catch (caughtPipelineExceptionErr: any) {
      clearTimeout(pipelineTimeoutTrackerId);
      if (caughtPipelineExceptionErr?.name !== "AbortError") {
        trackError(caughtPipelineExceptionErr, {
          component: "Navbar",
          action: "verify_institutional_role",
          targetUserUuidStr,
        });
        if (isMountedRef.current) {
          setIsAdmin(false);
        }
      }
    }
  };

  const executeIdentityAuditProtocol = async () => {
    trackEvent("navbar_identity_audit_initiated");

    try {
      const liveSessionFetchRequestPromise = supabase.auth.getSession();
      const diagnosticTimeoutBarrierPromise = new Promise<null>((resolveNode) =>
        setTimeout(() => resolveNode(null), AUTH_SYNC_TIMEOUT_MS),
      );

      const dynamicRaceResolutionPayload = await Promise.race([
        liveSessionFetchRequestPromise,
        diagnosticTimeoutBarrierPromise,
      ]);

      if (!dynamicRaceResolutionPayload || !isMountedRef.current) return;

      if ("data" in dynamicRaceResolutionPayload && dynamicRaceResolutionPayload.data.session?.user) {
        setIsLoggedIn(true);
        await verifyInstitutionalRoleProtocol(dynamicRaceResolutionPayload.data.session.user.id);
      }
    } catch (caughtAuditExceptionErr) {
      trackError(caughtAuditExceptionErr, { component: "Navbar", action: "execute_identity_audit" });
    }
  };

  // Unified Subscriber Pass: Listen natively to active authorization token state variations
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (authLifecycleEvent, activeSessionPayload) => {
      trackEvent("navbar_auth_state_changed", { event: authLifecycleEvent });

      if (activeSessionPayload?.user) {
        if (isMountedRef.current) {
          setIsLoggedIn(true);
        }
        await verifyInstitutionalRoleProtocol(activeSessionPayload.user.id);
      } else {
        if (isMountedRef.current) {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
        await queryClient.clear();
      }
    });

    executeIdentityAuditProtocol();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Clean out mobile navigation panes cleanly across horizontal view mutations
  useEffect(() => {
    if (isMountedRef.current) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  const derivedActiveLogoAssetSource = useMemo(() => {
    if (!isThemeHydrated) return logoDark;
    const currentSystemThemeModeStr = resolvedTheme || theme;
    return currentSystemThemeModeStr === "dark" ? logoLight : logoDark;
  }, [isThemeHydrated, resolvedTheme, theme]);

  const handleToggleThemeModeProtocol = () => {
    const calculatedThemeStateStr = (resolvedTheme || theme) === "dark" ? "light" : "dark";
    setTheme(calculatedThemeStateStr);
    trackEvent("navbar_theme_toggle_clicked", { assignedTheme: calculatedThemeStateStr });
  };

  return (
    <header className="w-full sticky top-0 z-50 border-b border-border/40 bg-card/60 backdrop-blur-md select-none text-left antialiased transform-gpu">
      {/* HUD LEVEL 1: TOP PANEL METRIC GLOW ACCENT LINE */}
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between w-full min-w-0">
          {/* HUD LEVEL 2: CORPORATE LOGO EMBLEM ACTION ROUTER */}
          <button
            type="button"
            onClick={() => {
              trackEvent("navbar_logo_home_clicked");
              navigate("/");
            }}
            className="flex items-center transition-transform hover:scale-[1.015] active:scale-[0.99] cursor-pointer outline-none focus-visible:ring-1 rounded-lg focus-visible:ring-ring p-0.5"
            aria-label="Navigate to institutional homepage index node"
          >
            <img
              src={derivedActiveLogoAssetSource}
              alt="GroUp Academy platform corporate registration mark"
              className="h-8 sm:h-9 w-auto object-contain select-none pointer-events-none"
            />
          </button>

          {/* HUD LEVEL 3: DESKTOP MASTER MANAGEMENT DECISION GRID ROW */}
          <nav
            className="hidden md:flex items-center gap-3 font-bold text-xs select-none"
            aria-label="Desktop structural command navigation"
          >
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="h-8 px-3 rounded-lg font-mono font-extrabold text-[10px] uppercase tracking-wider gap-1.5 bg-primary/5 border border-primary/10 text-primary hover:bg-primary/10 cursor-pointer transition-colors"
              >
                <Zap className="h-3.5 w-3.5 text-primary fill-primary/10 stroke-[2.2] animate-pulse" />
                <span>Command Dashboard</span>
              </Button>
            )}

            <div className="h-4 w-[1px] bg-border/40 mx-1 shrink-0" aria-hidden="true" />

            {/* INTEGRATED GRAPHIC INTERFACE LIGHTNING CONTROLLER */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleToggleThemeModeProtocol}
              className="h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
              title="Synchronize presentation environment theme layer matrices"
            >
              <Sun className="h-4 w-4 stroke-[2.2] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 stroke-[2.2] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isLoggedIn ? (
              <Button
                type="button"
                onClick={() => navigate("/app/feed")}
                className="h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm transform-gpu active:scale-[0.985] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sync to App
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="h-8 px-4 rounded-lg border border-border/40 font-bold text-[10px] uppercase tracking-wider hover:bg-accent shrink-0 shadow-xs cursor-pointer transition-colors"
              >
                Identity Ingress
              </Button>
            )}
          </nav>

          {/* HUD LEVEL 4: MOBILE LAYER COLLAPSE CONTROLLER SECTOR BUTTON */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setMobileMenuOpen((prevOpenStateBool) => !prevOpenStateBool)}
            className="md:hidden h-9 w-9 rounded-xl bg-muted/30 border border-border/10 text-foreground flex items-center justify-center cursor-pointer"
            aria-label="Toggle adaptive infrastructure navigation overview panel sheet"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 stroke-[2.5]" /> : <Menu className="h-4 w-4 stroke-[2.2]" />}
          </Button>
        </div>

        {/* HUD LEVEL 5: COMPACT VERTICAL MOBILE DROP DOWN OVERLAY TRACK SHEET */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden pt-4 pb-2 flex flex-col gap-2 border-t border-border/10 mt-3 font-bold text-xs select-none text-left animate-in slide-in-from-top-3 duration-200"
            aria-label="Mobile viewport track summary panel links"
          >
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer justify-start gap-2 px-3"
                  >
                    <Zap className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
                    <span>Command Dashboard Node</span>
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => navigate("/app/feed")}
                  className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sync to Active Application
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => navigate("/auth")}
                className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Identity Sync Ingress
              </Button>
            )}

            {/* THEME SELECT ROW STRIP BLOCK FOR MOBILE OVERLAYS */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-muted/10 leading-none text-left w-full h-11 shrink-0 mt-1 shadow-inner">
              <div className="flex items-center gap-2 min-w-0 flex-1 select-none text-muted-foreground/60 leading-none">
                <ShieldCheck className="h-4 w-4 stroke-[2.2] shrink-0" />
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider block pt-0.5">
                  Mobile Theme Sync
                </span>
              </div>

              <Button
                size="icon"
                type="button"
                variant="ghost"
                onClick={handleToggleThemeModeProtocol}
                className="h-7 w-7 rounded bg-background border border-border/10 flex items-center justify-center shadow-xs cursor-pointer p-0 text-foreground shrink-0"
                aria-label="Toggle user presentation context theme"
              >
                {(resolvedTheme || theme) === "dark" ? (
                  <Sun className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  <Moon className="h-3.5 w-3.5 stroke-[2.2]" />
                )}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
