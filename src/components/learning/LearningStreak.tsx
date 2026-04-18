import { Flame, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningStreakProps {
  streak: number;
  className?: string;
}

export function LearningStreak({ streak, className }: LearningStreakProps) {
  const isActive = streak > 0;
  const isHot = streak >= 7;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500",
        isActive
          ? "bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-orange-600 border border-orange-200/50 shadow-lg shadow-orange-500/5"
          : "bg-muted/50 text-muted-foreground/60 border border-transparent",
        isHot && "ring-2 ring-orange-500/20 animate-pulse",
        className,
      )}
    >
      {isActive ? (
        <>
          <div className="relative">
            <Flame className={cn("h-4 w-4 text-orange-500", isHot ? "animate-bounce" : "animate-pulse")} />
            {isHot && <div className="absolute inset-0 bg-orange-400 blur-lg opacity-40 animate-pulse" />}
          </div>
          <span>
            {streak} Day {isHot ? "Hot " : ""}Streak
          </span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 opacity-40" />
          <span>Ignite Your Streak</span>
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

export function LearningStatsRow({ streak, hoursLearned, coursesCompleted, className }: LearningStatsRowProps) {
  return (
    <div className={cn("flex items-center gap-3 overflow-x-auto no-scrollbar py-1", className)}>
      <LearningStreak streak={streak} className="shrink-0" />

      {hoursLearned > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-200/30 text-[11px] font-black uppercase tracking-widest shrink-0">
          <TrendingUp className="h-4 w-4" />
          <span>{hoursLearned}h Knowledge</span>
        </div>
      )}

      {coursesCompleted > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/30 text-[11px] font-black uppercase tracking-widest shrink-0">
          <Trophy className="h-4 w-4" />
          <span>{coursesCompleted} Graduated</span>
        </div>
      )}
    </div>
  );
}
