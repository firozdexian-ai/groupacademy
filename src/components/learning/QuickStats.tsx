import { BookOpen, Award, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  coursesCompleted: number;
  hoursLearned: number;
  modulesCompleted: number;
  className?: string;
}

export function QuickStats({ coursesCompleted, hoursLearned, modulesCompleted, className }: QuickStatsProps) {
  const stats = [
    {
      label: "Courses",
      value: coursesCompleted,
      icon: Award,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Hours",
      value: hoursLearned % 1 === 0 ? hoursLearned : hoursLearned.toFixed(1),
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Modules",
      value: modulesCompleted,
      icon: BookOpen,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  // CTO Fix: Ensure we don't render an empty section header if all stats are zero
  if (!coursesCompleted && !hoursLearned && !modulesCompleted) {
    return null;
  }

  return (
    <section className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700", className)}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Academic Performance
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="group border-border/40 shadow-sm bg-card/50 backdrop-blur-sm rounded-[24px] transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300 shadow-inner",
                    stat.bgColor,
                  )}
                >
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black tracking-tighter block leading-none">{stat.value}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {stat.label}
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
