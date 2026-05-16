import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, Circle, Play, Zap, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number;
  is_preview: boolean;
}

interface Progress {
  module_id: string;
  completed_at: string | null;
}

interface ModuleListProps {
  modules: Module[];
  progress: Progress[];
  currentModuleId?: string;
  onModuleSelect: (module: Module) => void;
}

/**
 * GroUp Academy: Curriculum Module Directory List Ledger (ModuleList)
 * An authoritative operational sidebar orchestrating linear navigation routing, item caching, and completion auditing.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ModuleList({ modules = [], progress = [], currentModuleId, onModuleSelect }: ModuleListProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("curriculum_module_registry_mounted", { totalModulesAvailable: modules.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [modules.length]);

  // High-Performance Ingress Optimization: Pre-index completion arrays into an O(1) tracking look-up Set hash
  const completedModuleIdsSet = useMemo(() => {
    const temporarySet = new Set<string>();
    if (!Array.isArray(progress)) return temporarySet;

    progress.forEach((progressRecordItem) => {
      if (progressRecordItem?.module_id && progressRecordItem.completed_at) {
        temporarySet.add(progressRecordItem.module_id);
      }
    });
    return temporarySet;
  }, [progress]);

  const handleModuleSelectionTrigger = async (targetModuleNode: Module) => {
    if (!targetModuleNode || !targetModuleNode.id) return;

    trackEvent("curriculum_registry_item_selected", {
      moduleId: targetModuleNode.id,
      isCurrentlySelected: targetModuleNode.id === currentModuleId,
    });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onModuleSelect(targetModuleNode);
      }
    } catch (err) {
      trackError(err, {
        component: "ModuleList",
        action: "execute_module_selection_callback",
        moduleId: targetModuleNode.id,
      });
      // Safe fallback passthrough sequence execution to maintain course navigation flow
      onModuleSelect(targetModuleNode);
    }
  };

  return (
    <Card className="w-full h-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased flex flex-col transform-gpu overflow-hidden">
      {/* HUD LEVEL 1: OVERVIEW CONTROL TITLE ROW HEADER */}
      <CardHeader className="p-4 select-none border-b border-border/10 bg-muted/20 shrink-0 w-full">
        <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 w-full leading-none">
          <Zap className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Curriculum Ingress Registry</span>
        </CardTitle>
      </CardHeader>

      {/* HUD LEVEL 2: DYNAMIC LISTING MODULE SCROLL AREA PANEL */}
      <CardContent className="p-0 flex-1 overflow-hidden w-full">
        <ScrollArea className="h-[600px] lg:h-full w-full">
          <div className="p-4 space-y-2.5 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight">
            {Array.isArray(modules) &&
              modules.map((moduleItem, index) => {
                if (!moduleItem || !moduleItem.id) return null;

                // Fast O(1) Hash Ingress Validation Match Pass
                const isNodeComplete = completedModuleIdsSet.has(moduleItem.id);
                const isCurrent = moduleItem.id === currentModuleId;

                return (
                  <button
                    key={moduleItem.id}
                    type="button"
                    onClick={() => handleModuleSelectionTrigger(moduleItem)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all duration-300 transform-gpu cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-start gap-3.5 min-w-0 select-none group",
                      isCurrent
                        ? "bg-primary/5 border-primary shadow-sm shadow-primary/5 font-bold scale-[1.01]"
                        : "bg-background/50 border-border/40 hover:border-border/80 hover:bg-background/80 hover:-translate-y-0.5 active:scale-[0.995]",
                    )}
                    aria-label={`Select section course module row #${index + 1}: ${moduleItem.title}. Status index holds ${isNodeComplete ? "Complete verified" : "Pending entry"}`}
                  >
                    {/* NODE STATUS SHIELD BOX ICON VECTOR INDICATOR */}
                    <div className="shrink-0 select-none pt-0.5">
                      {isNodeComplete ? (
                        <div className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/5 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="p-1 rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/10 shrink-0 flex items-center justify-center animate-pulse border-none">
                          <Play className="h-4 w-4 fill-current stroke-[2.2]" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-md bg-muted/60 border border-border/10 text-muted-foreground/40 group-hover:text-primary/50 group-hover:border-primary/20 shrink-0 flex items-center justify-center transition-colors">
                          <Circle className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* ELEMENT B: TYPOGRAPHY DESCRIPTION METADATA BOX LAYOUT */}
                    <div className="flex-1 min-w-0 pt-0.5 text-left space-y-1.5 flex flex-col justify-center leading-none">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold uppercase italic tracking-wide truncate text-ellipsis pr-2 block leading-none select-text transition-colors",
                          isCurrent ? "text-primary font-black" : "text-foreground/90",
                          isNodeComplete && !isCurrent && "text-emerald-600/80 dark:text-emerald-400/80 font-semibold",
                        )}
                      >
                        {moduleItem.title ? moduleItem.title.trim() : "Unresolved Curriculum Track Module Reference"}
                      </span>

                      {/* Chronology duration elements layout marker badge line */}
                      <div className="flex flex-wrap items-center gap-2.5 leading-none select-none font-bold text-[9px] uppercase tracking-wider text-muted-foreground/50 tabular-nums">
                        {moduleItem.duration_minutes ? (
                          <div className="flex items-center gap-1 shrink-0 italic">
                            <Clock className="h-3 w-3 stroke-[2.2]" />
                            <span>{moduleItem.duration_minutes} MIN TRAINING PASS</span>
                          </div>
                        ) : null}

                        {isNodeComplete && (
                          <Badge
                            variant="outline"
                            className="text-[8px] font-black tracking-wide bg-emerald-500/10 border-transparent text-emerald-600 dark:text-emerald-400 px-1.5 h-4.5 rounded leading-none shadow-sm uppercase"
                          >
                            Verified Node
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* VISUAL BOUNCE GLOW VECTOR TARGET FOR THE CURRENT ACTIVE MODULE */}
                    {isCurrent && (
                      <div className="ml-auto shrink-0 flex items-center h-full select-none pl-1 pt-1">
                        <Zap className="h-3.5 w-3.5 text-primary fill-primary/10 animate-bounce stroke-[2.2]" />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
