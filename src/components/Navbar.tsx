import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, Zap, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Navigation Command Deck
 * CTO Reference: Authoritative entry node for trajectory routing and identity sync.
 */

const AUTH_SYNC_TIMEOUT = 5000;

export const Navbar = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    executeIdentityAudit();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        await verifyInstitutionalRole(session.user.id);
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      authAbortController.current?.abort();
    };
  }, []);

  const executeIdentityAudit = async () => {
    try {
      const sessionRequest = supabase.auth.getSession();
      const timeoutNode = new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_SYNC_TIMEOUT));

      const result = await Promise.race([sessionRequest, timeoutNode]);

      if (result && "data" in result && result.data.session?.user) {
        setIsLoggedIn(true);
        await verifyInstitutionalRole(result.data.session.user.id);
      }
    } catch (err) {
      console.warn("[Navbar] Identity_Audit_Fault:", err);
    }
  };

  const verifyInstitutionalRole = async (userId: string) => {
    authAbortController.current?.abort();
    const controller = new AbortController();
    authAbortController.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), AUTH_SYNC_TIMEOUT);

    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      clearTimeout(timeoutId);

      if (!controller.signal.aborted) {
        setIsAdmin(!!data);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name !== "AbortError") {
        console.warn("[Navbar] Role_Sync_Fault:", err);
      }
    }
  };

  return (
    <header className="border-b-2 border-border/10 bg-card/60 backdrop-blur-xl sticky top-0 z-50 overflow-hidden">
      {/* HUD: STATUS_GLOW */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />

      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* HUD: IDENTITY_ARTIFACT */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center transition-all hover:scale-105 active:scale-95"
          >
            <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp_Academy_Logo" className="h-10 w-auto" />
          </button>

          {/* HUD: EXECUTIVE_NAVIGATION */}
          <nav className="hidden md:flex items-center gap-4">
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-primary/10"
              >
                <Zap className="h-3 w-3 text-primary fill-current" />
                COMMAND_DASHBOARD
              </Button>
            )}

            <div className="h-6 w-[1px] bg-border/20 mx-2" />

            {/* ACTION: THEME_ENGINE */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl border-2 hover:bg-primary/5 transition-all"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* ACTION: INGRESS_NODE */}
            {isLoggedIn ? (
              <Button
                onClick={() => navigate("/app/feed")}
                className="rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
              >
                SYNC_TO_APP
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                variant="secondary"
                className="rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] px-8 border-2 border-transparent hover:border-primary/20 transition-all"
              >
                IDENTITY_SYNC
              </Button>
            )}
          </nav>

          {/* HUD: MOBILE_SYNC_TRIGGER */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl bg-muted/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* HUD: MOBILE_OVERLAY */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-6 pb-4 flex flex-col gap-3 border-t-2 border-border/10 mt-4 animate-in slide-in-from-top-4 duration-300">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start font-black italic text-[10px] uppercase tracking-widest h-12 rounded-2xl"
                  >
                    <Zap className="h-4 w-4 mr-3 text-primary" /> COMMAND_DASHBOARD
                  </Button>
                )}
                <Button
                  onClick={() => {
                    navigate("/app/feed");
                    setMobileMenuOpen(false);
                  }}
                  className="h-14 rounded-2xl font-black uppercase italic text-[11px] tracking-widest shadow-xl"
                >
                  SYNC_TO_APP
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  navigate("/auth");
                  setMobileMenuOpen(false);
                }}
                className="h-14 rounded-2xl font-black uppercase italic text-[11px] tracking-widest shadow-xl"
              >
                IDENTITY_SYNC
              </Button>
            )}

            <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase italic tracking-widest opacity-60">Theme_Sync</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg bg-background shadow-sm"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
