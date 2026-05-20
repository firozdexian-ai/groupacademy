import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionSelector } from "@/components/assessment/ProfessionSelector";
import { AssessmentStepper } from "@/components/assessment/AssessmentStepper";
import { LeadCaptureForm } from "@/components/assessment/LeadCaptureForm";
import { ProcessingCard } from "@/components/ui/processing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Target, TrendingUp, Sparkles, Zap } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { analyzeCareerAssessment } from "@/domains/talent/api/talentApi";

export type AssessmentStep = "intro" | "profession" | "questions" | "lead-capture" | "processing";

interface ProcessingStage {
  progress: number;
  message: string;
}

const ASSESSMENT_PROCESSING_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Connecting Secure Node..." },
  { progress: 15, message: "Parsing Logic Artifacts..." },
  { progress: 35, message: "AI Evaluation Run In Progress..." },
  { progress: 55, message: "Mapping Competency Gap Vectors..." },
  { progress: 75, message: "Compiling Executive Report Summary..." },
  { progress: 90, message: "Committing Data Ledger Maps..." },
];

const STEP_PROGRESS: Record<AssessmentStep, number> = {
  intro: 5,
  profession: 25,
  questions: 50,
  "lead-capture": 75,
  processing: 95,
};

const ASSESSMENT_COST = 50;

