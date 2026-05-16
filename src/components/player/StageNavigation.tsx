import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  PlayCircle,
  BookOpen,
  MessageSquare,
  Brain,
  ClipboardCheck,
  Award,
  Lock,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StageInfo {
  number: number;
  name: string;
  icon: typeof PlayCircle;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

const STAGE_CONFIG = [
  { number: 1, name: "ORIENTATION", icon: PlayCircle },
  { number: 2, name: "LEARN", icon: BookOpen },
  { number: 3, name: "DISCUSS", icon: MessageSquare },
  { number: 4, name: "PRACTICE", icon: Brain },
  { number: 5, name: "ASSESS", icon: ClipboardCheck },
  { number: 6, name: "PROGRESS_SYNC", icon: Award },
];

interface StageNavigationProps {
  currentStage: number;
  completedStages: number[];
  onStageSelect: (stage: number) => void;
  className?: string;
}

/**
 * GroUp Academy: Authoritative Sequential Trajectory Controller (StageNavigation)
 * An adaptive horizontal step orchestration layout enforcing strict linear learning tracks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function StageNavigation({
  currentStage,
  completedStages = [],
  onStageSelect,
  className,
}: StageNavigationProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component mounting bounds cleanly to protect against asynchronous drift
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("stage_navigation_panel_mounted", { currentStage, totalCompleted: completedStages.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [currentStage, completedStages.length]);

  // Compute maximum cleared stage watermark index to enforce robust linear progression
  const maxCompletedStageWatermark = useMemo(() => {
    if (completedStages.length === 0) return 0;
    return Math.max(...completedStages);
  }, [completedStages]);

  // Transform configuration array cleanly using high-performance memo blocks
  const processedStages: StageInfo[] = useMemo(() => {
    return STAGE_CONFIG.map((stageItem) => {
      const isCompleted = completedStages.includes(stageItem.number);
      const isCurrent = stageItem.number === currentStage;

      // A step is unlocked if it is the baseline first stage, if it has already been passed,
      // if it is the immediate successor to the maximum passed stage, or if it matches the current active stage.
      const isLocked =
        stageItem.number > 1 && !isCompleted && !isCurrent && stageItem.number > maxCompletedStageWatermark + 1;

      return {
        ...stageItem,
        isCompleted,
        isLocked,
        isCurrent,
      };
    });
  }, [completedStages, currentStage, maxCompletedStageWatermark]);

  const handleStageSelectionTrigger = async (stageNumberTarget: number, labelName: string) => {
    if (!stageNumberTarget) return;
    trackEvent("stage_navigation_node_selected", { targetNumber: stageNumberTarget, name: labelName });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onStageSelect(stageNumberTarget);
      }
    } catch (err) {
      trackError(err, {
        component: "StageNavigation",
        action: "execute_stage_selection_callback",
        targetStageNum: stageNumberTarget,
      });
      // Safe fallback passthrough sequence execution to maintain course flow
      onStageSelect(stageNumberTarget);
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 p-1 w-full min-w-0 antialiased tracking-tight",
        className,
      )}
    >
      {processedStages.map((stageItem, index) => {
        const IconComponent = stageItem.icon || PlayCircle;
        const isClickable = !stageItem.isLocked && !isSaving;
        const normalizedLabelStr = stageItem.name.replace(/_/g, " ");

        return (
          <div key={stageItem.number} className="flex items-center min-w-0 group/step flex-1 sm:flex-initial">
            <button
              type="button"
              disabled={stageItem.isLocked}
              onClick={() => isClickable && handleStageSelectionTrigger(stageItem.number, stageItem.name)}
              className={cn(
                "relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider w-full sm:w-auto border-2 outline-none select-none transform-gpu focus-visible:ring-1 focus-visible:ring-ring",
                stageItem.isCurrent
                  ? "bg-primary border-primary text-primary-foreground font-black shadow-md scale-102 z-10"
                  : "bg-card/40 border-border/40 backdrop-blur-sm text-foreground/80",
                stageItem.isCompleted &&
                  !stageItem.isCurrent &&
                  "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.02] hover:border-emerald-500/40 shadow-sm",
                stageItem.isLocked &&
                  "opacity-30 grayscale cursor-not-allowed border-transparent bg-muted/10 text-muted-foreground/40",
                !stageItem.isCurrent &&
                  !stageItem.isCompleted &&
                  !stageItem.isLocked &&
                  "hover:border-primary/20 hover:bg-background/80 cursor-pointer active:scale-[0.985]",
              )}
            >
              {/* STAGE_GLOW Atmospheric Vector Layer Shield */}
              {stageItem.isCurrent && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-xl" />
              )}

              <div className="shrink-0 select-none flex items-center justify-center">
                {stageItem.isLocked ? (
                  <Lock className="h-3.5 w-3.5 stroke-[2.2]" />
                ) : stageItem.isCompleted ? (
                  <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                ) : stageItem.isCurrent ? (
                  <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] animate-pulse" />
                ) : (
                  <IconComponent className="h-4 w-4 stroke-[2.2]" />
                )}
              </div>

              <span className="truncate text-ellipsis max-w-full font-extrabold">{normalizedLabelStr}</span>
            </button>

            {/* TRAJECTORY LINK INTER-STAGE LINEAR PIPELINE CONNECTOR */}
            {index < processedStages.length - 1 && (
              <div
                className={cn(
                  "hidden lg:block w-5 h-[1px] ml-3 transition-colors duration-500 shrink-0 select-none pointer-events-none",
                  completedStages.includes(stageItem.number) ? "bg-emerald-500/30" : "bg-border/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
