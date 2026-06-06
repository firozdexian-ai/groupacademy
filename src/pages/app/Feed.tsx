import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useFeedRecommendations } from "@/domains/feed/hooks/useFeedRecommendations";
import { FeedHeader } from "@/domains/feed/components/talent/FeedHeader";
import { FeedFilters } from "@/domains/feed/components/talent/FeedFilters";
import { ComposePost } from "@/domains/feed/components/talent/ComposePost";
import { FeedCardRedesigned } from "@/domains/feed/components/talent/FeedCardRedesigned";
import { PostCard } from "@/domains/feed/components/talent/PostCard";
import { FeedSkeleton } from "@/domains/feed/components/talent/FeedSkeleton";
import { useTalent } from "@/hooks/useTalent";

/**
 * /app/feed — Talent social feed.
 * Restored after a prior commit replaced this file with track-detail code,
 * which left the route stuck on a perpetual spinner.
 */
export default function Feed() {
 const { talent } = useTalent();
 const {
 items,
 isLoading,
 isRefreshing,
 isFetchingNextPage,
 hasNextPage,
 error,
 filters,
 setFilters,
 refresh,
 loadMore,
 markInterested,
 markNotInterested,
 } = useFeedRecommendations();

 // Infinite scroll sentinel
 const sentinelRef = useRef<HTMLDivElement | null>(null);
 useEffect(() => {
 if (!hasNextPage || isFetchingNextPage) return;
 const el = sentinelRef.current;
 if (!el) return;
 const obs = new IntersectionObserver(
 (entries) => {
 if (entries[0]?.isIntersecting) loadMore();
 },
 { rootMargin: "400px" },
 );
 obs.observe(el);
 return () => obs.disconnect();
 }, [hasNextPage, isFetchingNextPage, loadMore]);

 const counts = {
 all: items.length,
 course: items.filter((i) => i.type === "course").length,
 video: items.filter((i) => i.type === "video").length,
 blog: items.filter((i) => i.type === "blog").length,
 post: items.filter((i) => i.type === "post" && i.contentType !== "poll").length,
 poll: items.filter((i) => i.type === "post" && i.contentType === "poll").length,
 };

 return (
 <div className="max-w-md md:max-w-2xl mx-auto px-3 py-2 pb-32 space-y-2">
 <FeedHeader
 talentName={talent?.fullName || "You"}
 talentPhoto={(talent as any)?.profilePhotoUrl || (talent as any)?.profile_photo_url || null}
 talentProfession={(talent as any)?.customProfession || (talent as any)?.custom_profession || null}
 onRefresh={refresh}
 isRefreshing={isRefreshing}
 />

 <ComposePost onPostCreated={refresh} />

 <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

 {error && (
 <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
 {error}
 </div>
 )}

 {isLoading ? (
 <FeedSkeleton />
 ) : items.length === 0 ? (
 <div className="rounded-lg border border-border/40 bg-card/40 p-6 text-center text-xs text-muted-foreground">
 Nothing here yet. Pull to refresh or check back soon.
 </div>
 ) : (
 <div className="space-y-2">
 {items.map((item) => (
  item.type === "post" ? (
    <PostCard key={`${item.type}-${item.id}`} post={item as any} />
  ) : (
    <FeedCardRedesigned
      key={`${item.type}-${item.id}`}
      item={item}
      onInterested={() => markInterested(item)}
      onNotInterested={() => markNotInterested(item.id)}
    />
  )
 ))}
 </div>
 )}

 <div ref={sentinelRef} className="h-8" />

 {isFetchingNextPage && (
 <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
 <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading more…
 </div>
 )}
 </div>
 );
}
