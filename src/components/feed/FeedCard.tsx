import { ThumbsUp, ThumbsDown, Play, BookOpen, Newspaper, FileText, Sparkles, Building2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/hooks/useFeedRecommendations";

/**
 * GroUp Academy: Neural Feed Node (FeedCard)
 * CTO Reference: Authoritative node for displaying AI-recommended content artifacts.
 */

interface FeedCardProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

export function FeedCard({ item, onInterested, onNotInterested }: FeedCardProps) {
  // PROTOCOL: Semantic Mapping for Content Archetypes
  const iconMap = {
    video: <Play className="h-3 w-3 fill-current" />,
    course: <BookOpen className="h-3 w-3" />,
    blog: <Newspaper className="h-3 w-3" />,
    post: <FileText className="h-3 w-3" />,
  };

  const styleMap = {
    video: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    course: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    blog: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    post: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const currentType = (item.type as keyof typeof iconMap) || "post";
  const score = item.matchScore || 0;

  return (
    <Card className="group relative overflow-hidden flex flex-col h-full transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-primary/30 border-2 border-border/40 bg-card/30 backdrop-blur-md rounded-[28px]">
      {/* HIGH-MATCH NEURAL GLOW */}
      {score >= 85 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none transition-opacity opacity-40 group-hover:opacity-100" />
      )}

      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-5 flex-1">
          {/* ARTIFACT VISUAL NODE */}
          <div className="relative shrink-0">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-[20px] border-2 border-border/40 shadow-sm transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div
                className={cn(
                  "w-24 h-24 rounded-[20px] flex items-center justify-center border-2 shadow-inner transition-all duration-500 group-hover:rotate-3",
                  styleMap[currentType],
                )}
              >
                <div className="scale-[1.8]">{iconMap[currentType]}</div>
              </div>
            )}
            <Badge
              className={cn(
                "absolute -bottom-2 -right-2 px-2 py-0.5 h-6 text-[8px] font-black uppercase italic tracking-widest shadow-xl border-2 rounded-lg",
                styleMap[currentType],
              )}
            >
              {item.type}
            </Badge>
          </div>

          {/* METADATA INGRESS */}
          <div className="flex-1 min-w-0 space-y-2 text-left">
            <div className="flex items-center gap-2">
              {item.company && (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] truncate opacity-60 group-hover:opacity-100 transition-opacity">
                  <Building2 className="h-3 w-3 text-primary" />
                  {item.company}
                </div>
              )}
            </div>

            <h3 className="font-black text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tighter uppercase italic">
              {item.title}
            </h3>

            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium">
              {item.description}
            </p>

            {/* NEURAL MATCH TELEMETRY */}
            {item.matchScore !== undefined && (
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={cn(
                        "h-3.5 w-3.5 animate-pulse",
                        score >= 80 ? "text-emerald-500 fill-emerald-500/20" : "text-amber-500 fill-amber-500/20",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase italic tracking-widest",
                        score >= 80 ? "text-emerald-600" : "text-amber-600",
                      )}
                    >
                      {score}% STRATEGIC_ALIGNMENT
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-border/5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-[2000ms] ease-out",
                      score >= 80 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-amber-500",
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
                {item.matchReason && (
                  <p className="text-[10px] text-muted-foreground/60 italic font-bold leading-tight">
                    {item.matchReason.toUpperCase()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ACTION ARCHITECTURE */}
        <div className="grid grid-cols-2 gap-3 mt-8 pt-4 border-t-2 border-border/10">
          <Button
            size="sm"
            className="h-11 text-[10px] font-black uppercase italic tracking-widest gap-2 rounded-xl shadow-lg active:scale-95 transition-all"
            onClick={onInterested}
          >
            <ThumbsUp className="h-4 w-4 fill-current" />
            Engage_Node
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 text-[10px] font-black uppercase italic tracking-widest gap-2 rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-all"
            onClick={onNotInterested}
          >
            <ThumbsDown className="h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
