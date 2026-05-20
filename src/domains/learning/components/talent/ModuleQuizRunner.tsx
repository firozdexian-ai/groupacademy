import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, Brain, CheckCircle2, XCircle, RefreshCw, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { learnerAdaptiveSample, learnerQuizPool } from "@/domains/learning/api/learningApi";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Item { id: string; question: string; options: string[]; difficulty?: string }
interface Result { id: string; correct: boolean; correct_index?: number; explanation?: string }

export function ModuleQuizRunner({ moduleId, onComplete }: { moduleId: string; onComplete?: (score: number) => void }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number; results: Result[] } | null>(null);
  const [adaptiveMix, setAdaptiveMix] = useState<{ avg_mastery: number; mix: { easy: number; medium: number; hard: number } } | null>(null);

  // Monitor psychometric test-taker workspace impressions via telemetry hooks
  useEffect(() => {
    if (moduleId) {
      trackEvent("psychometric_quiz_runner_mounted", { moduleId });
    }
  }, [moduleId]);

  const normalizeOptions = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.map((o) => String(o).trim());
    if (raw && typeof raw === "object") return Object.values(raw as Record<string, unknown>).map((o) => String(o).trim());
    return [];
  };

  const draw = async () => {
    setLoading(true); 
    setResults(null); 
    setAnswers({}); 
    setAdaptiveMix(null);
    
    let isRequestAlive = true;
    trackEvent("psychometric_quiz_draw_requested", { moduleId });

    try {
      // 1) Try adaptive sampler first (skill-aware cognitive engine profile)
      const adaptiveResponse = await supabase.functions.invoke("learner-adaptive-sample", {
        body: { module_id: moduleId, count: 10 },
      });

      if (!adaptiveResponse.error && (adaptiveResponse.data as any)?.items?.length) {
        const payloadData = adaptiveResponse.data as any;
        
        if (isRequestAlive) {
          setItems(
            payloadData.items.map((it: any) => ({
              id: it.id,
              question: it.question,
              options: normalizeOptions(it.options),
              difficulty: it.difficulty ?? undefined,
            }))
          );
          setAdaptiveMix({ avg_mastery: payloadData.avg_mastery, mix: payloadData.mix });
          setLoading(false);
          trackEvent("psychometric_quiz_adaptive_sampled_success", { moduleId });
        }
        return;
      }

      // 2) Fallback to legacy random pool draw when cognitive tracking tables cold-start
      trackEvent("psychometric_quiz_fallback_pool_triggered", { moduleId });
      const { data: poolData, error: poolError } = await supabase.functions.invoke("learner-quiz-pool", {
        body: { mode: "draw", module_id: moduleId },
      });

      if (isRequestAlive) {
        setLoading(false);
        if (poolError || (poolData as any)?.error) {
          throw new Error((poolData as any)?.error || poolError?.message || "Synapse evaluation generation failed.");
        }
        setItems((poolData as any).items);
      }
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);
      
      trackError(parsedExceptionMsg, {
        component: "ModuleQuizRunner",
        action: "execute_quiz_draw_pipeline",
        moduleId
      });

      toast.error(`Ecosystem generation lockout: ${parsedExceptionMsg}`);
      if (isRequestAlive) setLoading(false);
    }
  };

  useEffect(() => {
    draw();
  }, [moduleId]);

  const submit = async () => {
    if (!items) return;
    if (items.some((i) => answers[i.id] === undefined)) {
      toast.error("Please provide entry alignment choices over all outstanding parameters.");
      return;
    }
    
    setSubmitting(true);
    const toastId = toast.loading("Processing evaluation telemetry payload against ledger matrices...");
    
    const item_ids = items.map((i) => i.id);
    const ans = item_ids.map((id) => answers[id]);

    trackEvent("psychometric_quiz_submission_dispatched", { moduleId, payloadSize: item_ids.length });

    try {
      const data = await learnerQuizPool({ mode: "submit", module_id: moduleId, item_ids, answers: ans });

      if (data?.error) {
        throw new Error(data.error);
      }

      setResults({ score: (data as any).score, results: (data as any).results });
      
      // Automated Efficiency: Synchronize cache indices globally to cascade mastery metrics
      queryClient.invalidateQueries({ queryKey: ["module-analytics", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["item-analytics", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["talent-stats"] });

      toast.success("Psychometric metrics committed cleanly. Trajectory score verified.", { id: toastId });
      trackEvent("psychometric_quiz_submission_success", { moduleId, finalScore: (data as any).score });
      
      if (onComplete) onComplete((data as any).score);
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);
      
      trackError(parsedExceptionMsg, {
        component: "ModuleQuizRunner",
        action: "submit_quiz_answers_pipeline",
        moduleId
      });

      toast.error(`Ledger verification error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-in scale-in duration-200">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3.5 text-center w-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 animate-pulse">Assembling Adaptive Competency Evaluation Matrix…</p>
        </CardContent>
      </Card>
    );
  }

  if (!items) return null;

  return (
    <div className="space-y-4 antialiased text-left select-none sm:select-text w-full max-w-full transform-gpu">
      
      {/* CARD LAYER STATE A: EVALUATION HISTORICAL METRICS RESULTS SCREEN */}
      {results ? (
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden w-full animate-in zoom-in-98 duration-300">
          <CardHeader className="p-4 px-5 border-b border-border/10 select-none bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2.5">
              <Brain className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
              <span>Assessment Results Ledger</span>
              <Badge variant="outline" className="ml-auto bg-primary/5 text-primary border-primary/20 text-xs font-extrabold px-2 py-0.5 rounded shadow-sm tabular-nums">
                Score: {Math.round(results.score)}% Verified Parity
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0">
            <Progress value={results.score} className="h-2 rounded-full shadow-inner select-none" />
            
            <div className="space-y-3 w-full min-w-0">
              {items.map((it, idx) => {
                const r = results.results[idx] || { correct: false };
                const selectedOptionValue = it.options[answers[it.id]] || "Unselected item marker link";
                const isCorrectNode = !!r.correct;

                return (
                  <div key={it.id} className="border border-border/40 bg-background/40 backdrop-blur-sm rounded-xl p-3.5 space-y-2.5 text-left w-full min-w-0 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5 w-full min-w-0">
                      {isCorrectNode ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      )}
                      <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-snug break-words flex-1 select-text">
                        {idx + 1}. {it.question}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5 pl-7 text-[11px] sm:text-xs font-semibold leading-normal text-muted-foreground w-full break-words">
                      <p className={cn("p-2 rounded-lg border leading-tight select-text select-none", isCorrectNode ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700" : "bg-rose-500/5 border-rose-500/10 text-rose-700")}>
                        <span className="font-extrabold uppercase tracking-wide text-[9px] block mb-0.5 opacity-60">Submitted Variable Choice</span>
                        <span>{selectedOptionValue}</span>
                      </p>
                      
                      {!isCorrectNode && (r as any).correct_index !== undefined && it.options[(r as any).correct_index] && (
                        <p className="p-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 text-emerald-700 font-bold leading-tight select-text">
                          <span className="font-extrabold uppercase tracking-wide text-[9px] block mb-0.5 opacity-60">Reconciled Valid Lock Target</span>
                          <span>{it.options[(r as any).correct_index]}</span>
                        </p>
                      )}
                      
                      {(r as any).explanation && (
                        <div className="p-3 rounded-lg border border-border/20 bg-muted/20 select-text font-medium text-muted-foreground/90 italic leading-relaxed break-words shadow-inner">
                          <span className="font-bold uppercase tracking-wider text-[9px] text-primary not-italic block mb-1 select-none leading-none pl-0.5">Ecosystem Synapse Rationale</span>
                          <p className="pl-0.5">&ldquo;{String((r as any).explanation).trim()}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button 
              type="button"
              onClick={draw} 
              variant="outline" 
              className="w-full h-10 rounded-xl font-bold text-xs tracking-wide uppercase border-border/60 hover:bg-accent cursor-pointer transition-all active:scale-[0.99] gap-2 select-none mt-2"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary stroke-[2.5]" /> 
              <span>Initialize Alternating Evaluation Pool</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        {/* CARD LAYER STATE B: INTERACTIVE RUNTIME ENTRY MATRIX QUESTIONNAIRE SCREEN */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden w-full">
          <CardHeader className="p-4 px-5 border-b border-border/10 select-none bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <Brain className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
                <span>Personalized Competency Assessment</span>
              </div>
              {adaptiveMix && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-extrabold h-5 px-2 rounded-md tracking-wider uppercase shadow-sm select-none animate-pulse">
                  Synapse Adaptive Model &bull; Mastery Profile: {Math.round(adaptiveMix.avg_mastery * 100)}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-5 space-y-5 w-full min-w-0">
            {items.map((it, idx) => {
              const activeUserChoiceIndex = answers[it.id];
              return (
                <div key={it.id} className="space-y-2.5 w-full min-w-0 border-b border-border/10 pb-4 last:border-none last:pb-0">
                  <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-relaxed select-text break-words pr-1">
                    {idx + 1}. {it.question}
                  </p>
                  
                  <div className="grid gap-2 w-full select-none font-bold text-xs sm:text-sm">
                    {it.options.map((optStringValue, optionIdx) => {
                      const isOptionChecked = activeUserChoiceIndex === optionIdx;
                      return (
                        <button
                          key={optionIdx}
                          type="button"
                          disabled={submitting}
                          onClick={() => setAnswers((a) => ({ ...a, [it.id]: optionIdx }))}
                          className={cn(
                            "w-full text-left text-xs sm:text-sm rounded-xl border p-3 transition-all duration-200 cursor-pointer transform-gpu active:scale-[0.995] outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-start gap-3 shadow-sm font-semibold",
                            isOptionChecked
                              ? "border-primary bg-primary/5 text-primary font-bold shadow-inner"
                              : "border-border/40 hover:border-border/60 bg-background/40 hover:bg-background"
                          )}
                        >
                          <span className={cn("h-5 w-5 rounded-md flex items-center justify-center border text-[10px] font-mono shrink-0 select-none", isOptionChecked ? "bg-primary/10 border-primary/20 text-primary font-bold" : "bg-muted border-border/40 text-muted-foreground")}>
                            {String.fromCharCode(64 + optionIdx + 1)}
                          </span>
                          <span className="flex-1 min-w-0 pt-0.5 break-words leading-tight">{optStringValue}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            })}
            
            <Button 
              onClick={submit} 
              disabled={submitting || items.length === 0} 
              type="button"
              className="w-full h-11 rounded-xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-transform select-none cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                  <span>Calculating Psychometric Parity Alignment Indices…</span>
                </>
              ) : (
                <>
                  <span>Commit Completed Questionnaire Registry</span>
                  <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}