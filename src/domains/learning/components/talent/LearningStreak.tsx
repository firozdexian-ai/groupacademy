import { useEffect, useMemo, useState } from "react";
import { Flame, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";
import { trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface LearningStreakProps {
  streak: number;
  className?: string;
}

/**
 * GroUp Academy: Student Metrics Component (LearningStreak)
 * Visual indicator for student daily learning consistency and achievement tracking.
 */
export function LearningStreak({ streak, className }: LearningStreakProps) {
  const normalizedStreak = typeof streak === "number" && !isNaN(streak) ? Math.max(0, streak) : 0;
  const isActive = normalizedStreak > 0;
  const isHot = normalizedStreak >= 7;

  // Track active student streak events via standard metrics pathways
  useEffect(() => {
    trackEvent("gamified_streak_node_rendered", {
      currentStreakCount: normalizedStreak,
      isSuperStreakMode: isHot,
      isStreakActive: isActive,
    });
  }, [normalizedStreak, isHot, isActive]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all duration-500 border shadow-sm select-none antialiased transform-gpu shrink-0",
        isActive
          ? "bg-gradient-to-br from-warning/15 via-warning/5 to-transparent text-warning dark:text-warning border-warning/20 shadow-orange-500/[0.02]"
          : "bg-muted/30 text-muted-foreground/50 border-dashed border-border/40 shadow-none",
        isHot && "ring-4 ring-warning/10 dark:ring-warning/5 animate-in zoom-in-98",
        className,
      )}
    >
      {isActive ? (
        <>
          {/* Hardware-accelerated presentation layer for animation performance smoothness */}
          <div className="relative shrink-0 flex items-center justify-center transform-gpu h-4 w-4">
            <Flame
              className={cn(
                "h-4 w-4 text-current stroke-[2.2] fill-current z-10 relative",
                isHot ? "animate-bounce" : "animate-pulse",
              )}
            />
            {isHot && (
              <div className="absolute inset-0 bg-warning rounded-full blur-xl opacity-60 animate-pulse pointer-events-none transform-gpu backface-hidden will-change-transform" />
            )}
          </div>

          <span className="drop-shadow-sm tabular-nums tracking-wide font-black">
            {normalizedStreak} {isHot ? "Super Streak" : "Day Streak"}
          </span>
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5 opacity-40 shrink-0 stroke-[2.2]" />
          <span className="font-bold tracking-wide">Start Your Streak</span>
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
  const normalizedHours = typeof hoursLearned === "number" && !isNaN(hoursLearned) ? Math.max(0, hoursLearned) : 0;
  const normalizedCourses =
    typeof coursesCompleted === "number" && !isNaN(coursesCompleted) ? Math.max(0, coursesCompleted) : 0;
  const isStreakActive = typeof streak === "number" && streak > 0;

  // Dispatch component data changes strictly over tracking streams
  useEffect(() => {
    if (isStreakActive || normalizedHours > 0 || normalizedCourses > 0) {
      trackEvent("gamified_telemetry_row_compiled", {
        activeStreak: streak,
        hoursAccumulated: normalizedHours,
        graduationsCount: normalizedCourses,
      });
    }
  }, [streak, normalizedHours, normalizedCourses, isStreakActive]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 select-none w-full max-w-full transform-gpu whitespace-nowrap",
        className,
      )}
    >
      {/* Visual Learning Streak Element */}
      <LearningStreak streak={streak} className="shrink-0" />

      {/* Aggregate Cumulative Hours Learned Tag */}
      {normalizedHours > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 dark:bg-primary/5 text-primary dark:text-primary border border-primary/20 text-[10px] font-extrabold uppercase tracking-wide shrink-0 shadow-sm leading-none select-text tabular-nums">
          <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.2]" />
          <span>{normalizedHours.toLocaleString()} Hours Learned</span>
        </div>
      )}

      {/* Completed Courses Tracking Yield Tag */}
      {normalizedCourses > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-success/10 dark:bg-success/5 text-success dark:text-success border border-success/20 text-[10px] font-extrabold uppercase tracking-wide shrink-0 shadow-sm leading-none select-text tabular-nums">
          <Trophy className="h-3.5 w-3.5 text-success shrink-0 stroke-[2.2]" />
          <span>{normalizedCourses.toLocaleString()} Courses Finished</span>
        </div>
      )}

      {/* Empty State Fallback Anchor Display Row */}
      {!isStreakActive && normalizedHours === 0 && normalizedCourses === 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-muted/20 text-muted-foreground/50 border border-dashed border-border/40 text-[10px] font-bold uppercase tracking-wide shrink-0 leading-none">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 stroke-[2.2] animate-pulse" />
          <span>Start Learning</span>
        </div>
      )}
    </div>
  );
}
