import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";

/**
 * Feed Recommendations — React Query powered with infinite pagination.
 * v3.0: Migrated from useState/useEffect to useInfiniteQuery for caching,
 * dedup, and proper pagination via createdAt cursor.
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
  authorCountry?: string;
  authorProfession?: string;
}

export type FeedFilterType = "all" | "course" | "video" | "blog" | "post" | "poll";
export type FeedSortType = "match" | "newest";
export type FeedScope = "global" | "country" | "profession";

export interface FeedFilters {
  type: FeedFilterType;
  sort: FeedSortType;
  scope: FeedScope;
}

const STORAGE_KEY_FILTERS = "feed_filters_v5";
const PAGE_SIZE_POSTS = 30;
const PAGE_SIZE_COURSES = 20;
const PAGE_SIZE_BLOGS = 15;

const STATIC_INSIGHTS = [
  "Keep your profile fresh to stay visible to recruiters",
  "Practice mock interviews to sharpen your delivery",
  "Check the Jobs board daily for matches in your field",
  "Update your portfolio to showcase recent achievements",
  "Connect with peers in your career track to grow faster",
];

const getYoutubeThumbnail = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
};

async function fetchFeedPage(olderThan?: string): Promise<{ items: FeedItem[]; nextCursor?: string }> {
  let coursesQuery = supabase.from("content").select("*").eq("is_published", true).limit(PAGE_SIZE_COURSES);
  let blogsQuery = supabase.from("blog_posts").select("*").eq("status", "published").limit(PAGE_SIZE_BLOGS);
  let postsQuery = supabase
    .from("feed_posts")
    .select("*")
    .eq("is_active", true)
    .eq("status", "published")
    .limit(PAGE_SIZE_POSTS);

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

  coursesRes.data?.forEach((c: any) => {
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

  blogsRes.data?.forEach((b: any) => {
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

  // Batch author enrichment
  const authorIds = Array.from(
    new Set((postsRes.data || []).map((p: any) => p.author_user_id).filter(Boolean)),
  );
  const authorMeta = new Map<string, { country?: string; profession?: string }>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("talents")
      .select("user_id, country, custom_profession")
      .in("user_id", authorIds);
    authors?.forEach((a: any) =>
      authorMeta.set(a.user_id, { country: a.country, profession: a.custom_profession }),
    );
  }

  postsRes.data?.forEach((p: any) => {
    const meta = p.author_user_id ? authorMeta.get(p.author_user_id) : undefined;
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
      authorCountry: meta?.country,
      authorProfession: meta?.profession,
      pollOptions: p.poll_options as unknown as { id: string; text: string }[],
    });
  });

  items.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : undefined;
  // Stop paging when both sources return empty
  const hasMore = (postsRes.data?.length || 0) >= PAGE_SIZE_POSTS ||
                  (coursesRes.data?.length || 0) >= PAGE_SIZE_COURSES;

  return { items, nextCursor: hasMore ? nextCursor : undefined };
}

export function useFeedRecommendations() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const [filters, setFiltersState] = useState<FeedFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      const parsed = saved ? JSON.parse(saved) : null;
      return { type: "all", sort: "newest", scope: "global", ...(parsed || {}) };
    } catch {
      return { type: "all", sort: "newest", scope: "global" };
    }
  });

  const setFilters = useCallback((newFilters: FeedFilters) => {
    setFiltersState(newFilters);
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(newFilters));
  }, []);

  const query = useInfiniteQuery({
    queryKey: ["feed-recommendations"],
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const allItems: FeedItem[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) || [],
    [query.data],
  );

  const talentCountry = talent?.country;
  const talentProfession = (talent as any)?.customProfession || (talent as any)?.custom_profession;

  // Stable randomized insights — generated once
  const insightsRef = useRef<string[]>();
  if (!insightsRef.current) {
    insightsRef.current = [...STATIC_INSIGHTS].sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  const filteredItems = useMemo(
    () =>
      allItems
        .filter((i) => !dismissedIds.has(i.id))
        .filter((i) => {
          if (filters.type === "all") return true;
          if (filters.type === "poll") return i.type === "post" && i.contentType === "poll";
          return i.type === filters.type;
        })
        .filter((i) => {
          if (filters.scope === "global") return true;
          if (i.type !== "post") return false;
          if (filters.scope === "country") return !!talentCountry && i.authorCountry === talentCountry;
          if (filters.scope === "profession")
            return !!talentProfession && i.authorProfession === talentProfession;
          return true;
        }),
    [allItems, dismissedIds, filters, talentCountry, talentProfession],
  );

  return {
    items: filteredItems,
    insights: insightsRef.current,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error ? String((query.error as Error).message || "Feed error") : null,
    filters,
    setFilters,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed-recommendations"] });
      toast({ title: "Feed refreshed" });
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    markInterested: async (item: FeedItem) => {
      if (talent?.id)
        await supabase
          .from("feed_interactions")
          .upsert({ talent_id: talent.id, item_id: item.id, item_type: item.type, interaction_type: "interested" });
    },
    markNotInterested: (itemId: string) => {
      setDismissedIds((prev) => new Set([...prev, itemId]));
      toast({ title: "Got it — we'll show less like this" });
    },
    hasGeneratedOnce: true,
  };
}
