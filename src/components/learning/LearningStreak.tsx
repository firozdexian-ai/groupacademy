import { Flame, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Talent Telemetry Node (Streaks & Stats)
 * CTO Reference: Authoritative node for gamified engagement tracking.
 */

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
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase italic tracking-[0.15em] transition-all duration-700",
        isActive
          ? "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent text-orange-600 border-2 border-orange-500/20 shadow-xl shadow-orange-500/5"
          : "bg-muted/30 text-muted-foreground/40 border-2 border-dashed border-border/40",
        isHot && "ring-4 ring-orange-500/10 animate-in zoom-in-95",
        className,
      )}
    >
      {isActive ? (
        <>
          <div className="relative">
            <Flame className={cn("h-4 w-4 fill-current", isHot ? "animate-bounce" : "animate-pulse")} />
            {isHot && <div className="absolute inset-0 bg-orange-500 blur-xl opacity-60 animate-pulse" />}
          </div>
          <span className="drop-shadow-sm">
            {streak} DAY {isHot ? "SUPER_" : ""}STREAK
          </span>
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 opacity-30 italic" />
          <span>Initialize_Streak</span>
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
    <div className={cn("flex items-center gap-3 overflow-x-auto no-scrollbar py-2", className)}>
      {/* INGRESS: Streak Telemetry */}
      <LearningStreak streak={streak} className="shrink-0" />

      {/* METRIC: Knowledge Synthesis */}
      {hoursLearned > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-blue-500/5 text-blue-500 border-2 border-blue-500/10 text-[10px] font-black uppercase italic tracking-[0.15em] shrink-0 shadow-lg">
          <TrendingUp className="h-4 w-4" />
          <span>{hoursLearned}H_SYNCED</span>
        </div>
      )}

      {/* METRIC: Graduation Yield */}
      {coursesCompleted > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-emerald-500/5 text-emerald-500 border-2 border-emerald-500/10 text-[10px] font-black uppercase italic tracking-[0.15em] shrink-0 shadow-lg">
          <Trophy className="h-4 w-4" />
          <span>{coursesCompleted}_GRADUATED</span>
        </div>
      )}

      {/* PLACEHOLDER: Reward Ingress */}
      {!isActive && coursesCompleted === 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-muted/10 text-muted-foreground/30 border-2 border-dashed border-border/40 text-[10px] font-black uppercase italic tracking-[0.15em] shrink-0">
          <Sparkles className="h-4 w-4" />
          <span>Awaiting_Data</span>
        </div>
      )}
    </div>
  );
}
