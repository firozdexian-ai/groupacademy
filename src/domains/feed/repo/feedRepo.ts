/**
 * Feed domain repository (Phase 10i.1).
 */
import { supabase } from "@/integrations/supabase/client";

export async function deletePostReaction(input: {
  postId: string;
  talentId: string;
}): Promise<{ error: any }> {
  const { error } = await supabase
    .from("post_reactions")
    .delete()
    .eq("post_id", input.postId)
    .eq("talent_id", input.talentId);
  return { error };
}

export async function insertPostReaction(input: {
  postId: string;
  talentId: string;
  reactionType: string;
}): Promise<{ error: any }> {
  const { error } = await supabase
    .from("post_reactions")
    .insert({
      post_id: input.postId,
      talent_id: input.talentId,
      reaction_type: input.reactionType as any,
    } as any);
  return { error };
}

export async function insertFeedPost(payload: Record<string, any>): Promise<{ error: any }> {
  const { error } = await supabase.from("feed_posts").insert(payload as any);
  return { error };
}

export async function fetchFeedRecommendationPage(opts: {
  olderThan?: string;
  pageSizeCourses: number;
  pageSizeBlogs: number;
  pageSizePosts: number;
}) {
  let coursesQuery = supabase
    .from("content")
    .select("*")
    .eq("is_published", true)
    .limit(opts.pageSizeCourses);
  let blogsQuery = supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .limit(opts.pageSizeBlogs);
  let postsQuery = supabase
    .from("feed_posts")
    .select("*")
    .eq("is_active", true)
    .eq("status", "published")
    .limit(opts.pageSizePosts);

  if (opts.olderThan) {
    coursesQuery = coursesQuery.lt("created_at", opts.olderThan);
    blogsQuery = blogsQuery.lt("created_at", opts.olderThan);
    postsQuery = postsQuery.lt("created_at", opts.olderThan);
  }

  const [coursesRes, blogsRes, postsRes] = await Promise.all([
    coursesQuery.order("created_at", { ascending: false }),
    blogsQuery.order("created_at", { ascending: false }),
    postsQuery.order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  return { coursesRes, blogsRes, postsRes };
}

export async function getHypeEarnings(talentId: string, sinceIso: string) {
  const [allHypesQuery, recentHypesQuery] = await Promise.all([
    supabase.from("instructor_earnings_ledger").select("amount_credits").eq("talent_id", talentId),
    supabase
      .from("instructor_earnings_ledger")
      .select("amount_credits")
      .eq("talent_id", talentId)
      .gte("created_at", sinceIso),
  ]);
  if (allHypesQuery.error) throw allHypesQuery.error;
  if (recentHypesQuery.error) throw recentHypesQuery.error;
  return { all: allHypesQuery.data ?? [], recent: recentHypesQuery.data ?? [] };
}

export async function getTalentAuthorMeta(userIds: string[]) {
  if (!userIds.length) return [];
  const { data } = await supabase
    .from("talents")
    .select("user_id, country, custom_profession")
    .in("user_id", userIds);
  return (data ?? []) as Array<{ user_id: string; country?: string; custom_profession?: string }>;
}

export async function upsertFeedInteraction(input: {
  talentId: string;
  itemId: string;
  itemType: string;
  interactionType: string;
}): Promise<void> {
  await (supabase.from("feed_interactions") as any).upsert({
    talent_id: input.talentId,
    item_id: input.itemId,
    item_type: input.itemType,
    interaction_type: input.interactionType,
  });
}

// ─── Phase 10j.4: audience-aware feed list ─────────────────────────────────
export async function listAudienceFeedPosts(opts: {
  audience: "network" | "internal";
  companyId?: string | null;
  limit?: number;
}) {
  let query = supabase
    .from("feed_posts")
    .select(
      "id, author_name, author_avatar, author_title, text_content, tags, created_at, author_type, author_company_id",
    )
    .eq("is_active", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.audience === "internal" && opts.companyId) {
    query = query.eq("audience", "internal").eq("author_company_id", opts.companyId);
  } else {
    query = query.eq("audience", "network");
  }
  const { data } = await query;
  return (data ?? []) as any[];
}

// ─── Phase 10j.6a: creator analytics RPCs ──────────────────────────────────
export async function getCreatorScorecard(_talent_id: string, _days: number) {
  const { data, error } = await (supabase as any).rpc("get_creator_scorecard", { _talent_id, _days });
  if (error) throw error;
  return data;
}

export async function getCreatorTopPosts(_talent_id: string, _days: number, _limit: number) {
  const { data, error } = await (supabase as any).rpc("get_creator_top_posts", { _talent_id, _days, _limit });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function getPostInsights(_post_id: string) {
  const { data, error } = await (supabase as any).rpc("get_post_insights", { _post_id });
  if (error) throw error;
  return data;
}

export async function recordImpressionAsync(_post_id: string, _surface: string) {
  return (supabase as any).rpc("record_impression", { _post_id, _surface });
}

export async function recordShare(_post_id: string, _channel: string): Promise<void> {
  const { error } = await (supabase as any).rpc("record_share", { _post_id, _channel });
  if (error) throw error;
}

// --- Engagement / Hype / Tip (migrated from feed/api/manifest.ts, Phase 10j.5h-final) ---

export async function getFeedEngagement(args: { _post_ids: string[]; _talent_id: string | null }): Promise<any[]> {
  const { data, error } = await (supabase as any).rpc("get_feed_engagement", args);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function hypeContent(args: { _content_type: string; _content_id: string }): Promise<void> {
  const { error } = await (supabase as any).rpc("hype_content", args);
  if (error) throw error;
}

export async function tipComment(args: { _comment_id: string; _amount: number }): Promise<void> {
  const { error } = await (supabase as any).rpc("tip_comment", args);
  if (error) throw error;
}
