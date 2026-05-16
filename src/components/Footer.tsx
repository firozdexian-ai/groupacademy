import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Zap, ShieldCheck, Youtube, ExternalLink } from "lucide-react";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Global Layout Anchor Gateway (Footer)
 * Authoritative terminal node orchestrating cross-platform routing links, license stamps, and index markers.
 * Version: Launch Candidate · Phase Z0 Hardened Global Anchor
 */
export function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme } = useTheme();

  const isMountedRef = useRef<boolean>(true);
  const [isThemeHydrated, setIsThemeHydrated] = useState<boolean>(false);

  // Synchronize component lifecycles to insulate background operations from state drops
  useEffect(() => {
    isMountedRef.current = true;
    setIsThemeHydrated(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleDeepLinkIngressProtocol = async (targetPathDestinationStr: string) => {
    if (!targetPathDestinationStr) return;
    trackEvent("footer_deep_link_triggered", { destination: targetPathDestinationStr });

    try {
      // Clear and synchronize active profile cache streams to prevent state drift over navigation swaps
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        navigate(`/auth?returnTo=${encodeURIComponent(targetPathDestinationStr)}`);
      }
    } catch (err) {
      navigate(`/auth?returnTo=${encodeURIComponent(targetPathDestinationStr)}`);
    }
  };

  // Defensively match layout themes to shield SSR pipelines from graphic logo asset flickering
  const derivedActiveLogoAssetSource = useMemo(() => {
    if (!isThemeHydrated) return logoDark;
    const currentSystemThemeModeStr = resolvedTheme || theme;
    return currentSystemThemeModeStr === "dark" ? logoLight : logoDark;
  }, [isThemeHydrated, resolvedTheme, theme]);

  return (
    <footer className="w-full mt-auto relative overflow-hidden border-t border-border/40 bg-card/40 backdrop-blur-md select-none text-left antialiased transform-gpu">
      {/* ATMOSPHERIC HUD GLOW DECK BLOCK */}
      <div
        className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/[0.02] blur-[90px] rounded-full pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 w-full min-w-0">
          {/* COLUMN MATRIX 1: CORPORATE MARK IDENTITY SECTOR */}
          <div className="space-y-4 col-span-2 sm:col-span-2 lg:col-span-1 text-left min-w-0">
            <button
              type="button"
              onClick={() => {
                trackEvent("footer_logo_home_clicked");
                navigate("/");
              }}
              className="flex items-center transition-transform hover:scale-[1.015] active:scale-[0.99] cursor-pointer outline-none focus-visible:ring-1 rounded-lg focus-visible:ring-ring p-0.5"
              aria-label="Navigate to institutional homepage index node"
            >
              <img
                src={derivedActiveLogoAssetSource}
                alt="GroUp Academy authoritative corporate tracking logo asset reference"
                className="h-8 w-auto object-contain select-none pointer-events-none"
              />
            </button>

            <div className="space-y-2 font-bold text-xs tracking-tight">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary block leading-none">
                Decode Your Career Potential
              </span>
              <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/60 italic max-w-xs select-text selection:bg-primary/10">
                Authoritative international verification registry mapping high-fidelity technical milestones, career
                alignment metrics, and adaptive pedagogical intelligence models.
              </p>
            </div>
          </div>

          {/* COLUMN MATRIX 2: PLATFORM CORE INFRASTRUCTURE LINKS */}
          <div className="space-y-3.5 text-left min-w-0 flex flex-col justify-start font-bold text-xs">
            <h4 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-muted-foreground/40 block leading-none select-none h-4">
              Platform Nodes
            </h4>
            <nav
              className="flex flex-col gap-2 w-full text-left"
              aria-label="Footer platform links structure directory navigation"
            >
              {[
                { label: "Syllabus Courses", path: "/app/learning/courses" },
                { label: "Career Milestones", path: "/app/learning/tracks" },
                { label: "Job Opportunity Ledger", path: "/app/jobs" },
                { label: "Ecosystem Insights Blog", path: "/blog" },
              ].map((linkItem) => (
                <button
                  key={linkItem.label}
                  type="button"
                  onClick={() => handleDeepLinkIngressProtocol(linkItem.path)}
                  className="w-fit text-xs font-semibold text-muted-foreground/70 hover:text-primary tracking-tight transition-colors text-left border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:text-primary uppercase font-mono text-[10px]"
                >
                  {linkItem.label.replace(/\s+/g, "_")}
                </button>
              ))}
            </nav>
          </div>

          {/* COLUMN MATRIX 3: ADVANCED NEURAL CAREER SERVICES NODES */}
          <div className="space-y-3.5 text-left min-w-0 flex flex-col justify-start font-bold text-xs">
            <h4 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-muted-foreground/40 block leading-none select-none h-4">
              Placement Services
            </h4>
            <nav
              className="flex flex-col gap-2 w-full text-left"
              aria-label="Footer advanced career placement services structure navigation"
            >
              {[
                { label: "Psychometric Scorecard", path: "/app/services/assessment" },
                { label: "AI Interview Simulation", path: "/app/services/mock-interview" },
                { label: "Fiscal Parity Analysis", path: "/app/services/salary-analysis" },
                { label: "Dynamic Vector Portfolio", path: "/app/services/portfolio" },
              ].map((linkItem) => (
                <button
                  key={linkItem.label}
                  type="button"
                  onClick={() => handleDeepLinkIngressProtocol(linkItem.path)}
                  className="w-fit text-xs font-semibold text-muted-foreground/70 hover:text-primary tracking-tight transition-colors text-left border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:text-primary uppercase font-mono text-[10px]"
                >
                  {linkItem.label.replace(/\s+/g, "_")}
                </button>
              ))}
            </nav>
          </div>

          {/* COLUMN MATRIX 4: INSTITUTIONAL SYNC ACCESS AND AUTH PANEL */}
          <div className="space-y-3.5 text-left min-w-0 flex flex-col justify-start font-bold text-xs">
            <h4 className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-muted-foreground/40 block leading-none select-none h-4">
              Institutional Sync
            </h4>
            <nav
              className="flex flex-col gap-2 w-full text-left"
              aria-label="Footer profile operational synchronization links structure navigation"
            >
              {[
                { label: "My Learning Track Dashboard", path: "/app/learning/my-courses", isAuthBound: true },
                { label: "Sign In Identity Token", path: "/auth", isAuthBound: false },
                { label: "For Enterprise Organizations", path: "/org", isAuthBound: false },
                { label: "Administrative Registry Terminal", path: "/admin", isAuthBound: false },
              ].map((linkItem) => (
                <button
                  key={linkItem.label}
                  type="button"
                  onClick={() => {
                    if (linkItem.isAuthBound) {
                      handleDeepLinkIngressProtocol(linkItem.path);
                    } else {
                      trackEvent("footer_direct_link_triggered", { destination: linkItem.path });
                      navigate(linkItem.path);
                    }
                  }}
                  className="w-fit text-xs font-semibold text-muted-foreground/70 hover:text-primary tracking-tight transition-colors text-left border-none bg-transparent p-0 cursor-pointer outline-none focus-visible:text-primary uppercase font-mono text-[10px]"
                >
                  {linkItem.label.replace(/\s+/g, "_")}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* HUD LEVEL 3: TERMINAL COMPLIANCE LICENSE STATUS FOOTER STRIP */}
        <div className="border-t border-border/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 w-full select-none text-left font-bold text-xs">
          <div className="flex items-center gap-3 min-w-0 text-left leading-none h-8">
            <div className="h-7 w-7 rounded bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="h-4 w-4 text-primary stroke-[2.2]" />
            </div>
            <p className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/40 block leading-none pt-0.5 select-text selection:bg-primary/10 truncate">
              &copy; 2026 GroUp Academy Neural Registry &bull; All Rights Reserved Compliance Directives
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0 font-bold text-xs select-none">
            <a
              href="https://www.youtube.com/@groupacademi"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("footer_youtube_channel_clicked")}
              className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/40 hover:text-rose-500 transition-colors cursor-pointer leading-none h-5 pt-0.5 outline-none focus-visible:text-rose-500"
            >
              <Youtube className="h-4 w-4 stroke-[2.2] text-zinc-400 hover:text-rose-500 shrink-0" />
              <span>Institutional Media Channel</span>
              <ExternalLink className="h-2.5 w-2.5 stroke-[2.5] text-muted-foreground/20 shrink-0" />
            </a>

            <div className="flex items-center gap-1 opacity-20 font-mono text-[8px] font-extrabold uppercase leading-none h-5 pt-0.5 tracking-wide">
              <Zap className="h-3.5 w-3.5 text-primary fill-primary/10 stroke-[2.5]" />
              <span>v4.2 CRYPT_LOCK</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
