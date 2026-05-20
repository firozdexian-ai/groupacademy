/**
 * Edge function contracts for the feed domain.
 *
 * The feed domain currently has no dedicated `supabase.functions.invoke`
 * callsites — all server interaction goes through Postgres RPCs
 * (`get_feed_engagement`, `hype_content`, `tip_comment`) and direct table
 * reads. This file reserves the namespace and documents the RPC surface
 * so future edge functions for the feed plug into the same pattern as
 * `learning.ts` / `jobs.ts`.
 */

// --- get_feed_engagement RPC ---
export interface GetFeedEngagementArgs {
  _post_ids: string[];
  _talent_id: string | null;
}

export type FeedReactionType = "like" | "insightful" | "celebrate" | "support";

export interface FeedEngagementRow {
  post_id: string;
  reaction_counts: Partial<Record<FeedReactionType, number>>;
  user_reaction: FeedReactionType | null;
  poll_counts: Record<string, number>;
  user_vote: string | null;
}

// --- hype_content RPC ---
export interface HypeContentArgs {
  _content_id: string;
  _content_type: "post" | "course" | "video" | "blog";
}

// --- tip_comment RPC ---
export interface TipCommentArgs {
  _comment_id: string;
  _amount: number;
}
