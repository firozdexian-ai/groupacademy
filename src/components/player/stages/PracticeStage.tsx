import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardPlayer, Flashcard } from "../FlashcardPlayer";
import { AIScenarioPlayer, AIScenario } from "../AIScenarioPlayer";
import { CheckCircle, Brain, Layers, Target, Zap, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { ModuleQuizRunner } from "@/components/learning/ModuleQuizRunner";
import { ModuleScenarioRunner } from "@/components/learning/ModuleScenarioRunner";

/**
 * GroUp Academy: Cognitive Consolidation Node (PracticeStage)
 * CTO Reference: Authoritative gateway for active recall and real-world simulation.
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface PracticeStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
  moduleId: string;
}

export function PracticeStage({ resources, onComplete, isCompleted, professionLineId, moduleId }: PracticeStageProps) {
  const [flashcardsCompleted, setFlashcardsCompleted] = useState(false);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const flashcardResource = resources.find((r) => r.resource_type === "flashcards");
  const scenarioResource = resources.find((r) => r.resource_type === "ai_scenario");
  const quizResource = resources.find((r) => r.resource_type === "quiz");

  // REGISTRY_PROTOCOL: Normalize heterogeneous data formats
  const normalizeFlashcards = (resourceData: unknown): Flashcard[] => {
    if (!resourceData) return [];
    try {
      const data = resourceData as any;
      const cardsArray = data.cards && Array.isArray(data.cards) ? data.cards : Array.isArray(data) ? data : [];
      return cardsArray.map(normalizeCard).filter((c: any): c is Flashcard => c !== null);
    } catch (e) {
      console.error("[Registry Sync Fault]: Flashcard ingestion error", e);
      return [];
    }
  };

  const normalizeCard = (card: any, index: number): Flashcard | null => {
    if (!card || typeof card !== "object") return null;
    const front = String(
      card.front || card.Front || card.question || card.Question || card.term || card.Term || card.q || card.Q || "",
    );
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
    );
    if (!front && !back) return null;
    return {
      id: String(card.id || card.Id || card.ID || `card-${index}`),
      front,
      back,
      hint: card.hint || card.Hint ? String(card.hint || card.Hint) : undefined,
    };
  };

  const flashcards = normalizeFlashcards(flashcardResource?.resource_data);
  const scenario: AIScenario | null = scenarioResource?.resource_data
    ? { id: scenarioResource.id, ...(scenarioResource.resource_data as any) }
    : null;

  const hasFlashcards = flashcards.length > 0;
  const hasAuthoredScenario = !!scenario;
  const hasPoolScenario = !!scenarioResource && !hasAuthoredScenario && !!moduleId;
  const hasScenarioTab = hasAuthoredScenario || hasPoolScenario;
  const hasQuiz = !!quizResource && !!moduleId;

  const canComplete =
    flashcardsCompleted || scenarioCompleted || quizCompleted ||
    (!hasFlashcards && !hasScenarioTab && !hasQuiz);

  const handleScenarioSync = (score: number) => {
    if (score >= 5) setScenarioCompleted(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: STAGE_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <Brain className="h-6 w-6 text-primary" /> Stage_04: Cognitive_Recall
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Reinforce match-vectors via active recall and simulation
          </p>
        </div>
        {isCompleted && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 shadow-lg">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
          </div>
        )}
      </div>

      {!hasFlashcards && !hasScenarioTab && !hasQuiz ? (
        <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[40px] p-24 text-center">
          <div className="flex flex-col items-center gap-6">
            <Zap className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Registry_Empty: Practical_Artifacts_Pending
            </p>
            <Button
              onClick={onComplete}
              className="h-12 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-2xl"
            >
              Sync_Next_Stage
            </Button>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue={hasFlashcards ? "flashcards" : hasQuiz ? "quiz" : "scenario"} className="space-y-6">
          <TabsList className="bg-muted/20 backdrop-blur-md p-1.5 rounded-[22px] border-2 border-border/40 w-full lg:w-[520px]">
            {hasFlashcards && (
              <TabsTrigger value="flashcards" className="rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> RECALL
                {flashcardsCompleted && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </TabsTrigger>
            )}
            {hasQuiz && (
              <TabsTrigger value="quiz" className="rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2">
                <Brain className="h-3.5 w-3.5" /> QUIZ
                {quizCompleted && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </TabsTrigger>
            )}
            {hasScenarioTab && (
              <TabsTrigger value="scenario" className="rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2">
                <Target className="h-3.5 w-3.5" /> SIMULATE
                {scenarioCompleted && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </TabsTrigger>
            )}
          </TabsList>

          {hasFlashcards && (
            <TabsContent value="flashcards" className="animate-in slide-in-from-bottom-2 duration-500">
              <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
                <CardHeader className="p-6 border-b border-border/10">
                  <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" /></div>
                    {flashcardResource?.title || "Node_Knowledge_Recall"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-10">
                  <FlashcardPlayer cards={flashcards} title={flashcardResource?.title || "Knowledge_Artifacts"} onComplete={() => setFlashcardsCompleted(true)} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasQuiz && (
            <TabsContent value="quiz" className="animate-in slide-in-from-bottom-2 duration-500">
              <ModuleQuizRunner moduleId={moduleId} onComplete={(score) => { if (score >= 60) setQuizCompleted(true); }} />
            </TabsContent>
          )}

          {hasAuthoredScenario && scenario && (
            <TabsContent value="scenario" className="animate-in slide-in-from-bottom-2 duration-500">
              <AIScenarioPlayer scenario={scenario} professionLineId={professionLineId} onComplete={handleScenarioSync} />
            </TabsContent>
          )}
          {hasPoolScenario && (
            <TabsContent value="scenario" className="animate-in slide-in-from-bottom-2 duration-500">
              <ModuleScenarioRunner moduleId={moduleId} onComplete={() => setScenarioCompleted(true)} />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* FOOTER: TELEMETRY_SUMMARY */}
      {(hasFlashcards || hasScenarioTab) && (
        <Card className="rounded-[24px] border-2 border-primary/20 bg-primary/5 shadow-inner">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic leading-relaxed">
                <span className="text-primary">Executive_Guidance:</span> Complete at least one node trajectory to
                verify practical competence for the global recruitment ledger.
              </p>
              <div className="flex gap-4 shrink-0">
                {hasFlashcards && (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[9px] font-black uppercase italic tracking-tighter transition-colors",
                      flashcardsCompleted ? "text-emerald-500" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        flashcardsCompleted ? "border-emerald-500 bg-emerald-500/10" : "border-border/40",
                      )}
                    >
                      {flashcardsCompleted && "✓"}
                    </div>{" "}
                    RECALL_SYNC
                  </div>
                )}
                {hasScenarioTab && (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[9px] font-black uppercase italic tracking-tighter transition-colors",
                      scenarioCompleted ? "text-emerald-500" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        scenarioCompleted ? "border-emerald-500 bg-emerald-500/10" : "border-border/40",
                      )}
                    >
                      {scenarioCompleted && "✓"}
                    </div>{" "}
                    SIM_SUCCESS
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER: ACTION_INGRESS */}
      {!isCompleted && (hasFlashcards || hasScenarioTab) && (
        <div className="flex justify-end pt-4 border-t-2 border-border/10">
          <Button
            onClick={onComplete}
            disabled={!canComplete}
            className="h-14 px-10 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-2xl active:scale-95 transition-all gap-3"
          >
            {canComplete ? <Zap className="h-5 w-5 fill-current" /> : <Brain className="h-5 w-5" />}
            {canComplete ? "AUTHORIZE_NEXT_STAGE" : "SYNC_REQUIRED: COMPLETE_ACTIVE_NODE"}
          </Button>
        </div>
      )}
    </div>
  );
}
