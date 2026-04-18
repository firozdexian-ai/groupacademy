import { useState } from "react";
import { Pin, ExternalLink, Play, MoreHorizontal, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { PostAuthor } from "./PostAuthor";
import { ReactionBar, ReactionType } from "./ReactionBar";
import { PollWidget } from "./PollWidget";
import { ShareSheet } from "./ShareSheet";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePollVoting } from "@/hooks/usePollVoting";
import { cn } from "@/lib/utils";

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
        return { label: "💡 Tip", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
      case "news":
        return { label: "📰 News", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
      case "announcement":
        return { label: "📢 Announcement", className: "bg-primary/10 text-primary border-primary/20" };
      case "poll":
        return { label: "📊 Poll", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
      default:
        return null;
    }
  };

  const typeBadge = getContentTypeBadge();
  const isVideo = post.mediaUrl?.match(/(youtube\.com|youtu\.be)/);

  return (
    <Card className="group overflow-hidden transition-all duration-300 border-border/40 hover:border-primary/30 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md rounded-2xl">
      {/* Pinned Status */}
      {post.isPinned && (
        <div className="bg-primary/5 px-4 py-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary border-b border-primary/10">
          <Pin className="h-3.5 w-3.5 fill-current" />
          <span>Priority Update</span>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Author Header */}
        <div className="flex items-start justify-between">
          <PostAuthor
            name={post.authorName}
            title={post.authorTitle}
            avatar={post.authorAvatar}
            createdAt={post.createdAt}
          />
          <div className="flex flex-col items-end gap-1">
            <button className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {totalReactions > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                {totalReactions} Interactions
              </span>
            )}
          </div>
        </div>

        {/* Content Type */}
        {typeBadge && (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-bold uppercase tracking-tight py-0.5", typeBadge.className)}
          >
            {typeBadge.label}
          </Badge>
        )}

        {/* Body Text */}
        <div className="relative">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed tracking-tight font-medium">
            {displayText}
          </p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-bold text-primary mt-2 hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              {isExpanded ? "Show less" : "Read full post"}
            </button>
          )}
        </div>

        {/* Hashtags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-bold text-primary hover:text-primary/70 cursor-pointer bg-primary/5 px-2 py-0.5 rounded-md transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media Block */}
        {post.mediaUrl && post.contentType !== "poll" && (
          <div className="mt-2 -mx-4">
            <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden group-hover:opacity-95 transition-opacity">
              <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    <Play className="h-7 w-7 text-rose-600 fill-current ml-1" />
                  </div>
                </div>
              )}
            </AspectRatio>
          </div>
        )}

        {/* Interactive Poll */}
        {post.contentType === "poll" && pollOptions.length > 0 && (
          <div className="pt-2">
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

        {/* External Link Meta */}
        {post.linkUrl && post.linkPreview && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border/60 rounded-xl overflow-hidden hover:bg-muted/30 hover:border-primary/20 transition-all bg-muted/10"
          >
            {post.linkPreview.image && <img src={post.linkPreview.image} alt="" className="w-full h-36 object-cover" />}
            <div className="p-4 space-y-2">
              <h4 className="text-sm font-bold leading-tight line-clamp-2">{post.linkPreview.title}</h4>
              {post.linkPreview.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {post.linkPreview.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-1">
                <ExternalLink className="h-3 w-3" />
                <span>{new URL(post.linkUrl).hostname}</span>
              </div>
            </div>
          </a>
        )}

        {/* Social Engagement Row */}
        <div className="flex items-center justify-between gap-4 pt-4 mt-2 border-t border-border/40">
          <div className="flex-1">
            <ReactionBar
              reactions={reactions}
              userReaction={userReaction}
              onReact={toggleReaction}
              disabled={reactionsLoading}
              inline
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground/60 hover:text-primary"
            >
              <MessageSquare className="h-4 w-4" />
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
