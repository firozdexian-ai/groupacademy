import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProcessingStage {
  progress: number;
  message: string;
}

interface ProcessingCardProps {
  title: string;
  stages: ProcessingStage[];
  /** Duration in ms to complete all stages (default: 30000) */
  duration?: number;
  /** Show error state with retry */
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ProcessingCard({
  title,
  stages,
  duration = 30000,
  error,
  onRetry,
  className,
}: ProcessingCardProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(stages[0]?.message || "Processing...");

  useEffect(() => {
    if (error) return;

    const sortedStages = [...stages].sort((a, b) => a.progress - b.progress);
    const intervalTime = duration / 100;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        const next = Math.min(prev + 1, 99); // Never hit 100 until actually done

        // Find the appropriate message for current progress
        const currentStage = sortedStages
          .filter((s) => s.progress <= next)
          .pop();
        
        if (currentStage) {
          setCurrentMessage(currentStage.message);
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [stages, duration, error]);

  if (error) {
    return (
      <Card className={cn("max-w-md mx-auto", className)}>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("max-w-md mx-auto", className)}>
      <CardContent className="py-12 text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{currentProgress}%</span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{currentMessage}</p>
        
        <Progress value={currentProgress} className="h-2 mb-4" />
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>AI is working on your results</span>
        </div>
      </CardContent>
    </Card>
  );
}
