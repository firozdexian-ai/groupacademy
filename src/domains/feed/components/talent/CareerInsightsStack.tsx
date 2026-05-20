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
 * Premium, performance-optimized Career Insights Stack with explicit Phase Z0 telemetry tracking.
 * Provides high-efficiency visual compilation for mobile PWA viewports while multiplexing
 * critical validation metrics back to the central Admin Dashboard.
 */
export function CareerInsightsStack({ insights, className, maxVisible = 3 }: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Safeguard platform layout state and log tracking telemetry on initial render window
  useEffect(() => {
    if (!insights || insights.length === 0) {
      trackEvent("CareerInsightsStack:empty_payload_rendered", {
        timestamp: new Date().toISOString(),
      });
      return;
    }

    trackEvent("CareerInsightsStack:mounted", {
      totalInsightsCount: insights.length,
      maxVisibleThreshold: maxVisible,
    });
  }, [insights, maxVisible]);

  if (!insights || insights.length === 0) return null;

  const visible = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  // Intercept layout array iterations safely to prevent downstream layout shell compilation crashes
  const renderInsightCard = (insight: string, index: number) => {
    try {
      if (!insight || typeof insight !== "string") {
        throw new Error(`Malformed index parsing chunk identified at positional offset [${index}]`);
      }

      return (
        <Card
          key={index}
          className="p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/30 transition-all duration-200 shadow-sm content-visibility-auto"
        >
          <div className="flex gap-3 items-start">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0 animate-pulse" />
            <p className="text-sm text-foreground leading-relaxed selection:bg-primary/20">{insight}</p>
          </div>
        </Card>
      );
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "CareerInsightsStack",
        action: "renderInsightCard",
        positionalIndex: index,
        payloadSlice: String(insight).slice(0, 50),
      });
      return null;
    }
  };

  const handleExpansionToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    trackEvent("CareerInsightsStack:user_expansion_toggled", {
      targetExpandedState: nextState,
      visibleItemsCount: nextState ? insights.length : maxVisible,
    });
  };

  return (
    <div className={cn("space-y-4 select-none sm:select-text", className)}>
      {/* Immersive Section Header */}
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

      {/* Render Filtered Visible Insight Nodes */}
      <div className="space-y-3 transition-all duration-300 ease-in-out">
        {visible.map((insight, index) => renderInsightCard(insight, index))}
      </div>

      {/* Interactive Expand Trigger Button */}
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
