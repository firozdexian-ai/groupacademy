import { useState } from "react";
import { Play, BookOpen, Newspaper, FileText, ArrowRight, Bookmark, Share2, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularMatchBadge } from "./CircularMatchBadge";
import { SkillTagBadge } from "./SkillTagBadge";
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

export function FeedCardRedesigned({ item, onInterested, onNotInterested }: FeedCardRedesignedProps) {
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

  // CTO Mapping: Optimized icon and style lookup
  const typeConfigs: Record<string, { icon: any; style: string; gradient: string; label: string }> = {
    video: {
      icon: <Play className="h-3 w-3 fill-current" />,
      style: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/30",
      gradient: "from-rose-500/10 via-transparent to-transparent",
      label: "Watch Video",
    },
    course: {
      icon: <BookOpen className="h-3 w-3" />,
      style: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/30",
      gradient: "from-indigo-500/10 via-transparent to-transparent",
      label: "Start Course",
    },
    blog: {
      icon: <Newspaper className="h-3 w-3" />,
      style: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30",
      gradient: "from-amber-500/10 via-transparent to-transparent",
      label: "Read Article",
    },
    post: {
      icon: <FileText className="h-3 w-3" />,
      style: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/30",
      gradient: "from-emerald-500/10 via-transparent to-transparent",
      label: "View Post",
    },
  };

  const config = typeConfigs[item.type] || typeConfigs.post;
  const youtubeId = extractYouTubeId(item.youtubeUrl || "");
  const shareUrl = `${window.location.origin}/app/${item.type === "course" ? "courses" : "blog"}/${item.id}`;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-500 border-border/40 hover:border-primary/30 relative rounded-2xl bg-card/50 backdrop-blur-sm flex flex-col h-full">
      {/* Media Section: YouTube or Image */}
      <div className="relative overflow-hidden bg-muted shrink-0">
        {youtubeId ? (
          <div className="aspect-video w-full">
            {showYoutube ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full animate-in fade-in duration-500"
              />
            ) : (
              <div className="relative w-full h-full cursor-pointer group/yt" onClick={() => setShowYoutube(true)}>
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/yt:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/yt:bg-black/40 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transform transition-transform group-hover/yt:scale-110">
                    <Play className="h-6 w-6 text-rose-600 fill-current ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : item.mediaUrl ? (
          <div className="aspect-[2/1] w-full">
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className={cn("h-12 w-full bg-gradient-to-r border-b border-border/20", config.gradient)} />
        )}

        {/* Overlay Controls (Floating) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-90",
              isBookmarked ? "bg-primary text-white" : "bg-white/80 hover:bg-white text-foreground",
            )}
            onClick={handleToggleSave}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </Button>
          {item.matchScore !== undefined && (
            <div className="bg-white/80 backdrop-blur-md rounded-full p-0.5 shadow-lg">
              <CircularMatchBadge score={item.matchScore} size="sm" />
            </div>
          )}
        </div>

        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant="outline"
            className={cn("gap-1.5 backdrop-blur-md bg-white/80 border-none shadow-sm px-2 py-1", config.style)}
          >
            {config.icon}
            <span className="capitalize font-bold text-[10px] tracking-widest">{item.type}</span>
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex-1 space-y-3">
          <h3 className="font-bold text-[16px] leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>

          {item.skills && item.skills.length > 0 && (
            <SkillTagBadge skills={item.skills} maxVisible={3} className="opacity-90" />
          )}

          {item.matchReason && (
            <div className="flex items-start gap-2 bg-primary/[0.03] p-2.5 rounded-xl border border-primary/5">
              <Zap className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-2">
                {item.matchReason}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Footer Actions */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/20">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            className="flex-1 h-10 text-[11px] font-bold uppercase tracking-wider gap-2 rounded-xl group/btn transition-all hover:scale-[1.02] active:scale-95"
          >
            {item.type === "video" ? <ExternalLink className="h-3.5 w-3.5" /> : null}
            {config.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Button>

          <ShareSheet title={item.title} url={shareUrl} description={item.matchReason} />
        </div>
      </CardContent>
    </Card>
  );
}
