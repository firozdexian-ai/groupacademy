import { useState, useEffect } from "react";
import { Play, BookOpen, Newspaper, FileText, ArrowRight, Bookmark, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularMatchBadge } from "./CircularMatchBadge";
import { ShareSheet } from "./ShareSheet";
import { HypeButton } from "./HypeButton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import { useSavedItems, SavedItemType } from "@/hooks/useSavedItems";
import type { HypeContentType } from "@/hooks/useContentHype";
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
    style: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/5",
    label: "Video",
    cta: "Watch Track",
  },
  course: {
    icon: <BookOpen className="h-3 w-3" />,
    style: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/5",
    label: "Course",
    cta: "Open Course",
  },
  blog: {
    icon: <Newspaper className="h-3 w-3" />,
    style: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5",
    label: "Article",
    cta: "Read Post",
  },
  post: {
    icon: <FileText className="h-3 w-3" />,
    style: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/5",
    label: "Post",
    cta: "View Update",
  },
};

export function FeedCardRedesigned({ item, onInterested, onNotInterested }: FeedCardRedesignedProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const [showYoutube, setShowYoutube] = useState(false);

  // Trace card impression metrics safely under Automated Efficiency guidelines
  useEffect(() => {
    if (item?.id) {
      trackEvent("feed_card_impression_rendered", {
        contentId: item.id,
        contentType: item.type,
        hasMatchScore: item.matchScore !== undefined,
      });
    }
  }, [item]);

  if (!item) {
    trackError("FeedCardRedesigned element mounted without active item property references.", {
      component: "FeedCardRedesigned",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const getSavedItemType = (): SavedItemType => {
    if (item.type === "post") return "blog";
    return (item.type as SavedItemType) || "blog";
  };

  const itemType = getSavedItemType();
  const isBookmarked = isSaved(item.id, itemType);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    trackEvent("feed_card_bookmark_toggled", { contentId: item.id, targetType: itemType, nextState: !isBookmarked });

    try {
      await toggleSave(item.id, itemType);
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "FeedCardRedesigned",
        action: "handleToggleSave_fault",
        contentId: item.id,
      });
    }
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("feed_card_cta_invoked", { contentId: item.id, contentType: item.type });
    onInterested();
  };

  const config = typeConfigs[item.type] || typeConfigs.post;
  const youtubeId = extractYouTubeId(item.youtubeUrl || "");
  const shareUrl = `${window.location.origin}/app/${item.type === "course" ? "courses" : "blog"}/${item.id}`;
  const hasMedia = !!youtubeId || !!item.mediaUrl;

  return (
    <Card className="group relative flex flex-col overflow-hidden border border-border/40 hover:border-primary/30 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm transition-all duration-300 w-full max-w-full">
      {hasMedia && (
        <div className="relative overflow-hidden bg-muted/20 border-b border-border/10 shrink-0 select-none aspect-video w-full">
          {youtubeId ? (
            <div className="w-full h-full">
              {showYoutube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none transform-gpu"
                />
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer group/yt"
                  onClick={() => {
                    setShowYoutube(true);
                    trackEvent("feed_card_youtube_playback_triggered", { contentId: item.id, youtubeId });
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/yt:scale-102"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/yt:bg-black/30 transition-colors duration-300">
                    <div className="w-12 h-12 rounded-full bg-background/95 dark:bg-background/90 text-rose-600 flex items-center justify-center shadow-md transform-gpu active:scale-90 transition-transform duration-200">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : item.mediaUrl ? (
            <div className="w-full h-full overflow-hidden">
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          {/* Absolute Top Control Layer Row */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-xl backdrop-blur-md border shadow-sm transition-all duration-200 active:scale-90 cursor-pointer",
                isBookmarked
                  ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-background/80 hover:bg-background border-border/40 text-foreground",
              )}
              onClick={handleToggleSave}
              aria-label={isBookmarked ? "Remove bookmark" : "Archive item bookmark"}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
            {item.matchScore !== undefined && (
              <div className="bg-background/80 dark:bg-background/90 backdrop-blur-md border border-border/40 rounded-xl p-0.5 shadow-sm">
                <CircularMatchBadge score={item.matchScore} size="sm" contextData={{ jobId: item.id }} />
              </div>
            )}
          </div>

          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge
              className={cn(
                "gap-1.5 backdrop-blur-md border px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-sm select-none tracking-wide uppercase",
                config.style,
              )}
            >
              {config.icon}
              {config.label}
            </Badge>
          </div>
        </div>
      )}

      {/* Primary Context Typography Layer */}
      <CardContent className="p-4 flex flex-col gap-2.5 flex-1 min-w-0">
        {!hasMedia && (
          <div className="flex items-center justify-between gap-2 select-none">
            <Badge
              className={cn(
                "gap-1.5 border px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase",
                config.style,
              )}
            >
              {config.icon}
              {config.label}
            </Badge>
            <button
              onClick={handleToggleSave}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center border border-transparent hover:border-border/40 transition-all cursor-pointer active:scale-90",
                isBookmarked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:bg-muted/40",
              )}
              aria-label="Toggle textual bookmark mapping"
            >
              <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
            </button>
          </div>
        )}

        <div className="space-y-1 w-full min-w-0 flex-1">
          <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-primary select-text transition-colors duration-200">
            {item.title}
          </h3>

          {item.matchReason && (
            <p className="text-[11px] font-medium text-muted-foreground/90 leading-normal line-clamp-2 select-text selection:bg-primary/10">
              {item.matchReason}
            </p>
          )}
        </div>

        {/* Operational Interactive Footer Strip Control Bar */}
        <div className="flex items-center gap-2 mt-1 pt-3 border-t border-border/30 w-full select-none">
          <Button
            onClick={handleCtaClick}
            size="sm"
            className="flex-1 h-9 text-xs font-bold gap-1.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {item.type === "video" && <ExternalLink className="h-3.5 w-3.5 shrink-0" />}
            <span>{config.cta}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Button>

          {(["course", "video", "blog"] as const).includes(item.type as any) && (
            <HypeButton
              contentType={item.type as HypeContentType}
              contentId={item.id}
              variant="compact"
              contextData={{ senderTalentId: item.id }}
            />
          )}

          <ShareSheet title={item.title} url={shareUrl} description={item.matchReason} />
        </div>
      </CardContent>
    </Card>
  );
}
