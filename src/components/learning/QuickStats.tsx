import { BookOpen, Award, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  coursesCompleted: number;
  hoursLearned: number;
  modulesCompleted: number;
  className?: string;
}

export function QuickStats({
  coursesCompleted,
  hoursLearned,
  modulesCompleted,
  className,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Courses Completed",
      value: coursesCompleted,
      icon: Award,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Hours Learned",
      value: hoursLearned,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Modules Done",
      value: modulesCompleted,
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  // Don't show if no stats
  if (coursesCompleted === 0 && hoursLearned === 0 && modulesCompleted === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold">Your Progress</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-1.5", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <span className="text-xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
