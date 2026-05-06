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

interface ServicesTourProps {
  onComplete: () => void;
}

const SERVICE_REGISTRY = [
  {
    icon: ClipboardCheck,
    name: "Career Readiness Audit",
    description: "Get a personalised analysis of where your career stands and how to improve.",
    cost: CREDIT_CONFIG.SERVICES.CAREER_ASSESSMENT.cost,
    bgClass: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    icon: MessageSquare,
    name: "AI Mock Interviews",
    description: "Practise interviews with realistic simulations and instant feedback.",
    cost: CREDIT_CONFIG.SERVICES.MOCK_INTERVIEW.cost,
    bgClass: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    icon: TrendingUp,
    name: "Salary Analysis",
    description: "See your real market value with AI insights and negotiation tips.",
    cost: CREDIT_CONFIG.SERVICES.SALARY_ANALYSIS.cost,
    bgClass: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    icon: Send,
    name: "Smart Job Applications",
    description: "Speed up applications with AI-written cover letters tailored to each job.",
    cost: CREDIT_CONFIG.SERVICES.JOB_APPLICATION.cost,
    bgClass: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    icon: Globe,
    name: "Digital Portfolio",
    description: "Generate a polished portfolio site to showcase your work.",
    cost: CREDIT_CONFIG.SERVICES.PORTFOLIO.cost,
    bgClass: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    icon: Bot,
    name: "AI Career Agents",
    description: "Chat with specialised AI advisors for career guidance, anytime.",
    cost: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
    bgClass: "bg-sky-50",
    iconColor: "text-sky-500",
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
    <div className="flex flex-col items-center px-4 py-8 max-w-xl mx-auto min-h-[70vh] text-left w-full animate-in fade-in duration-700">
      <div className="mb-12 space-y-3 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
          What you can do here
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          A quick look at your AI career toolkit.
        </p>
      </div>

      {/* PROGRESS INDICATORS */}
      <div className="flex gap-2 mb-10">
        {SERVICE_REGISTRY.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              index === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-slate-200 hover:bg-slate-300",
            )}
          />
        ))}
      </div>

      {/* COMPONENT: SERVICE_ARTIFACT_CARD */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="w-full bg-white rounded-[40px] border border-slate-100 p-10 md:p-12 transition-all duration-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

          <div className="flex justify-center mb-8 relative z-10">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-500 hover:scale-105",
                currentService.bgClass,
              )}
            >
              <Icon className={cn("h-10 w-10", currentService.iconColor)} />
            </div>
          </div>

          <div className="space-y-4 text-center relative z-10">
            <h3 className="text-2xl font-black tracking-tighter text-slate-900">{currentService.name}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed px-2 md:px-6 h-12">
              {currentService.description}
            </p>

            <div className="pt-8">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> {currentService.cost} credits per use
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
          className="h-14 w-14 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95 shrink-0 shadow-sm"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {isTerminalNode ? (
          <Button
            size="lg"
            onClick={onComplete}
            className="flex-1 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95 gap-3"
          >
            Enter the platform <ShieldCheck className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            onClick={goNext}
            className="flex-1 h-14 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95 gap-3"
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={isTerminalNode}
          className="h-14 w-14 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95 shrink-0 shadow-sm"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={onComplete}
        className="mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors rounded-full h-10 px-6"
      >
        Skip tour
      </Button>
    </div>
  );
}
