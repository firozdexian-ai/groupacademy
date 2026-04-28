import { useState } from "react";
import {
  Play,
  BookOpen,
  Newspaper,
  FileText,
  ArrowRight,
  Bookmark,
  Share2,
  ExternalLink,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularMatchBadge } from "./CircularMatchBadge";
import { SkillTagBadge } from "./SkillTagBadge";
import { ShareSheet } from "./ShareSheet";
import { cn } from "@/lib/utils";
import { useSavedItems, SavedItemType } from "@/hooks/useSavedItems";
import type { FeedItem } from "@/hooks/useFeedRecommendations";

/**
 * GroUp Academy: Executive Feed Node (V3 Redesign)
 * CTO Reference: High-fidelity media ingestion node with neural matching telemetry.
 */

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

  // REGISTRY: Semantic Mapping for Pattern-Recognition Ingestion
  const typeConfigs: Record<string, { icon: any; style: string; gradient: string; label: string }> = {
    video: {
      icon: <Play className="h-3 w-3 fill-current" />,
      style: "text-rose-600 bg-rose-500/10 border-rose-500/20",
      gradient: "from-rose-500/20 via-transparent to-transparent",
      label: "INITIALIZE_VIDEO",
    },
    course: {
      icon: <BookOpen className="h-3 w-3" />,
      style: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
      gradient: "from-indigo-500/20 via-transparent to-transparent",
      label: "AUTHORIZE_COURSE",
    },
    blog: {
      icon: <Newspaper className="h-3 w-3" />,
      style: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      gradient: "from-amber-500/20 via-transparent to-transparent",
      label: "READ_ANALYSIS",
    },
    post: {
      icon: <FileText className="h-3 w-3" />,
      style: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      gradient: "from-emerald-500/20 via-transparent to-transparent",
      label: "VIEW_ARTIFACT",
    },
  };

  const config = typeConfigs[item.type] || typeConfigs.post;
  const youtubeId = extractYouTubeId(item.youtubeUrl || "");
  const shareUrl = `${window.location.origin}/app/${item.type === "course" ? "courses" : "blog"}/${item.id}`;

  return (
    <Card className="group relative flex flex-col h-full overflow-hidden transition-all duration-500 border-2 border-border/40 hover:border-primary/40 bg-card/30 backdrop-blur-md rounded-[32px] hover:shadow-2xl">
      {/* MEDIA INGRESS: YouTube Protocol or Image Node */}
      <div className="relative overflow-hidden bg-muted shrink-0 border-b-2 border-border/10">
        {youtubeId ? (
          <div className="aspect-video w-full">
            {showYoutube ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full animate-in fade-in zoom-in-95 duration-500"
              />
            ) : (
              <div className="relative w-full h-full cursor-pointer group/yt" onClick={() => setShowYoutube(true)}>
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/yt:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/yt:bg-black/50 transition-all duration-500">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] transform transition-transform group-hover/yt:scale-110">
                    <Play className="h-7 w-7 text-rose-600 fill-current ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : item.mediaUrl ? (
          <div className="aspect-[2/1] w-full overflow-hidden">
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          </div>
        ) : (
          <div className={cn("h-16 w-full bg-gradient-to-r", config.gradient)} />
        )}

        {/* FLOATING TELEMETRY CONTROLS */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-2xl backdrop-blur-xl shadow-2xl transition-all active:scale-90 border-2",
              isBookmarked
                ? "bg-primary text-white border-primary"
                : "bg-background/60 hover:bg-background border-white/20 text-foreground",
            )}
            onClick={handleToggleSave}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
          </Button>
          {item.matchScore !== undefined && (
            <div className="bg-background/60 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border-2 border-white/20">
              <CircularMatchBadge score={item.matchScore} size="sm" />
            </div>
          )}
        </div>

        <div className="absolute top-4 left-4 z-20">
          <Badge
            className={cn(
              "gap-2 backdrop-blur-xl border-2 shadow-xl px-3 py-1.5 rounded-xl font-black italic text-[9px] uppercase tracking-widest",
              config.style,
            )}
          >
            <Zap className="h-3 w-3 fill-current" />
            {item.type}
          </Badge>
        </div>
      </div>

      {/* PAYLOAD CONTENT SECTION */}
      <CardContent className="p-6 flex flex-col flex-1 text-left">
        <div className="flex-1 space-y-4">
          <h3 className="font-black text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 uppercase italic tracking-tighter">
            {item.title}
          </h3>

          {item.skills && item.skills.length > 0 && (
            <SkillTagBadge skills={item.skills} maxVisible={3} className="opacity-90" />
          )}

          {item.matchReason && (
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-[20px] border-2 border-primary/10">
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground font-bold italic leading-relaxed line-clamp-3">
                {item.matchReason.toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* EXECUTIVE ACTION STRIP */}
        <div className="flex items-center gap-3 mt-8 pt-5 border-t-2 border-border/10">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onInterested();
            }}
            className="flex-1 h-12 text-[10px] font-black uppercase italic tracking-[0.2em] gap-3 rounded-2xl group/btn shadow-xl active:scale-95 transition-all"
          >
            {item.type === "video" ? <ExternalLink className="h-4 w-4" /> : null}
            {config.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
          </Button>

          <ShareSheet title={item.title} url={shareUrl} description={item.matchReason} />
        </div>
      </CardContent>
    </Card>
  );
}
