import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * PostCard — compact, plain-language social feed node.
 * Hardened according to GroUp Academy Phase Z0 highly professional SAAS UI specifications
 * and Digital Workforce automated content telemetry guidelines.
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
  tip: {
    label: "Tip",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5",
  },
  news: {
    label: "News",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/5",
  },
  announcement: { label: "Announcement", className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/5" },
  poll: {
    label: "Poll",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/5",
  },
  text: null,
  media: null,
};

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSaved, toggleSave } = useSavedItems();

  const saved = isSaved(post.id, "post" as any);
  const pollOptions = post.pollOptions || [];

  // 1. Core Server-State Sync for poll responses
  const {
    hasVoted,
    userVote,
    results,
    totalVotes,
    castVote,
    isLoading: pollLoading,
  } = usePollVoting(post.id, pollOptions);

  // Monitor impression state rendering tracking cycles
  useEffect(() => {
    if (post?.id) {
      trackEvent("feed_postcard_impression", {
        postId: post.id,
        contentType: post.contentType,
        isPinned: !!post.isPinned,
      });
    }
  }, [post]);

  if (!post || !post.id) {
    trackError("PostCard component mounted without valid post context bindings.", {
      component: "PostCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const isLongText = post.textContent?.length > 280;
  const displayText = isLongText && !isExpanded ? post.textContent.slice(0, 280) + "..." : post.textContent;
  const typeMeta = TYPE_META[post.contentType] ?? null;
  const isVideo = post.mediaUrl?.match(/(youtube\.com|youtu\.be)/);

  const handleSaveToggle = async () => {
    trackEvent("feed_post_save_toggled", { postId: post.id, nextState: !saved });

    try {
      await toggleSave(post.id, "post" as any);

      // Cache Bridge Invalidation: Sync bookmarks layout state instantly across components
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });

      toast.success(saved ? "Removed from saved items" : "Post saved successfully");
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PostCard",
        action: "handleSaveToggle_fault",
        postId: post.id,
      });
      toast.error("Couldn't update your saved items layout registry.");
    }
  };

  // Safely parse URL components to protect rendering threads from malformed string payloads
  const parseHostnameSafe = (urlStr: string): string => {
    try {
      if (!urlStr) return "link";
      return new URL(urlStr).hostname;
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PostCard",
        action: "parse_hostname_safe",
        providedUrl: urlStr,
        postId: post.id,
      });
      return "external link";
    }
  };

  const handleReportAction = () => {
    trackEvent("feed_post_reported_by_user", { postId: post.id });
    toast.info("Content flagged. Platform moderators have been notified.");
  };

  const trackerRef = useImpressionTracker(post.id, "feed");

  return (
    <div ref={trackerRef} className="w-full h-auto">
      <Card className="overflow-hidden border border-border/40 hover:border-primary/30 bg-card/60 backdrop-blur-md rounded-2xl transition-all duration-300 shadow-sm">
        {post.isPinned && (
          <div className="bg-primary/5 px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-primary border-b border-primary/10 select-none uppercase tracking-wider">
            <Pin className="h-3 w-3 fill-current rotate-45" />
            <span>Pinned Update</span>
          </div>
        )}

        <CardContent className="p-4 space-y-3.5">
          {/* Author Block Row */}
          <div className="flex items-start justify-between gap-3 select-none">
            <PostAuthor
              name={post.authorName}
              title={post.authorTitle}
              avatar={post.authorAvatar}
              createdAt={post.createdAt}
              contextData={{ postId: post.id }}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
                  aria-label="More operational options"
                >
                  <MoreHorizontal className="h-4 w-4 stroke-[2.2]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl border border-border/40 shadow-xl bg-background/95 backdrop-blur-md"
              >
                <DropdownMenuItem
                  onClick={handleSaveToggle}
                  className="cursor-pointer font-semibold text-xs gap-2 py-2 text-foreground/90"
                >
                  {saved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary fill-current" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <span>{saved ? "Saved to Profile" : "Save Update"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleReportAction}
                  className="cursor-pointer font-semibold text-xs gap-2 py-2 text-destructive hover:bg-destructive/10"
                >
                  <Flag className="h-4 w-4" />
                  <span>Report Content</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Core Body Text Content Panel */}
          <div className="text-left select-text selection:bg-primary/20 space-y-2">
            {typeMeta && (
              <Badge
                className={cn(
                  "gap-1 border px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase select-none",
                  typeMeta.className,
                )}
              >
                {typeMeta.label}
              </Badge>
            )}
            <p className="text-sm font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
              {displayText}
            </p>
            {isLongText && (
              <button
                onClick={() => {
                  const nextState = !isExpanded;
                  setIsExpanded(nextState);
                  trackEvent("feed_post_expansion_toggled", { postId: post.id, targetState: nextState });
                }}
                className="inline-block text-xs font-bold text-primary mt-1 hover:text-primary/80 focus-visible:underline cursor-pointer select-none"
              >
                {isExpanded ? "Show less" : "Read full update"}
              </button>
            )}
          </div>

          {/* Hashtag Taxonomy Grid Node array */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 select-none pt-0.5">
              {post.tags.map((tag) => {
                if (!tag) return null;
                return (
                  <span
                    key={tag}
                    onClick={() => trackEvent("feed_post_tag_clicked", { tag, postId: post.id })}
                    className="text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/5 px-2 py-0.5 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    #{tag.toLowerCase().replace(/[^a-z0-9]/g, "")}
                  </span>
                );
              })}
            </div>
          )}

          {/* Media Content Box Container — Constrained spatial layout mapping */}
          {post.mediaUrl && post.contentType !== "poll" && (
            <div className="relative overflow-hidden rounded-xl border border-border/30 bg-muted/10 shadow-inner max-w-full select-none w-full max-h-72 aspect-video sm:aspect-auto">
              <img
                src={post.mediaUrl}
                alt="Feed entry visualization container file"
                className="w-full h-full max-h-72 object-cover transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200">
                  <div className="w-12 h-12 rounded-full bg-background/95 text-rose-600 flex items-center justify-center shadow-md shadow-black/10 transform-gpu active:scale-90 transition-transform">
                    <Play className="h-5 w-5 text-rose-600 fill-current ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Consensus Poll Block Node */}
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
              contextData={{ postId: post.id }}
            />
          )}

          {/* External Link Rich Content Preview Section */}
          {post.linkUrl && post.linkPreview && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("feed_post_external_preview_link_clicked", { postId: post.id, url: post.linkUrl })
              }
              className="block border border-border/40 rounded-xl overflow-hidden bg-card/30 hover:border-primary/30 hover:bg-card/70 transition-all duration-200 shadow-sm w-full max-w-full"
            >
              {post.linkPreview.image && (
                <img
                  src={post.linkPreview.image}
                  alt="Link destination metadata cover thumbnail preview"
                  className="w-full max-h-36 object-cover border-b border-border/10 select-none"
                  loading="lazy"
                />
              )}
              <div className="p-3.5 space-y-1.5 text-left w-full min-w-0">
                <h4 className="text-sm font-bold leading-snug tracking-tight line-clamp-2 text-foreground select-text">
                  {post.linkPreview.title}
                </h4>
                {post.linkPreview.description && (
                  <p className="text-[11px] font-medium text-muted-foreground leading-normal line-clamp-2 select-text selection:bg-primary/10">
                    {post.linkPreview.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/80 pt-0.5 select-none uppercase tracking-wide">
                  <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate max-w-full">{parseHostnameSafe(post.linkUrl)}</span>
                </div>
              </div>
            </a>
          )}

          {/* Authoritative Action Ribbon Footer Control Strip */}
          <PostActionBar
            postId={post.id}
            initialHypeCount={0}
            postTitle={post.textContent?.slice(0, 80) || "Update"}
            postUrl={`/app/feed/post/${post.id}`}
            postDescription={post.textContent?.slice(0, 160) || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
