import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

export interface FeedItem {
  id: string;
  type: "course" | "video" | "blog" | "post";
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
  // Post-specific fields
  authorName?: string;
  authorAvatar?: string;
  authorTitle?: string;
  contentType?: "text" | "poll" | "tip" | "news" | "announcement" | "media";
  textContent?: string;
  pollOptions?: { id: string; text: string }[];
  pollEndsAt?: string;
  linkUrl?: string;
  linkPreview?: { title: string; description?: string; image?: string };
  tags?: string[];
  isPinned?: boolean;
}

export type FeedFilterType = "all" | "course" | "video" | "blog" | "post" | "poll";
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
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markInterested: (item: FeedItem) => Promise<void>;
  markNotInterested: (itemId: string) => void;
  hasGeneratedOnce: boolean;
}

const STORAGE_KEY_FILTERS = "feed_filters";

// Static curated career tips - no AI needed
const STATIC_INSIGHTS = [
  "Keep your profile updated to increase visibility to employers",
  "Practice common interview questions using our Mock Interview service",
  "Check the Jobs Hub daily for new opportunities matching your skills",
  "Build your portfolio to stand out from other candidates",
  "Network with professionals in your field through events and courses",
];

export function useFeedRecommendations(): UseFeedRecommendationsResult {
  const { talent } = useTalent();
  const { toast } = useToast();

  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Initialize filters from localStorage
  const [filters, setFiltersState] = useState<FeedFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      return saved ? JSON.parse(saved) : { type: "all", sort: "newest" };
    } catch {
      return { type: "all", sort: "newest" };
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

  // Simple, free feed fetch - no AI, no credits
  const fetchFeed = useCallback(async (olderThan?: string) => {
    try {
      // Parallel fetch from all content sources
      let coursesQuery = supabase
        .from("content")
        .select("id, title, description, thumbnail_url, cover_image_url, youtube_url, created_at, slug, content_type")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);

      let blogsQuery = supabase
        .from("blog_posts")
        .select("id, title, excerpt, featured_image, created_at, slug, category, external_url")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(15);

      let postsQuery = supabase
        .from("feed_posts")
        .select("*")
        .eq("is_active", true)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);

      if (olderThan) {
        coursesQuery = coursesQuery.lt("created_at", olderThan);
        blogsQuery = blogsQuery.lt("created_at", olderThan);
        postsQuery = postsQuery.lt("created_at", olderThan);
      }

      const [coursesResult, blogsResult, postsResult] = await Promise.all([
        coursesQuery, blogsQuery, postsQuery,
      ]);

      const items: FeedItem[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Add posts (pinned posts naturally come first due to order)
      if (postsResult.data) {
        postsResult.data.forEach((post: any) => {
          const isRecent = new Date(post.created_at) > oneDayAgo;
          items.push({
            id: post.id,
            type: "post",
            title: post.text_content?.substring(0, 60) || "Post",
            description: post.text_content || "",
            createdAt: post.created_at || "",
            matchScore: post.is_pinned ? 100 : (isRecent ? 90 : 70),
            mediaUrl: post.media_url || undefined,
            mediaType: post.media_url ? "image" : undefined,
            authorName: post.author_name,
            authorAvatar: post.author_avatar,
            authorTitle: post.author_title,
            contentType: post.content_type,
            textContent: post.text_content,
            pollOptions: post.poll_options,
            pollEndsAt: post.poll_ends_at,
            linkUrl: post.link_url,
            linkPreview: post.link_preview,
            tags: post.tags,
            isPinned: post.is_pinned,
          });
        });
      }

      // Add courses
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

          const isRecent = new Date(course.created_at || "") > oneDayAgo;

          items.push({
            id: course.id,
            type: course.content_type === "free_video" ? "video" : "course",
            title: course.title,
            description: course.description?.substring(0, 150) + "..." || "",
            thumbnail: course.thumbnail_url || undefined,
            createdAt: course.created_at || "",
            slug: course.slug,
            matchScore: isRecent ? 85 : 65,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            youtubeUrl: youtubeUrl,
          });
        });
      }

      // Add blogs
      if (blogsResult.data) {
        blogsResult.data.forEach((blog) => {
          const isRecent = new Date(blog.created_at || "") > oneDayAgo;

          items.push({
            id: blog.id,
            type: "blog",
            title: blog.title,
            description: blog.excerpt || "",
            thumbnail: blog.featured_image || undefined,
            createdAt: blog.created_at || "",
            slug: blog.slug,
            matchScore: isRecent ? 85 : 60,
            mediaUrl: blog.featured_image || undefined,
            mediaType: blog.featured_image ? "image" : undefined,
            category: blog.category || undefined,
            externalUrl: blog.external_url || undefined,
          });
        });
      }

      // Sort: pinned first, then by recency
      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      if (isMounted.current) {
        if (olderThan) {
          setAllItems(prev => [...prev, ...items]);
        } else {
          setAllItems(items);
        }
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      }
    }
  }, [getYoutubeThumbnail]);

  // Refresh function - now FREE (no credits needed)
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchFeed();
    if (isMounted.current) {
      setIsRefreshing(false);
      toast({
        title: "Feed refreshed",
        description: "Showing the latest content",
      });
    }
  }, [fetchFeed, toast]);

  // Load more - cursor-based pagination
  const loadMore = useCallback(async () => {
    if (allItems.length === 0) return;
    const oldestItem = allItems[allItems.length - 1];
    setIsRefreshing(true);
    await fetchFeed(oldestItem.createdAt);
    if (isMounted.current) {
      setIsRefreshing(false);
    }
  }, [fetchFeed, allItems]);

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

  // Load dismissed items
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

  // Initial fetch
  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true;
      setIsLoading(true);
      fetchFeed().finally(() => {
        if (isMounted.current) {
          setIsLoading(false);
        }
      });
    }
  }, [fetchFeed]);

  const filteredItems = useMemo(() => {
    return allItems
      .filter((item) => !dismissedIds.has(item.id))
      .filter((item) => {
        if (filters.type === "all") return true;
        if (filters.type === "poll") return item.type === "post" && item.contentType === "poll";
        return item.type === filters.type;
      })
      .sort((a, b) => {
        // Pinned posts always first, then newest
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [allItems, dismissedIds, filters.type]);

  // Return static insights - no AI generation needed
  const insights = useMemo(() => {
    // Shuffle and pick 3 random insights
    const shuffled = [...STATIC_INSIGHTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  return {
    items: filteredItems,
    insights,
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh,
    loadMore,
    markInterested,
    markNotInterested,
    hasGeneratedOnce: true, // Always true since we use static insights
  };
}