/**
 * GroUp Academy: AI Career Readiness Telemetry Orchestrator (AppCareerAssessment)
 * Hardened responsive wizard interface tracking candidate telemetry, insulating credit transactions, and preventing dangling abort signal memory leaks.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function AppCareerAssessment() {
  const navigateHook = useNavigate();
  const { toast } = useToast();
  const { talent: talentProfileRecord, user: userAuthRecord, addServiceUsed } = useTalent();
  const { canAfford, deductCredits } = useCredits();
  const [urlSearchParamsMap] = useSearchParams();

  const [assessmentStepState, setAssessmentStepState] = React.useState<AssessmentStep>("intro");
  const [candidateEmailState, setCandidateEmailState] = React.useState<string>("");
  const [professionCategoriesArray, setProfessionCategoriesArray] = React.useState<any[]>([]);
  const [selectedCategoryRecord, setSelectedCategoryRecord] = React.useState<any | null>(null);
  const [accumulatedAnswersState, setAccumulatedAnswersState] = React.useState<Record<string, any>>({});
  const [isMutationProcessing, setIsMutationProcessing] = React.useState<boolean>(false);

  const hasFormProcessedRefFlag = React.useRef<boolean>(false);

  // =========================================================================
  // LIFECYCLE SECTOR 1: IDENTITY RECONCILIATION SYNCHRONIZATION
  // =========================================================================
  React.useEffect(() => {
    const verifiedResolutionEmail = talentProfileRecord?.email || userAuthRecord?.email || "";
    if (verifiedResolutionEmail) {
      setCandidateEmailState(verifiedResolutionEmail);
    }
  }, [talentProfileRecord, userAuthRecord]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: PARSE REPOS DIRECTORIES WITH INSULATED ABORT GATES
  // =========================================================================
  React.useEffect(() => {
    const macroAbortControllerInstance = new AbortController();
    const networkSchedulingTimerToken = setTimeout(() => {
      macroAbortControllerInstance.abort();
    }, TIMEOUTS.CATEGORY_LOAD || 10000);

    const loadProfessionCategoriesInventory = async () => {
      try {
        const { data: dbCategoriesPayload, error: queryHandshakeError } = await supabase
          .from("profession_categories")
          .select("id, name, display_order, is_active")
          .eq("is_active", true)
          .order("display_order")
          .abortSignal(macroAbortControllerInstance.signal);

        clearTimeout(networkSchedulingTimerToken);

        if (queryHandshakeError) throw queryHandshakeError;
        if (dbCategoriesPayload) {
          setProfessionCategoriesArray(dbCategoriesPayload);
        }
      } catch (pipelineException: any) {
        clearTimeout(networkSchedulingTimerToken);
        if (pipelineException?.name !== "AbortError") {
          console.error("Diagnostic Failure: Category Grid Load Exception:", pipelineException);
        }
      }
    };

    loadProfessionCategoriesInventory();

    return () => {
      clearTimeout(networkSchedulingTimerToken);
      macroAbortControllerInstance.abort();
    };
  }, []);

  // =========================================================================
  // LIFECYCLE SECTOR 3: MUTATION EXECUTION CONTROL LAYER
  // =========================================================================
  const processCareerAssessmentDiagnosticSequence = React.useCallback(async () => {
    if (!selectedCategoryRecord || hasFormProcessedRefFlag.current) return;

    setIsMutationProcessing(true);
    hasFormProcessedRefFlag.current = true;

    try {
      if (!canAfford("CAREER_ASSESSMENT")) {
        toast({
          title: "Insufficient Wallet Volume",
          description: `This automated cognitive diagnostic requires ${ASSESSMENT_COST.toString()} active system credits.`,
          variant: "destructive",
        });
        setAssessmentStepState("lead-capture");
        hasFormProcessedRefFlag.current = false;
        return;
      }

      const isCreditHandshakeSettled = await deductCredits(
        "CAREER_ASSESSMENT",
        undefined,
        "Career Assessment Diagnostic Evaluation",
      );
      if (!isCreditHandshakeSettled) throw new Error("Credit transaction verification loop timeout.");

      const edgeFunctionResponseData: any = await analyzeCareerAssessment({
        answers: accumulatedAnswersState,
        professionCategoryId: selectedCategoryRecord.id,
        email: candidateEmailState,
        talentId: talentProfileRecord?.id,
      });

      if (talentProfileRecord?.id) {
        await addServiceUsed("CAREER_ASSESSMENT");
      }

      toast({
        title: "Telemetry Finalized",
        description: "Your technical evaluation executive mapping dossier is now online.",
      });

      recordToolRun({
        toolKey: "assessment",
        costCredits: 100,
        payload: { assessment_id: edgeFunctionResponseData?.assessmentId },
      });

      if (edgeFunctionResponseData?.assessmentId) {
        navigateHook(`/assessment-results/${edgeFunctionResponseData.assessmentId}`);
      } else {
        navigateHook("/app/jobs?tab=tools");
      }
    } catch (fatalMutationExceptionPayload: any) {
      toast({
        title: "Sequence Refused",
        description: "The evaluation pipeline rejected your transaction string parameters. Please re-initialize.",
        variant: "destructive",
      });
      setAssessmentStepState("lead-capture");
      hasFormProcessedRefFlag.current = false;
    } finally {
      setIsMutationProcessing(false);
    }
  }, [
    selectedCategoryRecord,
    accumulatedAnswersState,
    candidateEmailState,
    talentProfileRecord?.id,
    canAfford,
    deductCredits,
    addServiceUsed,
    navigateHook,
    toast,
  ]);

  React.useEffect(() => {
    if (assessmentStepState === "processing" && !isMutationProcessing && !hasFormProcessedRefFlag.current) {
      processCareerAssessmentDiagnosticSequence();
    }
  }, [assessmentStepState, isMutationProcessing, processCareerAssessmentDiagnosticSequence]);

  const handleStepRevertAction = React.useCallback(() => {
    setAssessmentStepState((currentStep) => {
      if (currentStep === "intro") {
        navigateHook("/app/services");
        return "intro";
      }
      if (currentStep === "profession") return "intro";
      if (currentStep === "questions") return "profession";
      if (currentStep === "lead-capture") return "questions";
      return currentStep;
    });
  }, [navigateHook]);

  const handleProfessionSelectionComplete = React.useCallback((categoryNode: any) => {
    setSelectedCategoryRecord(categoryNode);
    setAssessmentStepState("questions");
  }, []);

  const handleAssessmentQuestionsComplete = React.useCallback((answersPayload: Record<string, any>) => {
    setAccumulatedAnswersState(answersPayload);
    setAssessmentStepState("lead-capture");
  }, []);

  const handleLeadCaptureComplete = React.useCallback(() => {
    setAssessmentStepState("processing");
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-svh space-y-8 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: TRACKING SEQUENCE HUD BAR HEADER */}
      <header className="space-y-3 block select-none pointer-events-none w-full shrink-0">
        <div className="flex justify-between items-end px-0.5 leading-none w-full block">
          <div className="leading-none space-y-1 block">
            <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Cognitive Diagnostic Run
            </p>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground/60 block truncate max-w-[180px] sm:max-w-xs pt-0.5">
              Phase: {assessmentStepState.replace("-", " ")}
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold text-muted-foreground/40 tabular-nums">
            {STEP_PROGRESS[assessmentStepState].toString()}% Unified Matrix Completion
          </span>
        </div>
        <Progress
          value={STEP_PROGRESS[assessmentStepState]}
          className="h-1.5 rounded-full bg-primary/10 w-full block shadow-none"
        />
      </header>

      {/* HUD LEVEL 2: REVERT TERMINATE PIPELINE CONSOLE BUTTON */}
      {assessmentStepState !== "processing" && (
        <div className="block shrink-0 select-none">
          <Button
            type="button"
            variant="ghost"
            onClick={handleStepRevertAction}
            className="rounded-lg h-9 px-3 text-[10px] font-mono font-black uppercase tracking-wider hover:bg-muted group cursor-pointer border border-border/5"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span>Terminate / Revert Parameters</span>
          </Button>
        </div>
      )}

      {/* HUD LEVEL 3: DYNAMIC TRACK CONTAINER WIZARD VIEWS */}
      <main className="relative block w-full">
        {assessmentStepState === "intro" && (
          <div className="space-y-6 block w-full animate-in fade-in duration-200">
            <div className="text-center space-y-2 select-none pointer-events-none block leading-none max-w-lg mx-auto pb-2">
              <Badge
                variant="outline"
                className="rounded font-mono text-[9px] font-extrabold uppercase tracking-widest px-2.5 h-5 bg-primary/5 text-primary border-primary/20 shrink-0 pointer-events-none leading-none pt-0.5"
              >
                Diagnostic Protocol Gateway 2.0
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none pt-1">
                Career Readiness Evaluation
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block max-w-sm mx-auto">
                AI-powered algorithmic competency telemetry mapping and matching profile matrix architectures.
              </p>
            </div>

            <Card className="rounded-xl border border-dashed border-border/80 bg-card/30 backdrop-blur-md shadow-2xs block overflow-hidden w-full">
              <CardContent className="p-6 sm:p-8 block w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 block w-full select-none pointer-events-none align-top">
                  {[
                    {
                      icon: Target,
                      title: "Precision Mapping",
                      desc: "Role-specific telemetry parameter configurations.",
                    },
                    {
                      icon: Sparkles,
                      title: "AI Inference Logic",
                      desc: "Deep programmatic structural gap vector analysis.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Executive Syllabus",
                      desc: "Target output career roadmap data listings.",
                    },
                  ].map((itemNode, itemIdx) => {
                    const VectorIconComponent = itemNode.icon;

                    return (
                      <div
                        key={`intro-feature-element-${itemIdx}`}
                        className="flex flex-col items-center text-center space-y-2.5 block flex-1"
                      >
                        <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-lg shrink-0 block text-primary shadow-2xs">
                          <VectorIconComponent className="h-5 w-5 stroke-[2.2]" />
                        </div>
                        <div className="space-y-0.5 block leading-none">
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground block">
                            {itemNode.title}
                          </h3>
                          <p className="text-[11px] font-medium text-muted-foreground/60 leading-normal block max-w-[200px] mx-auto">
                            {itemNode.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  onClick={() => setAssessmentStepState("profession")}
                  className="w-full h-11 px-5 rounded-lg font-bold uppercase text-xs tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs transform-gpu active:scale-[0.99] select-none block text-center"
                >
                  <Zap className="h-4 w-4 stroke-[2.5] inline-block align-middle shrink-0" />
                  <span className="inline-block align-middle pt-0.5">Initialize Diagnostic Sequence</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase A: Specialty Category Mapping Selector Rigs */}
        {assessmentStepState === "profession" && (
          <div className="block w-full animate-in fade-in duration-200">
            <ProfessionSelector
              categories={professionCategoriesArray}
              onSelect={handleProfessionSelectionComplete}
              onBack={handleStepRevertAction}
            />
          </div>
        )}

        {/* Phase B: Programmatic Interrogation Flow Step Blocks */}
        {assessmentStepState === "questions" && selectedCategoryRecord && (
          <div className="block w-full animate-in fade-in duration-200">
            <AssessmentStepper
              categoryId={selectedCategoryRecord.id}
              categoryName={selectedCategoryRecord.name}
              onComplete={handleAssessmentQuestionsComplete}
              onBack={handleStepRevertAction}
            />
          </div>
        )}

        {/* Phase C: Operator Capture Credential Ingress Form Blocks */}
        {assessmentStepState === "lead-capture" && selectedCategoryRecord && (
          <div className="block w-full animate-in fade-in duration-200">
            <LeadCaptureForm
              categoryId={selectedCategoryRecord.id}
              categoryName={selectedCategoryRecord.name}
              answers={accumulatedAnswersState}
              email={candidateEmailState}
              onComplete={handleLeadCaptureComplete}
              onBack={handleStepRevertAction}
            />
          </div>
        )}

        {/* Phase D: Processing Async Computation Evaluation Cards */}
        {assessmentStepState === "processing" && (
          <div className="py-12 block w-full animate-in fade-in duration-300">
            <ProcessingCard stages={ASSESSMENT_PROCESSING_STAGES} title="Synchronizing System Profile" />
          </div>
        )}
      </main>
    </div>
  );
}
