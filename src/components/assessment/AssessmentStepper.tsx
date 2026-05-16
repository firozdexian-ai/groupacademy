import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Readiness Assessment Stepper (V5.6.0)
 * CTO Reference: Authoritative diagnostic node capture pipeline handling talent telemetry.
 * Architecture: Edge-shielded state re-hydration loops protected against database collection updates.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface Question {
  id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "scale" | "text";
  options: any;
  weight: number;
  category: string;
  display_order: number;
}

interface AssessmentStepperProps {
  categoryId: string;
  categoryName: string;
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

export function AssessmentStepper({ categoryId, categoryName, onComplete, onBack }: AssessmentStepperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const registryKey = useMemo(() => `assessment_sync_v3_${categoryId}`, [categoryId]);

  // --- SENSOR: QUESTIONS_REGISTRY_QUERY_NODE ---
  const {
    data: questions = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<Question[], Error>({
    queryKey: ["assessment-questions", categoryId],
    staleTime: 5 * 60 * 1000, // 5-minute stability caching protect database aggregate paths
    queryFn: async (): Promise<Question[]> => {
      // HUD: EXECUTING_DIAGNOSTIC_QUESTIONS_INGRESS_SELECT
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("is_active", true)
        .or(`profession_category_id.is.null,profession_category_id.eq.${categoryId}`)
        .order("display_order");

      if (error) {
        console.error("[Digital Workforce] FAULT: assessment_questions collection dropped.", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: String(row.id),
        question_text: String(row.question_text ?? "Untitled Evaluation Parameter"),
        question_type: String(row.question_type) as Question["question_type"],
        options: row.options || [],
        weight: Number(row.weight ?? 1),
        category: String(row.category ?? "General Core"),
        display_order: Number(row.display_order ?? 0),
      }));
    },
  });

  // --- PHASE: SAFE_STATE_RE_HYDRATION_LOOP ---
  // Architecture Fix: Shield local state trees from crashing if administrators mutate questions tables
  useEffect(() => {
    if (questions.length === 0) return;

    const savedRegistry = localStorage.getItem(registryKey);
    if (savedRegistry) {
      try {
        const { savedAnswers, savedIndex } = JSON.parse(savedRegistry);
        if (savedAnswers && typeof savedAnswers === "object") {
          // Verify that historical tracking points map safely inside current bounds checks natively
          const boundedIndex = Math.max(0, Math.min(Number(savedIndex || 0), questions.length - 1));

          setAnswers(savedAnswers);
          setCurrentIndex(boundedIndex);
        }
      } catch (err) {
        console.error("[Digital Workforce] FAULT: Clearing corrupted localStorage cache registries.", err);
        localStorage.removeItem(registryKey);
      }
    }
  }, [registryKey, questions]);

  // --- PHASE: CONTINUOUS_REGISTRY_COMMITMENT ---
  useEffect(() => {
    if (Object.keys(answers).length > 0 && questions.length > 0) {
      localStorage.setItem(
        registryKey,
        JSON.stringify({
          savedAnswers: answers,
          savedIndex: currentIndex,
        }),
      );
    }
  }, [answers, currentIndex, registryKey, questions.length]);

  const executeSelection = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const executeMultipleSelection = useCallback((questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      return {
        ...prev,
        [questionId]: checked ? [...current, value] : current.filter((v: string) => v !== value),
      };
    });
  }, []);

  const handleTrajectoryAdvance = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    // Enforce rigorous response checking controls to isolate blank completions cleanly
    const existingAnswer = answers[currentQuestion.id];

    if (currentQuestion.question_type === "scale" && existingAnswer === undefined) {
      // Force scaling inputs to commit baseline parameters explicitly rather than passing undefined hooks
      executeSelection(currentQuestion.id, 5);
    } else if (
      currentQuestion.question_type !== "multiple_choice" &&
      (existingAnswer === undefined || existingAnswer === null || String(existingAnswer).trim() === "")
    ) {
      toast.error("DATA_REQUIRED: Answer node must be populated before advancing phase.");
      return;
    }

    if (currentIndex === questions.length - 1) {
      // HUD: FINALIZING_TELEMETRY_INGRESS_COMMIT
      localStorage.removeItem(registryKey);
      onComplete(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const normalizeOptionsRegistry = useCallback((optionsArray: any[]): Array<{ value: string; label: string }> => {
    if (!optionsArray || !Array.isArray(optionsArray)) return [];
    return optionsArray.map((opt, idx) => {
      if (typeof opt === "object" && opt !== null && opt.value) {
        return { value: String(opt.value), label: String(opt.label || opt.value) };
      }
      if (typeof opt === "string") {
        return { value: opt.toLowerCase().replace(/\s+/g, "_"), label: opt };
      }
      return { value: String(idx), label: String(opt) };
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-700 select-none">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
          Initializing_Registry_Nodes...
        </p>
      </div>
    );
  }

  if (queryError || questions.length === 0) {
    const fallbackErrorString = queryError?.message || "No diagnostic questions populated inside this category node.";
    return (
      <Card className="max-w-xl mx-auto border-2 border-rose-500/20 bg-rose-500/5 rounded-[32px] select-none text-left animate-in zoom-in-95">
        <CardContent className="p-10 text-center space-y-6">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Registry_Fault</h3>
            <p className="text-xs font-medium text-muted-foreground italic">{fallbackErrorString}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest"
            >
              ABORT_SYNC
            </Button>
            <Button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2"
            >
              <RefreshCw className="h-4 w-4" /> RETRY_SYNC
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];
  const yieldProgress = ((currentIndex + 1) / questions.length) * 100;
  const activeOptions = normalizeOptionsRegistry(currentQuestion?.options);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-1000 text-left select-none">
      {/* HUD: TRAJECTORY_PROGRESS_METRICS */}
      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">
              {categoryName}
            </span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-muted-foreground/60 font-mono">
            NODE_{currentIndex + 1} <span className="mx-1 opacity-20">/</span> {questions.length}
          </span>
        </div>
        <Progress value={yieldProgress} className="h-1.5 bg-primary/10 shadow-inner" />
      </div>

      {/* COMPONENT: CORE_DIAGNOSTIC_SURFACE_CARD */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black uppercase italic tracking-tighter leading-tight text-foreground">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-8">
          {/* CONTROL SECTOR: SINGLE CHOICE RADIO GRID */}
          {currentQuestion.question_type === "single_choice" && (
            <RadioGroup
              value={String(answers[currentQuestion.id] || "")}
              onValueChange={(v) => executeSelection(currentQuestion.id, v)}
              className="grid grid-cols-1 gap-3"
            >
              {activeOptions.map((opt) => (
                <Label
                  key={opt.value}
                  className={cn(
                    "flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.99]",
                    answers[currentQuestion.id] === opt.value
                      ? "border-primary bg-primary/5 shadow-lg scale-[1.01]"
                      : "border-border/40 hover:border-primary/20 bg-muted/5",
                  )}
                >
                  <span className="text-xs font-black uppercase italic tracking-tighter text-foreground/90">
                    {opt.label}
                  </span>
                  <RadioGroupItem value={opt.value} className="h-5 w-5 border-2 shrink-0 text-primary" />
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* CONTROL SECTOR: MULTIPLE CHOICE CHECKBOX GRID */}
          {currentQuestion.question_type === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-3">
              {activeOptions.map((opt) => {
                const isSelected =
                  Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => executeMultipleSelection(currentQuestion.id, opt.value, !isSelected)}
                    className={cn(
                      "flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.99]",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg scale-[1.01]"
                        : "border-border/40 hover:border-primary/20 bg-muted/5",
                    )}
                  >
                    <span className="text-xs font-black uppercase italic tracking-tighter text-foreground/90">
                      {opt.label}
                    </span>
                    <Checkbox
                      checked={isSelected}
                      className="h-5 w-5 border-2 rounded-lg shrink-0 text-primary-foreground"
                    />
                  </div>
                );
              })}
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-2 ml-1 italic font-mono">
                MULTI_NODE_INGRESS_ACTIVE
              </p>
            </div>
          )}

          {/* CONTROL SECTOR: QUANTITATIVE SCALING SLIDER */}
          {currentQuestion.question_type === "scale" && (
            <div className="space-y-8 py-6">
              <div className="relative px-2">
                <Slider
                  value={[Number(answers[currentQuestion.id] ?? 5)]}
                  onValueChange={(v) => executeSelection(currentQuestion.id, v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full h-2 cursor-pointer"
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-black italic rounded-lg px-4 py-1.5 shadow-xl animate-in zoom-in-95 font-mono text-sm border border-primary/20">
                  {answers[currentQuestion.id] ?? 5}
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground italic px-1 font-mono">
                <span>Min_Vector</span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Perceptual_Baseline</span>
                </div>
                <span>Max_Vector</span>
              </div>
            </div>
          )}

          {/* HUD: NAVIGATION_ACTIONS_DECK */}
          <div className="flex justify-between gap-4 pt-8 border-t-2 border-border/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => (currentIndex === 0 ? onBack() : setCurrentIndex((v) => v - 1))}
              className="h-14 px-8 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest transition-all hover:bg-muted/10"
            >
              <ArrowLeft className="h-4 w-4 mr-3" /> {currentIndex === 0 ? "Abort" : "Node_Prev"}
            </Button>
            <Button
              type="button"
              onClick={handleTrajectoryAdvance}
              className="h-14 flex-1 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-[0.99] gap-3"
            >
              {currentIndex === questions.length - 1 ? (
                <>
                  SYNC_FINAL_DATA <ShieldCheck className="h-5 w-5" />
                </>
              ) : (
                <>
                  NEXT_NODE <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
