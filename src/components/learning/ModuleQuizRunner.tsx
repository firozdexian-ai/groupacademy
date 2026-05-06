import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Item { id: string; question: string; options: string[]; difficulty?: string }
interface Result { id: string; correct: boolean; correct_index?: number; explanation?: string }

export function ModuleQuizRunner({ moduleId, onComplete }: { moduleId: string; onComplete?: (score: number) => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number; results: Result[] } | null>(null);
  const [adaptiveMix, setAdaptiveMix] = useState<{ avg_mastery: number; mix: { easy: number; medium: number; hard: number } } | null>(null);

  const normalizeOptions = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.map((o) => String(o));
    if (raw && typeof raw === "object") return Object.values(raw as Record<string, unknown>).map((o) => String(o));
    return [];
  };

  const draw = async () => {
    setLoading(true); setResults(null); setAnswers({}); setAdaptiveMix(null);

    // 1) Try adaptive sampler first (skill-aware)
    const adaptive = await supabase.functions.invoke("learner-adaptive-sample", {
      body: { module_id: moduleId, count: 10 },
    });
    if (!adaptive.error && (adaptive.data as any)?.items?.length) {
      const d = adaptive.data as any;
      setItems(
        d.items.map((it: any) => ({
          id: it.id,
          question: it.question,
          options: normalizeOptions(it.options),
          difficulty: it.difficulty ?? undefined,
        })),
      );
      setAdaptiveMix({ avg_mastery: d.avg_mastery, mix: d.mix });
      setLoading(false);
      return;
    }

    // 2) Fallback to legacy random pool draw
    const { data, error } = await supabase.functions.invoke("learner-quiz-pool", {
      body: { mode: "draw", module_id: moduleId },
    });
    setLoading(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed to load quiz"); return; }
    setItems((data as any).items);
  };

  useEffect(() => { draw(); }, [moduleId]);

  const submit = async () => {
    if (!items) return;
    if (items.some((i) => answers[i.id] === undefined)) { toast.error("Answer all questions"); return; }
    setSubmitting(true);
    const item_ids = items.map((i) => i.id);
    const ans = item_ids.map((id) => answers[id]);
    const { data, error } = await supabase.functions.invoke("learner-quiz-pool", {
      body: { mode: "submit", module_id: moduleId, item_ids, answers: ans },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Submit failed"); return; }
    setResults({ score: (data as any).score, results: (data as any).results });
    onComplete?.((data as any).score);
  };

  if (loading) return (
    <Card className="rounded-3xl"><CardContent className="py-12 flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Preparing your personalized quiz…</p>
    </CardContent></Card>
  );
  if (!items) return null;

  if (results) {
    return (
      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Quiz Score: {Math.round(results.score)}%</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Progress value={results.score} />
          {items.map((it, idx) => {
            const r = results.results[idx];
            return (
              <div key={it.id} className="border rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  {r.correct ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                  <p className="text-sm font-semibold">{it.question}</p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">Your answer: {it.options[answers[it.id]]}</p>
                {!r.correct && r.correct_index !== undefined && (
                  <p className="text-xs pl-6 text-emerald-700">Correct: {it.options[r.correct_index]}</p>
                )}
                {r.explanation && <p className="text-xs pl-6 text-muted-foreground italic">{r.explanation}</p>}
              </div>
            );
          })}
          <Button onClick={draw} variant="outline" className="w-full"><RefreshCw className="h-3 w-3 mr-2" /> Try a new set</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Quiz
          {adaptiveMix && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Adaptive · Mastery {Math.round(adaptiveMix.avg_mastery * 100)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((it, idx) => (
          <div key={it.id} className="space-y-2">
            <p className="text-sm font-semibold">{idx + 1}. {it.question}</p>
            <div className="grid gap-2">
              {it.options.map((opt, oi) => (
                <button
                  key={oi}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [it.id]: oi }))}
                  className={cn(
                    "text-left text-sm rounded-xl border px-3 py-2 transition-colors",
                    answers[it.id] === oi ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-muted/50"
                  )}
                >{opt}</button>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Submit
        </Button>
      </CardContent>
    </Card>
  );
}
