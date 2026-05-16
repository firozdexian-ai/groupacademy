import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, Lock, PlayCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description?: string | null;
  display_order?: number | null;
  duration_minutes?: number | null;
}

interface ModuleProgress {
  completedStages: number[];
  isComplete: boolean;
}

interface ImmersiveModuleListProps {
  modules: Module[];
  currentModuleId: string | undefined;
  moduleProgress: Record<string, ModuleProgress>;
  onModuleSelect: (moduleId: string) => void;
}

/**
 * GroUp Academy: Immersive Modular Curriculum Progression Ledger (ImmersiveModuleList)
 * An authoritative operational pipeline executing linear trajectory enforcement, locking validations, and telemetry logs.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ImmersiveModuleList({
  modules = [],
  currentModuleId,
  moduleProgress = {},
  onModuleSelect,
}: ImmersiveModuleListProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("immersive_module_list_mounted", { configuredModulesCount: modules.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [modules.length]);

  // High-Performance State Pre-indexing Pass: Cache lock states recursively to optimize multi-row grid computations
  const lookupCalculatedUnlockedMap = useMemo(() => {
    const calculatedMap = new Record<string, boolean>();
    if (!Array.isArray(modules)) return calculatedMap;

    modules.forEach((moduleItem, index) => {
      if (index === 0) {
        calculatedMap[moduleItem.id] = true;
        return;
      }
      const previousModuleItemNode = modules[index - 1];
      const isPreviousUnitComplete = moduleProgress[previousModuleItemNode.id]?.isComplete || false;
      calculatedMap[moduleItem.id] = isPreviousUnitComplete;
    });

    return calculatedMap;
  }, [modules, moduleProgress]);

  // Compute and sort granular modular completion variables through clean memo tables
  const calculatedProgressPercentageMap = useMemo(() => {
    const percentageMap = new Record<string, number>();
    if (!Array.isArray(modules)) return percentageMap;

    modules.forEach((moduleItem) => {
      const stageTrackerNode = moduleProgress[moduleItem.id];
      if (!stageTrackerNode || !Array.isArray(stageTrackerNode.completedStages)) {
        percentageMap[moduleItem.id] = 0;
        return;
      }
      // Normalized tracking criteria mapped against our 6-stage institutional framework
      percentageMap[moduleItem.id] = Math.max(0, Math.min(100, (stageTrackerNode.completedStages.length / 6) * 100));
    });

    return percentageMap;
  }, [modules, moduleProgress]);

  const handleModuleSelectionTrigger = async (targetModuleIdStr: string) => {
    if (!targetModuleIdStr) return;

    const isTargetUnitUnlocked = lookupCalculatedUnlockedMap[targetModuleIdStr] || false;
    if (!isTargetUnitUnlocked) {
      trackEvent("immersive_module_locked_intercept", { moduleId: targetModuleIdStr });
      return;
    }

    trackEvent("immersive_module_selected", { moduleId: targetModuleIdStr });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onModuleSelect(targetModuleIdStr);
      }
    } catch (err) {
      trackError(err, {
        component: "ImmersiveModuleList",
        action: "execute_module_selection_callback",
        moduleId: targetModuleIdStr,
      });
      // Safe fallback passthrough validation sequence execution
      onModuleSelect(targetModuleIdStr);
    }
  };

  return (
    <Card className="w-full h-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased flex flex-col transform-gpu overflow-hidden">
      {/* HUD LEVEL 1: TITLE BANNER TRACK PANEL CONTROLS */}
      <CardHeader className="p-4 select-none border-b border-border/10 bg-muted/20 shrink-0 w-full">
        <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 w-full leading-none">
          <Zap className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Curriculum Node Registry</span>
        </CardTitle>
      </CardHeader>

      {/* HUD LEVEL 2: IMMERSIVE SCROLL AREA SCROLL LEDGER PANEL */}
      <CardContent className="p-0 flex-1 overflow-hidden w-full">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-2.5 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight">
            {Array.isArray(modules) &&
              modules.map((moduleItem, index) => {
                if (!moduleItem || !moduleItem.id) return null;

                const isUnlocked = lookupCalculatedUnlockedMap[moduleItem.id] || false;
                const isCurrent = moduleItem.id === currentModuleId;
                const progressPercentageValue = calculatedProgressPercentageMap[moduleItem.id] || 0;
                const isComplete = moduleProgress[moduleItem.id]?.isComplete || false;

                const totalStagesLoggedCount = moduleProgress[moduleItem.id]?.completedStages?.length || 0;

                return (
                  <button
                    key={moduleItem.id}
                    type="button"
                    onClick={() => handleModuleSelectionTrigger(moduleItem.id)}
                    disabled={!isUnlocked}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all duration-300 transform-gpu cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring flex flex-col justify-center leading-none min-w-0 select-none",
                      isCurrent
                        ? "bg-primary/5 border-primary shadow-sm shadow-primary/5 font-bold"
                        : "border-transparent",
                      !isCurrent &&
                        isUnlocked &&
                        "bg-muted/30 border-border/10 hover:border-primary/20 hover:bg-background/40 hover:-translate-y-0.5",
                      !isUnlocked && "bg-muted/10 opacity-30 cursor-not-allowed grayscale pointer-events-none",
                    )}
                    aria-label={`Select curriculum track module row #${index + 1}: ${moduleItem.title}. Current completion curve hits ${Math.round(progressPercentageValue)} percent.`}
                  >
                    <div className="flex items-start gap-3.5 w-full min-w-0 leading-none">
                      {/* INDICATOR SHIELD BOUNDS VECTOR ICON GRAPHIC */}
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 transform font-mono font-black text-[10px] select-none leading-none border border-transparent",
                          isComplete && "bg-emerald-500/10 border-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                          isCurrent &&
                            !isComplete &&
                            "bg-primary text-primary-foreground animate-pulse shadow-primary/10 border-none",
                          !isCurrent &&
                            !isComplete &&
                            isUnlocked &&
                            "bg-background border-border/40 text-muted-foreground/80",
                          !isUnlocked && "bg-muted text-muted-foreground/20 shadow-none border-none",
                        )}
                      >
                        {isComplete ? (
                          <ShieldCheck className="h-4.5 w-4.5 stroke-[2.5]" />
                        ) : !isUnlocked ? (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.5]" />
                        ) : isCurrent ? (
                          <PlayCircle className="h-4.5 w-4.5 stroke-[2.2]" />
                        ) : (
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        )}
                      </div>

                      {/* TARGET METADATA TEXT PARAMETER ALIGNMENT STRIP */}
                      <div className="flex-1 min-w-0 pt-0.5 Text-left space-y-1 flex flex-col justify-center leading-none">
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-bold uppercase italic tracking-wide truncate text-ellipsis pr-2 block leading-none select-text",
                            isCurrent ? "text-primary font-black" : "text-foreground/90",
                            !isUnlocked && "text-muted-foreground/40 font-medium",
                          )}
                        >
                          {moduleItem.title ? moduleItem.title.trim() : "Unresolved Curriculum Track Sequence Block"}
                        </span>

                        {isUnlocked && (
                          <div className="mt-2 space-y-1.5 animate-in fade-in duration-300 w-full min-w-0 tabular-nums font-bold text-[9px] text-muted-foreground/60 leading-none uppercase tracking-wider font-mono">
                            <div className="flex items-center justify-between gap-4 w-full leading-none">
                              <span className="text-primary font-black">
                                {Math.round(progressPercentageValue)}% complete
                              </span>
                              <span className="italic pr-0.5">{totalStagesLoggedCount} / 6 stages cleared</span>
                            </div>
                            <Progress
                              value={progressPercentageValue}
                              className="h-1 rounded-full bg-primary/10 border-none shadow-inner w-full block"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
