import { Flame, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningStreakProps {
  streak: number;
  className?: string;
}

export function LearningStreak({ streak, className }: LearningStreakProps) {
  const isActive = streak > 0;
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        isActive
          ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/30"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {isActive ? (
        <>
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
          <span>{streak}-day streak!</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>Start your streak</span>
        </>
      )}
    </div>
  );
}

interface LearningStatsRowProps {
  streak: number;
  hoursLearned: number;
  coursesCompleted: number;
  className?: string;
}

export function LearningStatsRow({
  streak,
  hoursLearned,
  coursesCompleted,
  className,
}: LearningStatsRowProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <LearningStreak streak={streak} />
      
      {hoursLearned > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          <span>{hoursLearned}h learned</span>
        </div>
      )}
      
      {coursesCompleted > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          <span>{coursesCompleted} completed</span>
        </div>
      )}
    </div>
  );
}
