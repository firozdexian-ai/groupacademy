import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles, ChevronRight, Clock, MessageSquare } from "lucide-react";
import { useMasterySummary } from "@/hooks/useMasterySummary";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";

interface AdaptiveSnapshotCardProps {
  /** Filter to a single module (per-course variant) */
  moduleId?: string;
  /** Filter to a single course's content */
  contentId?: string;
  /** Compact mode hides sparkline + signal split */
  compact?: boolean;
  className?: string;
}

function MasteryRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(1, value)) * c);
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} className="stroke-muted fill-none" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          className="stroke-primary fill-none transition-all"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
        {pct}%
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: Array<{ date: string; quiz: number; scenario: number }> }) {
  const totals = points.map((p) => p.quiz + p.scenario);
  const max = Math.max(1, ...totals);
  const w = 140;
  const h = 28;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const path = totals
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <path d={path} className="stroke-[hsl(183_75%_54%)] fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {totals.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - (v / max) * h} r={1.5} className="fill-primary" />
      ))}
    </svg>
  );
}

export function AdaptiveSnapshotCard({ moduleId, contentId, compact, className }: AdaptiveSnapshotCardProps) {
  const { data, isLoading: loading } = useMasterySummary({ moduleId, contentId, days: 7 });

  const nextDueLabel = useMemo(() => {
    if (!data?.totals.next_due_at) return null;
    try {
      return formatDistanceToNowStrict(new Date(data.totals.next_due_at), { addSuffix: true });
    } catch {
      return null;
    }
  }, [data?.totals.next_due_at]);

  if (loading) {
    return (
      <Card className={cn("rounded-2xl", className)}>
        <CardContent className="py-3 space-y-2">
          <Skeleton className="h-14 w-full" />
          {!compact && <Skeleton className="h-7 w-full" />}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Cold-start
  if (data.totals.tracked_topics === 0) {
    return (
      <Card className={cn("rounded-2xl border-dashed", className)}>
        <CardContent className="py-3 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            Take a quiz or run a scenario to start tracking your mastery.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dueNow = data.totals.due_now;

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardContent className="py-3 space-y-3">
        {/* Header row: ring + totals + CTA */}
        <div className="flex items-center gap-3">
          <MasteryRing value={data.totals.avg_mastery} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {data.totals.tracked_topics} topic{data.totals.tracked_topics === 1 ? "" : "s"} tracked
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {dueNow > 0 ? (
                <span className="text-primary font-semibold">{dueNow} due now</span>
              ) : (
                <>All caught up</>
              )}
              {nextDueLabel && <> · next {nextDueLabel}</>}
            </p>
          </div>
          {dueNow > 0 && (
            <Link
              to="/app/learning/review"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
            >
              Review <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Weakest topics */}
        {data.weakest.length > 0 && (
          <div className="space-y-1.5 border-t pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Needs work
            </p>
            {data.weakest.map((w, i) => (
              <Link
                key={`${w.module_id}:${w.topic_tag}:${i}`}
                to="/app/learning/review"
                className="flex items-center gap-2 text-[11px] hover:bg-muted/40 rounded-md -mx-1 px-1 py-0.5"
              >
                <Brain className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate flex-1 capitalize">
                  {w.topic_tag.replace(/_/g, " ")}
                  {w.module_title && (
                    <span className="text-muted-foreground"> · {w.module_title}</span>
                  )}
                </span>
                <span className="font-semibold tabular-nums">{Math.round(w.mastery * 100)}%</span>
              </Link>
            ))}
          </div>
        )}

        {/* Sparkline + signal split */}
        {!compact && (
          <div className="border-t pt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-bold uppercase tracking-wider">Last 7 days</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {data.signal_split_30d.quiz} quiz
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5" /> {data.signal_split_30d.scenario} scenario
                </span>
              </span>
            </div>
            <Sparkline points={data.sparkline} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
