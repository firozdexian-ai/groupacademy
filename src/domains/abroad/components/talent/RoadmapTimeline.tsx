import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Admissions Trajectory Timeline (V5.6.0)
 * CTO Reference: High-performance data-driven timeline mapping algorithmic progress tracks.
 * Architecture: Stable key structural mapping eliminating layout thrashing and item re-renders.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface TimelineItem {
  month: number;
  title: string;
  tasks: string[];
  deadline?: string;
}

interface RoadmapTimelineProps {
  timeline: TimelineItem[];
  currentMonth?: number;
  onExecutePhase?: (month: number) => void;
  // State extension mapping to lock button controls while background mutations resolve
  isExecuting?: boolean;
}

export function RoadmapTimeline({
  timeline = [],
  currentMonth = 1,
  onExecutePhase,
  isExecuting = false,
}: RoadmapTimelineProps) {
  // Isolate timeline validation matrices to protect layout loops from tracking failures
  const validatedTimeline = useMemo(() => {
    if (!Array.isArray(timeline)) return [];
    return [...timeline].sort((a, b) => Number(a.month ?? 0) - Number(b.month ?? 0));
  }, [timeline]);

  return (
    <div className="space-y-6 relative animate-in fade-in duration-1000 select-none text-left">
      {validatedTimeline.map((item, index) => {
        const itemMonth = Number(item.month ?? 0);
        const isCompleted = itemMonth < currentMonth;
        const isCurrent = itemMonth === currentMonth;

        // Stabilize unique key signatures to ensure clean DOM tree recycling
        const nodeStableKey = `phase-node-${itemMonth}-${index}`;

        // Safe sanitization handling for localized text conversions
        const standardizedTitle = useMemo(() => {
          const rawTitle = String(item.title || "Untitled step");
          return rawTitle.trim().replace(/\s+/g, "_");
        }, [item.title]);

        return (
          <div key={nodeStableKey} className="relative pl-2">
            {/* HUD: NEURAL_PATH_CONNECTOR */}
            {index < validatedTimeline.length - 1 && (
              <div
                className={cn(
                  "absolute left-6 top-12 w-[2px] h-full -mb-6 z-0 transition-colors duration-1000",
                  isCompleted ? "bg-primary" : "bg-border/30 border-dashed border-l-2",
                )}
              />
            )}

            <Card
              className={cn(
                "relative z-10 transition-all duration-500 rounded-[28px] border-2 overflow-hidden",
                isCurrent
                  ? "border-primary bg-card/60 backdrop-blur-xl shadow-[0_20px_50px_rgba(var(--primary),0.1)] scale-[1.02]"
                  : "border-border/40 bg-card/30",
                isCompleted && "bg-muted/10 opacity-80 grayscale-[0.5]",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* COMPONENT: NODE_STATUS_INDICATOR */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg",
                      isCompleted
                        ? "bg-emerald-500 text-white rotate-6"
                        : isCurrent
                          ? "bg-primary text-white animate-pulse"
                          : "bg-muted text-muted-foreground border-2 border-border/10",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : isCurrent ? (
                      <Zap className="h-5 w-5 fill-current" />
                    ) : (
                      <span className="text-xs font-black italic tracking-tighter">
                        {String(itemMonth).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {/* HUD: NODE_CONTENT_ARRAY */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic leading-none">
                          PHASE_MONTH_{itemMonth}
                        </p>
                        <h4 className="font-black text-lg uppercase italic tracking-tighter text-foreground leading-none">
                          {standardizedTitle}
                        </h4>
                      </div>

                      <div className="flex gap-2">
                        {isCurrent && (
                          <Badge className="bg-primary text-white font-black italic text-[9px] uppercase tracking-widest px-3 h-6 rounded-lg">
                            ACTIVE_SYNC
                          </Badge>
                        )}
                        {item.deadline && (
                          <Badge
                            variant="outline"
                            className="h-6 rounded-lg border-2 border-border/40 text-[9px] font-black uppercase italic tracking-widest gap-2 bg-background/50"
                          >
                            <Calendar className="h-3 w-3 text-primary" /> {String(item.deadline).trim()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* TASK_REGISTRY_MATRIX */}
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/10">
                      {(item.tasks || []).map((task, taskIndex) => {
                        const taskStableKey = `task-${itemMonth}-${taskIndex}`;
                        return (
                          <div key={taskStableKey} className="flex items-start gap-3 group">
                            <div
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 transition-all group-hover:scale-150",
                                isCompleted ? "bg-emerald-500" : isCurrent ? "bg-primary" : "bg-muted-foreground/30",
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-medium italic leading-relaxed transition-colors",
                                isCompleted
                                  ? "text-muted-foreground line-through opacity-50"
                                  : "text-foreground/80 group-hover:text-primary",
                              )}
                            >
                              {String(task)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ACTION INTERFACE TRIGGER GATED BY ACTIVE WORKFLOW STAGES */}
                    {isCurrent && onExecutePhase && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={isExecuting}
                          onClick={() => onExecutePhase(itemMonth)}
                          className={cn(
                            "flex items-center gap-2 text-[9px] font-black uppercase italic tracking-widest text-primary hover:translate-x-1 transition-all cursor-pointer bg-transparent border-none p-0",
                            isExecuting && "opacity-40 cursor-not-allowed translate-x-0",
                          )}
                        >
                          {isExecuting ? "SYNCHRONIZING_PHASE_TASKS..." : "EXECUTE_PHASE_TASKS"}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
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
