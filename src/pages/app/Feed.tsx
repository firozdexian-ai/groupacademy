import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, RefreshCw, ArrowDown, Briefcase, BookOpen, Video, FileText } from "lucide-react";
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
          // Fallback if no slug but has direct link (e.g. external video)
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
        <div className="bg-background/80 backdrop-blur-md shadow-lg rounded-full p-2 border">
          {isRefreshing ? (
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ArrowDown
              className={cn("h-5 w-5 text-primary transition-transform", pullDistance > 60 ? "rotate-180" : "")}
            />
          )}
        </div>
      </div>

      {/* Header */}
      <FeedHeader
        talentName={talent?.fullName}
        talentPhoto={talent?.profilePhotoUrl}
        onRefresh={() => refresh(true)}
        isRefreshing={isRefreshing}
      />

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
          <CardContent className="p-4 text-center">
            <p className="text-sm text-destructive font-medium mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh(true)}
              className="text-xs h-8 border-destructive/20 hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feed Items */}
      {items.length === 0 ? (
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

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refresh(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
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
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground mb-3">You've reached the end</p>
            <Button variant="ghost" size="sm" onClick={() => refresh(true)} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Load More
            </Button>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <FloatingAIButton showPrompt={!talent?.servicesUsed?.length && items.length > 0} />
    </div>
  );
}
