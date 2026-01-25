import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";

export interface FeedItem {
  id: string;
  type: "job" | "course" | "video" | "blog";
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
  mediaType?: "image" | "youtube";
  youtubeUrl?: string;
  category?: string;
  externalUrl?: string;
  // Job-specific fields
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  jobType?: string;
}

export type FeedFilterType = "all" | "job" | "course" | "video" | "blog";
export type FeedSortType = "match" | "newest";

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

const STORAGE_KEY_FILTERS = "feed_filters";

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

  // Initialize filters from localStorage
  const [filters, setFiltersState] = useState<FeedFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      return saved ? JSON.parse(saved) : { type: "all", sort: "match" };
    } catch {
      return { type: "all", sort: "match" };
    }
  });

  const isMounted = useRef(true);
  const hasInitialFetch = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setFilters = useCallback((newFilters: FeedFilters) => {
    setFiltersState(newFilters);
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(newFilters));
  }, []);

  const getYoutubeThumbnail = useCallback((url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  }, []);

  // Basic fallback fetch without AI
  const fetchBasicFeed = useCallback(async () => {
    try {
      const [jobsResult, coursesResult, blogsResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, description, company_name, company_logo_url, source_image_url, location, created_at, salary_range_min, salary_range_max, experience_level, job_type")
          .eq("is_active", true)
          .or("deadline.is.null,deadline.gte.now()")
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("content")
          .select("id, title, description, thumbnail_url, cover_image_url, youtube_url, created_at, slug, content_type")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("blog_posts")
          .select("id, title, excerpt, featured_image, created_at, slug, category, external_url")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const getRandomScore = () => Math.floor(Math.random() * 26) + 60;
      const items: FeedItem[] = [];

      if (jobsResult.data) {
        jobsResult.data.forEach((job) => {
          const mediaUrl = job.source_image_url || job.company_logo_url || undefined;
          items.push({
            id: job.id,
            type: "job",
            title: job.title,
            description: job.description?.substring(0, 150) + "..." || "",
            company: job.company_name,
            companyLogo: job.company_logo_url || undefined,
            location: job.location || undefined,
            createdAt: job.created_at || "",
            matchScore: getRandomScore(),
            mediaUrl: mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            salaryMin: job.salary_range_min || undefined,
            salaryMax: job.salary_range_max || undefined,
            experienceLevel: job.experience_level || undefined,
            jobType: job.job_type || undefined,
          });
        });
      }

      if (coursesResult.data) {
        coursesResult.data.forEach((course) => {
          let mediaUrl = course.cover_image_url || course.thumbnail_url || undefined;
          let mediaType: "image" | "youtube" | undefined = mediaUrl ? "image" : undefined;
          let youtubeUrl: string | undefined = undefined;

          if (course.youtube_url) {
            youtubeUrl = course.youtube_url;
            const ytThumb = getYoutubeThumbnail(course.youtube_url);
            if (ytThumb) {
              mediaUrl = ytThumb;
              mediaType = "youtube";
            }
          }

          items.push({
            id: course.id,
            type: course.content_type === "free_video" ? "video" : "course",
            title: course.title,
            description: course.description?.substring(0, 150) + "..." || "",
            thumbnail: course.thumbnail_url || undefined,
            createdAt: course.created_at || "",
            slug: course.slug,
            matchScore: getRandomScore(),
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            youtubeUrl: youtubeUrl,
          });
        });
      }

      if (blogsResult.data) {
        blogsResult.data.forEach((blog) => {
          items.push({
            id: blog.id,
            type: "blog",
            title: blog.title,
            description: blog.excerpt || "",
            thumbnail: blog.featured_image || undefined,
            createdAt: blog.created_at || "",
            slug: blog.slug,
            matchScore: getRandomScore(),
            mediaUrl: blog.featured_image || undefined,
            mediaType: blog.featured_image ? "image" : undefined,
            category: blog.category || undefined,
            externalUrl: blog.external_url || undefined,
          });
        });
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (isMounted.current) {
        setAllItems(items);
      }
    } catch (err) {
      console.error("Error in fetchBasicFeed:", err);
    }
  }, [getYoutubeThumbnail]);

  // Fetch recommendations from AI
  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      if (!talent?.id) return;

      try {
        if (forceRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // 1. Invoke AI Edge Function
        const { data, error: fnError } = await supabase.functions.invoke("generate-feed-recommendations", {
          body: { talentId: talent.id, forceRefresh },
        });

        // 2. SAFETY NET: Concurrently fetch latest blogs manually
        // (This ensures blogs appear even if the AI function hasn't indexed them yet)
        const { data: recentBlogs } = await supabase
          .from("blog_posts")
          .select("id, title, excerpt, featured_image, created_at, slug, category, external_url")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(5);

        if (!isMounted.current) return;

        if (fnError) throw new Error(fnError.message);
        if (data.error) throw new Error(data.error);

        let aiItems: FeedItem[] = data.recommendations || [];

        // 3. Merge AI results with latest blogs
        if (recentBlogs && recentBlogs.length > 0) {
          const blogItems: FeedItem[] = recentBlogs.map((blog) => ({
            id: blog.id,
            type: "blog",
            title: blog.title,
            description: blog.excerpt || "",
            thumbnail: blog.featured_image || undefined,
            createdAt: blog.created_at || "",
            slug: blog.slug,
            matchScore: 80, // Give new blogs a high default score
            mediaUrl: blog.featured_image || undefined,
            mediaType: blog.featured_image ? "image" : undefined,
            category: blog.category || undefined,
            externalUrl: blog.external_url || undefined,
            matchReason: "New article you might like",
          }));

          // Deduplicate (don't add if AI already found it)
          const existingIds = new Set(aiItems.map((i) => i.id));
          const newBlogs = blogItems.filter((b) => !existingIds.has(b.id));

          // Add new blogs to the top
          aiItems = [...newBlogs, ...aiItems];
        }

        setAllItems(aiItems);
        setInsights(data.careerInsights || []);
        setHasGeneratedOnce(true);

        if (!data.cached && forceRefresh) {
          toast({
            title: "Recommendations updated",
            description: "AI has analyzed your profile for best matches",
          });
        }
      } catch (err) {
        console.error("Error in fetchRecommendations:", err);
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load recommendations");
          await fetchBasicFeed();
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [talent?.id, toast, fetchBasicFeed],
  );

  // Refresh with credit check
  const refresh = useCallback(
    async (forceAI = false) => {
      if (forceAI && hasGeneratedOnce) {
        if (!canAfford("SUGGESTED_JOBS")) {
          toast({
            title: "Insufficient credits",
            description: "You need 20 credits to refresh AI recommendations",
            variant: "destructive",
          });
          return;
        }

        const success = await deductCredits("SUGGESTED_JOBS", undefined, "AI feed refresh");
        if (!success) return;
      }

      await fetchRecommendations(forceAI);
    },
    [fetchRecommendations, hasGeneratedOnce, canAfford, deductCredits, toast],
  );

  const markInterested = useCallback(
    async (item: FeedItem) => {
      if (!talent?.id) return;
      await supabase.from("feed_interactions").upsert(
        {
          talent_id: talent.id,
          item_id: item.id,
          item_type: item.type,
          interaction_type: "interested",
        },
        { onConflict: "talent_id,item_id,interaction_type" },
      );
    },
    [talent?.id],
  );

  const markNotInterested = useCallback(
    (itemId: string) => {
      if (!talent?.id) return;
      setDismissedIds((prev) => new Set([...prev, itemId]));
      const item = allItems.find((i) => i.id === itemId);
      if (item) {
        supabase
          .from("feed_interactions")
          .upsert(
            {
              talent_id: talent.id,
              item_id: itemId,
              item_type: item.type,
              interaction_type: "not_interested",
            },
            { onConflict: "talent_id,item_id,interaction_type" },
          )
          .then(() => {
            toast({
              title: "Got it!",
              description: "We'll show you fewer items like this",
            });
          });
      }
    },
    [talent?.id, allItems, toast],
  );

  useEffect(() => {
    if (!talent?.id) return;
    supabase
      .from("feed_interactions")
      .select("item_id")
      .eq("talent_id", talent.id)
      .eq("interaction_type", "not_interested")
      .then(({ data }) => {
        if (isMounted.current && data) {
          setDismissedIds(new Set(data.map((d) => d.item_id)));
        }
      });
  }, [talent?.id]);

  useEffect(() => {
    if (talent?.id && !hasInitialFetch.current) {
      hasInitialFetch.current = true;
      fetchRecommendations();
    }
  }, [talent?.id, fetchRecommendations]);

  const filteredItems = useMemo(() => {
    return allItems
      .filter((item) => !dismissedIds.has(item.id))
      .filter((item) => filters.type === "all" || item.type === filters.type)
      .sort((a, b) => {
        if (filters.sort === "match") {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [allItems, dismissedIds, filters.type, filters.sort]);

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
    hasGeneratedOnce,
  };
}
