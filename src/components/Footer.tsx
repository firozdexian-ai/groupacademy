import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Zap, ShieldCheck, Youtube, ExternalLink } from "lucide-react";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Global Anchor (Footer)
 * CTO Reference: Authoritative terminal node for global trajectory navigation.
 */

export const Footer = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleDeepLinkIngress = (path: string) => {
    navigate(`/auth?returnTo=${encodeURIComponent(path)}`);
  };

  return (
    <footer className="border-t-2 border-border/10 bg-card/40 backdrop-blur-xl mt-auto relative overflow-hidden">
      {/* ATMOSPHERIC_NODE: Subtle background pulse */}
      <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* HUD: IDENTITY_ARTIFACT */}
          <div className="space-y-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center transition-all hover:scale-105 active:scale-95"
            >
              <img
                src={theme === "dark" ? logoLight : logoDark}
                alt="GroUp_Academy_Institutional_Logo"
                className="h-9 w-auto"
              />
            </button>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase italic tracking-widest text-primary">
                Decode_Your_Career_Potential.
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground/60 italic max-w-[200px]">
                Global_Registry for high-fidelity career trajectories and pedagogical intelligence.
              </p>
            </div>
          </div>

          {/* HUD: PLATFORM_MATRIX */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
              Platform_Nodes
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { l: "Courses", p: "/app/learning/courses" },
                { l: "Career_Tracks", p: "/app/learning/tracks" },
                { l: "Job_Ledger", p: "/app/jobs" },
                { l: "Insights_Blog", p: "/blog" },
              ].map((link) => (
                <button
                  key={link.l}
                  onClick={() => handleDeepLinkIngress(link.p)}
                  className="text-xs font-bold text-muted-foreground/80 hover:text-primary transition-all text-left uppercase tracking-tighter italic"
                >
                  {link.l}
                </button>
              ))}
            </nav>
          </div>

          {/* HUD: SERVICE_VECTORS */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
              Career_Services
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { l: "Neural_Scorecard", p: "/app/services/assessment" },
                { l: "Mock_Simulation", p: "/app/services/mock-interview" },
                { l: "Fiscal_Analysis", p: "/app/services/salary-analysis" },
                { l: "Digital_Portfolio", p: "/app/services/portfolio" },
              ].map((link) => (
                <button
                  key={link.l}
                  onClick={() => handleDeepLinkIngress(link.p)}
                  className="text-xs font-bold text-muted-foreground/80 hover:text-primary transition-all text-left uppercase tracking-tighter italic"
                >
                  {link.l}
                </button>
              ))}
            </nav>
          </div>

          {/* HUD: ACCOUNT_ADMIN */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
              Institutional_Sync
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { l: "My_Learning", p: "/app/learning/my-courses", auth: true },
                { l: "Sign_In", p: "/auth", auth: false },
                { l: "For_Organizations", p: "/org", auth: false },
                { l: "Admin_Registry", p: "/admin", auth: false },
              ].map((link) => (
                <button
                  key={link.l}
                  onClick={() => (link.auth ? handleDeepLinkIngress(link.p) : navigate(link.p))}
                  className="text-xs font-bold text-muted-foreground/80 hover:text-primary transition-all text-left uppercase tracking-tighter italic"
                >
                  {link.l}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* HUD: TERMINAL_STATUS_BAR */}
        <div className="border-t border-border/10 mt-16 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
              © {new Date().getFullYear()} GroUp_Academy_Neural_Registry // All_Rights_Reserved
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://www.youtube.com/@groupacademi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/40 hover:text-rose-500 transition-colors"
            >
              <Youtube className="h-4 w-4" />
              Institutional_Channel
              <ExternalLink className="h-2.5 w-2.5 opacity-40" />
            </a>
            <div className="flex items-center gap-2 text-primary opacity-20">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span className="text-[9px] font-black tracking-widest italic">v4.2_SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
