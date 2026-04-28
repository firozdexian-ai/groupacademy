import { useState } from "react";
import { Pin, ExternalLink, Play, MoreHorizontal, MessageSquare, Zap, Target, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { PostAuthor } from "./PostAuthor";
import { ReactionBar } from "./ReactionBar";
import { PollWidget } from "./PollWidget";
import { ShareSheet } from "./ShareSheet";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePollVoting } from "@/hooks/usePollVoting";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Atomic Content Node (PostCard)
 * CTO Reference: Authoritative hub for social artifacts, polls, and media.
 */

interface PollOption {
  id: string;
  text: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorTitle?: string;
  contentType: "text" | "poll" | "tip" | "news" | "announcement" | "media";
  textContent: string;
  mediaUrl?: string;
  pollOptions?: PollOption[];
  pollEndsAt?: string;
  linkUrl?: string;
  linkPreview?: { title: string; description?: string; image?: string };
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { reactions, userReaction, toggleReaction, isLoading: reactionsLoading } = usePostReactions(post.id);

  const pollOptions = post.pollOptions || [];
  const {
    hasVoted,
    userVote,
    results,
    totalVotes,
    castVote,
    isLoading: pollLoading,
  } = usePollVoting(post.id, pollOptions);

  const isLongText = post.textContent.length > 280;
  const displayText = isLongText && !isExpanded ? post.textContent.slice(0, 280) + "..." : post.textContent;
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  const getContentTypeBadge = () => {
    switch (post.contentType) {
      case "tip":
        return { label: "NEURAL_TIP", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Zap };
      case "news":
        return {
          label: "MARKET_INTELLIGENCE",
          className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          icon: Target,
        };
      case "announcement":
        return { label: "INSTITUTIONAL_LOG", className: "bg-primary/10 text-primary border-primary/20", icon: Pin };
      case "poll":
        return {
          label: "COMMUNITY_CONSENSUS",
          className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          icon: Share2,
        };
      default:
        return null;
    }
  };

  const typeMeta = getContentTypeBadge();
  const isVideo = post.mediaUrl?.match(/(youtube\.com|youtu\.be)/);

  return (
    <Card className="group relative overflow-hidden transition-all duration-500 border-2 border-border/40 hover:border-primary/40 bg-card/30 backdrop-blur-md rounded-[32px] shadow-xl animate-in fade-in duration-700">
      {/* SECTION: PINNED_PROTOCOL */}
      {post.isPinned && (
        <div className="bg-primary/10 px-6 py-2.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary/10 italic">
          <Pin className="h-3.5 w-3.5 fill-current animate-pulse" />
          <span>Priority_Artifact_Locked</span>
        </div>
      )}

      <CardContent className="p-6 space-y-5">
        {/* IDENTITY: Author Header */}
        <div className="flex items-start justify-between">
          <PostAuthor
            name={post.authorName}
            title={post.authorTitle}
            avatar={post.authorAvatar}
            createdAt={post.createdAt}
          />
          <div className="flex flex-col items-end gap-2">
            <button className="text-muted-foreground/30 hover:text-primary transition-all p-1.5 rounded-lg hover:bg-primary/5 active:scale-90">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {totalReactions > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] font-black italic border-primary/10 text-muted-foreground/60 uppercase px-2 py-0"
              >
                {totalReactions} ANALYTICS_HITS
              </Badge>
            )}
          </div>
        </div>

        {/* CLASSIFICATION: Type Badge */}
        {typeMeta && (
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-black uppercase italic tracking-widest py-1 px-3 gap-2 rounded-full border-2",
              typeMeta.className,
            )}
          >
            {typeMeta.icon && <typeMeta.icon className="h-3 w-3" />}
            {typeMeta.label}
          </Badge>
        )}

        {/* PAYLOAD: Body Text */}
        <div className="relative text-left">
          <p className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-relaxed tracking-tight font-medium italic">
            {displayText}
          </p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-black uppercase italic tracking-widest text-primary mt-3 hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              <Zap className="h-3 w-3 fill-current" />
              {isExpanded ? "Minimize_Payload" : "Initialize_Full_Ingress"}
            </button>
          )}
        </div>

        {/* REGISTRY: Hashtags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-black italic text-primary hover:bg-primary hover:text-white cursor-pointer bg-primary/5 border border-primary/10 px-3 py-1 rounded-xl transition-all uppercase tracking-tighter"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ASSETS: Media Block */}
        {post.mediaUrl && post.contentType !== "poll" && (
          <div className="mt-4 -mx-6 relative group/media overflow-hidden border-y-2 border-border/10">
            <AspectRatio ratio={16 / 9} className="bg-muted transition-all duration-700 group-hover/media:scale-105">
              <img src={post.mediaUrl} alt="Payload Asset" className="w-full h-full object-cover" />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/media:bg-black/60 transition-all duration-500">
                  <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] transform transition-transform group-hover/media:scale-110">
                    <Play className="h-8 w-8 text-rose-600 fill-current ml-1" />
                  </div>
                </div>
              )}
            </AspectRatio>
          </div>
        )}

        {/* INTERACTIVE: Poll Node */}
        {post.contentType === "poll" && pollOptions.length > 0 && (
          <div className="pt-4 animate-in slide-in-from-bottom-2 duration-500">
            <PollWidget
              options={pollOptions}
              results={results}
              totalVotes={totalVotes}
              hasVoted={hasVoted}
              userVote={userVote}
              pollEndsAt={post.pollEndsAt}
              onVote={castVote}
              disabled={pollLoading}
            />
          </div>
        )}

        {/* METADATA: External Link Preview */}
        {post.linkUrl && post.linkPreview && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-2 border-border/20 rounded-[24px] overflow-hidden hover:bg-primary/5 hover:border-primary/20 transition-all bg-muted/10 group/link"
          >
            {post.linkPreview.image && (
              <img
                src={post.linkPreview.image}
                alt=""
                className="w-full h-44 object-cover grayscale-[20%] group-hover/link:grayscale-0 transition-all"
              />
            )}
            <div className="p-5 space-y-2">
              <h4 className="text-[15px] font-black uppercase italic leading-tight tracking-tight line-clamp-2">
                {post.linkPreview.title}
              </h4>
              {post.linkPreview.description && (
                <p className="text-[11px] text-muted-foreground font-bold italic line-clamp-2 leading-relaxed uppercase opacity-60">
                  {post.linkPreview.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 pt-2 italic">
                <ExternalLink className="h-3 w-3" />
                <span>{new URL(post.linkUrl).hostname}</span>
              </div>
            </div>
          </a>
        )}

        {/* ENGAGEMENT: Social Command Strip */}
        <div className="flex items-center justify-between gap-4 pt-6 mt-4 border-t-2 border-border/10">
          <div className="flex-1">
            <ReactionBar
              reactions={reactions}
              userReaction={userReaction}
              onReact={toggleReaction}
              disabled={reactionsLoading}
              inline
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all active:scale-90"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <ShareSheet
              title={post.textContent.slice(0, 80)}
              url={`${window.location.origin}/app/feed?post=${post.id}`}
              description={post.textContent.slice(0, 160)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
