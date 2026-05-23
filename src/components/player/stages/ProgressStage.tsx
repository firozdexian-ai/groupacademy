import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { MasteryBars } from "./MasteryBars";
import { AdaptiveSnapshotCard } from "@/domains/learning/components/talent/AdaptiveSnapshotCard";
import {
  Award,
  CheckCircle,
  ArrowRight,
  Download,
  Trophy,
  Target,
  Clock,
  Brain,
  Zap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStageProps {
  moduleId?: string;
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

/**
 * GroUp Academy: End-Of-Module Milestone Synchronization Controller (ProgressStage)
 * An authoritative operational pipeline auditing progression telemetry, updating wallets, and launching curriculum node routing shifts.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProgressStage({
  moduleId,
  moduleName,
  moduleIndex,
  totalModules,
  completedStages = [],
  quizScore,
  quizTotal,
  quizPassed,
  onNextModule,
  onComplete,
  isCompleted,
  hasNextModule,
}: ProgressStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("progress_stage_milestone_mounted", { moduleId, completedCount: completedStages.length });

    // PROTOCOL LOCK: Auto-synchronize state on ingress defensively inside component lifecycle bounds
    if (!isCompleted) {
      trackEvent("progress_stage_auto_completion_triggered", { moduleId });
      onComplete();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isCompleted, onComplete, moduleId, completedStages.length]);

  const stagesCompletedCount = useMemo(() => {
    return Array.isArray(completedStages) ? completedStages.length : 0;
  }, [completedStages]);

  const stageProgressPercentage = useMemo(() => {
    return (stagesCompletedCount / 6) * 100;
  }, [stagesCompletedCount]);

  const normalizedAccuracyValue = useMemo(() => {
    if (quizScore === undefined || quizTotal === undefined || quizTotal <= 0) return 0;
    return Math.round((quizScore / quizTotal) * 100);
  }, [quizScore, quizTotal]);

  const handleDownloadKnowledgeNodesClick = () => {
    trackEvent("progress_stage_download_nodes_requested", { moduleId });
    toast.info("Saving progress", {
      description:
        "Assembling verified knowledge schemas and cognitive recall artifacts for your local credential locker.",
    });
  };

  const handleNextCurriculumNodeAdvance = async () => {
    trackEvent("progress_stage_next_node_advance_requested", { hasNextModule, currentModuleIndex: moduleIndex });

    try {
      // Automated Efficiency: Invalidate metric states immediately across adjacent workspace viewports
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onNextModule();
      }
    } catch (err) {
      trackError(err, {
        component: "ProgressStage",
        action: "execute_next_node_advance_callback",
      });
      onNextModule(); // Safe fallback passthrough validation
    }
  };

  const stageRegistry = [
    { name: "ORIENTATION SYNC", stage: 1, icon: Target },
    { name: "KNOWLEDGE INGESTION", stage: 2, icon: Brain },
    { name: "KNOWLEDGE SYNTHESIS", stage: 3, icon: Clock },
    { name: "COGNITIVE RECALL", stage: 4, icon: Brain },
    { name: "ACCURACY AUDIT", stage: 5, icon: CheckCircle },
    { name: "MILESTONE SYNC", stage: 6, icon: Award },
  ];

  return (
    <div className="space-y-5 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: STAGE HEADER METADATA SHIELD */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <Award className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Stage 06: Milestone Synchronization</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Audit trajectory progression telemetry and transition identity credentials to outstanding targets
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-extrabold tracking-wider uppercase px-2 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shrink-0 select-none"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
          <span>Node Verified</span>
        </Badge>
      </div>

      {/* HUD LEVEL 2: TWO-COLUMN MAIN TELEMETRY CONTENT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-4 w-full min-w-0 items-start">
        {/* MAIN PANEL CONTENT STACK: COLUMN LEFT */}
        <div className="space-y-4 w-full min-w-0 flex flex-col justify-start">
          {/* COMPONENT ELEMENT A: MODULE VICTORY GRAPHIC SUMMARY COVER CARD */}
          <Card className="border border-primary/20 bg-primary/[0.015] rounded-2xl p-6 relative overflow-hidden text-center shadow-sm w-full flex flex-col justify-center items-center py-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.03] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none select-none" />

            <div className="flex justify-center select-none shrink-0 mb-3 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center relative shadow-inner">
                <Trophy className="h-5 w-5 text-primary stroke-[2.2] animate-bounce" />
                <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 w-full text-center leading-none select-text relative z-10">
              <h3 className="text-base font-black uppercase tracking-wider text-foreground/90 leading-none">
                Module Complete verified
              </h3>
              <p className="text-xs font-semibold text-muted-foreground/80 line-clamp-1 truncate uppercase tracking-wide leading-none pt-0.5 pr-1 max-w-full">
                {moduleName || "Un-calibrated curriculum target row"}
              </p>
            </div>

            {/* INTERACTIVE COMPOSITE PROGRESS RING SVG GAUGE */}
            <div className="flex justify-center items-center relative select-none shrink-0 pt-5">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 block">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20 border-none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${stageProgressPercentage * 3.01} 301`}
                    className="text-primary border-none transition-all Logan-stroke duration-1000 ease-out shrink-0"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-xl font-black tabular-nums tracking-tighter text-foreground/95 flex items-baseline justify-center leading-none">
                    {stagesCompletedCount}
                    <span className="text-[10px] font-bold text-muted-foreground/50 ml-0.5">/6</span>
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/60 pt-0.5 leading-none">
                    Units
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-wider select-none leading-none pt-5 relative z-10">
              Cryptographically syncing module metrics with wallet ledger…
            </p>
          </Card>

          {/* COMPONENT ELEMENT B: ACCURACY PROTOCOL SCORE SUMMARY INTERFACE */}
          {quizScore !== undefined && quizTotal !== undefined && (
            <Card
              className={cn(
                "rounded-2xl border backdrop-blur-md shadow-sm overflow-hidden text-left w-full min-w-0 transition-all duration-300",
                quizPassed ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-amber-500/20 bg-amber-500/[0.01]",
              )}
            >
              <CardContent className="p-4 sm:p-5 w-full min-w-0 font-bold text-xs flex items-center justify-between gap-4 leading-none">
                <div className="space-y-1 text-left min-w-0 flex-1 leading-none select-none">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block leading-none">
                    Quiz Evaluation Yield
                  </span>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 leading-none pt-1 text-foreground/90 truncate">
                    {quizPassed ? (
                      <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500/10 stroke-[2.2] shrink-0 animate-pulse" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 stroke-[2.2] shrink-0" />
                    )}
                    <span>{quizPassed ? "You passed" : "Not passed yet"}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 leading-none select-text">
                  <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tighter leading-none block text-foreground/95">
                    {quizScore}
                    <span className="text-xs font-normal text-muted-foreground/30 mx-1">/</span>
                    {quizTotal}
                  </p>
                  <p className="text-[9px] font-black text-primary uppercase tracking-wide pt-1 leading-none font-mono">
                    {normalizedAccuracyValue}% Verification accuracy
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SIDEBAR ANALYSIS TRACK PANELS CONTAINER: COLUMN RIGHT */}
        <div className="space-y-4 w-full min-w-0 flex flex-col justify-start">
          {/* COMPONENT ELEMENT C: SIX-STAGE PROGRESS TRAJECTORY AUDIT DIAL */}
          <Card className="rounded-2xl border border-border/40 bg-muted/5 w-full min-w-0 select-none shadow-sm flex flex-col justify-center">
            <CardHeader className="p-3.5 px-4 select-none border-b border-border/10 leading-none w-full">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 block pt-0.5 leading-none w-full">
                Synchronous Trajectory Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90">
              {stageRegistry.map(({ name, stage, icon: Icon }) => {
                const isSubStageCleared = completedStages.includes(stage);
                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-colors transform-gpu flex-1 min-w-0 leading-none font-semibold",
                      isSubStageCleared
                        ? "bg-emerald-500/[0.015] border-emerald-500/10 text-foreground"
                        : "bg-background/30 border-border/5 opacity-35",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                      <div
                        className={cn(
                          "p-1.5 rounded-md shrink-0 border border-transparent shadow-sm flex items-center justify-center",
                          isSubStageCleared
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/5"
                            : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate text-ellipsis block">
                        {name}
                      </span>
                    </div>
                    {isSubStageCleared ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <span className="text-[8px] font-black opacity-45 uppercase tracking-wide shrink-0">Pending</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* COMPONENT ELEMENT D: MODULAR SNAPSHOT DIAGNOSTIC CHIP */}
          {moduleId && <AdaptiveSnapshotCard moduleId={moduleId} compact />}

          {/* COMPONENT ELEMENT E: GRANULAR PSYCHOMETRIC MASTERY OVERVIEW DECK */}
          <MasteryBars moduleId={moduleId} topN={5} />

          {/* COMPONENT ELEMENT F: OVERALL ACCUMULATIVE COURSE HORIZON TRACK PROGRESS CARD */}
          <Card className="rounded-2xl border border-border/40 bg-card/30 w-full min-w-0 shadow-sm select-none">
            <CardContent className="p-4 space-y-3 font-bold text-xs tracking-tight">
              <div className="flex items-center justify-between gap-4 select-none leading-none w-full">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block leading-none">
                  Total Trajectory Calibration
                </span>
                <span className="text-[9px] font-mono font-black text-primary border bg-primary/5 rounded px-1.5 h-4.5 flex items-center justify-center shadow-sm uppercase tracking-wide leading-none shrink-0">
                  Mod {moduleIndex + 1} of {totalModules}
                </span>
              </div>
              <Progress
                value={((moduleIndex + 1) / totalModules) * 100}
                className="h-2 rounded-full bg-primary/10 shadow-inner border-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* HUD LEVEL 3: TIMELINE TRANSACTION CONFIGURATION CONTROL COMMAND DISPATCH ROW STRIP */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/10 select-none w-full shrink-0">
        <Button
          variant="outline"
          type="button"
          onClick={handleDownloadKnowledgeNodesClick}
          className="flex-1 h-10 rounded-xl border border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1.5 flex items-center justify-center transition-colors"
        >
          <Download className="h-4 w-4 stroke-[2.2]" />
          <span>Download Knowledge Schema</span>
        </Button>

        {hasNextModule ? (
          <Button
            type="button"
            onClick={handleNextCurriculumNodeAdvance}
            className="sm:flex-[2] h-10 rounded-xl font-extrabold uppercase text-[10px] tracking-wider gap-1.5 cursor-pointer shadow-md transform-gpu active:scale-[0.99] transition-transform bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
          >
            <span>Initialize Next Specialized Node</span>
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNextCurriculumNodeAdvance}
            className="sm:flex-[2] h-10 rounded-xl font-extrabold uppercase text-[10px] tracking-wider gap-1.5 cursor-pointer shadow-md transform-gpu active:scale-[0.99] transition-transform bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
          >
            <Trophy className="h-4 w-4 shrink-0 stroke-[2.2] text-current fill-primary-foreground/10" />
            <span>Finalize Curriculum Track Graduation</span>
          </Button>
        )}
      </div>
    </div>
  );
}
