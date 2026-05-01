import { useState } from "react";
import { Play, BookOpen, Newspaper, FileText, ArrowRight, Bookmark, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularMatchBadge } from "./CircularMatchBadge";
import { ShareSheet } from "./ShareSheet";
import { cn } from "@/lib/utils";
import { useSavedItems, SavedItemType } from "@/hooks/useSavedItems";
import type { FeedItem } from "@/hooks/useFeedRecommendations";

interface FeedCardRedesignedProps {
  item: FeedItem;
  onInterested: () => void;
  onNotInterested: () => void;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

const typeConfigs: Record<string, { icon: any; style: string; label: string; cta: string }> = {
  video: {
    icon: <Play className="h-3 w-3 fill-current" />,
    style: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    label: "Video",
    cta: "Watch",
  },
  course: {
    icon: <BookOpen className="h-3 w-3" />,
    style: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
    label: "Course",
    cta: "Open course",
  },
  blog: {
    icon: <Newspaper className="h-3 w-3" />,
    style: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    label: "Article",
    cta: "Read",
  },
  post: {
    icon: <FileText className="h-3 w-3" />,
    style: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    label: "Post",
    cta: "View",
  },
};

export function FeedCardRedesigned({ item, onInterested }: FeedCardRedesignedProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const [showYoutube, setShowYoutube] = useState(false);

  const getSavedItemType = (): SavedItemType => {
    if (item.type === "post") return "blog";
    return (item.type as SavedItemType) || "blog";
  };

  const itemType = getSavedItemType();
  const isBookmarked = isSaved(item.id, itemType);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSave(item.id, itemType);
  };

  const config = typeConfigs[item.type] || typeConfigs.post;
  const youtubeId = extractYouTubeId(item.youtubeUrl || "");
  const shareUrl = `${window.location.origin}/app/${item.type === "course" ? "courses" : "blog"}/${item.id}`;
  const hasMedia = !!youtubeId || !!item.mediaUrl;

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all border border-border/40 hover:border-primary/40 bg-card rounded-2xl">
      {hasMedia && (
        <div className="relative overflow-hidden bg-muted shrink-0">
          {youtubeId ? (
            <div className="aspect-video w-full">
              {showYoutube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="relative w-full h-full cursor-pointer" onClick={() => setShowYoutube(true)}>
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                      <Play className="h-5 w-5 text-rose-600 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : item.mediaUrl ? (
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ) : null}

          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg backdrop-blur-md transition-all active:scale-90",
                isBookmarked
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/80 hover:bg-background text-foreground",
              )}
              onClick={handleToggleSave}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
            {item.matchScore !== undefined && (
              <div className="bg-background/80 backdrop-blur-md rounded-lg p-0.5">
                <CircularMatchBadge score={item.matchScore} size="sm" />
              </div>
            )}
          </div>

          <div className="absolute top-2 left-2 z-10">
            <Badge className={cn("gap-1 backdrop-blur-md border px-2 py-0.5 rounded-md text-[10px] font-medium", config.style)}>
              {config.icon}
              {config.label}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-3 flex flex-col gap-2">
        {!hasMedia && (
          <div className="flex items-center justify-between">
            <Badge className={cn("gap-1 border px-2 py-0.5 rounded-md text-[10px] font-medium", config.style)}>
              {config.icon}
              {config.label}
            </Badge>
            <button
              onClick={handleToggleSave}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                isBookmarked ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
            </button>
          </div>
        )}

        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {item.matchReason && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">{item.matchReason}</p>
        )}

        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border/40">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            size="sm"
            className="flex-1 h-9 text-xs gap-1.5 rounded-lg"
          >
            {item.type === "video" && <ExternalLink className="h-3.5 w-3.5" />}
            {config.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <ShareSheet title={item.title} url={shareUrl} description={item.matchReason} />
        </div>
      </CardContent>
    </Card>
  );
}
