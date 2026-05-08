import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Match Visualization (CircularMatchBadge)
 * CTO Reference: Authoritative node for displaying match-score telemetry.
 */

interface CircularMatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CircularMatchBadge({ score, size = "md", className }: CircularMatchBadgeProps) {
  // PROTOCOL: Centralized Telemetry Configuration
  const config = {
    high: { color: "text-emerald-500", stroke: "stroke-emerald-500", threshold: 80 },
    medium: { color: "text-amber-500", stroke: "stroke-amber-500", threshold: 60 },
    low: { color: "text-muted-foreground/60", stroke: "stroke-muted/40", threshold: 0 },
  };

  const getVariant = () => {
    if (score >= config.high.threshold) return config.high;
    if (score >= config.medium.threshold) return config.medium;
    return config.low;
  };

  const variant = getVariant();

  // GEOMETRY: Dimensional mapping for executive UI targets
  const dimensions = {
    sm: { size: 36, stroke: 3, radius: 14, fontSize: "text-[10px]" },
    md: { size: 44, stroke: 3.5, radius: 17, fontSize: "text-xs" },
    lg: { size: 56, stroke: 4, radius: 22, fontSize: "text-sm" },
  };

  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0 animate-in fade-in duration-500", className)}
      style={{ width: d.size, height: d.size }}
    >
      <svg className="w-full h-full -rotate-90 transform-gpu" viewBox={`0 0 ${d.size} ${d.size}`}>
        {/* INFRASTRUCTURE: Track Layer */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className="stroke-muted/20"
          strokeWidth={d.stroke}
        />
        {/* TELEMETRY: Match Progression */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className={cn(
            "transition-all duration-[1500ms] ease-in-out",
            variant.stroke,
            score >= 80 && "drop-shadow-[0_0_3px_rgba(16,185,129,0.4)]",
          )}
          strokeWidth={d.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* IDENTITY: Yield Label */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold tabular-nums",
          d.fontSize,
          variant.color,
        )}
      >
        <span className="flex items-start">
          {score}
          <span className="text-[0.55em] mt-0.5 ml-0.5 opacity-60">%</span>
        </span>
      </div>
    </div>
  );
}
