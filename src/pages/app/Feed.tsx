import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, ArrowDown, BookOpen, FileText, WifiOff, Clock, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTalent } from "@/hooks/useTalent";
import { useFeedRecommendations, FeedItem, FeedFilterType } from "@/hooks/useFeedRecommendations";
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

export default function Feed() {
  const navigate = useNavigate();
  const { talent, refreshTalent } = useTalent();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

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

  const handleInterested = async (item: FeedItem) => {
    await markInterested(item);
    if (!item.slug && !item.youtubeUrl) return;

    switch (item.type) {
      case "blog":
        navigate(`/app/blog/${item.slug}`);
        break;
      case "course":
      case "video":
        if (item.slug) navigate(`/app/learning/courses/${item.slug}`);
        else if (item.youtubeUrl) window.open(item.youtubeUrl, "_blank");
        break;
    }
  };

  // CTO Fix: Memoized counts to prevent re-calculation crashes
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

  // Pull to refresh logic
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
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 60) await refresh();
    setPullDistance(0);
  };

  if (showOnboarding)
    return (
      <OnboardingWizard
        onComplete={() => {
          setShowOnboarding(false);
          refreshTalent();
          refresh();
        }}
      />
    );

  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-6 min-h-screen relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)`, top: -40, opacity: pullDistance > 10 ? 1 : 0 }}
      >
        <div className="bg-primary text-white p-2 rounded-full shadow-xl">
          <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <FeedHeader
            talentName={talent?.fullName}
            talentPhoto={talent?.profilePhotoUrl}
            talentProfession={talent?.customProfession}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
          />

          <QuickActionsGrid />
          <BannerCarousel compact />
          <ComposePost onPostCreated={refresh} />
          <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

          {error ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-12 text-center">
                <WifiOff className="h-10 w-10 text-destructive mx-auto mb-4" />
                <h3 className="font-bold text-lg text-destructive">Feed Connection Lost</h3>
                <Button variant="outline" className="mt-4" onClick={refresh}>
                  Reconnect
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <h3 className="text-xl font-bold">No updates found</h3>
              <Button onClick={() => setFilters({ ...filters, type: "all" })}>Clear Filters</Button>
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              {items.map((item, index) => {
                if (!item) return null; // Safe guard
                return (
                  <div key={item.id || index} className="animate-in fade-in duration-500">
                    {item.type === "post" ? (
                      <PostCard
                        post={{
                          id: item.id,
                          authorName: item.authorName || "Academy Expert",
                          authorAvatar: item.authorAvatar,
                          authorTitle: item.authorTitle || "Verified Instructor",
                          contentType: item.contentType || "text",
                          textContent: item.textContent || item.description || "",
                          mediaUrl: item.mediaUrl,
                          pollOptions: item.pollOptions || [],
                          pollEndsAt: item.pollEndsAt,
                          linkUrl: item.linkUrl,
                          linkPreview: item.linkPreview,
                          tags: item.tags || [],
                          isPinned: item.isPinned || false,
                          createdAt: item.createdAt || new Date().toISOString(),
                        }}
                      />
                    ) : (
                      <FeedCardRedesigned
                        item={item}
                        onInterested={() => handleInterested(item)}
                        onNotInterested={() => markNotInterested(item.id)}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex justify-center pt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={isRefreshing}
                  className="gap-2 font-bold text-muted-foreground"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  Discover More
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            <PersonalizedPromptCard />
            <Card className="rounded-2xl border-primary/10 shadow-sm overflow-hidden">
              <div className="p-4 bg-primary/5 border-b border-primary/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" /> Growth Stats
                </h3>
              </div>
              <CardContent className="p-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Posts", val: counts.post },
                  { label: "Courses", val: counts.course },
                  { label: "Videos", val: counts.video },
                  { label: "Articles", val: counts.blog },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/30 p-3 rounded-xl text-center">
                    <p className="text-lg font-black">{stat.val}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <CareerInsightsStack insights={insights} />
          </div>
        </div>
      </div>

      <FloatingWhatsAppButton showPrompt={items.length > 0} />
    </div>
  );
}
