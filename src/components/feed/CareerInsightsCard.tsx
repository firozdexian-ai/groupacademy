import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CareerInsightsCardProps {
  insights: string[];
  onRefresh: () => void;
  isRefreshing: boolean;
  hasGeneratedOnce: boolean;
}

export function CareerInsightsCard({ 
  insights, 
  onRefresh, 
  isRefreshing,
  hasGeneratedOnce 
}: CareerInsightsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (insights.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                Career Insights
                <Sparkles className="h-3 w-3 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">Personalized for your profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </div>
        </button>

        {/* Content */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-96 mt-4" : "max-h-0"
        )}>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 text-sm"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span className="text-foreground/90 leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>

          {/* Refresh Button */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {hasGeneratedOnce ? "Refresh costs 20 credits" : "First analysis is free"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs h-7"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Analyzing..." : "Refresh insights"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
