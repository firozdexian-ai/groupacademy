import { PlayCircle, BookOpen, MessageSquare, Brain, ClipboardCheck, Award, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StageInfo {
  number: number;
  name: string;
  icon: typeof PlayCircle;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

const stageConfig = [
  { number: 1, name: "Orientation", icon: PlayCircle },
  { number: 2, name: "Learn", icon: BookOpen },
  { number: 3, name: "Discuss", icon: MessageSquare },
  { number: 4, name: "Practice", icon: Brain },
  { number: 5, name: "Assess", icon: ClipboardCheck },
  { number: 6, name: "Progress", icon: Award },
];

interface StageNavigationProps {
  currentStage: number;
  completedStages: number[];
  onStageSelect: (stage: number) => void;
  className?: string;
}

export function StageNavigation({ 
  currentStage, 
  completedStages, 
  onStageSelect,
  className 
}: StageNavigationProps) {
  const stages: StageInfo[] = stageConfig.map((stage) => ({
    ...stage,
    isCompleted: completedStages.includes(stage.number),
    isLocked: stage.number > 1 && !completedStages.includes(stage.number - 1) && stage.number !== currentStage,
    isCurrent: stage.number === currentStage,
  }));

  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto pb-2", className)}>
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isClickable = !stage.isLocked;
        
        return (
          <div key={stage.number} className="flex items-center">
            <button
              onClick={() => isClickable && onStageSelect(stage.number)}
              disabled={stage.isLocked}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap",
                stage.isCurrent && "bg-primary text-primary-foreground shadow-md",
                stage.isCompleted && !stage.isCurrent && "bg-green-500/10 text-green-600 dark:text-green-400",
                stage.isLocked && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                !stage.isCurrent && !stage.isCompleted && !stage.isLocked && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {stage.isLocked ? (
                <Lock className="h-4 w-4" />
              ) : stage.isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{stage.name}</span>
              <span className="sm:hidden">{stage.number}</span>
            </button>
            
            {index < stages.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 mx-1",
                completedStages.includes(stage.number) ? "bg-green-500" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
