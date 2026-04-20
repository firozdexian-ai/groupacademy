import { cn } from "@/lib/utils";

/**
 * Platform Logic: Performance Telemetry Node
 * High-fidelity circular progress indicator with reinforced geometric constants.
 * 2026 Standard: Executive Logic radii with responsive scaling presets.
 */

interface CircularProgressProps {
  value: number;
  current: number;
  target: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { dimension: "w-16 h-16", stroke: 14, radius: 70 },
  md: { dimension: "w-28 h-28", stroke: 12, radius: 70 },
  lg: { dimension: "w-40 h-40", stroke: 10, radius: 72 },
};

const CircularProgress = ({ value, current, target, size = "md", className }: CircularProgressProps) => {
  const config = SIZE_MAP[size];
  const clampedValue = Math.min(Math.max(value, 0), 100);

  // Logic: Circumference Calculation (2 * PI * R)
  // Standardizing on 160 viewbox for internal alignment consistency
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (circumference * clampedValue) / 100;

  return (
    <div className={cn("relative flex-shrink-0 group", config.dimension, className)}>
      {/* Background Glow Node */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 160 160">
        {/* Track: System Muted Trace */}
        <circle
          cx="80"
          cy="80"
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          className="text-muted/20"
        />

        {/* Progress: Active Logic Path */}
        <circle
          cx="80"
          cy="80"
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          className="text-primary transition-all duration-700 ease-in-out"
          strokeLinecap="round"
        />
      </svg>

      {/* Telemetry Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <span
          className={cn(
            "font-black tracking-tighter italic italic-none leading-none",
            size === "sm" && "text-base",
            size === "md" && "text-2xl",
            size === "lg" && "text-4xl",
          )}
        >
          {current}
        </span>
        <div className="flex flex-col items-center">
          <div className="h-[1px] w-4 bg-primary/20 my-0.5 sm:my-1" />
          <span
            className={cn(
              "font-black uppercase tracking-widest text-muted-foreground/50",
              size === "sm" && "text-[8px]",
              size === "md" && "text-[10px]",
              size === "lg" && "text-xs",
            )}
          >
            of {target}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
