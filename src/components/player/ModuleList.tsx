import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Circle, Play } from "lucide-react";
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

export function ModuleList({ modules, progress, currentModuleId, onModuleSelect }: ModuleListProps) {
  const isCompleted = (moduleId: string) => {
    return progress.some(p => p.module_id === moduleId && p.completed_at);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Content</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-2">
            {modules.map((module) => {
              const completed = isCompleted(module.id);
              const isCurrent = module.id === currentModuleId;

              return (
                <button
                  key={module.id}
                  onClick={() => onModuleSelect(module)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-colors",
                    isCurrent ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent",
                    "flex items-start gap-3"
                  )}
                >
                  <div className="mt-1">
                    {completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isCurrent ? (
                      <Play className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium",
                      isCurrent && "text-primary"
                    )}>
                      {module.title}
                    </p>
                    {module.duration_minutes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.duration_minutes} min
                      </p>
                    )}
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
