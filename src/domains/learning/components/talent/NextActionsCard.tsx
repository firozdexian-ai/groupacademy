import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sparkles, Clock, Target, PlayCircle, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNextActions, type NextAction, type NextActionType } from "@/domains/learning";

const ICON: Record<NextActionType, React.ComponentType<{ className?: string }>> = {
  review_due: Clock,
  practice_weakness: Target,
  take_scenario: PlayCircle,
  finish_module: BookOpen,
};

const TONE: Record<NextActionType, string> = {
  review_due: "text-destructive dark:text-destructive bg-destructive/10 border-destructive/20",
  practice_weakness: "text-warning dark:text-warning bg-warning/10 border-warning/20",
  take_scenario: "text-primary bg-primary/10 border-primary/20",
  finish_module: "text-success dark:text-success bg-success/10 border-success/20",
};

/**
 * GroUp Academy: Adaptive Learning Continuum Director (NextActionsCard)
 * Recommender card analyzing student performance metrics to dispatch personalized immediate study paths.
 */
export function NextActionsCard() {
  const navigate = useNavigate();
  const { data, isLoading: loading, error: queryFetchError } = useNextActions();

  // Monitor adaptive recommendation card views via telemetry hooks
  useEffect(() => {
    if (data?.actions && data.actions.length > 0) {
      trackEvent("adaptive_next_actions_card_mounted", { actionsCount: data.actions.length });
    }
  }, [data]);

  // Route database exceptions directly to background tracking networks
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "NextActionsCard",
        action: "fetch_useNextActions_hook_api",
      });
    }
  }, [queryFetchError]);

  if (loading && !data) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-pulse">
        <CardContent className="p-4 space-y-3.5 w-full">
          <Skeleton className="h-5 w-40 rounded-lg opacity-60" />
          <Skeleton className="h-14 w-full rounded-xl opacity-40" />
        </CardContent>
      </Card>
    );
  }

  // If counts handle cold-starts elsewhere on the hub, hide views cleanly to protect layout spacing
  if (!data || data.actions.length === 0) {
    if (data && data.counts?.tracked_topics === 0 && data.counts?.active_enrollments === 0) {
      return null;
    }
    return null;
  }

  const handleActionRedirectClick = (actionItem: NextAction, itemIndex: number) => {
    if (!actionItem || !actionItem.cta) return;

    trackEvent("adaptive_next_action_row_selected", {
      actionType: actionItem.type,
      targetCtaPath: actionItem.cta,
      positionIndex: itemIndex,
    });

    // Take immediate action by routing the student down their custom learning trajectory path
    navigate(actionItem.cta);
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none sm:select-text antialiased transform-gpu">
      {/* Decorative backdrop spotlight grid elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Panel Section */}
      <CardHeader className="p-4 flex-row items-center gap-2 space-y-0 select-none border-b border-b-muted-foreground/5 bg-muted/20">
        <Sparkles className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] animate-pulse" />
        <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
          Recommended for you
        </CardTitle>
      </CardHeader>

      {/* Action Rows Map Collection Block */}
      <CardContent className="p-4 space-y-2.5 w-full min-w-0">
        {data.actions.map((actionNodeItem, index) => {
          if (!actionNodeItem) return null;
          return (
            <ActionRow
              key={`${actionNodeItem.type}-${actionNodeItem.module_id ?? actionNodeItem.course_id ?? index}`}
              a={actionNodeItem}
              onGo={() => handleActionRedirectClick(actionNodeItem, index)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function ActionRow({ a, onGo }: { a: NextAction; onGo: () => void }) {
  const Icon = ICON[a.type] || Target;

  return (
    <button
      type="button"
      onClick={onGo}
      className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 p-3 hover:border-primary/20 hover:bg-card transition-all duration-200 transform-gpu cursor-pointer group shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-0"
    >
      {/* Icon Frame Shield Container Vector */}
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:rotate-2 shadow-sm select-none",
          TONE[a.type],
        )}
      >
        <Icon className="h-4 w-4 text-current stroke-[2.2]" />
      </div>

      {/* Typographic Metadata Frame Block */}
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-snug truncate pr-1 group-hover:text-primary transition-colors">
          {a.title || "Review Recommended Module"}
        </p>
        <p className="text-[11px] font-medium text-muted-foreground/80 tracking-tight truncate pr-1 selection:bg-primary/10 break-all leading-none mt-0.5">
          {a.reason || "Personalized recommendation based on your recent performance."}
        </p>
      </div>

      {/* Interactive Action Trigger Button Badge */}
      <Button
        size="sm"
        variant="ghost"
        type="button"
        className="h-8 px-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide text-primary shadow-none shrink-0 pointer-events-none select-none flex items-center gap-1 leading-none"
      >
        <span>{a.cta_label || "Start Activity"}</span>
        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </button>
  );
}
