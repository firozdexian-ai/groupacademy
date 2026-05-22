import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { listTopHypedPostsWeek } from "@/domains/feed/repo/feedRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface TopPost {
  post_id: string;
  hypes_week: number;
  preview: string | null;
  author_name: string | null;
}

/**
 * Premium, performance-hardened Weekly Trending Content Widget.
 * Leverages structured TanStack Query state caching to join analytics view aggregates
 * dynamically without over-fetching raw data profiles over mobile PWA channels.
 */
export function TopHypedWidget() {
  // 1. Unified Server-State Sync Layer (staleTime 5 min configuration)
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery<TopPost[]>({
    queryKey: ["top-hyped-posts-week"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => (await listTopHypedPostsWeek(5)) as TopPost[],
  });

  // 2. Instrument Lifecycle Observability & Exception Metrics Tracking
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "TopHypedWidget",
        action: "fetch_weekly_trending_metrics_query",
      });
    }
  }, [error]);

  useEffect(() => {
    if (posts.length > 0) {
      trackEvent("top_hyped_widget_viewed", {
        yieldedCount: posts.length,
        peakHypeScore: posts[0]?.hypes_week || 0,
      });
    }
  }, [posts]);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3.5 border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none">
        <h3 className="text-xs font-bold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
          <Flame className="h-4 w-4 text-orange-500 fill-orange-500/10 animate-pulse" />
          <span>Trending This Week</span>
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((placeholderIndex) => (
            <Skeleton key={placeholderIndex} className="h-12 w-full rounded-xl opacity-60" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none">
      {/* Immersive Section Header */}
      <h3 className="text-xs font-bold flex items-center gap-2 mb-3.5 text-foreground/90 uppercase tracking-wider">
        <Flame className="h-4 w-4 text-orange-500 fill-orange-500/10 drop-shadow-[0_1px_4px_rgba(249,115,22,0.2)]" />
        <span>Trending This Week</span>
      </h3>

      {posts.length === 0 ? (
        <p className="text-xs text-muted-foreground/90 leading-relaxed py-2 text-left select-text selection:bg-primary/20">
          No hyped updates yet &mdash; be the first to support community posts in the feed.
        </p>
      ) : (
        <div className="space-y-1.5 w-full">
          {posts.map((postItem) => {
            if (!postItem || !postItem.post_id) return null;
            return (
              <Link
                key={postItem.post_id}
                to={`/app/feed/post/${postItem.post_id}`}
                onClick={() => trackEvent("top_hyped_item_click", { postId: postItem.post_id })}
                className="block hover:bg-muted/40 rounded-xl p-2.5 -mx-1.5 transition-all duration-200 outline-none group focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground/90 line-clamp-2 leading-snug tracking-tight text-left select-text selection:bg-primary/20 break-words">
                  {postItem.preview || "(Media interaction asset update)"}
                </div>

                <div className="text-[11px] font-bold text-muted-foreground/80 mt-2 flex items-center justify-between gap-2 w-full select-none">
                  <span className="truncate max-w-[70%] text-left text-ellipsis tracking-tight">
                    {postItem.author_name}
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-500 tabular-nums shrink-0 bg-orange-500/5 px-2 py-0.5 border border-orange-500/10 rounded-full">
                    <Flame className="h-3 w-3 fill-current" />
                    <span>{postItem.hypes_week}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
