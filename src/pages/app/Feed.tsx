import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  RefreshCw,
  ArrowDown,
  BookOpen,
  FileText,
  WifiOff,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function Feed() {
  const navigate = useNavigate();
  const { talent, refreshTalent } = useTalent();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Pull-to-refresh state
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items,
    insights,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh,
    markInterested,
    markNotInterested,
  } = useFeedRecommendations();

  useEffect(() => {
    if (!isRefreshing && !error) {
      setLastUpdated(new Date());
    }
  }, [isRefreshing, error]);

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
    switch (item.type) {
      case "blog":
        if (item.slug) navigate(`/app/blog/${item.slug}`);
        break;
      case "course":
      case "video":
        if (item.slug) navigate(`/app/learning/courses/${item.slug}`);
        else if (item.youtubeUrl) window.open(item.youtubeUrl, "_blank");
        break;
      case "post":
        // Posts are viewed inline, no navigation needed
        break;
    }
  };

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
      setPullDistance(Math.min(diff * 0.4, 120));
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

  const counts = {
    all: items.length,
    course: items.filter((i) => i.type === "course").length,
    video: items.filter((i) => i.type === "video").length,
    blog: items.filter((i) => i.type === "blog").length,
    post: items.filter((i) => i.type === "post").length,
    poll: items.filter((i) => i.type === "post" && i.contentType === "poll").length,
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

  // --- Loading State (Desktop Optimized) ---
  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-64 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const emptyAction = getEmptyStateAction(filters.type);

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-6 min-h-screen"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Refresh Indicator */}
      <div
        className="fixed left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-200"
        style={{
          top: isRefreshing ? "80px" : `${Math.max(0, pullDistance - 40)}px`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="bg-background/80 backdrop-blur-md shadow-lg rounded-full p-2 border flex items-center gap-2">
          {isRefreshing ? (
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={cn("h-5 w-5 text-primary transition-transform", pullDistance > 60 ? "rotate-180" : "")}
            />
          )}
          {pullDistance > 60 && <span className="text-xs font-medium pr-1">Release to refresh</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= LEFT COLUMN (MAIN FEED) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <FeedHeader
            talentName={talent?.fullName}
            talentPhoto={talent?.profilePhotoUrl}
            onRefresh={() => refresh()}
            isRefreshing={isRefreshing}
          />

          {/* Last Updated */}
          {!isLoading && !error && items.length > 0 && (
            <div className="flex justify-end -mt-4">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </p>
            </div>
          )}

          {/* Banner */}
          <BannerCarousel compact />

          {/* Quick Actions Grid */}
          <QuickActionsGrid />

          {/* Mobile-Only Widgets */}
          <div className="lg:hidden space-y-6">
            <PersonalizedPromptCard />
            {insights.length > 0 && <CareerInsightsStack insights={insights} />}
          </div>

          {/* Filters */}
          <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

          {/* Error State */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5 rounded-xl">
              <CardContent className="p-6 text-center">
                <WifiOff className="h-8 w-8 text-destructive mx-auto mb-3" />
                <h3 className="font-semibold text-destructive mb-1">Couldn't load feed</h3>
                <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try again.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => refresh()} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry
                  </Button>
                  <Button size="sm" onClick={() => navigate("/app/jobs")}>
                    Explore Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!error && items.length === 0 ? (
            <Card className="rounded-xl border-dashed">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  {filters.type === "all" ? "All caught up!" : `No ${filters.type}s found`}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  {filters.type === "all"
                    ? "We couldn't find any new content for you right now."
                    : `Try adjusting your filters or check back later.`}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => refresh()}>
                    Refresh
                  </Button>
                  <Button size="sm" onClick={emptyAction.action}>
                    <emptyAction.icon className="h-3.5 w-3.5 mr-2" />
                    {emptyAction.label}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Feed Items List
            <div className="space-y-4 pb-20">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
                  style={{ animationDelay: `${Math.min(index * 100, 500)}ms` }}
                >
                  {item.type === "post" ? (
                    <PostCard
                      post={{
                        id: item.id,
                        authorName: item.authorName || "GRO10X",
                        authorAvatar: item.authorAvatar,
                        authorTitle: item.authorTitle,
                        contentType: item.contentType || "text",
                        textContent: item.textContent || item.description,
                        mediaUrl: item.mediaUrl,
                        pollOptions: item.pollOptions,
                        pollEndsAt: item.pollEndsAt,
                        linkUrl: item.linkUrl,
                        linkPreview: item.linkPreview,
                        tags: item.tags,
                        isPinned: item.isPinned,
                        createdAt: item.createdAt,
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
              {!error && items.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground mb-3">You've reached the end</p>
                  <Button variant="ghost" size="sm" onClick={() => refresh()} className="text-xs gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT SIDEBAR (DESKTOP ONLY) ================= */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* 1. Prompt Card */}
            <PersonalizedPromptCard />

            {/* 2. Quick Stats Widget */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Your Feed Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/40 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{counts.post}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{counts.course}</div>
                    <div className="text-xs text-muted-foreground">Courses</div>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{counts.video}</div>
                    <div className="text-xs text-muted-foreground">Videos</div>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{counts.blog}</div>
                    <div className="text-xs text-muted-foreground">Articles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Career Insights */}
            {insights.length > 0 ? (
              <CareerInsightsStack insights={insights} />
            ) : (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Career Tips</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep interacting with the feed to get personalized career advice.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Show WhatsApp button only if bonus not claimed yet */}
      {!talent?.whatsappBonusClaimedAt && (
        <FloatingWhatsAppButton showPrompt={items.length > 0} />
      )}
    </div>
  );
}
