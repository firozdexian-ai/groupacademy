import {
  TrendingUp,
  DollarSign,
  Building2,
  Users,
  Lightbulb,
  GraduationCap,
  Target,
  LucideIcon,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Artifact Delivery (InsightCard)
 * CTO Reference: Domain-aware card mapping for AI career strategies.
 */

interface InsightCardProps {
  insight: string;
  index: number;
  className?: string;
  fullWidth?: boolean;
}

interface Config {
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  borderColor: string;
  bgColor: string;
}

function getInsightConfig(insight: string, index: number): Config {
  const lower = insight.toLowerCase();

  // DOMAIN: Capital & Compensation (Emerald Protocol)
  if (lower.includes("salary") || lower.includes("pay") || lower.includes("earn") || lower.includes("compensation")) {
    return {
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-teal-500/5",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      bgColor: "bg-emerald-500/5",
    };
  }

  // DOMAIN: Skill Acquisition & Upskilling (Indigo Protocol)
  if (
    lower.includes("skill") ||
    lower.includes("learn") ||
    lower.includes("upskill") ||
    lower.includes("certification")
  ) {
    return {
      icon: GraduationCap,
      gradient: "from-indigo-500/20 to-blue-500/5",
      iconColor: "text-indigo-500",
      borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
      bgColor: "bg-indigo-500/5",
    };
  }

  // DOMAIN: Industry Intelligence & Trends (Violet Protocol)
  if (lower.includes("market") || lower.includes("industry") || lower.includes("trend") || lower.includes("demand")) {
    return {
      icon: TrendingUp,
      gradient: "from-violet-500/20 to-fuchsia-500/5",
      iconColor: "text-violet-500",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
      bgColor: "bg-violet-500/5",
    };
  }

  // DOMAIN: Social Capital & Network (Amber Protocol)
  if (
    lower.includes("network") ||
    lower.includes("connect") ||
    lower.includes("community") ||
    lower.includes("referral")
  ) {
    return {
      icon: Users,
      gradient: "from-amber-500/20 to-orange-500/5",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
      bgColor: "bg-amber-500/5",
    };
  }

  // DOMAIN: Tactical Targeting & Goals (Rose Protocol)
  if (lower.includes("goal") || lower.includes("focus") || lower.includes("target") || lower.includes("path")) {
    return {
      icon: Target,
      gradient: "from-rose-500/20 to-pink-500/5",
      iconColor: "text-rose-500",
      borderColor: "border-rose-500/20 hover:border-rose-500/40",
      bgColor: "bg-rose-500/5",
    };
  }

  // DEFAULTS: General Intelligence (Academy Blue / Corporate Slate)
  const defaults: Config[] = [
    {
      icon: Lightbulb,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      borderColor: "border-primary/20 hover:border-primary/40",
      bgColor: "bg-primary/5",
    },
    {
      icon: Building2,
      gradient: "from-slate-500/20 to-slate-700/5",
      iconColor: "text-slate-500",
      borderColor: "border-slate-500/20 hover:border-slate-500/40",
      bgColor: "bg-slate-500/5",
    },
  ];

  return defaults[index % defaults.length];
}

export function InsightCard({ insight, index, className, fullWidth = false }: InsightCardProps) {
  const config = getInsightConfig(insight, index);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative p-6 rounded-[24px] border-2 transition-all duration-500",
        "backdrop-blur-xl shadow-lg overflow-hidden text-left",
        fullWidth ? "w-full min-h-[100px]" : "flex-shrink-0 w-[300px]",
        "bg-gradient-to-br",
        config.gradient,
        config.borderColor,
        config.bgColor,
        className,
      )}
    >
      {/* EXECUTIVE GLOW INGRESS */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/10 transition-colors" />

      <div className="flex items-start gap-5 h-full relative z-10">
        <div
          className={cn(
            "p-3 rounded-2xl bg-background/80 shadow-inner border border-white/10 flex-shrink-0 transition-all duration-700",
            "group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl",
            config.iconColor,
          )}
        >
          <Icon className="h-5 w-5 fill-current opacity-80" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <p className="text-[15px] font-bold text-foreground/90 leading-relaxed tracking-tight italic">{insight}</p>
          <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Zap className={cn("h-3 w-3", config.iconColor)} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
              Neural_Protocol_Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
