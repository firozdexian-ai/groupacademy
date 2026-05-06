import { useState } from "react";
import { Pin, ExternalLink, Play, MoreHorizontal, Bookmark, BookmarkCheck, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostAuthor } from "./PostAuthor";
import { PollWidget } from "./PollWidget";
import { PostActionBar } from "./PostActionBar";
import { usePollVoting } from "@/hooks/usePollVoting";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useImpressionTracker } from "@/hooks/useCreatorAnalytics";
import { toast } from "sonner";
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
  const { isSaved, toggleSave } = useSavedItems();
  const saved = isSaved(post.id, "post" as any);

  const pollOptions = post.pollOptions || [];
  const { hasVoted, userVote, results, totalVotes, castVote, isLoading: pollLoading } = usePollVoting(
    post.id,
    pollOptions,
  );

  const isLongText = post.textContent.length > 280;
  const displayText = isLongText && !isExpanded ? post.textContent.slice(0, 280) + "..." : post.textContent;
  const typeMeta = TYPE_META[post.contentType] ?? null;
  const isVideo = post.mediaUrl?.match(/(youtube\.com|youtu\.be)/);

  const handleSaveToggle = async () => {
    try {
      await toggleSave(post.id, "post" as any);
      toast.success(saved ? "Removed from saved" : "Saved");
    } catch {
      toast.error("Couldn't update saved");
    }
  };

  const trackerRef = useImpressionTracker(post.id, "feed");

  return (
    <div ref={trackerRef}>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/40"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleSaveToggle}>
                {saved ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                {saved ? "Saved" : "Save"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Reported. Thanks.")}>
                <Flag className="h-4 w-4 mr-2" /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
        <PostActionBar
          postId={post.id}
          postTitle={post.textContent.slice(0, 80)}
          postUrl={`${window.location.origin}/app/feed/post/${post.id}`}
          postDescription={post.textContent.slice(0, 160)}
        />
      </CardContent>
    </Card>
    </div>
  );
}
