import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./InsightCard";
import { cn } from "@/lib/utils";

interface CareerInsightsStackProps {
  insights: string[];
  className?: string;
  maxVisible?: number;
}

export function CareerInsightsStack({ insights, className, maxVisible = 3 }: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const visibleInsights = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  return (
    <div className={cn("space-y-4 py-2", className)}>
      {/* Header with Semantic Counter */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-foreground">Career Intelligence</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {insights.length} Strategic Data Points
            </p>
          </div>
        </div>
      </div>

      {/* Vertical stack with staggered entry animation */}
      <div
        className={cn(
          "space-y-3 relative transition-all duration-500 ease-in-out",
          !isExpanded &&
            hasMore &&
            "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-background after:to-transparent after:pointer-events-none",
        )}
      >
        {visibleInsights.map((insight, index) => (
          <div
            key={index}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <InsightCard
              insight={insight}
              index={index}
              fullWidth
              className={cn(
                "border-primary/5 bg-gradient-to-r from-background to-primary/[0.01]",
                !isExpanded && index === maxVisible - 1 && "opacity-60 scale-[0.98] blur-[0.5px]",
              )}
            />
          </div>
        ))}
      </div>

      {/* Show more/less button with Enhanced Interaction */}
      {hasMore && (
        <div className="pt-2 px-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full text-xs font-bold uppercase tracking-tighter h-10 rounded-xl transition-all",
              "border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
              isExpanded ? "bg-muted/30" : "bg-background shadow-sm",
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-2" />
                Collapse Insights
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-2" />
                View {insights.length - maxVisible} Additional Analysis
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
