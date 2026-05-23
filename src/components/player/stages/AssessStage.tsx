import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  CheckCircle,
  ClipboardCheck,
  XCircle,
  AlertCircle,
  Trophy,
  RefreshCw,
  Zap,
  Target,
  Loader2,
} from "lucide-react";
import {
  listQuizQuestionsByModule,
  listFallbackQuizQuestionsByContent,
  insertQuizAttempt,
} from "@/domains/learning/repo/learningRepo";
import { learnerAdaptiveSample } from "@/domains/learning/api/learningApi";
import { cn } from "@/lib/utils";

export interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}

export interface AssessStageProps {
  contentId: string;
  moduleId: string;
  studentId: string | undefined;
  enrollmentId: string | undefined;
  passThreshold: number;
  onComplete: (passed: boolean, score: number) => void;
  isCompleted: boolean;
}

/**
 * GroUp Academy: Adaptive Knowledge Validation Engine Node (AssessStage)
 * An authoritative operational gatekeeper testing skill-node mastery and persisting verification scores.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function AssessStage({
  contentId,
  moduleId,
  studentId,
  enrollmentId,
  passThreshold,
  onComplete,
  isCompleted,
}: AssessStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("assessment_node_mounted", { moduleId, contentId });
    return () => {
      isMountedRef.current = false;
    };
  }, [moduleId, contentId]);

  // REGISTRY_SYNC: Adaptive item sampler first; cascades down to curated question tables on dropout
  const {
    data: questions = [],
    isLoading,
    error: loadError,
    refetch,
  } = useQuery<QuizQuestion[]>({
    queryKey: ["quiz-questions-adaptive", moduleId, contentId],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const adaptive = await learnerAdaptiveSample({ module_id: moduleId, count: 10 });

        if ((adaptive as any)?.items?.length) {
          const alphabetLetters = ["A", "B", "C", "D"] as const;
          trackEvent("assessment_adaptive_sampler_success", { count: (adaptive as any).items.length });

          return (
            (adaptive as any).items as Array<{
              id: string;
              question: string;
              options: unknown;
              correct_index: number;
              explanation: string | null;
            }>
          ).map((it) => {
            const opts = Array.isArray(it.options)
              ? it.options
              : it.options && typeof it.options === "object"
                ? Object.values(it.options as Record<string, unknown>)
                : [];
            const padded = [...opts, "", "", "", ""].slice(0, 4).map((o) => String(o).trim());
            return {
              id: it.id,
              question_text: it.question.trim(),
              option_a: padded[0],
              option_b: padded[1],
              option_c: padded[2],
              option_d: padded[3],
              correct_answer: alphabetLetters[Math.max(0, Math.min(3, it.correct_index))],
              explanation: it.explanation ? it.explanation.trim() : null,
            } satisfies QuizQuestion;
          });
        }
      } catch (e) {
        trackError(e, { component: "AssessStage", action: "adaptive_sampler_invoke_fallback" });
      }


      // Fallback Strategy: Extract static matching records directly from default repositories
      let { data, error } = await listQuizQuestionsByModule(moduleId);

      if (!error && (!data || data.length === 0)) {
        const fallbackResult = await listFallbackQuizQuestionsByContent(contentId);
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;
      trackEvent("assessment_fallback_repository_hydrated", { count: data?.length || 0 });
      return (data as QuizQuestion[]) ?? [];
    },
    enabled: !!moduleId && !!contentId,
  });

  const totalQuestions = useMemo(() => questions.length, [questions]);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = useMemo(
    () => answeredCount === totalQuestions && totalQuestions > 0,
    [answeredCount, totalQuestions],
  );

  const percentage = useMemo(() => {
    if (totalQuestions <= 0) return 0;
    return Math.round((score / totalQuestions) * 100);
  }, [score, totalQuestions]);

  const passed = useMemo(() => percentage >= passThreshold, [percentage, passThreshold]);

  const handleRetry = () => {
    trackEvent("assessment_retry_initiated", { moduleId });
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowExplanations(false);
  };

  const handleExecutiveSubmit = async () => {
    if (!allAnswered || submitted) return;

    const correctCount = questions.reduce((acc, q) => (answers[q.id] === q.correct_answer ? acc + 1 : acc), 0);
    const attemptPassed = Math.round((correctCount / totalQuestions) * 100) >= passThreshold;

    setScore(correctCount);
    setSubmitted(true);

    trackEvent("assessment_submission_requested", { correctCount, totalQuestions, attemptPassed });
    const toastId = toast.loading("Processing validation entries over profile ledger index...");

    if (studentId && enrollmentId) {
      try {
        await insertQuizAttempt({
          student_id: studentId,
          content_id: contentId,
          enrollment_id: enrollmentId,
          answers,
          score: correctCount,
          total_questions: totalQuestions,
          passed: attemptPassed,
        });

        // Automated Efficiency: Evaporate stale query structures across dashboard summaries instantly
        await queryClient.invalidateQueries({ queryKey: ["quiz-questions-adaptive", moduleId] });
        await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
        await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

        toast.success("Verification metrics logged cleanly into trajectory history.", { id: toastId });
        trackEvent("assessment_submission_persisted_success");
      } catch (err: any) {
        const exceptionMsg = err instanceof Error ? err.message : String(err);
        trackError(exceptionMsg, {
          component: "AssessStage",
          action: "persist_quiz_attempt_transaction_api",
          moduleId,
        });
        toast.error(`Ledger transaction dropped: ${exceptionMsg}`, { id: toastId });
      }
    }

    onComplete(attemptPassed, correctCount);
  };

  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl select-none w-full animate-in scale-in duration-200">
        <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-center w-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 animate-pulse">
            Assembling Knowledge Verification Matrix…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border border-dashed border-rose-500/20 bg-rose-500/5 rounded-2xl text-left w-full">
        <CardContent className="p-8 text-center space-y-4 select-none w-full">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto stroke-[2.2]" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
              Synapse Ledger Disconnected
            </p>
            <p className="text-[11px] font-semibold italic text-muted-foreground/70 mt-1 pl-1">
              Registry interface lookup failed. Server data synchronization dropped.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            type="button"
            className="h-8 rounded-xl border-border/60 font-bold uppercase text-[10px] tracking-wide shadow-sm hover:bg-accent gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Re-establish Ingress Sync</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: ASSESSMENT CALIBRATION HEADER */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Knowledge Validation Protocol</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Target Verification Curve: <span className="text-primary font-black">{passThreshold}% Accuracy Scale</span>{" "}
            &bull; Minimum Passing Threshold
          </p>
        </div>
        {isCompleted && (
          <Badge
            variant="outline"
            className="text-[9px] font-extrabold tracking-wider uppercase px-2 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shrink-0"
          >
            Node Verified
          </Badge>
        )}
      </div>

      {submitted ? (
        /* COMPONENT MATRIX: RESULTS GRAPHIC HUD DASHBOARD */
        <div className="space-y-4 text-left w-full animate-in fade-in duration-300">
          <Card
            className={cn(
              "rounded-2xl border backdrop-blur-md shadow-sm overflow-hidden transition-all duration-500 w-full min-w-0 text-center flex flex-col justify-center",
              passed ? "border-emerald-500/20 bg-emerald-500/[0.015]" : "border-rose-500/20 bg-rose-500/[0.015]",
            )}
          >
            <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4 w-full">
              <div className="h-14 w-14 rounded-full flex items-center justify-center select-none shrink-0 shadow-inner">
                {passed ? (
                  <Trophy className="h-6 w-6 text-emerald-500 stroke-[2.2] animate-bounce" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-rose-500 stroke-[2.2] animate-pulse" />
                )}
              </div>

              <div className="space-y-1 leading-none w-full">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground/90 leading-none">
                  {passed ? "You passed" : "Try again"}
                </h3>
                <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter leading-none pt-1">
                  {score}
                  <span className="text-lg font-normal text-muted-foreground/30 mx-2">/</span>
                  {totalQuestions}
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 select-none leading-none font-mono">
                  <span>{percentage}% aggregate alignment scale</span>
                </div>
              </div>

              <p className="text-[11px] font-semibold text-muted-foreground/80 leading-relaxed max-w-sm mx-auto italic select-text">
                {passed
                  ? "Identity credentials updated successfully. Target evaluation completed. You are authorized for next-stage tracks."
                  : `Minimum verification curves not reached (${passThreshold}% required). Re-initialize core module study units and launch a new attempt.`}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full font-bold text-xs select-none">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                trackEvent("assessment_explanations_toggled", { currentState: !showExplanations });
                setShowExplanations(!showExplanations);
              }}
              className="h-10 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors"
            >
              {showExplanations ? "Hide explanations" : "Show explanations"}
            </Button>
            {!passed && (
              <Button
                type="button"
                onClick={handleRetry}
                className="h-10 rounded-xl font-extrabold uppercase text-[10px] tracking-wider gap-1.5 cursor-pointer shadow-md transform-gpu active:scale-[0.99] transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Re-Initialize Calibration Sync</span>
              </Button>
            )}
          </div>

          {/* HUD SUB-TRACK LAYER: RATIONALE AUDIT EXPLANATIONS FLOW */}
          {showExplanations && (
            <div className="space-y-2 w-full min-w-0 animate-in slide-in-from-top-2 duration-200">
              {questions.map((questionRecord, idx) => {
                const isUserChoiceValid = answers[questionRecord.id] === questionRecord.correct_answer;
                return (
                  <Card
                    key={questionRecord.id}
                    className={cn(
                      "rounded-xl border border-border/40 backdrop-blur-sm overflow-hidden transition-all text-left w-full min-w-0 shadow-sm",
                      isUserChoiceValid ? "bg-emerald-500/[0.01]" : "bg-rose-500/[0.01]",
                    )}
                  >
                    <CardContent className="p-4 flex gap-3.5 items-start w-full min-w-0 leading-normal">
                      <div
                        className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border shadow-inner select-none mt-0.5",
                          isUserChoiceValid
                            ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-600"
                            : "bg-rose-500/10 border-rose-500/15 text-rose-500",
                        )}
                      >
                        {isUserChoiceValid ? (
                          <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          <XCircle className="h-4 w-4 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1 min-w-0 text-left leading-relaxed font-semibold text-xs sm:text-sm text-foreground/90">
                        <p className="font-bold text-foreground/90 select-text break-words pr-1">
                          <span className="font-mono text-[10px] font-black text-primary border rounded px-1 py-0.5 bg-muted/40 mr-1.5 select-none shadow-sm">
                            NODE {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span>{questionRecord.question_text}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-wide select-none font-mono leading-none pt-0.5 opacity-70">
                          <span>
                            Provided Input:{" "}
                            <span
                              className={
                                isUserChoiceValid
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {answers[questionRecord.id] || "NULL"}
                            </span>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Target Lock Value:{" "}
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {questionRecord.correct_answer}
                            </span>
                          </span>
                        </div>

                        {questionRecord.explanation && (
                          <div className="p-3 rounded-lg border border-border/20 bg-background/50 text-[11px] font-medium leading-relaxed italic text-muted-foreground select-text selection:bg-primary/10">
                            &ldquo;{questionRecord.explanation.trim()}&rdquo;
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* COMPONENT MATRIX: COGNITIVE ACTIVE EVALUATION QUIZ QUESTION FLOW INTERFACE */
        <div className="space-y-4 w-full animate-in fade-in duration-300 text-left">
          <div className="p-3.5 px-4 rounded-xl bg-muted/20 border border-border/40 backdrop-blur-sm flex items-center justify-between gap-4 select-none leading-none w-full">
            <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block pl-0.5 leading-none">
                Synchronized Ingress Progression
              </span>
              <p className="text-base sm:text-lg font-black tracking-tight text-foreground tabular-nums leading-none pt-0.5">
                {answeredCount}
                <span className="text-muted-foreground/30 font-normal mx-1.5">/</span>
                {totalQuestions} inputs calibrated
              </p>
            </div>
            <div className="w-28 sm:w-36 h-2 rounded-full bg-primary/10 border border-border/5 overflow-hidden shadow-inner shrink-0 relative flex">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out shrink-0 border-none"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3.5 w-full min-w-0 text-left">
            {questions.map((questionItem, index) => (
              <Card
                key={questionItem.id}
                className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center group"
              >
                <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                  <div className="flex items-center gap-2.5 min-w-0 w-full leading-none">
                    <div className="h-6.5 w-6.5 rounded-md bg-primary/10 border border-primary/5 text-primary text-[10px] font-mono font-black flex items-center justify-center shrink-0 shadow-sm leading-none">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 truncate block pt-0.5 leading-none">
                      Trajectory Evaluation Node Target
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-bold leading-relaxed text-foreground/90 break-words select-text pr-1 italic">
                    {questionItem.question_text}
                  </p>

                  <RadioGroup
                    value={answers[questionItem.id] || ""}
                    onValueChange={(chosenOptionValueStr) =>
                      setAnswers((prev) => ({ ...prev, [questionItem.id]: chosenOptionValueStr }))
                    }
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full select-none font-bold text-xs"
                  >
                    {["A", "B", "C", "D"].map((optionTokenStr) => {
                      const computedKeyName = `option_${optionTokenStr.toLowerCase()}` as keyof QuizQuestion;
                      const isOptionCheckedStr = answers[questionItem.id] === optionTokenStr;

                      return (
                        <div
                          key={optionTokenStr}
                          className={cn(
                            "relative flex items-center p-3.5 rounded-xl border transition-all duration-200 cursor-pointer transform-gpu active:scale-[0.995] w-full min-w-0 shadow-sm hover:border-primary/20 hover:bg-background/30",
                            isOptionCheckedStr
                              ? "border-primary bg-primary/5 shadow-inner text-primary font-bold"
                              : "border-border/40 bg-background/50",
                          )}
                        >
                          <RadioGroupItem
                            value={optionTokenStr}
                            id={`${questionItem.id}-${optionTokenStr}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`${questionItem.id}-${optionTokenStr}`}
                            className="cursor-pointer flex-1 flex items-start gap-3 w-full min-w-0 leading-tight font-semibold"
                          >
                            <span
                              className={cn(
                                "h-5 w-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] border shrink-0 select-none mt-0.5 transition-colors",
                                isOptionCheckedStr
                                  ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                                  : "bg-muted text-muted-foreground/80 border-border/40",
                              )}
                            >
                              {optionTokenStr}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground/80 flex-1 min-w-0 break-words select-text leading-snug pt-0.5">
                              {questionItem[computedKeyName] as string}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleExecutiveSubmit}
            disabled={!allAnswered}
            type="button"
            className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.99] transition-transform gap-1.5 flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
          >
            {allAnswered ? (
              <>
                <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] animate-pulse shrink-0" />
                <span>Commit & Finalize Accuracy Ledger</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4 stroke-[2.5] shrink-0" />
                <span>
                  Awaiting Inputs Matrix ({answeredCount} / {totalQuestions})
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
