import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Readiness Assessment Stepper
 * CTO Reference: Authoritative diagnostic node for talent telemetry.
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const registryKey = `assessment_sync_v3_${categoryId}`;

  // PROTOCOL: State Recovery Ingress
  useEffect(() => {
    const savedRegistry = localStorage.getItem(registryKey);
    if (savedRegistry) {
      try {
        const { savedAnswers, savedIndex } = JSON.parse(savedRegistry);
        if (savedAnswers && typeof savedAnswers === "object") {
          setAnswers(savedAnswers);
          setCurrentIndex(savedIndex || 0);
        }
      } catch (e) {
        localStorage.removeItem(registryKey);
      }
    }
  }, [registryKey]);

  // PROTOCOL: Continuous Registry Commitment
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

  useEffect(() => {
    loadNodeQuestions();
  }, [categoryId]);

  const loadNodeQuestions = async () => {
    setLoading(true);
    setLoadError(null);

    // Synapse Timeout Protocol
    const timeoutHandshake = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("SYNAPSE_TIMEOUT")), 15000);
    });

    try {
      const result = (await Promise.race([
        supabase
          .from("assessment_questions")
          .select("*")
          .eq("is_active", true)
          .or(`profession_category_id.is.null,profession_category_id.eq.${categoryId}`)
          .order("display_order"),
        timeoutHandshake,
      ])) as any;

      if (result.error) throw result.error;

      const data = result.data || [];
      const typedQuestions = data.map((q: any) => ({
        ...q,
        question_type: q.question_type as Question["question_type"],
      }));

      setQuestions(typedQuestions);
    } catch (error: any) {
      const msg =
        error.message === "SYNAPSE_TIMEOUT" ? "Registry latency detected. Check uplink." : "Registry fetch fault.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const executeSelection = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const executeMultipleSelection = (questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: checked ? [...current, value] : current.filter((v: string) => v !== value),
      };
    });
  };

  const handleTrajectoryAdvance = () => {
    const currentQ = questions[currentIndex];
    if (!answers[currentQ.id] && currentQ.question_type !== "multiple_choice") {
      toast.error("DATA_REQUIRED: Answer node must be populated.");
      return;
    }

    if (currentIndex === questions.length - 1) {
      localStorage.removeItem(registryKey);
      onComplete(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const normalizeOptionsRegistry = (options: any[]): Array<{ value: string; label: string }> => {
    if (!options || !Array.isArray(options)) return [];
    return options.map((opt, idx) => {
      if (typeof opt === "object" && opt !== null && opt.value) return opt;
      if (typeof opt === "string") {
        return { value: opt.toLowerCase().replace(/\s+/g, "_"), label: opt };
      }
      return { value: String(idx), label: String(opt) };
    });
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-700">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
          Initializing_Registry_Nodes...
        </p>
      </div>
    );

  if (loadError)
    return (
      <Card className="max-w-xl mx-auto border-2 border-rose-500/20 bg-rose-500/5 rounded-[32px]">
        <CardContent className="p-10 text-center space-y-6">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Registry_Fault</h3>
            <p className="text-xs font-medium text-muted-foreground italic">{loadError}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onBack}
              className="rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest"
            >
              ABORT_SYNC
            </Button>
            <Button
              onClick={loadNodeQuestions}
              className="rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2"
            >
              <RefreshCw className="h-4 w-4" /> RETRY_SYNC
            </Button>
          </div>
        </CardContent>
      </Card>
    );

  const currentQuestion = questions[currentIndex];
  const yieldProgress = ((currentIndex + 1) / questions.length) * 100;
  const activeOptions = normalizeOptionsRegistry(currentQuestion.options);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-1000 text-left">
      {/* HUD: TRAJECTORY_PROGRESS */}
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Node_{currentIndex + 1} <span className="mx-1 opacity-20">/</span> {questions.length}
          </span>
        </div>
        <Progress value={yieldProgress} className="h-1.5 bg-primary/10 shadow-inner" />
      </div>

      {/* COMPONENT: DIAGNOSTIC_NODE */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black uppercase italic tracking-tighter leading-tight text-foreground">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-8">
          {/* Node: Single_Choice */}
          {currentQuestion.question_type === "single_choice" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(v) => executeSelection(currentQuestion.id, v)}
              className="grid grid-cols-1 gap-3"
            >
              {activeOptions.map((opt, i) => (
                <Label
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all duration-500",
                    answers[currentQuestion.id] === opt.value
                      ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                      : "border-border/40 hover:border-primary/20 bg-muted/5",
                  )}
                >
                  <span className="text-xs font-black uppercase italic tracking-tighter">{opt.label}</span>
                  <RadioGroupItem value={opt.value} className="h-5 w-5 border-2" />
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Node: Multiple_Choice */}
          {currentQuestion.question_type === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-3">
              {activeOptions.map((opt, i) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(opt.value);
                return (
                  <div
                    key={i}
                    onClick={() => executeMultipleSelection(currentQuestion.id, opt.value, !isSelected)}
                    className={cn(
                      "flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all duration-500",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                        : "border-border/40 hover:border-primary/20 bg-muted/5",
                    )}
                  >
                    <span className="text-xs font-black uppercase italic tracking-tighter">{opt.label}</span>
                    <Checkbox checked={isSelected} className="h-5 w-5 border-2 rounded-lg" />
                  </div>
                );
              })}
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-2 ml-1 italic">
                MULTI_NODE_INGRESS_ACTIVE
              </p>
            </div>
          )}

          {/* Node: Scale_Quantitative */}
          {currentQuestion.question_type === "scale" && (
            <div className="space-y-8 py-6">
              <div className="relative px-2">
                <Slider
                  value={[answers[currentQuestion.id] || 5]}
                  onValueChange={(v) => executeSelection(currentQuestion.id, v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full h-2"
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white font-black italic rounded-lg px-4 py-2 shadow-xl animate-in zoom-in-95">
                  {answers[currentQuestion.id] || 5}
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground italic px-1">
                <span>Min_Vector</span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Perceptual_Baseline</span>
                </div>
                <span>Max_Vector</span>
              </div>
            </div>
          )}

          {/* HUD: NAVIGATION_ACTIONS */}
          <div className="flex justify-between gap-4 pt-8 border-t-2 border-border/10">
            <Button
              variant="outline"
              onClick={() => (currentIndex === 0 ? onBack() : setCurrentIndex((v) => v - 1))}
              className="h-14 px-8 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest transition-all hover:bg-muted/10"
            >
              <ArrowLeft className="h-4 w-4 mr-3" /> {currentIndex === 0 ? "Abort" : "Node_Prev"}
            </Button>
            <Button
              onClick={handleTrajectoryAdvance}
              className="h-14 flex-1 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
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
