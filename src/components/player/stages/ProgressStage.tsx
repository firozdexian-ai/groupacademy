import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, ArrowRight, Download, Trophy, Target, Clock, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProgressStageProps {
  moduleName: string;
  moduleIndex: number;
  totalModules: number;
  completedStages: number[];
  quizScore?: number;
  quizTotal?: number;
  quizPassed?: boolean;
  onNextModule: () => void;
  onComplete: () => void;
  isCompleted: boolean;
  hasNextModule: boolean;
}

export function ProgressStage({ 
  moduleName,
  moduleIndex,
  totalModules,
  completedStages,
  quizScore,
  quizTotal,
  quizPassed,
  onNextModule,
  onComplete,
  isCompleted,
  hasNextModule
}: ProgressStageProps) {
  // Auto-complete when viewed
  useEffect(() => {
    if (!isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const stagesCompleted = completedStages.length;
  const stageProgress = (stagesCompleted / 6) * 100;

  const stageDetails = [
    { name: "Orientation", stage: 1, icon: Target },
    { name: "Learn", stage: 2, icon: Brain },
    { name: "Discuss", stage: 3, icon: Clock },
    { name: "Practice", stage: 4, icon: Brain },
    { name: "Assess", stage: 5, icon: CheckCircle },
    { name: "Progress", stage: 6, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Stage 6: Progress
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your progress and prepare for the next module
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Module Completion Card */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Module Complete!</h3>
          <p className="text-lg text-muted-foreground mb-4">{moduleName}</p>
          
          {/* Progress Ring */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${stageProgress * 2.51} 251`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{stagesCompleted}/6</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Stages completed in this module
          </p>
        </CardContent>
      </Card>

      {/* Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {stageDetails.map(({ name, stage, icon: Icon }) => {
              const completed = completedStages.includes(stage);
              return (
                <div 
                  key={stage}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    completed ? "bg-green-500/10" : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-4 w-4",
                      completed ? "text-green-600" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm",
                      completed ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {name}
                    </span>
                  </div>
                  {completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Skipped</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Results */}
      {quizScore !== undefined && quizTotal !== undefined && (
        <Card className={cn(
          "border-l-4",
          quizPassed ? "border-l-green-500" : "border-l-orange-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quiz Result</p>
                <p className="text-sm text-muted-foreground">
                  {quizPassed ? "Passed" : "Not passed yet"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {quizScore}/{quizTotal}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((quizScore / quizTotal) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Course Progress</p>
            <p className="text-sm text-muted-foreground">
              Module {moduleIndex + 1} of {totalModules}
            </p>
          </div>
          <Progress value={((moduleIndex + 1) / totalModules) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            toast.info("Notes download coming soon!", {
              description: "We're working on generating downloadable notes for each module."
            });
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Notes
        </Button>
        
        {hasNextModule ? (
          <Button onClick={onNextModule} className="flex-1">
            Next Module
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onNextModule} className="flex-1" variant="default">
            <Trophy className="h-4 w-4 mr-2" />
            Complete Course
          </Button>
        )}
      </div>
    </div>
  );
}
