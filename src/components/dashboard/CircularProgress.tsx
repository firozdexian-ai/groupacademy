interface CircularProgressProps {
  value: number;
  current: number;
  target: number;
}

const CircularProgress = ({ value, current, target }: CircularProgressProps) => {
  const clampedValue = Math.min(value, 100);
  
  return (
    <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0">
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
        <span className="text-2xl sm:text-3xl font-bold">{current}</span>
        <span className="text-xs sm:text-sm text-muted-foreground">of {target}</span>
      </div>
    </div>
  );
};

export default CircularProgress;
