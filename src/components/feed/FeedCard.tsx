import { ThumbsUp, ThumbsDown, Play, BookOpen, Newspaper, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/hooks/useFeedRecommendations";

interface FeedCardProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

export function FeedCard({ item, onInterested, onNotInterested }: FeedCardProps) {
  const getTypeIcon = () => {
    switch (item.type) {
      case "video":
        return <Play className="h-3.5 w-3.5" />;
      case "course":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "blog":
        return <Newspaper className="h-3.5 w-3.5" />;
      case "post":
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getTypeBadgeStyles = () => {
    switch (item.type) {
      case "video":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "course":
        return "bg-accent/20 text-accent-foreground border-accent/30";
      case "blog":
        return "bg-secondary/20 text-secondary-foreground border-secondary/30";
      case "post":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMatchScoreColor = () => {
    const score = item.matchScore || 0;
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getProgressColor = () => {
    const score = item.matchScore || 0;
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-muted-foreground";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 group h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3 flex-1">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 ring-1 ring-border group-hover:ring-primary/20 transition-all"
            />
          ) : (
            <div
              className={cn(
                "w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-border bg-muted/30",
                getTypeBadgeStyles(),
              )}
            >
              {getTypeIcon()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header with type and company */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 gap-1", getTypeBadgeStyles())}>
                {getTypeIcon()}
                <span className="capitalize">{item.type}</span>
              </Badge>

              {item.company && (
                <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                  • {item.company}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-tight">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>

            {/* Match Score */}
            {item.matchScore !== undefined && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full pr-2">
                    <Sparkles className={cn("h-3.5 w-3.5", getMatchScoreColor())} />
                    <span className={cn("text-xs font-bold", getMatchScoreColor())}>{item.matchScore}% Match</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden w-full">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
                    style={{ width: `${item.matchScore}%` }}
                  />
                </div>
                {item.matchReason && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic">{item.matchReason}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <Button size="sm" className="flex-1 gap-2 shadow-sm" onClick={onInterested}>
            <ThumbsUp className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
            onClick={onNotInterested}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            Not for me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
