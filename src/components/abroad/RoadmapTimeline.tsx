import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Calendar } from "lucide-react";

interface TimelineItem {
  month: number;
  title: string;
  tasks: string[];
  deadline?: string;
}

interface RoadmapTimelineProps {
  timeline: TimelineItem[];
  currentMonth?: number;
}

export function RoadmapTimeline({ timeline, currentMonth = 1 }: RoadmapTimelineProps) {
  return (
    <div className="space-y-4">
      {timeline.map((item, index) => {
        const isCompleted = item.month < currentMonth;
        const isCurrent = item.month === currentMonth;

        return (
          <div key={index} className="relative">
            {/* Connector Line */}
            {index < timeline.length - 1 && (
              <div
                className={`absolute left-4 top-10 w-0.5 h-full -mb-4 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}

            <Card
              className={`relative transition-all ${
                isCurrent ? "border-primary shadow-md" : ""
              } ${isCompleted ? "bg-muted/30" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{item.month}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold text-sm">
                        Month {item.month}: {item.title}
                      </h4>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {item.deadline && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.deadline}
                        </Badge>
                      )}
                    </div>

                    <ul className="space-y-1.5">
                      {item.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Circle className="h-1.5 w-1.5 mt-2 flex-shrink-0 fill-current" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
