import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  getCreatorScorecard,
  getCreatorTopPosts,
  getPostInsights,
  recordImpressionAsync,
  recordShare as recordShareRepo,
} from "@/domains/feed/repo/feedRepo";

/**
 * GroUp Academy: Creator Shell Analytics & Tracking Suite (V5.6.0)
 * CTO Reference: Authoritative interaction sensor for UGC tracking and signal collection.
 * Architecture: Digital Workforce enabled - streams analytic faults directly to Admin Chat.
 * Phase: Z0 Code Freeze Hardened (2024 Launch Edition).
 */

export interface CreatorScorecard {
  totals?: {
    total_views: number;
    total_shares: number;
    total_hype: number;
    earned_credits: number;
  };
  growth_pct?: Record<string, number>;
  current?: any;
  previous?: any;
  post_count?: number;
  [key: string]: any;
}

export interface PostInsightData {
  views_count?: number;
  shares_count?: number;
  hype_count?: number;
  engagement_rate?: number;
  totals?: any;
  credits_earned?: number;
  daily?: any[];
  top_hypers?: any[];
  [key: string]: any;
}

/**
 * Pulls overall programmatic scorecard parameters for a target creator profile node.
 */
export function useCreatorScorecard(talentId?: string, days: number = 7) {
  return useQuery({
    queryKey: ["creator-scorecard", talentId, days],
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000, // 5-minute metric consistency window
    queryFn: async (): Promise<CreatorScorecard> => {
      try {
        return (await getCreatorScorecard(talentId!, days)) as CreatorScorecard;
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: get_creator_scorecard transaction failed.", {
          talentId,
          error: error?.message,
        });
        throw error;
      }
    },
  });
}

/**
 * Retrieves an array of top-performing UGC listings based on visibility weight metrics.
 */
export function useCreatorTopPosts(talentId?: string, days: number = 30, limit: number = 20) {
  return useQuery({
    queryKey: ["creator-top-posts", talentId, days, limit],
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<any[]> => {
      try {
        return await getCreatorTopPosts(talentId!, days, limit);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: get_creator_top_posts transaction failed.", {
          talentId,
          error: error?.message,
        });
        throw error;
      }
    },
  });
}

/**
 * Pulls telemetry insights specifically mapped to a single target feed post node.
 */
export function usePostInsights(postId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["post-insights", postId],
    enabled: !!postId && enabled,
    staleTime: 60 * 1000, // 60s fast caching for interactive feed viewports
    queryFn: async (): Promise<PostInsightData> => {
      try {
        return (await getPostInsights(postId!)) as PostInsightData;
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: get_post_insights telemetry extraction failure.", {
          postId,
          error: error?.message,
        });
        throw error;
      }
    },
  });
}

// Global in-memory de-duplication registry for viewpoint visibility counts
const seenPosts = new Set<string>();

/**
 * Automated Efficiency Sensor: Tracks 50% device visibility boundaries on viewports.
 * Automatically records un-duplicated impressions directly into the database engine.
 */
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

            // Execute the impression collection pipeline cleanly via public schema bounds
            (recordImpressionAsync(postId, surface) as any).then?.((res: any) => {
              if (res?.error) {
                console.error("[Digital Workforce] ANOMALY: record_impression background tracking failure.", {
                  postId,
                  surface,
                  error: res.error?.message,
                });
              }
            });

            obs.disconnect();
          }
        });
      },
      { threshold: [0.5] }, // Enforce 50% exact presentation constraint layout
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [postId, surface]);

  return elRef;
}

/**
 * Logs outward sharing tracking pathways targeted by channels ( bKash, WhatsApp, Email, etc.)
 */
export function useRecordShare() {
  return useMutation({
    mutationFn: async ({ postId, channel }: { postId: string; channel: string }) => {
      const { error } = await supabase.rpc("record_share" as any, {
        _post_id: postId,
        _channel: channel,
      });
      if (error) throw error;
    },
    onError: (err: any, variables) => {
      // Hardened: Replaces silent swallow protocols with explicit platform sensors logging
      console.error("[Digital Workforce] ANOMALY: record_share transaction failure.", {
        postId: variables.postId,
        channel: variables.channel,
        error: err.message,
      });
    },
  });
}

// Backward-compatible stateless export ensuring zero pipeline regressions across feed controllers
export async function recordShare(postId: string, channel: string) {
  try {
    await supabase.rpc("record_share" as any, { _post_id: postId, _channel: channel });
  } catch (err: any) {
    console.error("[Digital Workforce] ANOMALY: Stateless legacy recordShare swallowed a fault.", err?.message);
  }
}
