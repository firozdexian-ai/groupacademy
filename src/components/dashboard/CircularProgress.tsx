interface CircularProgressProps {
  value: number;
  current: number;
  target: number;
  size?: "sm" | "md" | "lg";
}

const CircularProgress = ({ value, current, target }: CircularProgressProps) => {
  const clampedValue = Math.min(value, 100);
  
  return (
    <div className="relative w-16 h-16 sm:w-28 sm:h-28 lg:w-40 lg:h-40 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeDasharray={440}
          strokeDashoffset={440 - (440 * clampedValue) / 100}
          className="text-primary transition-all duration-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg sm:text-2xl lg:text-3xl font-bold">{current}</span>
        <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">of {target}</span>
      </div>
    </div>
  );
};

export default CircularProgress;
