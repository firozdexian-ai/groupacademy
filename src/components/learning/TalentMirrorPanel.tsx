import { useNavigate } from "react-router-dom";
import { useTalentMirror, type TalentMirrorCourse, type TalentMirrorTopic } from "@/hooks/useTalentMirror";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`;

const tone = (v: number | null) => {
  if (v === null) return "text-muted-foreground";
  if (v < 0.4) return "text-destructive";
  if (v < 0.7) return "text-amber-500";
  return "text-success-green";
};

export function TalentMirrorPanel() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useTalentMirror();

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center space-y-3">
          <AlertTriangle className="h-6 w-6 mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  if (data.summary.topics === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-primary/40" />
          <p className="text-sm font-medium">Your Talent Mirror is empty</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Take a quiz or scenario in any course to start tracking your mastery across programs.
          </p>
          <Button size="sm" onClick={() => navigate("/app/learning?tab=my-courses")}>
            Go to my courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  const s = data.summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Courses" value={s.courses} />
        <Stat label="Topics tracked" value={s.topics} />
        <Stat label="Avg mastery" value={pct(s.avg_mastery)} />
        <Stat label="Due now" value={s.due_now} tone={s.due_now > 0 ? "warn" : "default"} />
      </div>

      <div className="text-[11px] text-muted-foreground flex items-center gap-3">
        <span>{data.signal_split.quiz} quiz signals</span>
        <span>•</span>
        <span>{data.signal_split.scenario} scenario signals</span>
        {s.due_now > 0 && (
          <Button
            size="sm"
            variant="link"
            className="ml-auto h-auto p-0 text-xs"
            onClick={() => navigate("/app/learning/review")}
          >
            Review now <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {data.weakest_topics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weakest topics across all courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.weakest_topics.map(t => <TopicRow key={t.content_id + t.topic_tag} t={t} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Mastery by course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.courses.map(c => (
            <CourseRow key={c.content_id} c={c} onOpen={() => navigate(`/content/${c.slug ?? c.content_id}`)} />
          ))}
        </CardContent>
      </Card>

      {data.strongest_topics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Strongest topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.strongest_topics.map(t => <TopicRow key={"s-" + t.content_id + t.topic_tag} t={t} />)}
          </CardContent>
        </Card>
      )}
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

function TopicRow({ t }: { t: TalentMirrorTopic }) {
  return (
    <div className="flex items-center justify-between text-xs border-b border-border/30 last:border-0 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{t.topic_tag}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {t.course_title}{t.module_title ? ` · ${t.module_title}` : ""}
        </p>
      </div>
      <span className={cn("text-sm font-bold tabular-nums shrink-0", tone(t.mastery))}>{pct(t.mastery)}</span>
    </div>
  );
}

function CourseRow({ c, onOpen }: { c: TalentMirrorCourse; onOpen: () => void }) {
  return (
    <div className="rounded-xl border border-border/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{c.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {c.modules} modules · {c.topics} topics{c.due_now > 0 ? ` · ${c.due_now} due` : ""}
          </p>
        </div>
        <span className={cn("text-base font-black tabular-nums shrink-0", tone(c.avg_mastery))}>
          {pct(c.avg_mastery)}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.round(c.avg_mastery * 100)}%` }} />
      </div>
      {c.weakest.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {c.weakest.map(w => (
            <Badge key={w.topic_tag} variant="outline" className="text-[9px] px-1.5 py-0">
              {w.topic_tag} {pct(w.mastery)}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={onOpen}>
          Open course <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
