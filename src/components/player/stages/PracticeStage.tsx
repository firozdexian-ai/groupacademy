import { useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardPlayer, Flashcard } from "../FlashcardPlayer";
import { AIScenarioPlayer, AIScenario } from "../AIScenarioPlayer";
import { ModuleQuizRunner } from "@/domains/learning/components/talent/ModuleQuizRunner";
import { ModuleScenarioRunner } from "@/domains/learning/components/talent/ModuleScenarioRunner";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, Brain, Layers, Target, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface PracticeStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
  moduleId: string;
}

/**
 * GroUp Academy: Cognitive Consolidation Practice Component (PracticeStage)
 * An authoritative operational hub managing active recall flashcards, quizzes, and automated AI simulation runs.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PracticeStage({
  resources = [],
  onComplete,
  isCompleted,
  professionLineId,
  moduleId,
}: PracticeStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [flashcardsCompleted, setFlashcardsCompleted] = useState(false);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("practice_stage_node_mounted", { moduleId, resourceCount: resources.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [moduleId, resources.length]);

  const flashcardResource = useMemo(() => resources.find((r) => r?.resource_type === "flashcards"), [resources]);
  const scenarioResource = useMemo(() => resources.find((r) => r?.resource_type === "ai_scenario"), [resources]);
  const quizResource = useMemo(() => resources.find((r) => r?.resource_type === "quiz"), [resources]);

  // REGISTRY_PROTOCOL: Normalize heterogeneous data formats with fallback assertions
  const normalizeCard = (card: any, index: number): Flashcard | null => {
    if (!card || typeof card !== "object") return null;
    const front = String(
      card.front || card.Front || card.question || card.Question || card.term || card.Term || card.q || card.Q || "",
    ).trim();
    const back = String(
      card.back ||
        card.Back ||
        card.answer ||
        card.Answer ||
        card.definition ||
        card.Definition ||
        card.a ||
        card.A ||
        "",
    ).trim();

    if (!front && !back) return null;
    return {
      id: String(card.id || card.Id || card.ID || `card-${index}`),
      front,
      back,
      hint: card.hint || card.Hint ? String(card.hint || card.Hint).trim() : undefined,
    };
  };

  const flashcards = useMemo((): Flashcard[] => {
    const rawData = flashcardResource?.resource_data;
    if (!rawData) return [];
    try {
      const cardsArray =
        (rawData as any).cards && Array.isArray((rawData as any).cards)
          ? (rawData as any).cards
          : Array.isArray(rawData)
            ? rawData
            : [];
      return cardsArray.map(normalizeCard).filter((c: any): c is Flashcard => c !== null);
    } catch (e) {
      trackError(e, { component: "PracticeStage", action: "normalize_flashcards_payload", moduleId });
      return [];
    }
  }, [flashcardResource, moduleId]);

  const scenario = useMemo((): AIScenario | null => {
    if (!scenarioResource?.resource_data) return null;
    return { id: scenarioResource.id, ...(scenarioResource.resource_data as any) };
  }, [scenarioResource]);

  const hasFlashcards = useMemo(() => flashcards.length > 0, [flashcards]);
  const hasAuthoredScenario = useMemo(() => !!scenario, [scenario]);
  const hasPoolScenario = useMemo(
    () => !!scenarioResource && !hasAuthoredScenario && !!moduleId,
    [scenarioResource, hasAuthoredScenario, moduleId],
  );
  const hasScenarioTab = useMemo(() => hasAuthoredScenario || hasPoolScenario, [hasAuthoredScenario, hasPoolScenario]);
  const hasQuiz = useMemo(() => !!quizResource && !!moduleId, [quizResource, moduleId]);

  const canComplete = useMemo(() => {
    return flashcardsCompleted || scenarioCompleted || quizCompleted || (!hasFlashcards && !hasScenarioTab && !hasQuiz);
  }, [flashcardsCompleted, scenarioCompleted, quizCompleted, hasFlashcards, hasScenarioTab, hasQuiz]);

  const handleScenarioSync = (score: number) => {
    trackEvent("practice_stage_scenario_completed", { score, moduleId });
    if (score >= 5 && isMountedRef.current) {
      setScenarioCompleted(true);
    }
  };

  const handleExecutiveCompletionSubmit = async () => {
    if (!canComplete) return;
    trackEvent("practice_stage_completion_requested", {
      moduleId,
      flashcardsCompleted,
      scenarioCompleted,
      quizCompleted,
    });

    try {
      // Automated Efficiency: Invalidate tracker states immediately across adjacent layout views
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onComplete();
      }
    } catch (err) {
      trackError(err, { component: "PracticeStage", action: "execute_practice_stage_completion_callback", moduleId });
      onComplete(); // Safe fallback passthrough validation
    }
  };

  const initialTabValue = useMemo(() => {
    if (hasFlashcards) return "flashcards";
    if (hasQuiz) return "quiz";
    return "scenario";
  }, [hasFlashcards, hasQuiz]);

  return (
    <div className="space-y-5 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: STAGE HEADER CONTEXT TITLE BLOCK */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Stage 04: Cognitive Consolidation Matrix</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Reinforce core matching vectors and conceptual recall via automated simulation runs and interactive active
            review
          </p>
        </div>
        {isCompleted && (
          <Badge
            variant="outline"
            className="text-[9px] font-extrabold tracking-wider uppercase px-2 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shrink-0 select-none"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
            <span>Node Verified</span>
          </Badge>
        )}
      </div>

      {/* HUD LEVEL 2: COMPONENT CORE ENTRY DATA VALIDATION */}
      {!hasFlashcards && !hasScenarioTab && !hasQuiz ? (
        <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-xl p-6 text-center select-none w-full max-w-full flex flex-col justify-center items-center py-12 animate-in fade-in duration-300">
          <Zap className="h-6 w-6 text-primary/30 mb-3 animate-pulse stroke-[2.2]" />
          <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-wide leading-none">
            Practical Registry Vacant
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic mb-4">
            No validation metrics or flashcard evaluation objects are deployed for this module.
          </p>
          <Button
            type="button"
            onClick={handleExecutiveCompletionSubmit}
            className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <span>Bypass Practice Vector</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        </Card>
      ) : (
        <Tabs
          defaultValue={initialTabValue}
          className="space-y-4 w-full"
          onValueChange={(tab) => trackEvent("practice_stage_tab_changed", { tab })}
        >
          <TabsList className="bg-muted/30 backdrop-blur-sm p-1 h-10 border border-border/40 rounded-xl w-full lg:w-[480px] flex items-center justify-start select-none font-bold text-xs tracking-tight">
            {hasFlashcards && (
              <TabsTrigger
                value="flashcards"
                className="flex-1 rounded-lg font-bold uppercase tracking-wider text-[10px] py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow flex items-center justify-center gap-1.5 cursor-pointer h-full text-muted-foreground transition-all"
              >
                <Layers className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Active Recall</span>
                {flashcardsCompleted && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10 stroke-[2.5] shrink-0 animate-in zoom-in" />
                )}
              </TabsTrigger>
            )}
            {hasQuiz && (
              <TabsTrigger
                value="quiz"
                className="flex-1 rounded-lg font-bold uppercase tracking-wider text-[10px] py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow flex items-center justify-center gap-1.5 cursor-pointer h-full text-muted-foreground transition-all"
              >
                <Brain className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Assessment</span>
                {quizCompleted && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10 stroke-[2.5] shrink-0 animate-in zoom-in" />
                )}
              </TabsTrigger>
            )}
            {hasScenarioTab && (
              <TabsTrigger
                value="scenario"
                className="flex-1 rounded-lg font-bold uppercase tracking-wider text-[10px] py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow flex items-center justify-center gap-1.5 cursor-pointer h-full text-muted-foreground transition-all"
              >
                <Target className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Simulation</span>
                {scenarioCompleted && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10 stroke-[2.5] shrink-0 animate-in zoom-in" />
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB SEGMENT ROW A: ACTIVE RECALL FLASHCARD ENVIRONMENT GRID */}
          {hasFlashcards && (
            <TabsContent
              value="flashcards"
              className="animate-in slide-in-from-bottom-1 duration-200 outline-none w-full"
            >
              <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center">
                <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight flex items-center gap-2 leading-none block truncate">
                    <Layers className="h-3.5 w-3.5 text-primary stroke-[2.2] shrink-0" />
                    <span>{flashcardResource?.title || "Flashcards"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 w-full min-w-0">
                  <FlashcardPlayer
                    cards={flashcards}
                    title={flashcardResource?.title || "Knowledge_Artifacts"}
                    onComplete={() => {
                      if (isMountedRef.current) {
                        trackEvent("practice_stage_flashcards_fully_cleared");
                        setFlashcardsCompleted(true);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TAB SEGMENT ROW B: TARGET QUIZ RUNNER INTERFACE TRACK */}
          {hasQuiz && (
            <TabsContent value="quiz" className="animate-in slide-in-from-bottom-1 duration-200 outline-none w-full">
              <ModuleQuizRunner
                moduleId={moduleId}
                onComplete={(scoreValue) => {
                  if (typeof scoreValue === "number" && scoreValue >= 60 && isMountedRef.current) {
                    trackEvent("practice_stage_quiz_threshold_passed", { score: scoreValue });
                    setQuizCompleted(true);
                  }
                }}
              />
            </TabsContent>
          )}

          {/* TAB SEGMENT ROW C: AUTOMATED AGENT ENVIRONMENT SCENARIO TILES */}
          {hasAuthoredScenario && scenario && (
            <TabsContent
              value="scenario"
              className="animate-in slide-in-from-bottom-1 duration-200 outline-none w-full"
            >
              <AIScenarioPlayer
                scenario={scenario}
                professionLineId={professionLineId}
                onComplete={handleScenarioSync}
              />
            </TabsContent>
          )}
          {hasPoolScenario && (
            <TabsContent
              value="scenario"
              className="animate-in slide-in-from-bottom-1 duration-200 outline-none w-full"
            >
              <ModuleScenarioRunner
                moduleId={moduleId}
                onComplete={() => {
                  if (isMountedRef.current) {
                    setScenarioCompleted(true);
                  }
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* HUD LEVEL 3: PRACTICAL TELEMETRY HINT COMPONENT RIBBON */}
      {(hasFlashcards || hasScenarioTab) && (
        <Card className="border border-primary/10 bg-primary/[0.015] rounded-xl text-left w-full select-none shadow-sm shrink-0">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-bold text-xs tracking-tight">
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wide italic flex-1 pr-2">
              <span className="text-primary font-black">Executive Guidance:</span> Clear at least one practice vector
              track loop cleanly to commit active proof of operational competence into the global system verification
              ledger.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 font-mono text-[9px] uppercase tracking-wider font-extrabold leading-none tabular-nums shrink-0">
              {hasFlashcards && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    flashcardsCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-md border text-[10px] flex items-center justify-center font-mono shrink-0 shadow-sm leading-none",
                      flashcardsCompleted
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold"
                        : "bg-muted border-border/40 text-muted-foreground",
                    )}
                  >
                    {flashcardsCompleted ? "✓" : ""}
                  </div>
                  <span>Recall Vector Checked</span>
                </div>
              )}
              {hasScenarioTab && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    scenarioCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-md border text-[10px] flex items-center justify-center font-mono shrink-0 shadow-sm leading-none",
                      scenarioCompleted
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold"
                        : "bg-muted border-border/40 text-muted-foreground",
                    )}
                  >
                    {scenarioCompleted ? "✓" : ""}
                  </div>
                  <span>Simulation Status Mapped</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 4: ACTION TRANSACTION COMPLETION ROUTE BUTTON CONTAINER */}
      {!isCompleted && (hasFlashcards || hasScenarioTab || hasQuiz) && (
        <div className="flex justify-end pt-3 border-t border-border/10 select-none w-full shrink-0">
          <Button
            onClick={handleExecutiveCompletionSubmit}
            disabled={!canComplete}
            type="button"
            className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.99] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {canComplete ? (
              <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] animate-pulse" />
            ) : (
              <Brain className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>
              {canComplete
                ? "Continue"
                : "Complete the remaining steps to continue"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
