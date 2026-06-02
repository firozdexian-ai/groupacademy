/**
 * Feed Domain Repository Layer
 * Single source of truth for user feed, reactions, interactions, and analytics.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PostReactionInput {
  postId: string;
  talentId: string;
}

export interface InsertReactionInput extends PostReactionInput {
  reactionType: string;
}

export interface FeedRecommendationOptions {
  olderThan?: string;
  pageSizeCourses: number;
  pageSizeBlogs: number;
  pageSizePosts: number;
}

export interface FeedInteractionInput {
  talentId: string;
  itemId: string;
  itemType: string;
  interactionType: string;
}

export interface AudienceFeedOptions {
  audience: "network" | "internal";
  companyId?: string | null;
  limit?: number;
}

export interface CommentInput {
  postId: string;
  authorTalentId: string;
  body: string;
}

/**
 * Removes a reaction from a feed post
 */
export async function deletePostReaction(input: PostReactionInput): Promise<{ error: any }> {
  const { error } = await supabase
    .from("post_reactions")
    .delete()
    .eq("post_id", input.postId)
    .eq("talent_id", input.talentId);
  return { error };
}

/**
 * Attaches a reaction (e.g., like, clap) to a feed post
 */
export async function insertPostReaction(input: InsertReactionInput): Promise<{ error: any }> {
  const { error } = await (supabase as any)
    .from("post_reactions")
    .insert({
      post_id: input.postId,
      talent_id: input.talentId,
      reaction_type: input.reactionType,
    });
  return { error };
}

/**
 * Creates a new user-generated post in the feed index
 */
export async function insertFeedPost(payload: Record<string, any>): Promise<{ error: any }> {
  const { error } = await (supabase as any).from("feed_posts").insert(payload);
  return { error };
}

/**
 * Fetches a personalized batch of recommendations (courses, articles, and posts)
 */
export async function fetchFeedRecommendationPage(opts: FeedRecommendationOptions) {
  // Use core standardized tables for courses instead of generic placeholders
  let coursesQuery = (supabase as any)
    .from("courses")
    .select("id, title, slug, cover_image, description, created_at")
    .limit(opts.pageSizeCourses);

  let blogsQuery = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, created_at")
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

/**
 * Calculates current ledger tracking milestones for Hype creator points
 */
export async function getHypeEarnings(talentId: string, sinceIso: string) {
  const [allHypesQuery, recentHypesQuery] = await Promise.all([
    supabase
      .from("instructor_earnings_ledger")
      .select("amount_credits")
      .eq("talent_id", talentId),
    supabase
      .from("instructor_earnings_ledger")
      .select("amount_credits")
      .eq("talent_id", talentId)
      .gte("created_at", sinceIso),
  ]);

  if (allHypesQuery.error) throw allHypesQuery.error;
  if (recentHypesQuery.error) throw recentHypesQuery.error;

  return { 
    all: allHypesQuery.data ?? [], 
    recent: recentHypesQuery.data ?? [] 
  };
}

/**
 * Resolves professional user metadata safely to construct public profile templates
 */
export async function getTalentAuthorMeta(userIds: string[]) {
  if (!userIds.length) return [];
  const { data } = await supabase
    .from("talents")
    .select("user_id, country, custom_profession")
    .in("user_id", userIds);
    
  return (data ?? []) as Array<{ user_id: string; country?: string; custom_profession?: string }>;
}

/**
 * Logs a tracking interaction to shape discovery recommendations background loops
 */
export async function upsertFeedInteraction(input: FeedInteractionInput): Promise<void> {
  await supabase.from("feed_interactions").upsert({
    talent_id: input.talentId,
    item_id: input.itemId,
    item_type: input.itemType,
    interaction_type: input.interactionType,
  });
}

/**
 * Returns posts scoped to specific workspaces or the general network audience
 */
export async function listAudienceFeedPosts(opts: AudienceFeedOptions) {
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
  return data ?? [];
}

/**
 * Fetches basic macro scorecard aggregations for creative dashboards
 */
export async function getCreatorScorecard(_talent_id: string, _days: number) {
  const { data, error } = await supabase.rpc("get_creator_scorecard", { _talent_id, _days });
  if (error) throw error;
  return data;
}

/**
 * Returns top performing updates ordered by interaction and engagement weightings
 */
export async function getCreatorTopPosts(_talent_id: string, _days: number, _limit: number) {
  const { data, error } = await supabase.rpc("get_creator_top_posts", { _talent_id, _days, _limit });
  if (error) throw error;
  return data ?? [];
}

/**
 * Retrieves aggregate interaction vectors for operational analysis panels
 */
export async function getPostInsights(_post_id: string) {
  const { data, error } = await supabase.rpc("get_post_insights", { _post_id });
  if (error) throw error;
  return data;
}

/**
 * Non-blocking utility to commit telemetry data rows down to feed tracking tables
 */
export async function recordImpressionAsync(_post_id: string, _surface: string) {
  return supabase.rpc("record_impression", { _post_id, _surface });
}

/**
 * Increments share metrics across specific distribution channels
 */
export async function recordShare(_post_id: string, _channel: string): Promise<void> {
  const { error } = await supabase.rpc("record_share", { _post_id, _channel });
  if (error) throw error;
}

/**
 * Hydrates multi-post metrics blocks cleanly including current session context locks
 */
export async function getFeedEngagement(args: { _post_ids: string[]; _talent_id: string | null }): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_feed_engagement", args);
  if (error) throw error;
  return data ?? [];
}

