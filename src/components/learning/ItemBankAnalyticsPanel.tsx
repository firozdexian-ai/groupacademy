import { useMemo, useState } from "react";
import { useItemAnalytics, type QuizItemStat, type ScenarioItemStat } from "@/hooks/useItemAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const FLAG_LABEL: Record<string, string> = {
  low_p_value: "Too hard",
  trivial: "Too easy",
  stale: "Stale",
  miscalibrated: "Miscalibrated",
  low_rubric: "Low rubric",
};

const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`;

const masteryTone = (v: number | null) => {
  if (v === null) return "text-muted-foreground";
  if (v < 0.4) return "text-destructive";
  if (v < 0.7) return "text-amber-500";
  return "text-success-green";
};

export interface ItemBankAnalyticsPanelProps {
  moduleId: string;
}

export function ItemBankAnalyticsPanel({ moduleId }: ItemBankAnalyticsPanelProps) {
  const { data, loading, error, refresh } = useItemAnalytics(moduleId);
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const quizItems = useMemo(() => {
    if (!data) return [];
    return onlyFlagged ? data.quiz_items.filter(q => q.needs_review.length > 0) : data.quiz_items;
  }, [data, onlyFlagged]);
  const scenarioItems = useMemo(() => {
    if (!data) return [];
    return onlyFlagged ? data.scenario_items.filter(s => s.needs_review.length > 0) : data.scenario_items;
  }, [data, onlyFlagged]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center space-y-3">
          <AlertTriangle className="h-6 w-6 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;
  const s = data.summary;

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Quiz items" value={s.quiz_items} />
        <Stat label="Scenarios" value={s.scenario_items} />
        <Stat label="Avg p-value" value={pct(s.avg_p_value)} tone={s.avg_p_value !== null && s.avg_p_value < 0.4 ? "warn" : "default"} />
        <Stat label="Need review" value={s.items_needing_review} tone={s.items_needing_review > 0 ? "warn" : "default"} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={onlyFlagged ? "default" : "outline"}
          onClick={() => setOnlyFlagged(v => !v)}
          className="text-[11px] uppercase tracking-widest"
        >
          {onlyFlagged ? "Show all" : "Only needs review"}
        </Button>
        <Button size="sm" variant="ghost" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Topics */}
      {data.topics.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Topics</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.topics.map(t => (
              <div key={t.topic_tag} className="flex items-center justify-between text-xs border-b border-border/30 last:border-0 py-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{t.topic_tag}</Badge>
                  <span className="text-muted-foreground">{t.items} item{t.items === 1 ? "" : "s"}</span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span title="Quiz p-value">Q {pct(t.avg_p_value)}</span>
                  <span title="Scenario score">S {pct(t.avg_scenario_score)}</span>
                  <span className={cn("font-bold", masteryTone(t.learner_mastery_mean))} title="Avg learner mastery">
                    M {pct(t.learner_mastery_mean)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quiz items */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Quiz items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {quizItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {onlyFlagged ? "No flagged quiz items." : "No quiz items in this module yet."}
            </p>
          )}
          {quizItems.map(q => <QuizRow key={q.id} q={q} />)}
        </CardContent>
      </Card>

      {/* Scenario items */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Scenarios</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {scenarioItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {onlyFlagged ? "No flagged scenarios." : "No scenarios in this module yet."}
            </p>
          )}
          {scenarioItems.map(s => <ScenarioRow key={s.id} s={s} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "warn" }) {
  return (
    <div className={cn(
      "rounded-xl border px-3 py-2",
      tone === "warn" ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-card",
    )}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className={cn("text-lg font-black tabular-nums", tone === "warn" && "text-destructive")}>{value}</p>
    </div>
  );
}

function FlagBadges({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map(f => (
        <Badge key={f} variant="destructive" className="text-[9px] px-1.5 py-0">
          {FLAG_LABEL[f] ?? f}
        </Badge>
      ))}
    </div>
  );
}

function QuizRow({ q }: { q: QuizItemStat }) {
  const tone = q.p_value === null ? "text-muted-foreground"
    : q.p_value < 0.3 ? "text-destructive"
    : q.p_value > 0.9 ? "text-amber-500"
    : "text-foreground";
  return (
    <div className="rounded-lg border border-border/30 p-2.5 space-y-1.5">
      <p className="text-xs line-clamp-2">{q.question}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1">
          {q.topic_tags.slice(0, 3).map(t => (
            <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
          ))}
          {q.difficulty && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 capitalize">{q.difficulty}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 tabular-nums">
          <span className="text-muted-foreground">{q.serves_lifetime} served</span>
          <span className={cn("font-bold", tone)}>p {pct(q.p_value)}</span>
        </div>
      </div>
      <FlagBadges flags={q.needs_review} />
    </div>
  );
}

function ScenarioRow({ s }: { s: ScenarioItemStat }) {
  const rubricKeys = Object.keys(s.avg_per_rubric);
  const tone = s.avg_overall === null ? "text-muted-foreground"
    : s.avg_overall < 0.4 ? "text-destructive"
    : s.avg_overall < 0.7 ? "text-amber-500"
    : "text-success-green";
  return (
    <div className="rounded-lg border border-border/30 p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium line-clamp-2">{s.title}</p>
        <span className={cn("text-xs font-bold tabular-nums shrink-0", tone)}>{pct(s.avg_overall)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1">
          {s.topic_tags.slice(0, 3).map(t => (
            <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
          ))}
        </div>
        <span className="text-muted-foreground tabular-nums">
          {s.runs_lifetime} runs · {s.runs_window} recent
        </span>
      </div>
      {rubricKeys.length > 0 && (
        <div className="grid grid-cols-2 gap-1 pt-1">
          {rubricKeys.map(k => (
            <div key={k} className="flex items-center gap-2 text-[10px]">
              <span className="capitalize text-muted-foreground truncate">{k}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round((s.avg_per_rubric[k] ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <FlagBadges flags={s.needs_review} />
    </div>
  );
}
