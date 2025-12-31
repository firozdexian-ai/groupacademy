import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';

export interface FeedItem {
  id: string;
  type: 'job' | 'course' | 'video';
  title: string;
  description: string;
  company?: string;
  thumbnail?: string;
  createdAt: string;
  slug?: string;
  matchScore?: number;
  matchReason?: string;
  skills?: string[];
  location?: string;
  companyLogo?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'youtube';
  youtubeUrl?: string;
}

export type FeedFilterType = 'all' | 'job' | 'course' | 'video';
export type FeedSortType = 'match' | 'newest';

export interface FeedFilters {
  type: FeedFilterType;
  sort: FeedSortType;
}

interface UseFeedRecommendationsResult {
  items: FeedItem[];
  insights: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  filters: FeedFilters;
  setFilters: (filters: FeedFilters) => void;
  refresh: (forceAI?: boolean) => Promise<void>;
  markInterested: (item: FeedItem) => Promise<void>;
  markNotInterested: (itemId: string) => void;
  hasGeneratedOnce: boolean;
}

export function useFeedRecommendations(): UseFeedRecommendationsResult {
  const { talent } = useTalent();
  const { deductCredits, canAfford } = useCredits();
  const { toast } = useToast();
  
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>({
    type: 'all',
    sort: 'match'
  });

  // Fetch recommendations from AI
  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!talent?.id) return;

    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('generate-feed-recommendations', {
        body: { talentId: talent.id, forceRefresh }
      });

      if (fnError) {
        console.error('Error fetching recommendations:', fnError);
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAllItems(data.recommendations || []);
      setInsights(data.careerInsights || []);
      setHasGeneratedOnce(true);

      if (!data.cached) {
        toast({
          title: "Recommendations updated",
          description: "AI has analyzed your profile for best matches"
        });
      }

    } catch (err) {
      console.error('Error in fetchRecommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      // Fall back to basic fetch if AI fails
      await fetchBasicFeed();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [talent?.id, toast]);

  // Basic fallback fetch without AI
  const fetchBasicFeed = async () => {
    try {
      const [jobsResult, coursesResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, description, company_name, company_logo_url, source_image_url, location, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('content')
          .select('id, title, description, thumbnail_url, cover_image_url, youtube_url, created_at, slug, content_type')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(15)
      ]);

      // Helper to extract YouTube thumbnail
      const getYoutubeThumbnail = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
      };

      const items: FeedItem[] = [];

      if (jobsResult.data) {
        jobsResult.data.forEach(job => {
          const mediaUrl = job.source_image_url || job.company_logo_url || undefined;
          items.push({
            id: job.id,
            type: 'job',
            title: job.title,
            description: job.description?.substring(0, 150) + '...' || '',
            company: job.company_name,
            companyLogo: job.company_logo_url || undefined,
            location: job.location || undefined,
            createdAt: job.created_at || '',
            matchScore: 50,
            mediaUrl: mediaUrl,
            mediaType: mediaUrl ? 'image' : undefined
          });
        });
      }

      if (coursesResult.data) {
        coursesResult.data.forEach(course => {
          let mediaUrl = course.cover_image_url || course.thumbnail_url || undefined;
          let mediaType: 'image' | 'youtube' | undefined = mediaUrl ? 'image' : undefined;
          let youtubeUrl: string | undefined = undefined;
          
          if (course.youtube_url) {
            youtubeUrl = course.youtube_url;
            const ytThumb = getYoutubeThumbnail(course.youtube_url);
            if (ytThumb) {
              mediaUrl = ytThumb;
              mediaType = 'youtube';
            }
          }
          
          items.push({
            id: course.id,
            type: course.content_type === 'free_video' ? 'video' : 'course',
            title: course.title,
            description: course.description?.substring(0, 150) + '...' || '',
            thumbnail: course.thumbnail_url || undefined,
            createdAt: course.created_at || '',
            slug: course.slug,
            matchScore: 50,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            youtubeUrl: youtubeUrl
          });
        });
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllItems(items);
    } catch (err) {
      console.error('Error in fetchBasicFeed:', err);
    }
  };

  // Refresh with credit check
  const refresh = useCallback(async (forceAI = false) => {
    if (forceAI && hasGeneratedOnce) {
      // Check if user can afford refresh (20 credits)
      if (!canAfford('SUGGESTED_JOBS')) {
        toast({
          title: "Insufficient credits",
          description: "You need 20 credits to refresh AI recommendations",
          variant: "destructive"
        });
        return;
      }

      const success = await deductCredits('SUGGESTED_JOBS', 'AI feed refresh');
      if (!success) return;
    }

    await fetchRecommendations(forceAI);
  }, [fetchRecommendations, hasGeneratedOnce, canAfford, deductCredits, toast]);

  // Mark item as interested and navigate
  const markInterested = useCallback(async (item: FeedItem) => {
    if (!talent?.id) return;

    // Record interaction
    await supabase
      .from('feed_interactions')
      .upsert({
        talent_id: talent.id,
        item_id: item.id,
        item_type: item.type,
        interaction_type: 'interested'
      }, { onConflict: 'talent_id,item_id,interaction_type' });

  }, [talent?.id]);

  // Mark item as not interested (dismiss)
  const markNotInterested = useCallback((itemId: string) => {
    if (!talent?.id) return;

    // Optimistic update
    setDismissedIds(prev => new Set([...prev, itemId]));

    // Record interaction
    const item = allItems.find(i => i.id === itemId);
    if (item) {
      supabase
        .from('feed_interactions')
        .upsert({
          talent_id: talent.id,
          item_id: itemId,
          item_type: item.type,
          interaction_type: 'not_interested'
        }, { onConflict: 'talent_id,item_id,interaction_type' })
        .then(() => {
          toast({
            title: "Got it!",
            description: "We'll show you fewer items like this"
          });
        });
    }
  }, [talent?.id, allItems, toast]);

  // Load dismissed items on mount
  useEffect(() => {
    if (!talent?.id) return;

    supabase
      .from('feed_interactions')
      .select('item_id')
      .eq('talent_id', talent.id)
      .eq('interaction_type', 'not_interested')
      .then(({ data }) => {
        if (data) {
          setDismissedIds(new Set(data.map(d => d.item_id)));
        }
      });
  }, [talent?.id]);

  // Initial load
  useEffect(() => {
    if (talent?.id) {
      fetchRecommendations();
    }
  }, [talent?.id]);

  // Filter and sort items
  const filteredItems = allItems
    .filter(item => !dismissedIds.has(item.id))
    .filter(item => filters.type === 'all' || item.type === filters.type)
    .sort((a, b) => {
      if (filters.sort === 'match') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return {
    items: filteredItems,
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
  };
}
