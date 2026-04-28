import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

/**
 * GroUp Academy: Institutional Services Tour
 * CTO Reference: Authoritative node for services discovery and value-proposition sync.
 */

interface ServicesTourProps {
  onComplete: () => void;
}

const SERVICE_REGISTRY = [
  {
    icon: ClipboardCheck,
    name: "Career Readiness HUD",
    description: "Autonomous analysis of your career vectors with real-time optimization protocols.",
    cost: CREDIT_CONFIG.SERVICES.CAREER_ASSESSMENT.cost,
    color: "from-blue-500/20 via-blue-500/5 to-transparent",
    iconColor: "text-blue-500",
  },
  {
    icon: MessageSquare,
    name: "Neural Mock Interview",
    description: "Execute high-fidelity interview simulations with real-time feedback ingestion.",
    cost: CREDIT_CONFIG.SERVICES.MOCK_INTERVIEW.cost,
    color: "from-purple-500/20 via-purple-500/5 to-transparent",
    iconColor: "text-purple-500",
  },
  {
    icon: TrendingUp,
    name: "Fiscal Analysis Engine",
    description: "Decrypt your market value with AI-powered salary insights and negotiation blueprints.",
    cost: CREDIT_CONFIG.SERVICES.SALARY_ANALYSIS.cost,
    color: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconColor: "text-emerald-500",
  },
  {
    icon: Send,
    name: "Job Deployment Ingress",
    description: "Authorize global job applications with AI-synchronized cover letters.",
    cost: CREDIT_CONFIG.SERVICES.JOB_APPLICATION.cost,
    color: "from-orange-500/20 via-orange-500/5 to-transparent",
    iconColor: "text-orange-500",
  },
  {
    icon: Globe,
    name: "Executive Portfolio",
    description: "Initialize a professional digital presence built by our core development team.",
    cost: CREDIT_CONFIG.SERVICES.PORTFOLIO.cost,
    color: "from-rose-500/20 via-rose-500/5 to-transparent",
    iconColor: "text-rose-500",
  },
  {
    icon: Bot,
    name: "AI Faculty Agents",
    description: "Sync with specialized AI career agents for 24/7 strategic guidance.",
    cost: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
    color: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    iconColor: "text-cyan-500",
  },
];

export function ServicesTour({ onComplete }: ServicesTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => currentIndex < SERVICE_REGISTRY.length - 1 && setCurrentIndex(currentIndex + 1);
  const goPrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const currentService = SERVICE_REGISTRY[currentIndex];
  const Icon = currentService.icon;
  const isTerminalNode = currentIndex === SERVICE_REGISTRY.length - 1;

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-lg mx-auto min-h-[70vh] text-left animate-in fade-in duration-700">
      <div className="mb-10 space-y-2 text-center">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">
          Service_Discovery
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground italic">
          Synchronize with high-yield career boosting artifacts
        </p>
      </div>

      {/* HUD: TELEMETRY_DOTS */}
      <div className="flex gap-3 mb-10">
        {SERVICE_REGISTRY.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              index === currentIndex
                ? "w-10 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                : "w-1.5 bg-muted/40",
            )}
          />
        ))}
      </div>

      {/* COMPONENT: SERVICE_ARTIFACT_CARD */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div
          className={cn(
            "w-full bg-gradient-to-br rounded-[32px] border-2 border-border/40 p-8 transition-all duration-700 shadow-2xl relative overflow-hidden",
            currentService.color,
          )}
        >
          <Zap className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 rotate-12" />

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-[24px] bg-background/80 backdrop-blur-xl flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:scale-110">
              <Icon className={cn("h-10 w-10", currentService.iconColor)} />
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">
              {currentService.name.replace(" ", "_")}
            </h3>
            <p className="text-sm font-medium italic text-muted-foreground leading-relaxed px-4">
              {currentService.description}
            </p>

            <div className="pt-4">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 border-2 border-amber-500/20 text-amber-600 text-[10px] font-black uppercase italic tracking-widest shadow-inner">
                <Zap className="h-3 w-3 fill-current" /> {currentService.cost}_CREDITS_PER_SYNC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HUD: NAVIGATION_INGRESS */}
      <div className="flex items-center justify-between w-full mt-10 gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="h-14 w-14 rounded-2xl border-2 hover:bg-muted/10 transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {isTerminalNode ? (
          <Button
            size="xl"
            onClick={onComplete}
            className="flex-1 h-14 rounded-2xl font-black uppercase italic text-xs tracking-[0.2em] shadow-[0_10px_40px_rgba(var(--primary),0.3)] transition-all active:scale-95 gap-3"
          >
            INITIALIZE_ACADEMY <ShieldCheck className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="xl"
            variant="outline"
            onClick={goNext}
            className="flex-1 h-14 rounded-2xl border-2 font-black uppercase italic text-xs tracking-[0.2em] transition-all hover:bg-primary/5 active:scale-95 gap-3"
          >
            NEXT_NODE <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={isTerminalNode}
          className="h-14 w-14 rounded-2xl border-2 hover:bg-muted/10 transition-all active:scale-90"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onComplete}
        className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors"
      >
        AUTHORIZE_SKIP_PROTOCOL
      </Button>
    </div>
  );
}
