import { useState } from "react";
import { Pin, ExternalLink, Play, MoreHorizontal, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostAuthor } from "./PostAuthor";
import { ReactionBar } from "./ReactionBar";
import { PollWidget } from "./PollWidget";
import { ShareSheet } from "./ShareSheet";
import { HypeButton } from "./HypeButton";
import { CommentList } from "./CommentList";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePollVoting } from "@/hooks/usePollVoting";
import { cn } from "@/lib/utils";

/**
 * PostCard — compact, plain-language social post.
 * Densified per Phase 12B feedback: no UPPERCASE_TERMINAL labels,
 * tighter padding, constrained media, simple type chips.
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

const TYPE_META: Record<string, { label: string; className: string } | null> = {
  tip: { label: "Tip", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  news: { label: "News", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  announcement: { label: "Announcement", className: "bg-primary/10 text-primary border-primary/20" },
  poll: { label: "Poll", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  text: null,
  media: null,
};

export function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { reactions, userReaction, toggleReaction, isLoading: reactionsLoading } = usePostReactions(post.id);

  const pollOptions = post.pollOptions || [];
  const { hasVoted, userVote, results, totalVotes, castVote, isLoading: pollLoading } = usePollVoting(
    post.id,
    pollOptions,
  );

  const isLongText = post.textContent.length > 280;
  const displayText = isLongText && !isExpanded ? post.textContent.slice(0, 280) + "..." : post.textContent;
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const typeMeta = TYPE_META[post.contentType] ?? null;
  const isVideo = post.mediaUrl?.match(/(youtube\.com|youtu\.be)/);

  return (
    <Card className="overflow-hidden border border-border/40 hover:border-primary/40 bg-card rounded-2xl transition-colors">
      {post.isPinned && (
        <div className="bg-primary/5 px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-medium text-primary border-b border-primary/10">
          <Pin className="h-3 w-3 fill-current" />
          <span>Pinned</span>
        </div>
      )}

      <CardContent className="p-3 space-y-3">
        {/* Author */}
        <div className="flex items-start justify-between gap-2">
          <PostAuthor
            name={post.authorName}
            title={post.authorTitle}
            avatar={post.authorAvatar}
            createdAt={post.createdAt}
          />
          <button className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/40">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Type chip */}
        {typeMeta && (
          <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0 rounded-full border", typeMeta.className)}>
            {typeMeta.label}
          </Badge>
        )}

        {/* Body */}
        <div className="text-left">
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{displayText}</p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-primary mt-1.5 hover:underline"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-primary bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media — constrained, not full-bleed */}
        {post.mediaUrl && post.contentType !== "poll" && (
          <div className="relative overflow-hidden rounded-xl border border-border/40 bg-muted">
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full max-h-72 object-cover"
              loading="lazy"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 text-rose-600 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Poll */}
        {post.contentType === "poll" && pollOptions.length > 0 && (
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
        )}

        {/* Link preview */}
        {post.linkUrl && post.linkPreview && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border/40 rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
          >
            {post.linkPreview.image && (
              <img src={post.linkPreview.image} alt="" className="w-full max-h-40 object-cover" />
            )}
            <div className="p-3 space-y-1">
              <h4 className="text-sm font-semibold leading-tight line-clamp-2">{post.linkPreview.title}</h4>
              {post.linkPreview.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{post.linkPreview.description}</p>
              )}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                <ExternalLink className="h-3 w-3" />
                <span>{new URL(post.linkUrl).hostname}</span>
              </div>
            </div>
          </a>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="flex-1">
            <ReactionBar
              reactions={reactions}
              userReaction={userReaction}
              onReact={toggleReaction}
              disabled={reactionsLoading}
              inline
            />
          </div>
          <div className="flex items-center gap-1">
            <HypeButton postId={post.id} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
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

        {totalReactions > 0 && (
          <p className="text-[10px] text-muted-foreground -mt-1">{totalReactions} reactions</p>
        )}

        <CommentList postId={post.id} />
      </CardContent>
    </Card>
  );
}
