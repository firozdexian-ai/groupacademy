import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Award, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  coursesCompleted: number;
  hoursLearned: number;
  modulesCompleted: number;
  className?: string;
}

/**
 * GroUp Academy: Academic Yield Telemetry Node (QuickStats)
 * CTO Reference: Authoritative node visualizing high-fidelity student performance metrics matrices.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function QuickStats({ coursesCompleted, hoursLearned, modulesCompleted, className }: QuickStatsProps) {
  const queryClient = useQueryClient();

  const normalizedCourses =
    typeof coursesCompleted === "number" && !isNaN(coursesCompleted) ? Math.max(0, coursesCompleted) : 0;
  const normalizedHours = typeof hoursLearned === "number" && !isNaN(hoursLearned) ? Math.max(0, hoursLearned) : 0;
  const normalizedModules =
    typeof modulesCompleted === "number" && !isNaN(modulesCompleted) ? Math.max(0, modulesCompleted) : 0;

  // Monitor psychometric metric performance tracking records via analytical telemetry
  useEffect(() => {
    if (normalizedCourses > 0 || normalizedHours > 0 || normalizedModules > 0) {
      trackEvent("academic_quick_stats_rendered", {
        graduationsCount: normalizedCourses,
        syncedHoursCount: normalizedHours,
        skillNodesCount: normalizedModules,
      });

      // Automated Efficiency: Synchronize state metrics cache rows instantly across dashboard elements
      queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
    }
  }, [normalizedCourses, normalizedHours, normalizedModules, queryClient]);

  // Data Ingress Guard Protocol: Protect timelines from rendering unpopulated slots
  if (normalizedCourses === 0 && normalizedHours === 0 && normalizedModules === 0) {
    return null;
  }

  const formattedHoursValue = normalizedHours % 1 === 0 ? String(normalizedHours) : normalizedHours.toFixed(1);

  const statsCollection = [
    {
      label: "GRADUATIONS",
      value: String(normalizedCourses),
      icon: Award,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/10",
    },
    {
      label: "SYNC_HOURS",
      value: formattedHoursValue,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/10",
    },
    {
      label: "SKILL_NODES",
      value: String(normalizedModules),
      icon: BookOpen,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10 border-violet-500/10",
    },
  ];

  return (
    <section
      className={cn(
        "space-y-4 antialiased text-left select-none sm:select-text max-w-full w-full transform-gpu",
        className,
      )}
    >
      {/* HUD HEADER: PERFORMANCE LEDGER LABEL STRIP */}
      <div className="flex items-center justify-between px-0.5 select-none w-full leading-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 italic leading-none">
            Ecosystem Performance Ledger
          </h2>
        </div>
        <Zap className="h-3 w-3 text-primary/30 stroke-[2.2] shrink-0" />
      </div>

      {/* THREE-COLUMN COMPACT METRICS GRID MESH */}
      <div className="grid grid-cols-3 gap-3 w-full min-w-0 select-none">
        {statsCollection.map((statItem) => {
          const Icon = statItem.icon || Award;

          return (
            <Card
              key={statItem.label}
              className="group relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl transition-all duration-300 transform-gpu shadow-sm hover:border-primary/20 hover:shadow-md min-w-0 w-full text-center flex flex-col justify-center"
            >
              {/* INTERACTIVE BACKDROP GLOW BACKDROP VECTOR */}
              <div
                className={cn(
                  "absolute -top-12 -right-12 w-20 h-20 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none select-none rounded-full",
                  statItem.bgColor,
                )}
              />

              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full min-w-0">
                {/* Micro-Icon Shield Frame Node */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-transform duration-500 group-hover:rotate-3 shrink-0 select-none mb-3",
                    statItem.bgColor,
                  )}
                >
                  <Icon className={cn("h-5 w-5 stroke-[2.2]", statItem.color)} />
                </div>

                {/* Metric Character Taxonomy Containers */}
                <div className="space-y-1 min-w-0 w-full flex flex-col justify-center leading-none">
                  <span className="text-xl sm:text-2xl font-black tracking-tight block leading-none tabular-nums italic text-foreground/90 select-text truncate max-w-full">
                    {statItem.value}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50 block select-none leading-none pt-0.5 truncate max-w-full">
                    {statItem.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
