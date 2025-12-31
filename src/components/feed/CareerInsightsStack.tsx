import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsightCard } from './InsightCard';
import { cn } from '@/lib/utils';

interface CareerInsightsStackProps {
  insights: string[];
  className?: string;
  maxVisible?: number;
}

export function CareerInsightsStack({ 
  insights, 
  className,
  maxVisible = 3 
}: CareerInsightsStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const visibleInsights = isExpanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Career Insights</h3>
        <span className="text-xs text-muted-foreground">({insights.length})</span>
      </div>

      {/* Vertical stack of insights */}
      <div className="space-y-2">
        {visibleInsights.map((insight, index) => (
          <div 
            key={index}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <InsightCard insight={insight} index={index} fullWidth />
          </div>
        ))}
      </div>

      {/* Show more/less button */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show {insights.length - maxVisible} more insights
            </>
          )}
        </Button>
      )}
    </div>
  );
}
