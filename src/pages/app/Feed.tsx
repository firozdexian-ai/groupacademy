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
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10 animate-pulse">
        <div className="lg:col-span-8 space-y-8">
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-8">
          <Skeleton className="h-40 w-full rounded-[32px] bg-muted/40" />
          <Skeleton className="h-64 w-full rounded-[32px] bg-muted/40" />
        </div>
      </div>
    );

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-10 min-h-screen relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Refresh Hub: Hardware Interaction */}
      <div
        className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-300"
        style={{
          top: isRefreshing ? "30px" : `${pullDistance - 50}px`,
          opacity: pullDistance > 15 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="bg-primary shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] rounded-2xl p-2.5 border-2 border-background">
          <RefreshCw className={cn("h-5 w-5 text-white", isRefreshing && "animate-spin")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* MAIN FEED: Registry Synchronizer */}
        <div className="lg:col-span-8 space-y-8">
          <FeedHeader
            talentName={talent?.fullName}
            talentPhoto={talent?.profilePhotoUrl}
            talentProfession={talent?.customProfession}
            onRefresh={() => refresh()}
            isRefreshing={isRefreshing}
          />

          <QuickActionsGrid />
          <BannerCarousel compact />

          <div className="rounded-[32px] overflow-hidden border-2 border-primary/10 shadow-xl bg-card/30 backdrop-blur-xl">
            <ComposePost onPostCreated={() => refresh()} />
          </div>

          <FeedFilters filters={filters} onChange={setFilters} counts={counts} />

          {error ? (
            <Card className="border-destructive/20 bg-destructive/5 rounded-[32px] py-16 text-center animate-in zoom-in-95">
              <CardContent className="space-y-6">
                <WifiOff className="h-16 w-16 text-destructive mx-auto opacity-30 rotate-12" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Sync Interrupted</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                    Registry handshake failed. Check your uplink.
                  </p>
                </div>
                <Button
                  onClick={() => refresh()}
                  className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest border-2"
                >
                  Retry Sequence
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="rounded-[48px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center">
              <CardContent className="flex flex-col items-center space-y-8">
                <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center rotate-3 border-2 border-dashed border-border/60">
                  <Inbox className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Registry Sync Complete</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    All artifacts consumed. Check back for new telemetry.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 pb-40">
              {items.map((item, index) => (
                <div key={item.id || index} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {item.type === "post" ? (
                    <PostCard
                      post={
                        {
                          ...item,
                          authorName: item.authorName || "Platform Node",
                          authorTitle: item.authorTitle || "Verified Authority",
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

              <div className="flex flex-col items-center py-12 group cursor-pointer" onClick={loadMore}>
                <div className="h-12 w-1px bg-gradient-to-b from-primary to-transparent mb-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic mb-4">
                  Registry Trace Complete
                </p>
                <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-3">
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Load Archive
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: Strategic Intelligence */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <PersonalizedPromptCard />

            <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-muted/20 border-b border-border/10 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <TrendingUp className="h-4 w-4" /> Discovery Telemetry
                </h3>
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              </div>
              <CardContent className="p-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Logic", val: counts.post, icon: Layers },
                  { label: "Path", val: counts.course, icon: BookOpen },
                  { label: "Stream", val: counts.video, icon: Zap },
                  { label: "Intel", val: counts.blog, icon: ShieldCheck },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-background/50 p-5 rounded-[24px] border border-border/40 transition-all hover:border-primary/40 group"
                  >
                    <stat.icon className="h-3 w-3 text-muted-foreground/30 mb-3 group-hover:text-primary transition-colors" />
                    <p className="text-2xl font-black tracking-tighter leading-none">{stat.val}</p>
                    <p className="text-[8px] uppercase font-black text-muted-foreground/60 tracking-widest mt-2">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <CareerInsightsStack insights={insights || []} />

            <div className="px-6 py-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4 opacity-60">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-tight">
                Secure Neural Feed Logic v2.6.4 Synchronized
              </p>
            </div>
          </div>
        </aside>
      </div>

      <FloatingWhatsAppButton showPrompt={items.length > 0} />
    </div>
  );
}
