import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
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

export function ImmersiveModuleList({
  modules,
  currentModuleId,
  moduleProgress,
  onModuleSelect,
}: ImmersiveModuleListProps) {
  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevModule = modules[index - 1];
    return moduleProgress[prevModule.id]?.isComplete || false;
  };

  const getModuleStageProgress = (moduleId: string) => {
    const progress = moduleProgress[moduleId];
    if (!progress) return 0;
    return (progress.completedStages.length / 6) * 100;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Modules</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-4 pt-0 space-y-2">
            {modules.map((module, index) => {
              const isUnlocked = isModuleUnlocked(index);
              const isCurrent = module.id === currentModuleId;
              const progress = getModuleStageProgress(module.id);
              const isComplete = moduleProgress[module.id]?.isComplete;

              return (
                <button
                  key={module.id}
                  onClick={() => isUnlocked && onModuleSelect(module.id)}
                  disabled={!isUnlocked}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all",
                    isCurrent && "bg-primary/10 border border-primary",
                    !isCurrent && isUnlocked && "bg-secondary hover:bg-secondary/80",
                    !isUnlocked && "bg-muted opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isComplete && "bg-green-500 text-white",
                      isCurrent && !isComplete && "bg-primary text-primary-foreground",
                      !isCurrent && !isComplete && isUnlocked && "bg-secondary-foreground/10",
                      !isUnlocked && "bg-muted-foreground/20"
                    )}>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : !isUnlocked ? (
                        <Lock className="h-4 w-4" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        !isUnlocked && "text-muted-foreground"
                      )}>
                        {module.title}
                      </p>
                      
                      {isUnlocked && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{Math.round(progress)}% complete</span>
                            <span>{moduleProgress[module.id]?.completedStages.length || 0}/6 stages</span>
                          </div>
                          <Progress value={progress} className="h-1" />
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
