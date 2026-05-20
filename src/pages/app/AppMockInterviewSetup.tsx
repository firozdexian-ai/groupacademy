import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, BriefcaseIcon, Settings, Loader2, Coins, Trash2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";
import { generateInterviewQuestions } from "@/domains/jobs/api/jobsApi";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type SetupStep = "job-description" | "configuration" | "generating";

interface InterviewConfig {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  professionCategoryId: string | null;
  additionalNotes: string;
  useProfileContext: boolean;
}

interface CandidateProfileSpec {
  skills: string[];
  experience: string[];
  education: string[];
  cvSummary: string | null;
}

interface SkillItem {
  name?: string;
  skill?: string;
}

interface ExperienceItem {
  position: string;
  company: string;
}

interface EducationItem {
  degree: string;
  institution: string;
}

const MOCK_INTERVIEW_COST = 50;
const DRAFT_STORAGE_KEY = "mock_interview_draft";

/**
 * GroUp Academy: AI Mock Interview Pre-Flight Orchestrator (AppMockInterviewSetup)
 * Hardened setup cockpit mapping candidate telemetry profile contexts and protecting credit transactions from generation drops.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function AppMockInterviewSetup() {
  const navigateHook = useNavigate();
  const { talent: talentProfileNode, user: userAuthNode, addServiceUsed } = useTalent();
  const { deductCredits, canAfford, addCredits } = useCredits();

  const [wizardStepState, setWizardStepState] = React.useState<SetupStep>("job-description");
  const [candidateEmailState, setCandidateEmailState] = React.useState<string>("");
  const [professionCategoriesArray, setProfessionCategoriesArray] = React.useState<ProfessionCategory[]>([]);
  const [isAIInferenceProcessing, setIsAIInferenceProcessing] = React.useState<boolean>(false);
  const [generationExceptionError, setGenerationExceptionError] = React.useState<Error | null>(null);

  // Safe lazy initializer loops for local draft states
  const [jobDescriptionInputStr, setJobDescriptionInputStr] = React.useState<string>(() => {
    try {
      const cachedDraftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      return cachedDraftStr ? JSON.parse(cachedDraftStr).jobDescription : "";
    } catch {
      return "";
    }
  });

  const [interviewConfigState, setInterviewConfigState] = React.useState<InterviewConfig>(() => {
    try {
      const cachedDraftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      return cachedDraftStr
        ? JSON.parse(cachedDraftStr).config
        : {
            questionCount: 5,
            difficulty: "medium",
            professionCategoryId: null,
            additionalNotes: "",
            useProfileContext: true,
          };
    } catch {
      return {
        questionCount: 5,
        difficulty: "medium",
        professionCategoryId: null,
        additionalNotes: "",
        useProfileContext: true,
      };
    }
  });

  // Save changes to localStorage on input updates
  React.useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ jobDescription: jobDescriptionInputStr, config: interviewConfigState }),
      );
    } catch (suppressedStorageException) {
      // Shield interaction loops from storage full failures
    }
  }, [jobDescriptionInputStr, interviewConfigState]);

  React.useEffect(() => {
    const activeEmailStr = talentProfileNode?.email || userAuthNode?.email || "";
    if (activeEmailStr) {
      setCandidateEmailState(activeEmailStr);
    }
  }, [talentProfileNode, userAuthNode]);

  React.useEffect(() => {
    if (talentProfileNode?.professionCategoryId && !interviewConfigState.professionCategoryId) {
      setInterviewConfigState((prev) => ({
        ...prev,
        professionCategoryId: talentProfileNode.professionCategoryId || null,
      }));
    }
  }, [talentProfileNode?.professionCategoryId, interviewConfigState.professionCategoryId]);

  // =========================================================================
  // LIFECYCLE SECTOR 1: REPOS DIRECTORIES LOAD WITH CLEANUP HOOKS
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
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order")
          .abortSignal(macroAbortControllerInstance.signal);

        clearTimeout(networkSchedulingTimerToken);

        if (queryHandshakeError) throw queryHandshakeError;
        if (dbCategoriesPayload) {
          setProfessionCategoriesArray(dbCategoriesPayload as unknown as ProfessionCategory[]);
        }
      } catch (pipelineException: any) {
        clearTimeout(networkSchedulingTimerToken);
        if (pipelineException?.name !== "AbortError") {
          console.error("Diagnostic Failure: Categories Load Exception:", pipelineException);
        }
      }
    };

    loadProfessionCategoriesInventory();

    return () => {
      clearTimeout(networkSchedulingTimerToken);
      macroAbortControllerInstance.abort();
    };
  }, []);

  const { message: progressiveLoadingMessageStr } = useProgressiveLoadingMessage(isAIInferenceProcessing);

  const handleTransactionRefundSequence = React.useCallback(async () => {
    if (!talentProfileNode?.id) return;
    try {
      await addCredits(MOCK_INTERVIEW_COST, "refund", "Refund: automated interview model generation timeline failure");
      toast.info("Wallet allocations successfully refunded onto your balance.");
    } catch (suppressedRefundException) {
      console.error("Critical Refund Pipeline Blockage Exception:", suppressedRefundException);
    }
  }, [talentProfileNode?.id, addCredits]);

  // =========================================================================
  // ACTION HOOKS: AI INFERENCE QUESTIONS CONVERSION PIPELINES
  // =========================================================================
  const handleStartInterviewSequence = async () => {
    if (!canAfford("MOCK_INTERVIEW")) {
      toast.error(
        `Transaction denied. Insufficient balance volume. Required: ${MOCK_INTERVIEW_COST.toString()} Credits.`,
      );
      return;
    }

    setIsAIInferenceProcessing(true);
    setGenerationExceptionError(null);
    setWizardStepState("generating");

    const aiInferenceTimeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("The AI generation inference queue timed out. Please try again.")),
        TIMEOUTS.AI_GENERATION || 45000,
      );
    });

    try {
      const isCreditHandshakeSettled = await deductCredits(
        "MOCK_INTERVIEW",
        undefined,
        "AI practice mock interview protocol generation run",
      );
      if (!isCreditHandshakeSettled) throw new Error("Credit mapping handshaking failure.");

      let calculatedCandidateProfile: CandidateProfileSpec | null = null;
      if (interviewConfigState.useProfileContext && talentProfileNode) {
        calculatedCandidateProfile = {
          skills: Array.isArray(talentProfileNode.skills)
            ? talentProfileNode.skills.map((skillItem: unknown) => {
                if (typeof skillItem === "string") return skillItem;
                const typedSkill = skillItem as SkillItem;
                return typedSkill?.name || typedSkill?.skill || String(skillItem);
              })
            : [],
          experience: Array.isArray(talentProfileNode.experience)
            ? talentProfileNode.experience
                .map((expItem: unknown) => {
                  const typedExp = expItem as ExperienceItem;
                  return `${typedExp.position} at ${typedExp.company}`;
                })
                .filter(Boolean)
            : [],
          education: Array.isArray(talentProfileNode.education)
            ? talentProfileNode.education
                .map((eduItem: unknown) => {
                  const typedEdu = eduItem as EducationItem;
                  return `${typedEdu.degree} from ${typedEdu.institution}`;
                })
                .filter(Boolean)
            : [],
          cvSummary: talentProfileNode.cvText?.substring(0, 1000) || null,
        };
      }

      // Race the Edge function payload against our hard timeout limit to prevent UI freezes
      const edgeFunctionInvokeResponse = await Promise.race([
        generateInterviewQuestions({
          jobDescription: jobDescriptionInputStr.trim(),
          questionCount: interviewConfigState.questionCount,
          difficulty: interviewConfigState.difficulty,
          professionCategoryId: interviewConfigState.professionCategoryId,
          additionalNotes: interviewConfigState.additionalNotes,
          candidateProfile: calculatedCandidateProfile as unknown as Record<string, unknown>,
        }).then((data) => ({ data, error: null })).catch((error) => ({ data: null, error })),
        aiInferenceTimeoutPromise,
      ]);

      const functionResponseData = edgeFunctionInvokeResponse as { data: any; error: any };
      if (functionResponseData.error)
        throw new Error(functionResponseData.error.message || "Generation core exception.");

      const generatedPayloadNode = functionResponseData.data;
      const targetInterviewIdUUID = crypto.randomUUID();

      const { error: databaseInsertError } = await supabase.from("mock_interviews").insert({
        id: targetInterviewIdUUID,
        email: candidateEmailState.toLowerCase().trim(),
        full_name: talentProfileNode?.fullName || "",
        job_description: jobDescriptionInputStr.trim(),
        job_title: generatedPayloadNode.jobTitle,
        company_name: generatedPayloadNode.companyName,
        question_count: interviewConfigState.questionCount,
        difficulty: interviewConfigState.difficulty,
        profession_category_id: interviewConfigState.professionCategoryId,
        additional_notes: interviewConfigState.additionalNotes,
        questions: generatedPayloadNode.questions,
        status: "in_progress",
        user_id: userAuthNode?.id || null,
        talent_id: talentProfileNode?.id || null,
      });

      if (databaseInsertError) throw new Error("Could not map interview node to remote transaction data rows.");
      if (talentProfileNode?.id) await addServiceUsed("MOCK_INTERVIEW");

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (suppressedStorageClearException) {
        // Safe secondary sweep path
      }

      toast.success("Interview initialized successfully.");
      recordToolRun({
        toolKey: "interview",
        costCredits: 100,
        payload: { interview_id: targetInterviewIdUUID, job_title: generatedPayloadNode.jobTitle },
      });
      navigateHook(`/mock-interview/questions/${targetInterviewIdUUID}`);
    } catch (fatalMutationException: any) {
      await handleTransactionRefundSequence();
      setGenerationExceptionError(
        fatalMutationException instanceof Error ? fatalMutationException : new Error(String(fatalMutationException)),
      );
      setWizardStepState("configuration");
      setIsAIInferenceProcessing(false);
    }
  };

  const handleStepRevertAction = React.useCallback(() => {
    setWizardStepState("job-description");
  }, []);

  const handleClearDescriptionFieldAction = React.useCallback(() => {
    setJobDescriptionInputStr("");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (suppressedStorageClearException) {
      // Safe secondary sweep path
    }
  }, []);

  const handleReturnToServicesDirectory = React.useCallback(() => {
    navigateHook("/app/services");
  }, [navigateHook]);

  return (
    <div className={cn(PAGE_SHELL, "text-left antialiased block transform-gpu w-full space-y-4")}>
      {/* HUD LEVEL 1: APPLICATION SHELL DIRECTORY INGRESS CONTROLLER BAR */}
      <header className="flex items-center gap-3.5 leading-none w-full shrink-0 select-none pb-2 border-b border-border/10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg cursor-pointer shrink-0 border border-border/5 bg-background"
          onClick={handleReturnToServicesDirectory}
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
        </Button>
        <div className="leading-none space-y-0.5">
          <h1
            className={cn(
              PAGE_TITLE,
              "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5",
            )}
          >
            AI Simulation Mock Interview
          </h1>
          <p
            className={cn(
              META_TEXT,
              "text-[11px] sm:text-xs font-semibold text-muted-foreground/60 block leading-none",
            )}
          >
            Deploy tailored interactive behavioral and technical role interrogations dynamically.
          </p>
        </div>
      </header>

      <ProfileCompletionPrompt
        variant="banner"
        className="rounded-xl border border-dashed border-primary/20 bg-card/10 block w-full shadow-none"
      />

      {/* HUD LEVEL 2: COMPOSITE JOB DESCRIPTIONS STEP OVERVIEW PANEL */}
      {wizardStepState === "job-description" && (
        <Card
          className={cn(CARD, "rounded-lg border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden")}
        >
          <CardContent className="p-4 space-y-4 block w-full leading-none">
            <div className="space-y-1 block leading-none select-none pointer-events-none">
              <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase tracking-wide text-primary leading-none">
                <BriefcaseIcon className="h-4 w-4 stroke-[2.2] text-primary" />
                <span className="pt-0.5">Target Placement Profile Description</span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground/50 leading-normal block">
                Provide or paste the explicit text criteria constraints of the target role you intend to target.
              </p>
            </div>

            <div className="space-y-2 block w-full leading-none">
              <div className="flex justify-between items-center select-none leading-none w-full shrink-0">
                <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none pt-0.5">
                  Role Parameters Configuration Matrix
                </Label>
                {jobDescriptionInputStr.trim().length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDescriptionFieldAction}
                    className="h-6 px-2 rounded font-mono text-[9px] font-black uppercase text-muted-foreground/60 hover:text-destructive cursor-pointer leading-none"
                  >
                    <Trash2 className="w-3 h-3 stroke-[2.2] inline mr-1" /> <span>Purge Draft</span>
                  </Button>
                )}
              </div>

              <Textarea
                placeholder="Paste corporate requirements outline description specifications directly here..."
                value={jobDescriptionInputStr}
                onChange={(e) => setJobDescriptionInputStr(e.target.value)}
                className="min-h-[180px] font-sans text-xs sm:text-sm font-medium leading-relaxed bg-background/50 border border-border/60 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none p-3"
              />

              <div className="flex justify-between font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none leading-none pt-0.5 tabular-nums w-full shrink-0">
                <span className="flex items-center gap-1">
                  <Save className="w-3 h-3 text-muted-foreground/50 stroke-[2.2]" /> <span>Draft Buffered</span>
                </span>
                <span className={cn(jobDescriptionInputStr.trim().length < 50 && "text-amber-600 font-extrabold")}>
                  {jobDescriptionInputStr.trim().length.toString()} / 50 Minimal Length Bounds Threshold
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
              onClick={() => setWizardStepState("configuration")}
              disabled={jobDescriptionInputStr.trim().length < 50}
            >
              <span>Advance Configuration parameters</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 3: SYLLABUS ALIGNMENT TUNE SETTINGS PANEL */}
      {wizardStepState === "configuration" && (
        <Card
          className={cn(CARD, "rounded-lg border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden")}
        >
          <CardContent className="p-4 space-y-5 block w-full leading-none">
            <div className="space-y-1 block leading-none select-none pointer-events-none pb-2 border-b border-border/5">
              <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase tracking-wide text-primary leading-none">
                <Settings className="h-4 w-4 stroke-[2.2] text-primary" />
                <span className="pt-0.5">Tune Assessment Pipeline Configurations</span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground/50 leading-normal block">
                Adjust length scales, difficulty steps, and context mappings prior to spawning runtime processes.
              </p>
            </div>

            {generationExceptionError && (
              <div className="block w-full leading-none select-none">
                <RetryErrorCard
                  type={getErrorType(generationExceptionError)}
                  onRetry={handleStartInterviewSequence}
                  description={generationExceptionError.message}
                />
              </div>
            )}

            {/* TUNING ITEM A: QUESTION QUANTUM LIMITS */}
            <div className="space-y-2 block w-full leading-none">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
                Evaluation Question Quantum Scale
              </Label>
              <RadioGroup
                value={String(interviewConfigState.questionCount)}
                onValueChange={(extractedVal) =>
                  setInterviewConfigState((prev) => ({ ...prev, questionCount: Number(extractedVal) }))
                }
                className="flex gap-4 flex-wrap select-none leading-none pt-0.5"
              >
                {[3, 5, 7, 10].map((numericalValue) => (
                  <div
                    key={`question-count-option-node-${numericalValue}`}
                    className="flex items-center space-x-1.5 h-4 block"
                  >
                    <RadioGroupItem
                      value={String(numericalValue)}
                      id={`q-quantum-option-${numericalValue}`}
                      className="h-4 w-4 rounded-full border-border/80 text-primary focus-visible:ring-1"
                    />
                    <Label
                      htmlFor={`q-quantum-option-${numericalValue}`}
                      className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer tabular-nums pt-0.5"
                    >
                      {numericalValue.toString()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* TUNING ITEM B: CHRONO STEP DIFFICULTY CHANNELS */}
            <div className="space-y-2 block w-full leading-none pt-1">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
                Target Vetting Difficulty Step
              </Label>
              <RadioGroup
                value={interviewConfigState.difficulty}
                onValueChange={(extractedLevel) =>
                  setInterviewConfigState((prev) => ({ ...prev, difficulty: extractedLevel as any }))
                }
                className="flex gap-4 flex-wrap select-none leading-none pt-0.5"
              >
                {["easy", "medium", "hard"].map((difficultyLevelStr) => (
                  <div
                    key={`difficulty-level-node-${difficultyLevelStr}`}
                    className="flex items-center space-x-1.5 h-4 block"
                  >
                    <RadioGroupItem
                      value={difficultyLevelStr}
                      id={`difficulty-level-option-${difficultyLevelStr}`}
                      className="h-4 w-4 rounded-full border-border/80 text-primary focus-visible:ring-1"
                    />
                    <Label
                      htmlFor={`difficulty-level-option-${difficultyLevelStr}`}
                      className="text-xs sm:text-sm font-semibold text-foreground capitalize cursor-pointer pt-0.5"
                    >
                      {difficultyLevelStr}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* TUNING ITEM C: CLASSIFICATION DOMAIN CATEGORIES */}
            <div className="space-y-1.5 block w-full leading-none pt-1">
              <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
                Profession Specialty Classification Variant
              </Label>
              <Select
                value={interviewConfigState.professionCategoryId || ""}
                onValueChange={(extractedCategoryId) =>
                  setInterviewConfigState((prev) => ({ ...prev, professionCategoryId: extractedCategoryId || null }))
                }
              >
                <SelectTrigger className="h-9 font-sans text-xs sm:text-sm rounded-lg border border-border/40 bg-background/50 shadow-none">
                  <SelectValue placeholder="Select specialized discipline context mapping..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-border/60 bg-popover text-popover-foreground">
                  {professionCategoriesArray.map((categoryNodeItem) => (
                    <SelectItem key={categoryNodeItem.id} value={categoryNodeItem.id} className="text-xs font-semibold">
                      {categoryNodeItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TUNING ITEM D: RESUME PROFILE INTEGRATION TOGGLES */}
            {talentProfileNode && (
              <div className="rounded-lg border border-primary/20 bg-primary/[0.01] p-3 flex gap-3 leading-none w-full block shadow-2xs">
                <input
                  type="checkbox"
                  id="profile-context-integration-trigger"
                  checked={interviewConfigState.useProfileContext}
                  onChange={(eventElement) =>
                    setInterviewConfigState((prev) => ({ ...prev, useProfileContext: eventElement.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-border/80 data-[state=checked]:bg-primary text-primary transition-colors cursor-pointer shrink-0 shadow-3xs"
                />
                <div className="leading-none space-y-1 block flex-1">
                  <Label
                    htmlFor="profile-context-integration-trigger"
                    className="text-xs sm:text-sm font-bold text-foreground cursor-pointer block"
                  >
                    Integrate Dynamic Profile Context Maps
                  </Label>
                  <p
                    className={cn(
                      META_TEXT,
                      "font-sans text-[11px] font-medium text-muted-foreground/50 leading-tight block select-none pointer-events-none",
                    )}
                  >
                    Tailor interrogation lines explicitly matching your skills metrics record logs and structural work
                    experience portfolios.
                  </p>
                </div>
              </div>
            )}

            {/* LOWER ACTIONS COMMIT AND REVERT MODULE CONTROLS */}
            <div className="pt-3 border-t border-border/40 space-y-3 block w-full leading-none shrink-0">
              <div className="flex items-center justify-between select-none pointer-events-none leading-none w-full shrink-0 font-mono text-[10px] uppercase tracking-tight font-bold text-muted-foreground/40">
                <span className="flex items-center gap-1.5 shrink-0">
                  <Coins className="h-3.5 w-3.5 text-amber-500 stroke-[2]" />{" "}
                  <span>Computational Resource Cost Charge</span>
                </span>
                <span className="text-sm font-black text-foreground tabular-nums">
                  {MOCK_INTERVIEW_COST.toString()} Credits
                </span>
              </div>

              <div className="flex gap-2.5 leading-none w-full block shrink-0 select-none">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStepRevertAction}
                  disabled={isAIInferenceProcessing}
                  className="h-9 px-4 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 hover:bg-accent cursor-pointer transition-colors shadow-2xs gap-1.5 pt-0.5 block shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Revert Description</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleStartInterviewSequence}
                  disabled={isAIInferenceProcessing}
                  className="flex-1 h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
                >
                  {isAIInferenceProcessing ? (
                    <div className="flex items-center justify-center gap-1.5 leading-none mx-auto">
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span className="truncate block pt-0.5">{progressiveLoadingMessageStr}</span>
                    </div>
                  ) : (
                    <span>Initialize Core Simulation Matrix</span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 4: PROCESSING STREAM TIMELINE INFERENCE OVERLAY */}
      {wizardStepState === "generating" && (
        <Card
          className={cn(
            CARD,
            "rounded-lg border border-border/60 bg-card/40 shadow-none block w-full overflow-hidden select-none pointer-events-none",
          )}
        >
          <CardContent className="py-12 text-center space-y-4 block w-full leading-none">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto stroke-[2.5]" />
            <div className="space-y-1 block leading-none">
              <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                Assembling Cognitive Syllabus Nodes...
              </h3>
              <p
                className={cn(
                  META_TEXT,
                  "font-sans text-[11px] font-medium text-muted-foreground/60 block leading-tight",
                )}
              >
                {progressiveLoadingMessageStr}
              </p>
              <p className="font-mono text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest pt-2 flex items-center justify-center gap-1 leading-none tabular-nums">
                <Sparkles className="h-3 w-3 stroke-[2]" />{" "}
                <span>Estimated inference conversion processing window: 20–30s</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
