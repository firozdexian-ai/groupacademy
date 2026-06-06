import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {/* Glassmorphism Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className={cn(
              "h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity",
              theme === "dark" ? "mix-blend-screen" : "mix-blend-multiply"
            )}
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-4">
              <button onClick={() => navigate("/courses")} className="hover:text-primary transition-colors">
                Courses
              </button>
              <button onClick={() => navigate("/career-services")} className="hover:text-primary transition-colors">
                Services
              </button>
              <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">
                Pricing
              </button>
              <button onClick={() => navigate("/agents")} className="hover:text-primary transition-colors">
                Agents
              </button>
              <button onClick={() => navigate("/blog")} className="hover:text-primary transition-colors">
                Blog
              </button>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6 border-primary/20 hover:bg-primary/5"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Premium Footer */}
      <footer className="border-t border-border/40 bg-card py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-4 text-center md:text-left">
              <img src={logoIcon} alt="GroUp" className="w-10 h-10 grayscale opacity-40" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  © 2026 GroUp Academy. Patent Pending.
                </p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter italic opacity-60">
                  Career Intelligence Verified
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {["courses", "career-services", "pricing", "agents", "blog"].map((path) => (
                <button
                  key={path}
                  onClick={() => navigate(`/${path}`)}
                  className="hover:text-primary transition-colors"
                >
                  {path.replace("-", " ")}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
