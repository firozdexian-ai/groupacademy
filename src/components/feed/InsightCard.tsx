import { TrendingUp, DollarSign, Building2, Users, Lightbulb, GraduationCap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: string;
  index: number;
  className?: string;
}

// Determine icon based on insight content keywords
function getInsightConfig(insight: string, index: number) {
  const lowerInsight = insight.toLowerCase();
  
  if (lowerInsight.includes('skill') || lowerInsight.includes('learn') || lowerInsight.includes('upskill')) {
    return { 
      icon: GraduationCap, 
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/30'
    };
  }
  if (lowerInsight.includes('salary') || lowerInsight.includes('pay') || lowerInsight.includes('earn')) {
    return { 
      icon: DollarSign, 
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/30'
    };
  }
  if (lowerInsight.includes('market') || lowerInsight.includes('industry') || lowerInsight.includes('company')) {
    return { 
      icon: Building2, 
      gradient: 'from-purple-500/20 to-violet-500/20',
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/30'
    };
  }
  if (lowerInsight.includes('network') || lowerInsight.includes('connect') || lowerInsight.includes('community')) {
    return { 
      icon: Users, 
      gradient: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500',
      borderColor: 'border-orange-500/30'
    };
  }
  if (lowerInsight.includes('trend') || lowerInsight.includes('grow') || lowerInsight.includes('demand')) {
    return { 
      icon: TrendingUp, 
      gradient: 'from-teal-500/20 to-cyan-500/20',
      iconColor: 'text-teal-500',
      borderColor: 'border-teal-500/30'
    };
  }
  if (lowerInsight.includes('goal') || lowerInsight.includes('focus') || lowerInsight.includes('target')) {
    return { 
      icon: Target, 
      gradient: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-500/30'
    };
  }
  
  // Default based on index for variety
  const defaults = [
    { icon: Lightbulb, gradient: 'from-primary/20 to-accent/20', iconColor: 'text-primary', borderColor: 'border-primary/30' },
    { icon: TrendingUp, gradient: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-500', borderColor: 'border-blue-500/30' },
    { icon: Target, gradient: 'from-green-500/20 to-teal-500/20', iconColor: 'text-green-500', borderColor: 'border-green-500/30' },
  ];
  
  return defaults[index % defaults.length];
}

export function InsightCard({ insight, index, className }: InsightCardProps) {
  const config = getInsightConfig(insight, index);
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex-shrink-0 w-[260px] p-4 rounded-xl border bg-gradient-to-br backdrop-blur-sm",
        config.gradient,
        config.borderColor,
        "hover:scale-[1.02] transition-transform duration-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-background/80 shadow-sm",
          config.iconColor
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground leading-relaxed flex-1">
          {insight}
        </p>
      </div>
    </div>
  );
}
