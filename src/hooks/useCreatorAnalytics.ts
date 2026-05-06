import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCreatorScorecard(talentId?: string, days: number = 7) {
  return useQuery({
    queryKey: ["creator-scorecard", talentId, days],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_creator_scorecard" as any, {
        _talent_id: talentId,
        _days: days,
      });
      if (error) throw error;
      return data as any;
    },
  });
}

export function useCreatorTopPosts(talentId?: string, days: number = 30, limit: number = 20) {
  return useQuery({
    queryKey: ["creator-top-posts", talentId, days, limit],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_creator_top_posts" as any, {
        _talent_id: talentId,
        _days: days,
        _limit: limit,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function usePostInsights(postId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["post-insights", postId],
    enabled: !!postId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_post_insights" as any, {
        _post_id: postId,
      });
      if (error) throw error;
      return data as any;
    },
  });
}

const seenPosts = new Set<string>();

export function useImpressionTracker(postId?: string, surface: string = "feed") {
  const elRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!postId || !elRef.current || seenPosts.has(`${postId}:${surface}`)) return;
    const el = elRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            const key = `${postId}:${surface}`;
            if (seenPosts.has(key)) return;
            seenPosts.add(key);
            supabase
              .rpc("record_impression" as any, { _post_id: postId, _surface: surface })
              .then(() => {});
            obs.disconnect();
          }
        });
      },
      { threshold: [0.5] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [postId, surface]);
  return elRef;
}

export async function recordShare(postId: string, channel: string) {
  try {
    await supabase.rpc("record_share" as any, { _post_id: postId, _channel: channel });
  } catch {
    /* swallow */
  }
}
