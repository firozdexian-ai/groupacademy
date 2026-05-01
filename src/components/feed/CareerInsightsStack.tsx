import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CareerInsightsStackProps {
  insights: string[];
  className?: string;
  maxVisible?: number;
}

export function CareerInsightsStack({ insights, className, maxVisible = 3 }: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const visible = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground leading-tight">Insights for you</h3>
          <p className="text-xs text-muted-foreground">{insights.length} suggestion{insights.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((insight, index) => (
          <Card
            key={index}
            className="p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/30 transition-colors"
          >
            <div className="flex gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Show {insights.length - maxVisible} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
