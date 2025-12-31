import { ThumbsUp, ThumbsDown, Briefcase, Play, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/hooks/useFeedRecommendations';

interface FeedCardProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

export function FeedCard({ item, onInterested, onNotInterested }: FeedCardProps) {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'job':
        return <Briefcase className="h-3.5 w-3.5" />;
      case 'video':
        return <Play className="h-3.5 w-3.5" />;
      case 'course':
        return <BookOpen className="h-3.5 w-3.5" />;
    }
  };

  const getTypeBadgeStyles = () => {
    switch (item.type) {
      case 'job':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'video':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'course':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
    }
  };

  const getMatchScoreColor = () => {
    const score = item.matchScore || 0;
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  const getProgressColor = () => {
    const score = item.matchScore || 0;
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-muted-foreground';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {item.thumbnail && (
            <img 
              src={item.thumbnail} 
              alt={item.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 ring-1 ring-border"
            />
          )}
          <div className="flex-1 min-w-0">
            {/* Header with type and company */}
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className={cn('text-xs gap-1', getTypeBadgeStyles())}>
                {getTypeIcon()}
                <span className="capitalize">{item.type}</span>
              </Badge>
              {item.company && (
                <span className="text-xs text-muted-foreground truncate">{item.company}</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{item.title}</h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>

            {/* Match Score */}
            {item.matchScore !== undefined && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={cn("h-3.5 w-3.5", getMatchScoreColor())} />
                    <span className={cn("text-sm font-medium", getMatchScoreColor())}>
                      {item.matchScore}% Match
                    </span>
                  </div>
                  {item.matchReason && (
                    <span className="text-xs text-muted-foreground truncate max-w-[50%]">
                      {item.matchReason}
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
                    style={{ width: `${item.matchScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={onInterested}
          >
            <ThumbsUp className="h-4 w-4" />
            Interested
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 gap-2"
            onClick={onNotInterested}
          >
            <ThumbsDown className="h-4 w-4" />
            Not for me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
