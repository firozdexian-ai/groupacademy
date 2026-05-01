import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalent } from "@/hooks/useTalent";
import { useFeedRecommendations, FeedItem } from "@/hooks/useFeedRecommendations";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { FeedCardRedesigned } from "@/components/feed/FeedCardRedesigned";
import { PostCard } from "@/components/feed/PostCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { CareerInsightsStack } from "@/components/feed/CareerInsightsStack";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FloatingWhatsAppButton } from "@/components/feed/FloatingWhatsAppButton";
import { PersonalizedPromptCard } from "@/components/feed/PersonalizedPromptCard";
import { BannerCarousel } from "@/components/BannerCarousel";
import { QuickActionsGrid } from "@/components/feed/QuickActionsGrid";
import { ComposePost } from "@/components/feed/ComposePost";
import { cn } from "@/lib/utils";

/**
 * Feed — personalized stream of posts, courses, videos and articles
 * for the signed-in talent. Mobile-first; supports pull-to-refresh.
 */

export default function Feed() {
  const navigate = useNavigate();
  const { talent, refreshTalent } = useTalent();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Pull-to-refresh state: Tactical Telemetry
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items = [],
    insights = [],
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh,
    loadMore,
    markInterested,
    markNotInterested,
  } = useFeedRecommendations();

  useEffect(() => {
    if (talent && !talent.onboardingCompletedAt) {
      setShowOnboarding(true);
    }
  }, [talent]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await refreshTalent();
    refresh();
  };

  const handleInterested = async (item: FeedItem) => {
    await markInterested(item);
    if (!item.slug && !item.youtubeUrl) return;

    switch (item.type) {
      case "blog":
        if (item.slug) navigate(`/app/blog/${item.slug}`);
        break;
      case "course":
      case "video":
        if (item.slug) navigate(`/app/learning/courses/${item.slug}`);
        else if (item.youtubeUrl) window.open(item.youtubeUrl, "_blank");
        break;
    }
  };

  /**
   * CTO Logic: Telemetry Registry
   * Synchronized counts to satisfy FeedFilters interface requirements.
   */
  const counts = useMemo(
    () => ({
      all: items.length,
      course: items.filter((i) => i.type === "course").length,
      video: items.filter((i) => i.type === "video").length,
      blog: items.filter((i) => i.type === "blog").length,
      post: items.filter((i) => i.type === "post").length,
      poll: items.filter((i) => i.type === "post" && i.contentType === "poll").length,
    }),
    [items],
  );

  // Pull-to-refresh handlers: Kinetic Protocol
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.4, 80));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 60) await refresh();
    setPullDistance(0);
  };

  if (showOnboarding) return <OnboardingWizard onComplete={handleOnboardingComplete} />;

  if (isLoading && !isRefreshing)
    return (
      <div className="max-w-7xl mx-auto px-3 py-2 md:px-6 md:py-10 grid lg:grid-cols-12 gap-4 md:gap-10 animate-pulse">
        <div className="lg:col-span-8 space-y-3 md:space-y-8">
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-8">
          <Skeleton className="h-40 w-full rounded-3xl bg-muted/40" />
          <Skeleton className="h-64 w-full rounded-3xl bg-muted/40" />
        </div>
      </div>
    );

  return (
    <div
      className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-10 min-h-screen relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-300"
        style={{
          top: isRefreshing ? "30px" : `${pullDistance - 50}px`,
          opacity: pullDistance > 15 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="bg-primary shadow-lg rounded-2xl p-2.5 border-2 border-background">
          <RefreshCw className={cn("h-5 w-5 text-primary-foreground", isRefreshing && "animate-spin")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-10">
        {/* Main feed column */}
        <div className="lg:col-span-8 space-y-3 md:space-y-8">
          <FeedHeader
            talentName={talent?.fullName}
            talentPhoto={talent?.profilePhotoUrl}
            talentProfession={talent?.customProfession}
            onRefresh={() => refresh()}
            isRefreshing={isRefreshing}
          />

          <QuickActionsGrid />
          <BannerCarousel compact />

          <div className="rounded-3xl overflow-hidden border border-border/40 shadow-sm bg-card">
            <ComposePost onPostCreated={() => refresh()} />
          </div>

          <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

          {error ? (
            <Card className="border-destructive/20 bg-destructive/5 rounded-3xl py-10 md:py-16 text-center animate-in zoom-in-95">
              <CardContent className="space-y-5">
                <WifiOff className="h-12 w-12 text-destructive mx-auto opacity-40" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Couldn't load your feed</h3>
                  <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
                </div>
                <Button onClick={() => refresh()} className="rounded-xl h-10 px-6 font-semibold text-sm">
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="rounded-3xl border border-dashed border-border/40 bg-muted/5 py-12 md:py-20 text-center">
              <CardContent className="flex flex-col items-center space-y-5">
                <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center border border-dashed border-border/60">
                  <Inbox className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">You're all caught up</h3>
                  <p className="text-sm text-muted-foreground">Check back later for new posts and recommendations.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-6 pb-32">
              {items.map((item, index) => (
                <div key={item.id || index} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {item.type === "post" ? (
                    <PostCard
                      post={
                        {
                          ...item,
                          authorName: item.authorName || "Community member",
                          authorTitle: item.authorTitle || "",
                          createdAt: item.createdAt || new Date().toISOString(),
                          textContent: item.textContent || item.description || "",
                        } as any
                      }
                    />
                  ) : (
                    <FeedCardRedesigned
                      item={item}
                      onInterested={() => handleInterested(item)}
                      onNotInterested={() => markNotInterested(item.id)}
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-col items-center py-8 group">
                <Button
                  variant="ghost"
                  onClick={loadMore}
                  className="rounded-xl font-semibold text-sm gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Load more
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <PersonalizedPromptCard />
            <CareerInsightsStack insights={insights || []} />
          </div>
        </aside>
      </div>

      <FloatingWhatsAppButton showPrompt={items.length > 0} />
    </div>
  );
}