/**
 * Fires a 1-credit paid reaction split 80/20 between creator and the platform ledger
 */
export async function hypeContent(args: { _content_type: string; _content_id: string }): Promise<void> {
  const { error } = await supabase.rpc("hype_content", args);
  if (error) throw error;
}

/**
 * Handles micro credit tipping conversions natively targeting commentary responses
 */
export async function tipComment(args: { _comment_id: string; _amount: number }): Promise<void> {
  const { error } = await supabase.rpc("tip_comment", args);
  if (error) throw error;
}

/**
 * Pulls available visual background skins for cards layout customization
 */
export async function listActiveProfileCardThemes() {
  const { data, error } = await supabase
    .from("profile_card_themes")
    .select(
      "id, media_type, media_url, poster_url, gradient_css, overlay_opacity, text_color, start_at, end_at, is_active, priority",
    )
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}

/**
 * Resolves aggregate talent ranking charts based on transactional mastery points
 */
export async function getWeeklyLeaderboard() {
  const { data, error } = await supabase
    .from("v_weekly_leaderboard")
    .select("talent_id, full_name, profile_photo_url, credits_earned, hype_count")
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

/**
 * Returns interactive prompt routing shortcuts wired directly to active AI agents
 */
export async function listActiveQuickActionAgents() {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
    .eq("is_active", true)
    .order("total_conversations", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Commits a community vote parameter on context-bound polling elements
 */
export async function insertPollVote(input: {
  postId: string;
  talentId: string;
  optionId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("poll_votes")
    .insert({ 
      post_id: input.postId, 
      talent_id: input.talentId, 
      option_id: input.optionId 
    });
  if (error) throw error;
}

/**
 * Compiles list of current high-volume interactions to update side metrics panels
 */
export async function listTopHypedPostsWeek(limit = 5) {
  const { data: topRows, error: topError } = await supabase
    .from("v_weekly_leaderboard")
    .select("talent_id, full_name, hype_count")
    .limit(limit);

  if (topError) throw topError;
  const talentIds = (topRows ?? []).map((t) => t.talent_id).filter(Boolean);
  if (!talentIds.length) return [];

  const { data: contentRows, error: contentError } = await supabase
    .from("feed_posts")
    .select("id, text_content, user_id")
    .in("user_id", talentIds)
    .limit(limit);

  if (contentError) throw contentError;
  const buf = new Map((contentRows ?? []).map((r: any) => [r.user_id, r]));

  return (topRows ?? []).map((r: any) => {
    const p = buf.get(r.talent_id);
    return {
      post_id: p?.id ?? r.talent_id,
      hypes_week: Number(r.hype_count || 0),
      preview: p?.text_content?.slice(0, 80) ?? null,
      author_name: r.full_name ?? "Academy Member",
    };
  });
}

/**
 * Fetches associated commentary records ordered chronologically for standard threads
 */
export async function listPostComments(postId: string, limit = 50) {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      "id, body, created_at, tip_count, tip_credits, author_talent_id",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Ingests a raw commentary submission parameter block into existing message tables
 */
export async function insertPostComment(input: CommentInput): Promise<{ error: any }> {
  const { error } = await supabase
    .from("post_comments")
    .insert({ 
      post_id: input.postId, 
      author_talent_id: input.authorTalentId, 
      body: input.body 
    });
  return { error };
}