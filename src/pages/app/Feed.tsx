import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, ArrowDown, Briefcase, BookOpen, Video, FileText, Coins, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTalent } from "@/hooks/useTalent";
import { useFeedRecommendations, FeedItem, FeedFilterType } from "@/hooks/useFeedRecommendations";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { FeedCardRedesigned } from "@/components/feed/FeedCardRedesigned";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { CareerInsightsStack } from "@/components/feed/CareerInsightsStack";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FloatingAIButton } from "@/components/feed/FloatingAIButton";
import { PersonalizedPromptCard } from "@/components/feed/PersonalizedPromptCard";
import { BannerCarousel } from "@/components/BannerCarousel";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
    hasGeneratedOnce,
  } = useFeedRecommendations();

  // Update timestamp when refresh finishes successfully
  useEffect(() => {
    if (!isRefreshing && !error) {
      setLastUpdated(new Date());
    }
  }, [isRefreshing, error]);

  // Check if onboarding is needed
  useEffect(() => {
    if (talent && !talent.onboardingCompletedAt) {
      setShowOnboarding(true);
    }
  }, [talent]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await refreshTalent();
    refresh(true);
  };

  const handleInterested = async (item: FeedItem) => {
    await markInterested(item);

    // Smart Navigation
    switch (item.type) {
      case "job":
        navigate(`/app/jobs/${item.id}`);
        break;
      case "blog":
        if (item.slug) navigate(`/app/blog/${item.slug}`);
        break;
      case "course":
      case "video":
        if (item.slug) {
          navigate(`/app/learning/courses/${item.slug}`);
        } else if (item.youtubeUrl) {
          window.open(item.youtubeUrl, "_blank");
        }
        break;
      default:
        console.warn("Unknown item type:", item.type);
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
      setPullDistance(Math.min(diff * 0.4, 120)); // Resistance effect
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance > 60) {
      // Threshold to trigger refresh
      await refresh(true);
    }
    setPullDistance(0);
  };

  const counts = {
    all: items.length,
    job: items.filter((i) => i.type === "job").length,
    course: items.filter((i) => i.type === "course").length,
    video: items.filter((i) => i.type === "video").length,
    blog: items.filter((i) => i.type === "blog").length,
  };

  const getEmptyStateAction = (type: FeedFilterType) => {
    switch (type) {
      case "job":
        return { label: "Browse All Jobs", action: () => navigate("/app/jobs"), icon: Briefcase };
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

  // Loading Skeleton
  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Welcome back!</h1>
            <p className="text-xs text-muted-foreground animate-pulse">Curating your personalized feed...</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
        <FeedSkeleton />
      </div>
    );
  }

  const emptyAction = getEmptyStateAction(filters.type);

  return (
    <div
      className="max-w-lg mx-auto px-4 py-4 space-y-4 min-h-screen"
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

      {/* Header */}
      <FeedHeader
        talentName={talent?.fullName}
        talentPhoto={talent?.profilePhotoUrl}
        onRefresh={() => refresh(true)}
        isRefreshing={isRefreshing}
      />

      {/* Last Updated Indicator */}
      {!isLoading && !error && items.length > 0 && (
        <div className="flex justify-end -mt-2 mb-2">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
      )}

      {/* Banner Carousel */}
      <BannerCarousel compact />

      {/* Personalized Service Prompts */}
      <PersonalizedPromptCard />

      {/* Career Insights */}
      {insights.length > 0 && <CareerInsightsStack insights={insights} />}

      {/* Filters */}
      <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 rounded-xl animate-in fade-in zoom-in-95">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <WifiOff className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-destructive mb-1">Couldn't load feed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error === "402"
                ? "We're currently experiencing high traffic. Please try again later."
                : "Something went wrong while curating your feed."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => refresh(true)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button size="sm" variant="default" onClick={() => navigate("/app/jobs")}>
                Explore Jobs Directly
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Items */}
      {!error && items.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {filters.type === "all" ? "All caught up!" : `No ${filters.type}s found`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
              {filters.type === "all"
                ? "We couldn't find any new recommendations for you right now."
                : `Try adjusting your filters or check back later.`}
            </p>

            <div className="flex gap-2 flex-wrap justify-center">
              <Button size="sm" variant="outline" onClick={() => refresh(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh (20 <Coins className="h-3 w-3 ml-1 text-yellow-500" />)
              </Button>
              <Button size="sm" onClick={emptyAction.action}>
                <emptyAction.icon className="h-3.5 w-3.5 mr-1.5" />
                {emptyAction.label}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 pb-20">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <FeedCardRedesigned
                item={item}
                onInterested={() => handleInterested(item)}
                onNotInterested={() => markNotInterested(item.id)}
              />
            </div>
          ))}

          {/* End of Feed Indicator */}
          {!error && items.length > 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground mb-3">You've reached the end</p>
              <Button variant="ghost" size="sm" onClick={() => refresh(true)} className="text-xs gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Load More (20 <Coins className="h-3 w-3 text-yellow-500" />)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <FloatingAIButton showPrompt={!talent?.servicesUsed?.length && items.length > 0} />
    </div>
  );
}
