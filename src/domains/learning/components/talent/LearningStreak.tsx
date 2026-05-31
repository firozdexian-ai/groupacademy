import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface LearningStreakProps {
  streak: number;
  className?: string;
}

/**
 * GroUp Academy: Talent Telemetry Node (LearningStreak)
 * CTO Reference: Authoritative micro-node for gamified engagement tracking and streak metrics visualization.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function LearningStreak({ streak, className }: LearningStreakProps) {
  const normalizedStreak = typeof streak === "number" && !isNaN(streak) ? Math.max(0, streak) : 0;
  const isActive = normalizedStreak > 0;
  const isHot = normalizedStreak >= 7;

  // Monitor retention streak metrics parameters over active telemetry channels
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
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase italic tracking-wider transition-all duration-500 border shadow-sm select-none antialiased transform-gpu shrink-0",
        isActive
          ? "bg-gradient-to-br from-orange-500/15 via-amber-500/5 to-transparent text-orange-600 dark:text-orange-400 border-orange-500/20 shadow-orange-500/[0.02]"
          : "bg-muted/30 text-muted-foreground/50 border-dashed border-border/40 shadow-none",
        isHot && "ring-4 ring-orange-500/10 dark:ring-orange-500/5 animate-in zoom-in-98",
        className,
      )}
    >
      {isActive ? (
        <>
          {/* Hardware-accelerated graphic layout mesh layers protecting CPU paint frames */}
          <div className="relative shrink-0 flex items-center justify-center transform-gpu h-4 w-4">
            <Flame
              className={cn(
                "h-4 w-4 text-current stroke-[2.2] fill-current z-10 relative",
                isHot ? "animate-bounce" : "animate-pulse",
              )}
            />
            {isHot && (
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-60 animate-pulse pointer-events-none transform-gpu backface-hidden will-change-transform" />
            )}
          </div>

          <span className="drop-shadow-sm tabular-nums tracking-wide font-black">
            {normalizedStreak} {isHot ? "Super Streak" : "Day Streak"}
          </span>
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5 opacity-40 shrink-0 stroke-[2.2]" />
          <span className="font-bold tracking-wide">Start your streak</span>
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
  const queryClient = useQueryClient();

  const normalizedHours = typeof hoursLearned === "number" && !isNaN(hoursLearned) ? Math.max(0, hoursLearned) : 0;
  const normalizedCourses =
    typeof coursesCompleted === "number" && !isNaN(coursesCompleted) ? Math.max(0, coursesCompleted) : 0;
  const isStreakActive = typeof streak === "number" && streak > 0;

  // Monitor metric track aggregates changes over query synchronization paths
  useEffect(() => {
    if (isStreakActive || normalizedHours > 0 || normalizedCourses > 0) {
      trackEvent("gamified_telemetry_row_compiled", {
        activeStreak: streak,
        hoursAccumulated: normalizedHours,
        graduationsCount: normalizedCourses,
      });

      // Automated Efficiency: Synchronize cache streams instantly across connected page views
      queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
    }
  }, [streak, normalizedHours, normalizedCourses, isStreakActive, queryClient]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 select-none w-full max-w-full transform-gpu whitespace-nowrap",
        className,
      )}
    >
      {/* INGRESS VECTOR A: CONTINUITY STREAK TELEMETRY FRAME */}
      <LearningStreak streak={streak} className="shrink-0" />

      {/* METRIC VECTOR B: COGNITIVE SYNTHESIS TIME ALLOCATION ACCUMULATOR */}
      {normalizedHours > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold uppercase italic tracking-wide shrink-0 shadow-sm leading-none select-text tabular-nums">
          <TrendingUp className="h-3.5 w-3.5 text-blue-500 shrink-0 stroke-[2.2]" />
          <span>{normalizedHours.toLocaleString()}h Synced</span>
        </div>
      )}

      {/* METRIC VECTOR C: GRADUATION VACANCY DISPATCH YIELD LEDGER */}
      {normalizedCourses > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase italic tracking-wide shrink-0 shadow-sm leading-none select-text tabular-nums">
          <Trophy className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.2]" />
          <span>{normalizedCourses.toLocaleString()} Graduated</span>
        </div>
      )}

      {/* PLACEHOLDER INDICATOR D: COLD-START DATA CONTEXT FRAME FALLBACK */}
      {!isStreakActive && normalizedHours === 0 && normalizedCourses === 0 && (
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-muted/20 text-muted-foreground/50 border border-dashed border-border/40 text-[10px] font-bold uppercase tracking-wider shrink-0 leading-none">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 stroke-[2.2] animate-pulse" />
          <span>No activity yet</span>
        </div>
      )}
    </div>
  );
}
