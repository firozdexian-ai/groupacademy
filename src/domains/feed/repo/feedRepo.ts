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
  const { error } = await supabase.from("feed_posts").insert(payload);
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
