import { TrendingUp, DollarSign, Building2, Users, Lightbulb, GraduationCap, Target, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // High-priority career keywords
  if (lower.includes("salary") || lower.includes("pay") || lower.includes("earn") || lower.includes("compensation")) {
    return {
      icon: DollarSign,
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
    };
  }

  if (
    lower.includes("skill") ||
    lower.includes("learn") ||
    lower.includes("upskill") ||
    lower.includes("certification")
  ) {
    return {
      icon: GraduationCap,
      gradient: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20 hover:border-blue-500/40",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    };
  }

  if (lower.includes("market") || lower.includes("industry") || lower.includes("trend") || lower.includes("demand")) {
    return {
      icon: TrendingUp,
      gradient: "from-violet-500/10 to-purple-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
      bgColor: "bg-violet-50/50 dark:bg-violet-950/20",
    };
  }

  if (
    lower.includes("network") ||
    lower.includes("connect") ||
    lower.includes("community") ||
    lower.includes("referral")
  ) {
    return {
      icon: Users,
      gradient: "from-orange-500/10 to-amber-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-500/20 hover:border-orange-500/40",
      bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
    };
  }

  if (lower.includes("goal") || lower.includes("focus") || lower.includes("target") || lower.includes("path")) {
    return {
      icon: Target,
      gradient: "from-rose-500/10 to-pink-500/10",
      iconColor: "text-rose-600 dark:text-rose-400",
      borderColor: "border-rose-500/20 hover:border-rose-500/40",
      bgColor: "bg-rose-50/50 dark:bg-rose-950/20",
    };
  }

  // Dynamic defaults for variety
  const defaults: Config[] = [
    {
      icon: Lightbulb,
      gradient: "from-primary/10 to-accent/10",
      iconColor: "text-primary",
      borderColor: "border-primary/20 hover:border-primary/40",
      bgColor: "bg-primary/5",
    },
    {
      icon: Building2,
      gradient: "from-slate-500/10 to-slate-700/10",
      iconColor: "text-slate-600",
      borderColor: "border-slate-500/20 hover:border-slate-500/40",
      bgColor: "bg-slate-50/50",
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
        "group relative p-4 rounded-2xl border transition-all duration-300",
        "backdrop-blur-md shadow-sm overflow-hidden",
        fullWidth ? "w-full min-h-[80px]" : "flex-shrink-0 w-[280px]",
        config.gradient,
        config.borderColor,
        config.bgColor,
        className,
      )}
    >
      {/* Subtle Glow Effect */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start gap-4 h-full">
        <div
          className={cn(
            "p-2.5 rounded-xl bg-background/90 shadow-sm flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            config.iconColor,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <p className="text-sm font-medium text-foreground/90 leading-snug tracking-tight">{insight}</p>
        </div>
      </div>
    </div>
  );
}
