import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, ArrowRight, Download, Trophy, Target, Clock, Brain, Zap, ShieldCheck, AlertCircle } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * GroUp Academy: Curriculum Completion Milestone
 * CTO Reference: Authoritative node for end-of-module synchronization and transition.
 */

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
  hasNextModule,
}: ProgressStageProps) {
  // PROTOCOL: Auto-synchronize state on ingress
  useEffect(() => {
    if (!isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const stagesCompleted = completedStages.length;
  const stageProgress = (stagesCompleted / 6) * 100;

  const stageRegistry = [
    { name: "ORIENTATION", stage: 1, icon: Target },
    { name: "LEARN", stage: 2, icon: Brain },
    { name: "DISCUSS", stage: 3, icon: Clock },
    { name: "PRACTICE", stage: 4, icon: Brain },
    { name: "ASSESS", stage: 5, icon: CheckCircle },
    { name: "PROGRESS_SYNC", stage: 6, icon: Award },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: STAGE_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <Award className="h-6 w-6 text-primary" /> Stage_06: Milestone_Sync
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Audit progression telemetry and transition to next trajectory
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 shadow-lg">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,350px]">
        <div className="space-y-6">
          {/* COMPONENT: MODULE_VICTORY_CARD */}
          <Card className="rounded-[40px] border-4 border-primary bg-card/30 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(var(--primary),0.2)]">
            <CardContent className="p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-primary/10 rounded-full relative">
                  <Trophy className="h-16 w-16 text-primary animate-bounce" />
                  <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Module_Complete!</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic opacity-60">
                  {moduleName}
                </p>
              </div>

              {/* INTERACTIVE_PROGRESS_RING */}
              <div className="flex justify-center relative">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${stageProgress * 3.51} 351`}
                      className="text-primary transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tabular-nums">
                      {stagesCompleted}
                      <span className="text-xs text-muted-foreground">/6</span>
                    </span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Stages</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                Synchronizing artifacts with identity ledger...
              </p>
            </CardContent>
          </Card>

          {/* COMPONENT: QUIZ_TELEMETRY */}
          {quizScore !== undefined && quizTotal !== undefined && (
            <Card
              className={cn(
                "rounded-[28px] border-l-8 transition-all duration-500 bg-card/30",
                quizPassed ? "border-l-emerald-500 shadow-emerald-500/5" : "border-l-orange-500 shadow-orange-500/5",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Quiz_Protocol_Yield
                    </p>
                    <p className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                      {quizPassed ? (
                        <Zap className="h-4 w-4 text-emerald-500 fill-current" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      {quizPassed ? "Authoritative_Pass" : "Readiness_Check_Fault"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black tabular-nums tracking-tighter">
                      {quizScore}
                      <span className="text-sm text-muted-foreground/40 mx-1">/</span>
                      {quizTotal}
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase italic">
                      {Math.round((quizScore / quizTotal) * 100)}% Accuracy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SIDEBAR: STAGE_BREAKDOWN_MATRIX */}
        <div className="space-y-6">
          <Card className="rounded-[32px] border-2 border-border/40 bg-muted/5">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
                Trajectory_Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {stageRegistry.map(({ name, stage, icon: Icon }) => {
                const completed = completedStages.includes(stage);
                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                      completed
                        ? "bg-emerald-500/5 border-emerald-500/10"
                        : "bg-background/40 border-border/10 opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          completed ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{name}</span>
                    </div>
                    {completed ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[8px] font-black opacity-40 uppercase">Pending</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* COMPONENT: AGGREGATE_COURSE_PROGRESS */}
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total_Trajectory_Sync
                </p>
                <p className="text-[10px] font-black text-primary italic">
                  Mod_{moduleIndex + 1}_of_{totalModules}
                </p>
              </div>
              <Progress
                value={((moduleIndex + 1) / totalModules) * 100}
                className="h-2.5 rounded-full bg-primary/10 shadow-inner"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FOOTER: TRANSACTIONAL_ACTION_BAR */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-border/10">
        <Button
          variant="outline"
          className="flex-1 h-14 rounded-2xl border-2 font-black uppercase italic text-xs tracking-widest gap-3 hover:bg-muted/10"
          onClick={() =>
            toast.info("Synchronization_Protocol_Active", {
              description: "Node-specific knowledge artifacts are being prepared for your credential locker.",
            })
          }
        >
          <Download className="h-5 w-5" /> Download_Nodes
        </Button>

        {hasNextModule ? (
          <Button
            onClick={onNextModule}
            className="flex-[2] h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest gap-3 shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all active:scale-95"
          >
            Initialize_Next_Node
            <ArrowRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={onNextModule}
            className="flex-[2] h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest gap-3 shadow-2xl transition-all active:scale-95"
          >
            <Trophy className="h-5 w-5" /> Finalize_Curriculum_Graduation
          </Button>
        )}
      </div>
    </div>
  );
}
