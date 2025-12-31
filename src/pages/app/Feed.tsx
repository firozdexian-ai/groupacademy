import { useNavigate } from 'react-router-dom';
import { Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTalent } from '@/hooks/useTalent';
import { useFeedRecommendations } from '@/hooks/useFeedRecommendations';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { FeedCardRedesigned } from '@/components/feed/FeedCardRedesigned';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { CareerInsightsStack } from '@/components/feed/CareerInsightsStack';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { FloatingAIButton } from '@/components/feed/FloatingAIButton';
import { PersonalizedPromptCard } from '@/components/feed/PersonalizedPromptCard';
import { BannerCarousel } from '@/components/BannerCarousel';
import { useState, useEffect } from 'react';

export default function Feed() {
  const navigate = useNavigate();
  const { talent, refreshTalent } = useTalent();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
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
    hasGeneratedOnce
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
    // Refresh recommendations after onboarding
    refresh(true);
  };

  const handleInterested = async (item: typeof items[0]) => {
    await markInterested(item);
    // Navigate to the item - use app routes to stay within shell
    if (item.type === 'job') {
      navigate(`/app/jobs/${item.id}`);
    } else if (item.slug) {
      navigate(`/app/learning/courses/${item.slug}`);
    }
  };

  // Calculate counts for filters
  const counts = {
    all: items.length,
    job: items.filter(i => i.type === 'job').length,
    course: items.filter(i => i.type === 'course').length,
    video: items.filter(i => i.type === 'video').length
  };

  // Show onboarding wizard if not completed
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Analyzing your profile for best matches...</p>
        </div>
        <FeedSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header with Avatar */}
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

      {/* Career Insights - Vertical Stack */}
      <CareerInsightsStack insights={insights} />

      {/* Filters */}
      <FeedFilters
        filters={filters}
        onChange={setFilters}
        counts={counts}
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refresh()}
              className="mt-2"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feed Items */}
      {items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {filters.type === 'all' 
                ? "No recommendations available right now."
                : `No ${filters.type}s to show.`}
            </p>
            <Button onClick={() => refresh(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={item.id}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <FeedCardRedesigned
                item={item}
                onInterested={() => handleInterested(item)}
                onNotInterested={() => markNotInterested(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <FloatingAIButton showPrompt={!talent?.servicesUsed?.length} />
    </div>
  );
}
