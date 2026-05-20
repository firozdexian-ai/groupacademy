/**
 * Typed feed-domain server surface.
 *
 * The feed has no dedicated edge functions yet, so this manifest currently
 * wraps the Postgres RPCs that power engagement, hype, and comment tips.
 * Adding an edge function later only requires extending `feedApi`.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  GetFeedEngagementArgs,
  FeedEngagementRow,
  HypeContentArgs,
  TipCommentArgs,
} from "@/edge/contracts/feed";

export const feedApi = {
  async getEngagement(args: GetFeedEngagementArgs): Promise<FeedEngagementRow[]> {
    const { data, error } = await supabase.rpc("get_feed_engagement" as any, args as any);
    if (error) throw error;
    return (data ?? []) as FeedEngagementRow[];
  },

  async hypeContent(args: HypeContentArgs): Promise<void> {
    const { error } = await supabase.rpc("hype_content" as any, args as any);
    if (error) throw error;
  },

  async tipComment(args: TipCommentArgs): Promise<void> {
    const { error } = await supabase.rpc("tip_comment" as any, args as any);
    if (error) throw error;
  },
};

export type FeedApi = typeof feedApi;
