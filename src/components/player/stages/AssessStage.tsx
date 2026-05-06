import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, ClipboardCheck, XCircle, AlertCircle, Trophy, RefreshCw, Zap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Knowledge Validation Node (AssessStage)
 * CTO Reference: Authoritative gatekeeper for skill-node mastery.
 */

// REGISTRY_INTERFACES: Explicitly defined to resolve TS2304
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

export function AssessStage({
  contentId,
  moduleId,
  studentId,
  enrollmentId,
  passThreshold,
  onComplete,
  isCompleted,
}: AssessStageProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);

  // REGISTRY_SYNC: Adaptive sampler first; fall back to curated quiz_questions
  const {
    data: questions = [],
    isLoading,
    error: loadError,
    refetch,
  } = useQueryWithTimeout({
    queryKey: ["quiz-questions-adaptive", moduleId, contentId],
    queryFn: async () => {
      // 1) Try adaptive sampler (skill-aware)
      try {
        const { data: adaptive, error: adaptiveErr } = await supabase.functions.invoke(
          "learner-adaptive-sample",
          { body: { module_id: moduleId, count: 10 } },
        );
        if (!adaptiveErr && (adaptive as any)?.items?.length) {
          const letters = ["A", "B", "C", "D"] as const;
          return ((adaptive as any).items as Array<{
            id: string;
            question: string;
            options: unknown;
            correct_index: number;
            explanation: string | null;
          }>).map((it) => {
            const opts = Array.isArray(it.options)
              ? it.options
              : it.options && typeof it.options === "object"
                ? Object.values(it.options as Record<string, unknown>)
                : [];
            const padded = [...opts, "", "", "", ""].slice(0, 4).map((o) => String(o));
            return {
              id: it.id,
              question_text: it.question,
              option_a: padded[0],
              option_b: padded[1],
              option_c: padded[2],
              option_d: padded[3],
              correct_answer: letters[Math.max(0, Math.min(3, it.correct_index))],
              explanation: it.explanation,
            } satisfies QuizQuestion;
          });
        }
      } catch (e) {
        console.warn("[AssessStage] adaptive sampler failed, falling back", e);
      }

      // 2) Fallback to curated quiz_questions (module → content)
      let { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("module_id", moduleId)
        .order("display_order");

      if (!error && (!data || data.length === 0)) {
        const fallbackResult = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("content_id", contentId)
          .is("module_id", null)
          .order("display_order");

        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!moduleId && !!contentId,
    timeout: TIMEOUTS.DEFAULT,
  });

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= passThreshold;

  // PROTOCOL: Attempt Reset Handler
  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowExplanations(false);
  };

  const handleExecutiveSubmit = async () => {
    if (!allAnswered) return;

    const correctCount = questions.reduce((acc, q) => (answers[q.id] === q.correct_answer ? acc + 1 : acc), 0);

    setScore(correctCount);
    setSubmitted(true);

    if (studentId && enrollmentId) {
      const attemptPassed = Math.round((correctCount / totalQuestions) * 100) >= passThreshold;

      try {
        // FIX: Await the Supabase call inside withTimeout to satisfy TS2739
        await withTimeout(
          (async () => {
            const { error } = await supabase.from("quiz_attempts").insert({
              student_id: studentId,
              content_id: contentId,
              enrollment_id: enrollmentId,
              answers,
              score: correctCount,
              total_questions: totalQuestions,
              passed: attemptPassed,
            });
            if (error) throw error;
          })(),
          TIMEOUTS.DEFAULT,
          "REGISTRY_SYNC_TIMEOUT",
        );
      } catch (error) {
        console.error("[AssessNode Sync Error]:", error);
      }

      onComplete(attemptPassed, correctCount);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md">
        <CardContent className="p-12 text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
            Initializing_Assessment_Matrix...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="rounded-[32px] border-2 border-dashed border-destructive/20 bg-destructive/5">
        <CardContent className="p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-[10px] font-black uppercase text-destructive tracking-widest italic">
            SYNC_FAULT: REGISTRY_OFFLINE
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="rounded-xl font-black uppercase text-[10px] border-destructive/20"
          >
            Re_Initialize_Node
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HUD: ASSESSMENT_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" /> Stage_05: Knowledge_Validation
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Pass Threshold: {passThreshold}% | Minimum Accuracy Required
          </p>
        </div>
        {isCompleted && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-500">
            <CheckCircle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
          </div>
        )}
      </div>

      {submitted ? (
        /* COMPONENT: RESULTS_DASHBOARD */
        <div className="space-y-6">
          <Card
            className={cn(
              "rounded-[40px] border-4 overflow-hidden transition-all duration-1000",
              passed
                ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]"
                : "border-orange-500 bg-orange-500/5",
            )}
          >
            <CardContent className="p-10 text-center space-y-6">
              <div className="relative inline-block">
                {passed ? (
                  <Trophy className="h-20 w-20 text-emerald-500 animate-bounce" />
                ) : (
                  <AlertCircle className="h-20 w-20 text-orange-500 animate-pulse" />
                )}
                <div className="absolute inset-0 blur-2xl opacity-20 bg-current" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                  {passed ? "PROTOCOL_PASSED" : "ACCURACY_INSUFFICIENT"}
                </h3>
                <p className="text-5xl font-black tabular-nums tracking-tighter">
                  {score}
                  <span className="text-xl text-muted-foreground/40 mx-2">/</span>
                  {totalQuestions}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">
                    {percentage}% AGGREGATE_ACCURACY
                  </p>
                </div>
              </div>

              <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {passed
                  ? "Identity credentials updated. You are cleared for next-stage trajectory."
                  : `Requirement not met (${passThreshold}%). Re-initiate learning node artifacts and try again.`}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => setShowExplanations(!showExplanations)}
              className="h-14 rounded-2xl border-2 font-black uppercase italic text-xs tracking-widest gap-3"
            >
              {showExplanations ? "Hide" : "Audit"} Knowledge_Explanations
            </Button>
            {!passed && (
              <Button
                onClick={handleRetry}
                className="h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest gap-3 shadow-xl"
              >
                <RefreshCw className="h-4 w-4" /> Re_Initialize_Attempt
              </Button>
            )}
          </div>

          {showExplanations && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              {questions.map((q, index) => {
                const isCorrect = answers[q.id] === q.correct_answer;
                return (
                  <Card
                    key={q.id}
                    className={cn(
                      "rounded-2xl border-l-8 transition-all text-left",
                      isCorrect ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-red-500 bg-red-500/5",
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border-2",
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-red-500/10 border-red-500/20 text-red-500",
                          )}
                        >
                          {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </div>
                        <div className="space-y-3">
                          <p className="font-black text-sm uppercase italic tracking-tight text-foreground">
                            NODE_{index + 1}: {q.question_text}
                          </p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest opacity-60 italic">
                            <span>
                              Input:{" "}
                              <span className={cn(isCorrect ? "text-emerald-600" : "text-red-600")}>
                                {answers[q.id] || "NONE"}
                              </span>
                            </span>
                            <span>
                              Target: <span className="text-emerald-600">{q.correct_answer}</span>
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="p-4 rounded-xl bg-background/50 border border-border/40">
                              <p className="text-xs font-medium leading-relaxed italic text-muted-foreground">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* COMPONENT: QUIZ_INTERFACE */
        <div className="space-y-8">
          <div className="p-6 rounded-[28px] bg-muted/20 border-2 border-border/10 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Synchronized_Questions
              </p>
              <p className="text-xl font-black italic tracking-tighter text-foreground">
                {answeredCount}
                <span className="text-muted-foreground/30 mx-2">/</span>
                {totalQuestions}
              </p>
            </div>
            <div className="w-32 h-2 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <Card
                key={q.id}
                className="rounded-[32px] border-2 border-border/40 overflow-hidden hover:border-primary/20 transition-colors text-left"
              >
                <CardHeader className="bg-muted/5 border-b border-border/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <CardTitle className="text-base font-black uppercase italic tracking-tighter text-foreground">
                      DATA_NODE_REQUEST
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-lg font-bold leading-tight text-foreground/90 italic">{q.question_text}</p>
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {["A", "B", "C", "D"].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}` as keyof QuizQuestion;
                      const isSelected = answers[q.id] === option;
                      return (
                        <div
                          key={option}
                          className={cn(
                            "relative flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:bg-primary/5",
                            isSelected ? "border-primary bg-primary/5 shadow-inner" : "border-border/40",
                          )}
                        >
                          <RadioGroupItem value={option} id={`${q.id}-${option}`} className="sr-only" />
                          <Label
                            htmlFor={`${q.id}-${option}`}
                            className="cursor-pointer flex-1 flex items-center gap-3"
                          >
                            <span
                              className={cn(
                                "h-6 w-6 rounded-lg flex items-center justify-center font-black text-[10px] border-2",
                                isSelected
                                  ? "bg-primary text-white border-primary"
                                  : "bg-muted text-muted-foreground border-border/40",
                              )}
                            >
                              {option}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-tight text-foreground">
                              {q[optionKey] as string}
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
            className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-widest text-sm shadow-2xl active:scale-95 transition-all gap-3"
          >
            {allAnswered ? <Zap className="h-5 w-5 fill-current" /> : <Target className="h-5 w-5" />}
            {allAnswered ? "Finalize_Identity_Sync" : `Awaiting_Inputs (${answeredCount}/${totalQuestions})`}
          </Button>
        </div>
      )}
    </div>
  );
}
