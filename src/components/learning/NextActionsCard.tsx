import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock, Target, PlayCircle, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNextActions, type NextAction, type NextActionType } from "@/hooks/useNextActions";

const ICON: Record<NextActionType, React.ComponentType<{ className?: string }>> = {
  review_due: Clock,
  practice_weakness: Target,
  take_scenario: PlayCircle,
  finish_module: BookOpen,
};

const TONE: Record<NextActionType, string> = {
  review_due: "text-destructive bg-destructive/10",
  practice_weakness: "text-amber-500 bg-amber-500/10",
  take_scenario: "text-primary bg-primary/10",
  finish_module: "text-success-green bg-success-green/10",
};

export function NextActionsCard() {
  const navigate = useNavigate();
  const { data, loading } = useNextActions();

  if (loading && !data) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }
  if (!data || data.actions.length === 0) {
    if (data && data.counts.tracked_topics === 0 && data.counts.active_enrollments === 0) {
      return null; // Cold start handled elsewhere on My Hub
    }
    return null;
  }

  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
        <Sparkles className="h-4 w-4 text-primary" />
        <CardTitle className="text-sm font-black uppercase tracking-widest">What to do next</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.actions.map((a, i) => (
          <ActionRow key={`${a.type}-${a.module_id ?? a.course_id ?? i}`} a={a} onGo={() => navigate(a.cta)} />
        ))}
      </CardContent>
    </Card>
  );
}

function ActionRow({ a, onGo }: { a: NextAction; onGo: () => void }) {
  const Icon = ICON[a.type];
  return (
    <button
      type="button"
      onClick={onGo}
      className="w-full text-left flex items-center gap-3 rounded-xl border border-border/30 px-3 py-2.5 hover:bg-muted/40 transition group"
    >
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", TONE[a.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold line-clamp-1">{a.title}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-1">{a.reason}</p>
      </div>
      <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0 text-[11px] uppercase tracking-widest font-bold">
        {a.cta_label}
        <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </button>
  );
}
