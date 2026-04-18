import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, ArrowDown, BookOpen, FileText, WifiOff, Clock, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Pull-to-refresh state
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

  // CTO Optimization: Memoized counts to prevent re-render logic errors
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
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 60) {
      await refresh();
    }
    setPullDistance(0);
  };

  const getEmptyStateAction = (type: FeedFilterType) => {
    switch (type) {
      case "course":
      case "video":
        return { label: "Explore Learning", action: () => navigate("/app/learning"), icon: BookOpen };
      case "blog":
        return { label: "Read Blog", action: () => navigate("/app/blog"), icon: FileText };
      default:
        return { label: "Update Preferences", action: () => navigate("/app/profile"), icon: RefreshCw };
    }
  };

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Loading State
  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const emptyAction = getEmptyStateAction(filters.type);

  return (
    <div
      className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-6 min-h-screen relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Refresh Indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-200"
        style={{
          top: isRefreshing ? "20px" : `${pullDistance - 40}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="bg-primary shadow-xl rounded-full p-2 border-4 border-background">
          <RefreshCw className={cn("h-5 w-5 text-white", isRefreshing && "animate-spin")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN FEED COLUMN */}
        <div className="lg:col-span-8 space-y-4">
          <FeedHeader
            talentName={talent?.fullName}
            talentPhoto={talent?.profilePhotoUrl}
            talentProfession={talent?.customProfession}
            onRefresh={() => refresh()}
            isRefreshing={isRefreshing}
          />

          <QuickActionsGrid />
          <BannerCarousel compact />
          <ComposePost onPostCreated={() => refresh()} />
          <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

          {error ? (
            <Card className="border-destructive/20 bg-destructive/5 rounded-2xl">
              <CardContent className="p-12 text-center">
                <WifiOff className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
                <h3 className="font-black text-xl text-destructive tracking-tight">Sync Failed</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">We couldn't reach the academy servers.</p>
                <Button onClick={() => refresh()} className="font-bold px-8">
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="rounded-[32px] border-dashed bg-muted/20">
              <CardContent className="p-20 text-center flex flex-col items-center">
                <Inbox className="h-16 w-16 text-muted-foreground/30 mb-6" />
                <h3 className="text-2xl font-black tracking-tight">All Caught Up!</h3>
                <p className="text-muted-foreground mt-2 mb-8 max-w-xs">
                  Check back later for new professional updates and courses.
                </p>
                <Button onClick={emptyAction.action} className="rounded-xl font-bold">
                  <emptyAction.icon className="h-4 w-4 mr-2" />
                  {emptyAction.label}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 pb-24">
              {items.map((item, index) => (
                <div key={item.id || index} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {item.type === "post" ? (
                    <PostCard
                      post={{
                        id: item.id,
                        authorName: item.authorName || "Academy Expert",
                        authorAvatar: item.authorAvatar,
                        authorTitle: item.authorTitle || "Verified User",
                        contentType: (item.contentType as any) || "text",
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
              ))}

              <div className="flex flex-col items-center py-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  End of personalized feed
                </p>
                <Button variant="ghost" onClick={loadMore} disabled={isRefreshing} className="font-bold gap-2">
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  Load Older Content
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            <PersonalizedPromptCard />

            <Card className="rounded-[24px] border-primary/10 shadow-sm overflow-hidden">
              <div className="p-5 bg-primary/5 border-b border-primary/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Discovery Hub
                </h3>
              </div>
              <CardContent className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Updates", val: counts.post },
                  { label: "Learning", val: counts.course },
                  { label: "Videos", val: counts.video },
                  { label: "Insight", val: counts.blog },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/30 p-4 rounded-2xl text-center border border-border/40">
                    <p className="text-xl font-black tracking-tighter">{stat.val}</p>
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <CareerInsightsStack insights={insights || []} />
          </div>
        </div>
      </div>

      <FloatingWhatsAppButton showPrompt={items.length > 0} />
    </div>
  );
}
