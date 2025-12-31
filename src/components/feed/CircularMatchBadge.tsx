import { cn } from '@/lib/utils';

interface CircularMatchBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CircularMatchBadge({ score, size = 'md', className }: CircularMatchBadgeProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'stroke-success';
    if (score >= 60) return 'stroke-warning';
    return 'stroke-muted-foreground';
  };

  const getTextColor = () => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-muted-foreground';
  };

  const dimensions = {
    sm: { size: 36, stroke: 3, radius: 14, fontSize: 'text-[10px]' },
    md: { size: 44, stroke: 3.5, radius: 17, fontSize: 'text-xs' },
    lg: { size: 56, stroke: 4, radius: 22, fontSize: 'text-sm' },
  };

  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: d.size, height: d.size }}>
      <svg 
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${d.size} ${d.size}`}
      >
        {/* Background circle */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={d.stroke}
        />
        {/* Progress circle */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className={cn("transition-all duration-500", getScoreColor())}
          strokeWidth={d.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center font-bold",
        d.fontSize,
        getTextColor()
      )}>
        {score}%
      </span>
    </div>
  );
}
