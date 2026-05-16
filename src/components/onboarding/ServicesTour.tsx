import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Send,
  Globe,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

interface ServicesTourProps {
  onComplete: () => void;
}

const SERVICE_REGISTRY = [
  {
    icon: ClipboardCheck,
    name: "Career Readiness Audit",
    description: "Get a personalized analysis of where your career stands and actionable feedback to improve.",
    cost: CREDIT_CONFIG.SERVICES.CAREER_ASSESSMENT?.cost || 100,
    bgClass: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: MessageSquare,
    name: "AI Mock Interviews",
    description: "Practice specialized interviews with realistic simulated agents and receive instant scoring.",
    cost: CREDIT_CONFIG.SERVICES.MOCK_INTERVIEW?.cost || 150,
    bgClass: "bg-purple-500/10 border-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: TrendingUp,
    name: "Salary Analysis",
    description: "Evaluate your actual market compensation threshold with data insights and negotiation tactics.",
    cost: CREDIT_CONFIG.SERVICES.SALARY_ANALYSIS?.cost || 100,
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Send,
    name: "Smart Job Applications",
    description: "Accelerate custom submission pipelines with context-aware cover letters mapped to positions.",
    cost: CREDIT_CONFIG.SERVICES.JOB_APPLICATION?.cost || 50,
    bgClass: "bg-orange-500/10 border-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Globe,
    name: "Digital Portfolio Engine",
    description: "Construct a sleek, production-ready portfolio landing page to demonstrate tracking assets.",
    cost: CREDIT_CONFIG.SERVICES.PORTFOLIO?.cost || 200,
    bgClass: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Bot,
    name: "AI Career Advisors",
    description: "Consult with automated domain experts for persistent trajectory advice and guidance maps.",
    cost: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT?.cost || 20,
    bgClass: "bg-sky-500/10 border-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
];

export function ServicesTour({ onComplete }: ServicesTourProps) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Monitor onboarding toolkit overview slide interactions via tracking metrics
  useEffect(() => {
    trackEvent("onboarding_services_tour_mounted");
  }, []);

  useEffect(() => {
    trackEvent("onboarding_services_tour_slide_changed", {
      slideIndex: currentIndex,
      serviceName: SERVICE_REGISTRY[currentIndex]?.name,
    });
  }, [currentIndex]);

  const goNext = () => {
    if (currentIndex < SERVICE_REGISTRY.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinishTour = async () => {
    trackEvent("onboarding_services_tour_completed");
    try {
      // Automated Efficiency: Invalidate baseline states to refresh dashboard content layout frames instantly
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      onComplete();
    } catch (err) {
      trackError(err, { component: "ServicesTour", action: "execute_on_complete_callback" });
      onComplete(); // Safe fallback
    }
  };

  const currentService = SERVICE_REGISTRY[currentIndex] || SERVICE_REGISTRY[0];
  const Icon = currentService.icon || Bot;
  const isTerminalNode = currentIndex === SERVICE_REGISTRY.length - 1;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-xl mx-auto w-full antialiased text-left select-none sm:select-text transform-gpu animate-in fade-in duration-300">
      {/* HUD HEADER COVER SLIDE BANNER */}
      <div className="mb-6 space-y-1.5 text-center select-none w-full leading-none">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
          Ecosystem Toolkit Architecture
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-0.5">
          An overview summary of available generative AI tools assigned to your profile.
        </p>
      </div>

      {/* METRIC HORIZON INDEX TICKERS BUTTON BAR */}
      <div className="flex items-center justify-center gap-2 mb-6 select-none">
        {SERVICE_REGISTRY.map((_, index) => {
          const isCurrentActiveIndicator = index === currentIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 transform-gpu cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isCurrentActiveIndicator ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/30",
              )}
              aria-label={`Maps to feature model description panel index target row #${index + 1}`}
            />
          );
        })}
      </div>

      {/* PRESENTATION DISPLAY CORE DATA FRAME CONTAINER */}
      <div className="w-full flex items-center justify-center min-h-[280px]">
        <Card className="w-full border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-sm relative overflow-hidden text-center flex flex-col justify-center items-center">
          {/* Atmospheric background glow vector layout */}
          <div
            className={cn(
              "absolute -top-16 -right-16 w-36 h-36 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full pointer-events-none select-none",
              currentService.bgClass,
            )}
          />

          <div className="flex justify-center mb-4 select-none shrink-0 relative z-10">
            <div
              className={cn(
                "w-16 h-16 rounded-xl border flex items-center justify-center shadow-inner transition-transform duration-500 transform hover:rotate-2",
                currentService.bgClass,
              )}
            >
              <Icon className={cn("h-7 w-7 stroke-[2.2]", currentService.iconColor)} />
            </div>
          </div>

          <div className="space-y-2 text-center relative z-10 w-full min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground/90 uppercase tracking-wide leading-none select-all selection:bg-primary/10">
              {currentService.name}
            </h3>
            {/* Hardened Fluid Geometry: Removed static heights to handle variable localized lines cleanly */}
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/80 leading-relaxed max-w-md mx-auto select-text selection:bg-primary/10 min-h-[40px] flex items-center justify-center">
              {currentService.description}
            </p>

            <div className="pt-4 select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/40 bg-background/50 rounded-full font-mono text-[9px] font-extrabold uppercase tracking-wide tabular-nums text-muted-foreground/70 shadow-sm leading-none">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2]" />
                <span>
                  Processing consumes <span className="text-primary font-black">{currentService.cost} credits</span> per
                  pass
                </span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* COMMAND CONTROL NAVIGATION OPERATIONS BAR */}
      <div className="flex items-center justify-between w-full mt-6 gap-3 select-none">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95"
          aria-label="Return back to previous toolkit model index description"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </Button>

        {isTerminalNode ? (
          <Button
            size="lg"
            type="button"
            onClick={handleFinishTour}
            className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider gap-1.5 cursor-pointer shadow-md transform-gpu active:scale-[0.99] transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>Activate Trajectory Platform</span>
            <ShieldCheck className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            type="button"
            onClick={goNext}
            className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wide gap-1.5 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95"
          >
            <span>Next System Tool</span>
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={goNext}
          disabled={isTerminalNode}
          className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95"
          aria-label="Advance forward to next platform tool element panel"
        >
          <ChevronRight className="h-5 w-5 stroke-[2.5]" />
        </Button>
      </div>

      <Button
        variant="ghost"
        type="button"
        onClick={handleFinishTour}
        className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors rounded-xl h-8 px-4 cursor-pointer shadow-none"
      >
        Skip System Tour Protocol
      </Button>
    </div>
  );
}
