import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useReviewQueue, type ReviewTopic } from "@/hooks/useReviewQueue";
import { formatDistanceToNowStrict } from "date-fns";
import { ModuleScenarioRunner } from "@/components/learning/ModuleScenarioRunner";

interface TopicResult {
  score: number;
  results: Array<{
    id: string;
    correct: boolean;
    correct_index?: number;
    explanation?: string;
  }>;
}

function normalizeOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o));
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).map((o) => String(o));
  }
  return [];
}

function TopicCard({
  topic,
  onCompleted,
}: {
  topic: ReviewTopic;
  onCompleted: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TopicResult | null>(null);

  const normalizedItems = useMemo(
    () =>
      topic.items.map((it) => ({
        ...it,
        options: normalizeOptions(it.options),
      })),
    [topic.items],
  );

  const overdueLabel = useMemo(() => {
    try {
      return formatDistanceToNowStrict(new Date(topic.due_at), {
        addSuffix: true,
      });
    } catch {
      return null;
    }
  }, [topic.due_at]);

  const submit = async () => {
    if (normalizedItems.some((i) => answers[i.id] === undefined)) {
      toast.error("Answer all questions");
      return;
    }
    setSubmitting(true);
    const item_ids = normalizedItems.map((i) => i.id);
    const ans = item_ids.map((id) => answers[id]);
    const { data, error } = await supabase.functions.invoke(
      "learner-quiz-pool",
      {
        body: {
          mode: "submit",
          module_id: topic.module_id,
          item_ids,
          answers: ans,
        },
      },
    );
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Submit failed");
      return;
    }
    setResult({
      score: (data as any).score,
      results: (data as any).results,
    });
    onCompleted();
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="truncate">{topic.topic_tag}</span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground truncate">
              {topic.content_title ?? "Course"} · {topic.module_title ?? "Module"}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            <Clock className="h-3 w-3 mr-1" />
            {overdueLabel ?? "due"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
          <span>Mastery {Math.round(topic.mastery * 100)}%</span>
          <span>·</span>
          <span>Ease {topic.ease.toFixed(2)}</span>
          <span>·</span>
          <span>Interval {topic.interval_days}d</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Progress value={result.score} className="flex-1" />
              <span className="text-xs font-bold">
                {Math.round(result.score)}%
              </span>
            </div>
            {normalizedItems.map((it, idx) => {
              const r = result.results[idx];
              return (
                <div key={it.id} className="rounded-xl border p-2 space-y-1">
                  <div className="flex items-start gap-2">
                    {r.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs font-medium">{it.question}</p>
                  </div>
                  {!r.correct && r.correct_index !== undefined && (
                    <p className="text-[11px] text-emerald-700 pl-6">
                      Correct: {it.options[r.correct_index]}
                    </p>
                  )}
                  {r.explanation && (
                    <p className="text-[11px] text-muted-foreground italic pl-6">
                      {r.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {normalizedItems.map((it, idx) => (
              <div key={it.id} className="space-y-2">
                <p className="text-sm font-semibold">
                  {idx + 1}. {it.question}
                </p>
                <div className="grid gap-2">
                  {it.options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [it.id]: oi }))
                      }
                      className={cn(
                        "text-left text-sm rounded-xl border px-3 py-2 transition-colors",
                        answers[it.id] === oi
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={submit}
              disabled={submitting || normalizedItems.length === 0}
              className="w-full"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit review
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewQueueRunner() {
  const [active, setActive] = useState<string | null>(null);
  const { data, loading, error, reload } = useReviewQueue({
    limit: 10,
    itemsPerTopic: 4,
  });

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Loading your review queue…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="h-3 w-3 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.topics.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="py-12 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold">You're all caught up!</p>
          <p className="text-xs text-muted-foreground">
            No topics are due for review right now. Keep learning to schedule
            future reviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (active) {
    const topic = data.topics.find(
      (t) => `${t.module_id}:${t.topic_tag}` === active,
    );
    if (!topic) {
      setActive(null);
      return null;
    }
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActive(null)}
          className="-ml-2"
        >
          ← Back to queue
        </Button>
        <TopicCard topic={topic} onCompleted={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-3xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/20">
        <CardContent className="py-4 flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">{data.total_due} topics due</p>
            <p className="text-[11px] text-muted-foreground">
              Spaced repetition keeps mastery sticky. Tackle a few each day.
            </p>
          </div>
        </CardContent>
      </Card>

      {data.topics.map((t) => {
        const key = `${t.module_id}:${t.topic_tag}`;
        let overdue: string | null = null;
        try {
          overdue = formatDistanceToNowStrict(new Date(t.due_at), {
            addSuffix: true,
          });
        } catch {
          /* noop */
        }
        return (
          <button
            key={key}
            onClick={() => setActive(key)}
            className="w-full text-left"
          >
            <Card className="rounded-2xl hover:border-primary/40 transition-colors">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold truncate">
                    {t.topic_tag}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.content_title ?? "Course"} ·{" "}
                    {t.module_title ?? "Module"}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {Math.round(t.mastery * 100)}% mastery
                    </Badge>
                    <span>·</span>
                    <span>{overdue ?? "due"}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
