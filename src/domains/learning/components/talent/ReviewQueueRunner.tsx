import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  ChevronRight,
  MessageSquare,
  Zap,
  ArrowLeft,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useReviewQueue, type ReviewTopic } from "@/hooks/useReviewQueue";
import { formatDistanceToNowStrict } from "date-fns";
import { ModuleScenarioRunner } from "./ModuleScenarioRunner";

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
  if (Array.isArray(raw)) return raw.map((o) => String(o).trim());
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).map((o) => String(o).trim());
  }
  return [];
}

/**
 * GroUp Academy: Adaptive Topic Calibration Node (TopicCard)
 * An authoritative wrapper handling inline psychometric evaluation or scenario execution.
 */
function TopicCard({ topic, onCompleted }: { topic: ReviewTopic; onCompleted: () => void }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TopicResult | null>(null);

  // Monitor target review card impression timelines via telemetry hooks
  useEffect(() => {
    if (topic) {
      trackEvent("review_topic_card_mounted", {
        topicTag: topic.topic_tag,
        sourceChannel: topic.source,
        masteryLevel: topic.mastery,
      });
    }
  }, [topic]);

  const normalizedItems = useMemo(
    () =>
      (topic.items || []).map((it) => ({
        ...it,
        options: normalizeOptions(it.options),
      })),
    [topic.items],
  );

  const overdueLabel = useMemo(() => {
    if (!topic.due_at) return null;
    try {
      return formatDistanceToNowStrict(new Date(topic.due_at), { addSuffix: true });
    } catch (err) {
      return null;
    }
  }, [topic.due_at]);

  const submit = async () => {
    if (normalizedItems.some((i) => answers[i.id] === undefined)) {
      toast.error("Please configure entries over all outstanding questionnaire parameters.");
      return;
    }

    setSubmitting(true);
    let isRequestAlive = true;
    const toastId = toast.loading("Processing space retention verification payload...");

    const item_ids = normalizedItems.map((i) => i.id);
    const ans = item_ids.map((id) => answers[id]);

    trackEvent("review_topic_quiz_dispatched", { topicTag: topic.topic_tag, itemsCount: item_ids.length });

    try {
      const { data, error } = await supabase.functions.invoke("learner-quiz-pool", {
        body: {
          mode: "submit",
          module_id: topic.module_id,
          item_ids,
          answers: ans,
        },
      });

      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Synapse ledger verification failed.");
      }

      if (isRequestAlive) {
        setResult({
          score: (data as any).score,
          results: (data as any).results,
        });

        // Automated Efficiency: Synchronize cache streams immediately to cascade updated weight dimensions
        queryClient.invalidateQueries({ queryKey: ["review-queue"] });
        queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
        queryClient.invalidateQueries({ queryKey: ["item-analytics"] });

        toast.success("Retention metrics calibrated successfully.", { id: toastId });
        trackEvent("review_topic_quiz_success", { topicTag: topic.topic_tag, score: (data as any).score });

        onCompleted();
      }
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "TopicCard",
        action: "submit_review_quiz_api",
        topicTag: topic.topic_tag,
      });

      toast.error(`Ledger transaction error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      if (isRequestAlive) setSubmitting(false);
    }
  };

  if (topic.source === "scenario") {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full animate-in fade-in duration-300">
        <CardHeader className="p-4 border-b border-border/10 select-none bg-muted/20">
          <div className="flex items-start justify-between gap-4 w-full min-w-0">
            <div className="space-y-0.5 min-w-0 flex-1">
              <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
                <span className="truncate text-ellipsis block pr-1">{topic.topic_tag}</span>
              </CardTitle>
              <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight italic">
                {topic.content_title ?? "Ecosystem Course"} &bull; {topic.module_title ?? "Target Module"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-[9px] font-extrabold px-2 h-5 bg-primary/5 text-primary border-primary/20 uppercase tracking-wide rounded"
            >
              Interactive Simulation
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[10px] font-bold text-muted-foreground/60 select-none tabular-nums leading-none">
            <span className="bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
              Mean Mastery: {Math.round(topic.mastery * 100)}%
            </span>
            <span>&bull;</span>
            <span className="bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
              Horizon Interval: {topic.interval_days}d
            </span>
            {overdueLabel && (
              <>
                <span>&bull;</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold uppercase text-[9px] tracking-wide animate-pulse">
                  {overdueLabel}
                </span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 w-full min-w-0">
          <ModuleScenarioRunner moduleId={topic.module_id} onComplete={onCompleted} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full animate-in fade-in duration-300">
      <CardHeader className="p-4 border-b border-border/10 select-none bg-muted/20">
        <div className="flex items-start justify-between gap-4 w-full min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1">
            <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span className="truncate text-ellipsis block pr-1">{topic.topic_tag}</span>
            </CardTitle>
            <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight italic">
              {topic.content_title ?? "Ecosystem Course"} &bull; {topic.module_title ?? "Target Module"}
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 text-[9px] font-extrabold px-2 h-5 bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wide rounded animate-pulse shadow-sm"
          >
            <Clock className="h-3 w-3 mr-1 shrink-0 stroke-[2.2]" />
            <span>{overdueLabel || "due framework"}</span>
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[10px] font-bold text-muted-foreground/60 select-none tabular-nums leading-none">
          <span className="bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
            Mastery: {Math.round(topic.mastery * 100)}%
          </span>
          <span>&bull;</span>
          <span className="bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
            Ease Scale: {topic.ease.toFixed(2)}
          </span>
          <span>&bull;</span>
          <span className="bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
            Interval Index: {topic.interval_days}d
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0">
        {result ? (
          <div className="space-y-3 w-full min-w-0 font-bold text-xs">
            <div className="flex items-center gap-3 select-none leading-none border-b border-border/5 pb-2">
              <Progress value={result.score} className="flex-1 h-1.5 rounded-full shadow-inner shadow-sm" />
              <span className="font-extrabold text-primary tabular-nums shrink-0 bg-primary/5 border rounded px-1.5 py-0.5">
                {Math.round(result.score)}% Verified Parity
              </span>
            </div>

            {normalizedItems.map((it, idx) => {
              const r: any = result.results[idx] || { correct: false };
              const isCorrectNode = !!r.correct;
              return (
                <div
                  key={it.id}
                  className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-sm p-3.5 space-y-2 text-left w-full min-w-0 shadow-sm animate-in fade-in duration-150"
                >
                  <div className="flex items-start gap-2.5 w-full min-w-0 leading-snug">
                    {isCorrectNode ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    )}
                    <p className="text-xs sm:text-sm font-bold text-foreground/90 break-words flex-1 select-text">
                      {it.question}
                    </p>
                  </div>

                  {!isCorrectNode && r.correct_index !== undefined && (
                    <p className="text-[11px] sm:text-xs pl-7 font-bold text-emerald-700 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg leading-tight select-text select-all">
                      <span className="font-extrabold uppercase text-[9px] block mb-0.5 opacity-60 select-none">
                        Reconciled Valid Lock Target
                      </span>
                      <span>{it.options[r.correct_index]}</span>
                    </p>
                  )}

                  {r.explanation && (
                    <div className="p-3 pl-3.5 rounded-lg border border-border/20 bg-muted/20 select-text font-medium text-muted-foreground/90 italic leading-relaxed break-words shadow-inner text-[11px] sm:text-xs">
                      <span className="font-bold uppercase tracking-wider text-[9px] text-primary not-italic block mb-1 select-none leading-none pl-0.5">
                        Ecosystem Synapse Rationale
                      </span>
                      <p className="pl-0.5">&ldquo;{r.explanation.trim()}&rdquo;</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {normalizedItems.map((it, idx) => (
              <div
                key={it.id}
                className="space-y-2.5 w-full min-w-0 border-b border-border/10 pb-4 last:border-none last:pb-0"
              >
                <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-relaxed select-text break-words pr-1">
                  {idx + 1}. {it.question}
                </p>

                <div className="grid gap-2 w-full select-none font-bold text-xs sm:text-sm">
                  {it.options.map((opt, oi) => {
                    const isOptionChecked = answers[it.id] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={submitting}
                        onClick={() => setAnswers((a) => ({ ...a, [it.id]: oi }))}
                        className={cn(
                          "w-full text-left text-xs sm:text-sm rounded-xl border p-3 transition-all duration-200 cursor-pointer transform-gpu active:scale-[0.995] outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-start gap-3 shadow-sm font-semibold",
                          isOptionChecked
                            ? "border-primary bg-primary/5 text-primary font-bold shadow-inner"
                            : "border-border/40 hover:border-border/60 bg-background/40 hover:bg-background",
                        )}
                      >
                        <span
                          className={cn(
                            "h-5 w-5 rounded-md flex items-center justify-center border text-[10px] font-mono shrink-0 select-none",
                            isOptionChecked
                              ? "bg-primary/10 border-primary/20 text-primary font-bold"
                              : "bg-muted border-border/40 text-muted-foreground",
                          )}
                        >
                          {String.fromCharCode(64 + oi + 1)}
                        </span>
                        <span className="flex-1 min-w-0 pt-0.5 break-words leading-tight">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Button
              onClick={submit}
              disabled={submitting || normalizedItems.length === 0}
              className="w-full h-11 rounded-xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-transform select-none cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary-foreground shrink-0 stroke-[2.5]" />
              )}
              <span>Commit Calibrated Review Entry</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * GroUp Academy: Spaced Repetition Calibration Dashboard Queue Terminal (ReviewQueueRunner)
 * An authoritative system node rendering pending knowledge synthesis revision items.
 */
export function ReviewQueueRunner() {
  const [active, setActive] = useState<string | null>(null);

  // Dynamic Server State Ingress via custom React Query hooks
  const { data, loading, error, reload } = useReviewQueue({
    limit: 10,
    itemsPerTopic: 4,
  });

  // Monitor retention summary profiles view tracking paths via telemetry logs
  useEffect(() => {
    trackEvent("spaced_repetition_review_queue_mounted");
  }, []);

  // Monitor internal database extraction exceptions via analytics tracking pipelines
  useEffect(() => {
    if (error) {
      trackError(error, {
        component: "ReviewQueueRunner",
        action: "fetch_useReviewQueue_hook_api",
      });
    }
  }, [error]);

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-in scale-in duration-200">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3.5 text-center w-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 animate-pulse">
            Assembling Spaced Repetition Calibration Backlog…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-rose-500/20 bg-rose-500/5 rounded-2xl text-left w-full max-w-full">
        <CardContent className="p-5 text-center space-y-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="h-5 w-5 text-rose-500 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
              Telemetry Channel Intercepted
            </p>
            <p className="text-xs font-medium italic text-muted-foreground/80 leading-normal select-text selection:bg-rose-500/10 mt-1.5">
              {error || "Ecosystem calibration link dropped."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => reload()}
            className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Re-establish Ingress Sync</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.topics.length === 0) {
    return (
      <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-md mx-auto flex flex-col justify-center items-center animate-in fade-in duration-300 py-10">
        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3.5 border border-emerald-500/5 shadow-inner">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
        </div>
        <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
          Ecosystem Calibrated Clean
        </h3>
        <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic">
          No baseline memory parameters are currently due for review inside your retention framework. Keep practicing
          active modules to seed the repetition ledger.
        </p>
      </Card>
    );
  }

  if (active) {
    const topic = data.topics.find((t) => `${t.module_id}:${t.topic_tag}` === active);
    if (!topic) {
      setActive(null);
      return null;
    }
    return (
      <div className="space-y-4 text-left w-full min-w-0 transform-gpu animate-in slide-in-from-left-2 duration-200">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            trackEvent("review_queue_back_to_catalog_clicked");
            setActive(null);
          }}
          className="h-8 px-2.5 rounded-xl text-[10px] font-bold uppercase border tracking-tight flex items-center gap-1.5 cursor-pointer shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent -ml-0.5 select-none"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Return back to revision backlog</span>
        </Button>
        <TopicCard topic={topic} onCompleted={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-3 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD HEADER COVER BANNER ELEMENT */}
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-cyan-500/[0.03] dark:from-primary/[0.02] dark:to-cyan-500/[0.01] rounded-2xl shadow-sm overflow-hidden select-none w-full">
        <CardContent className="p-4 flex items-center gap-3.5 text-left w-full">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner">
            <Brain className="h-5 w-5 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
            <p className="text-sm font-bold text-foreground/90 tracking-tight leading-none tabular-nums">
              {data.total_due.toLocaleString()} Revision Targets Outstanding
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground/80 mt-1.5 leading-normal tracking-tight italic">
              Automated spacing retention arrays reinforce knowledge optimization maps. Tackle outstanding nodes daily
              to secure trajectory fit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMIC LISTING STREAM CONTAINER */}
      <div className="space-y-2 w-full min-w-0">
        {data.topics.map((t) => {
          if (!t || !t.topic_tag) return null;

          const key = `${t.module_id}:${t.topic_tag}`;
          let overdueStringValue: string | null = null;

          try {
            overdueStringValue = formatDistanceToNowStrict(new Date(t.due_at), { addSuffix: true });
          } catch (chronologyErr) {
            /* noop */
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                trackEvent("review_queue_item_node_selected", { topicTag: t.topic_tag, moduleTarget: t.module_id });
                setActive(key);
              }}
              className="w-full text-left outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-2xl block group transform-gpu cursor-pointer"
            >
              <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:border-primary/30 hover:bg-card/80 flex items-center w-full min-w-0">
                <CardContent className="p-3.5 flex items-center justify-between gap-4 w-full min-w-0">
                  <div className="flex-1 min-w-0 text-left space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight truncate text-ellipsis pr-1 group-hover:text-primary transition-colors select-text">
                      {t.topic_tag}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight pr-1 italic select-text">
                      {t.content_title ?? "Ecosystem Course"} &bull; {t.module_title ?? "Target Module"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground/60 select-none tabular-nums leading-none pt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-extrabold px-1.5 h-4.5 rounded uppercase tracking-wide bg-background/50 border-border/40 text-muted-foreground shadow-sm"
                      >
                        {Math.round(t.mastery * 100)}% mastery scale
                      </Badge>

                      {t.source === "scenario" && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-extrabold px-1.5 h-4.5 rounded uppercase tracking-wide border-primary/20 bg-primary/5 text-primary shadow-sm gap-0.5 flex items-center"
                        >
                          <MessageCircle className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
                          <span>Simulation</span>
                        </Badge>
                      )}
                      <span className="opacity-40 font-normal">&bull;</span>
                      <span className="text-muted-foreground/70 font-semibold">
                        {overdueStringValue || "due framework"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5] shrink-0" />
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
