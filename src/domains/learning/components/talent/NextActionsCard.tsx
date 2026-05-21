import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  review_due: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  practice_weakness: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  take_scenario: "text-primary bg-primary/10 border-primary/20",
  finish_module: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

/**
 * GroUp Academy: Adaptive Learning Continuum Director (NextActionsCard)
 * CTO Reference: Authoritative hub card analyzing competency analytics to dispatch personalized immediate action sequences.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function NextActionsCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading: loading, error: queryFetchError } = useNextActions();

  // Monitor total action directory element impressions safely via telemetry hooks
  useEffect(() => {
    if (data?.actions && data.actions.length > 0) {
      trackEvent("adaptive_next_actions_card_mounted", { actionsCount: data.actions.length });
    }
  }, [data]);

  // Route internal database parsing exceptions straight to background tracking logs
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

  // Phase Z0 Optimization: If counts handle cold-starts elsewhere on My Hub, drop views cleanly
  if (!data || data.actions.length === 0) {
    if (data && data.counts?.tracked_topics === 0 && data.counts?.active_enrollments === 0) {
      return null;
    }
    return null;
  }

  const handleActionRedirectClick = async (actionItem: NextAction, itemIndex: number) => {
    if (!actionItem || !actionItem.cta) return;

    trackEvent("adaptive_next_action_row_selected", {
      actionType: actionItem.type,
      targetCtaPath: actionItem.cta,
      positionIndex: itemIndex,
    });

    try {
      // Automated Efficiency: Synchronize cache indices globally to avoid state drift across shared loops
      await queryClient.invalidateQueries({ queryKey: ["next-actions"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      navigate(actionItem.cta);
    } catch (err) {
      trackError(err, {
        component: "NextActionsCard",
        action: "execute_action_redirect_navigation",
        targetCtaPath: actionItem.cta,
      });
    }
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none sm:select-text antialiased transform-gpu">
      {/* Decorative Glow Mesh backdrop Layer */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* FIXED TITLE HUD SECTION */}
      <CardHeader className="p-4 flex-row items-center gap-2 space-y-0 select-none border-b border-border/10">
        <Sparkles className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] animate-pulse" />
        <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
          Ecosystem Adaptive Directives
        </CardTitle>
      </CardHeader>

      {/* ACTION ROWS STACK SECTOR AREA */}
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
      {/* Icon frame shield layout vector */}
      <div
        className={cn(
          "h-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:rotate-2 shadow-sm select-none",
          TONE[a.type],
        )}
      >
        <Icon className="h-4 w-4 text-current stroke-[2.2]" />
      </div>

      {/* Typographic Metadata Container Node */}
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-snug truncate pr-1 select-text select-none group-hover:text-primary transition-colors">
          {a.title || "Continuity process model title heading missing."}
        </p>
        <p className="text-[11px] font-medium text-muted-foreground/80 tracking-tight truncate pr-1 select-all break-all leading-none mt-0.5">
          {a.reason || "Analyzing psychometric constraints profile."}
        </p>
      </div>

      {/* CTA Interactive Navigation trigger node button */}
      <Button
        size="sm"
        variant="ghost"
        type="button"
        className="h-8 px-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide text-primary shadow-none shrink-0 pointer-events-none select-none flex items-center gap-1 leading-none"
      >
        <span>{a.cta_label || "Execute Target"}</span>
        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </button>
  );
}
