import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface CareerInsightsStackProps {
  insights: string[];
  className?: string;
  maxVisible?: number;
}

/**
 * Display card stack for tailored career insights and recommendations.
 * Optimized for mobile touch-viewports with embedded background monitoring.
 */
export function CareerInsightsStack({ insights, className, maxVisible = 3 }: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Log non-blocking telemetry data for dashboard optimization loops
  useEffect(() => {
    if (!insights || insights.length === 0) {
      trackEvent("insights_empty_payload", {
        timestamp: new Date().toISOString(),
      });
      return;
    }

    trackEvent("insights_stack_viewed", {
      count: insights.length,
      maxVisibleThreshold: maxVisible,
    });
  }, [insights, maxVisible]);

  if (!insights || insights.length === 0) return null;

  const visible = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  // Safely map individual insight strings into interactive cards
  const renderInsightCard = (insight: string, index: number) => {
    try {
      if (!insight || typeof insight !== "string") {
        throw new Error(`Invalid insight string found at index [${index}]`);
      }

      return (
        <Card
          key={index}
          className="p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/30 transition-all duration-200 shadow-sm content-visibility-auto"
        >
          <div className="flex gap-3 items-start">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed selection:bg-primary/20">{insight}</p>
          </div>
        </Card>
      );
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "CareerInsightsStack",
        action: "renderInsightCard",
        index,
        preview: String(insight).slice(0, 50),
      });
      return null;
    }
  };

  const handleExpansionToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    trackEvent("insights_expansion_toggled", {
      expanded: nextState,
      visibleCount: nextState ? insights.length : maxVisible,
    });
  };

  return (
    <div className={cn("space-y-4 select-none sm:select-text", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/5 shadow-inner">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground leading-tight tracking-tight">Insights for you</h3>
          <p className="text-xs text-muted-foreground">
            {insights.length} suggestion{insights.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3 transition-all duration-300 ease-in-out">
        {visible.map((insight, index) => renderInsightCard(insight, index))}
      </div>

      {/* View Toggle Control */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl active:scale-[0.99] transition-all"
          onClick={handleExpansionToggle}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 stroke-[2.5]" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 stroke-[2.5]" /> Show {insights.length - maxVisible} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}