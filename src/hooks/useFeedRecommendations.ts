import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Curated Content Delivery Node
 * CTO Reference: Authoritative aggregator for cross-registry talent engagement.
 * Fix Log: v2.4.31 - Resolved TS2322 (Json to PollOptions array casting).
 */

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

const STORAGE_KEY_FILTERS = "feed_filters_v4";

const STATIC_INSIGHTS = [
  "Maintain profile parity to optimize recruiter visibility",
  "Engage with Mock Simulation nodes to refine interview telemetry",
  "Audit the Jobs Ledger daily for skill-aligned opportunities",
  "Synchronize your Digital Portfolio to verify achievement artifacts",
  "Execute networking protocols within high-density career tracks",
];

export function useFeedRecommendations() {
  const { talent } = useTalent();
  const { toast } = useToast();

  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

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

  const fetchFeed = useCallback(
    async (olderThan?: string) => {
      try {
        let coursesQuery = supabase.from("content").select("*").eq("is_published", true).limit(20);
        let blogsQuery = supabase.from("blog_posts").select("*").eq("status", "published").limit(15);
        let postsQuery = supabase
          .from("feed_posts")
          .select("*")
          .eq("is_active", true)
          .eq("status", "published")
          .limit(30);

        if (olderThan) {
          coursesQuery = coursesQuery.lt("created_at", olderThan);
          blogsQuery = blogsQuery.lt("created_at", olderThan);
          postsQuery = postsQuery.lt("created_at", olderThan);
        }

        const [coursesRes, blogsRes, postsRes] = await Promise.all([
          coursesQuery.order("created_at", { ascending: false }),
          blogsQuery.order("created_at", { ascending: false }),
          postsQuery.order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
        ]);

        const items: FeedItem[] = [];

        coursesRes.data?.forEach((c) => {
          const ytThumb = c.youtube_url ? getYoutubeThumbnail(c.youtube_url) : null;
          items.push({
            id: c.id,
            type: c.content_type === "free_video" ? "video" : "course",
            title: c.title,
            description: c.description?.substring(0, 150) + "..." || "",
            createdAt: c.created_at || "",
            slug: c.slug,
            mediaUrl: ytThumb || c.cover_image_url || c.thumbnail_url || undefined,
            mediaType: c.youtube_url ? "youtube" : "image",
            youtubeUrl: c.youtube_url || undefined,
          });
        });

        blogsRes.data?.forEach((b) => {
          items.push({
            id: b.id,
            type: "blog",
            title: b.title,
            description: b.excerpt || "",
            createdAt: b.created_at || "",
            slug: b.slug,
            mediaUrl: b.featured_image || undefined,
            mediaType: "image",
            category: b.category,
          });
        });

        postsRes.data?.forEach((p) => {
          items.push({
            id: p.id,
            type: "post",
            title: p.text_content?.substring(0, 60) || "Post",
            description: p.text_content || "",
            createdAt: p.created_at || "",
            mediaUrl: p.media_url || undefined,
            mediaType: "image",
            authorName: p.author_name,
            authorAvatar: p.author_avatar,
            authorTitle: p.author_title,
            contentType: p.content_type,
            isPinned: p.is_pinned,
            // FIXED: Resolved Json assignment conflict
            pollOptions: p.poll_options as unknown as { id: string; text: string }[],
          });
        });

        items.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (isMounted.current) {
          setAllItems((prev) => (olderThan ? [...prev, ...items] : items));
          setError(null);
        }
      } catch (err) {
        console.error("FEED_INGRESS_FAULT:", err);
      }
    },
    [getYoutubeThumbnail],
  );

  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true;
      setIsLoading(true);
      fetchFeed().finally(() => isMounted.current && setIsLoading(false));
    }
  }, [fetchFeed]);

  return {
    items: allItems
      .filter((i) => !dismissedIds.has(i.id))
      .filter((i) => {
        if (filters.type === "all") return true;
        if (filters.type === "poll") return i.type === "post" && i.contentType === "poll";
        return i.type === filters.type;
      }),
    insights: useMemo(() => [...STATIC_INSIGHTS].sort(() => 0.5 - Math.random()).slice(0, 3), []),
    isLoading,
    isRefreshing,
    error,
    filters,
    setFilters,
    refresh: async () => {
      setIsRefreshing(true);
      await fetchFeed();
      setIsRefreshing(false);
      toast({ title: "FEED_SYNC_COMPLETE" });
    },
    loadMore: async () => {
      if (allItems.length > 0) await fetchFeed(allItems[allItems.length - 1].createdAt);
    },
    markInterested: async (item: FeedItem) => {
      if (talent?.id)
        await supabase
          .from("feed_interactions")
          .upsert({ talent_id: talent.id, item_id: item.id, item_type: item.type, interaction_type: "interested" });
    },
    markNotInterested: (itemId: string) => {
      setDismissedIds((prev) => new Set([...prev, itemId]));
      toast({ title: "PREFERENCE_NOTED" });
    },
    hasGeneratedOnce: true,
  };
}
