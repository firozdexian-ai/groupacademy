import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardPlayer, Flashcard } from "../FlashcardPlayer";
import { AIScenarioPlayer, AIScenario } from "../AIScenarioPlayer";
import { CheckCircle, Brain, Layers, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface PracticeStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
}

export function PracticeStage({ 
  resources, 
  onComplete, 
  isCompleted,
  professionLineId 
}: PracticeStageProps) {
  const [flashcardsCompleted, setFlashcardsCompleted] = useState(false);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);

  const flashcardResource = resources.find(r => r.resource_type === "flashcards");
  const scenarioResource = resources.find(r => r.resource_type === "ai_scenario");

  // Parse flashcards from resource_data
  const flashcards: Flashcard[] = flashcardResource?.resource_data 
    ? (flashcardResource.resource_data as { cards?: Flashcard[] }).cards || []
    : [];

  // Parse scenario from resource_data
  const scenario: AIScenario | null = scenarioResource?.resource_data
    ? {
        id: scenarioResource.id,
        ...(scenarioResource.resource_data as Omit<AIScenario, 'id'>)
      }
    : null;

  const hasFlashcards = flashcards.length > 0;
  const hasScenario = !!scenario;

  // Can complete if at least one activity is done, or no activities available
  const canComplete = 
    flashcardsCompleted || 
    scenarioCompleted || 
    (!hasFlashcards && !hasScenario);

  const handleScenarioComplete = (score: number) => {
    if (score >= 5) {
      setScenarioCompleted(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Stage 4: Practice
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reinforce your learning through flashcards and real-world scenarios
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {!hasFlashcards && !hasScenario ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No practice activities available for this module yet.</p>
            <Button onClick={onComplete} className="mt-4">
              Skip to Next Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={hasFlashcards ? "flashcards" : "scenario"} className="space-y-4">
          <TabsList>
            {hasFlashcards && (
              <TabsTrigger value="flashcards" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Flashcards
                {flashcardsCompleted && <CheckCircle className="h-3 w-3 text-green-600" />}
              </TabsTrigger>
            )}
            {hasScenario && (
              <TabsTrigger value="scenario" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Scenario
                {scenarioCompleted && <CheckCircle className="h-3 w-3 text-green-600" />}
              </TabsTrigger>
            )}
          </TabsList>

          {hasFlashcards && (
            <TabsContent value="flashcards">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {flashcardResource?.title || "Key Concepts"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FlashcardPlayer
                    cards={flashcards}
                    title={flashcardResource?.title || "Flashcards"}
                    onComplete={() => setFlashcardsCompleted(true)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasScenario && scenario && (
            <TabsContent value="scenario">
              <AIScenarioPlayer
                scenario={scenario}
                professionLineId={professionLineId}
                onComplete={handleScenarioComplete}
              />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Progress indicators */}
      {(hasFlashcards || hasScenario) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Practice Progress:</strong>
            </p>
            <div className="flex gap-4 text-sm">
              {hasFlashcards && (
                <span className={flashcardsCompleted ? "text-green-600" : "text-muted-foreground"}>
                  {flashcardsCompleted ? "✓" : "○"} Flashcards reviewed
                </span>
              )}
              {hasScenario && (
                <span className={scenarioCompleted ? "text-green-600" : "text-muted-foreground"}>
                  {scenarioCompleted ? "✓" : "○"} Scenario completed (score ≥5)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion */}
      {!isCompleted && (hasFlashcards || hasScenario) && (
        <div className="flex justify-end">
          <Button 
            onClick={onComplete}
            disabled={!canComplete}
          >
            {canComplete ? "Complete & Continue" : "Complete at least one activity"}
          </Button>
        </div>
      )}
    </div>
  );
}
