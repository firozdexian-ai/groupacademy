/**
 * UGC domain repository (Phase 10i.2).
 *
 * Wraps raw supabase.from(...) calls for the UGC admin area:
 * - Master graph fetch (videos / blogs / feed posts / competitions / reports)
 * - Per-entity upsert/delete helpers with slug normalization and author binding
 */
import { supabase } from "@/integrations/supabase/client";

export const slugifyUgc = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) ||
  `entry-${Date.now()}`;

export async function getUgcGraphMaster() {
  const [videosRes, blogsRes, feedRes, compsRes, reportsRes] = await Promise.all([
    supabase
      .from("content")
      .select("id, title, slug, content_type, description, thumbnail_url, youtube_url, is_published, created_at")
      .eq("content_type", "free_video")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, content, category, featured_image, status, is_featured, author_id, author_name, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("feed_posts")
      .select("id, text_content, content_type, author_user_id, author_name, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("competitions")
      .select(
        "id, title, slug, description, category, featured_image, status, start_date, end_date, submission_deadline, prizes, max_participants, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("content_reports")
      .select("id, scope, scope_id, reason, status, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (videosRes.error) throw videosRes.error;
  if (blogsRes.error) throw blogsRes.error;
  if (feedRes.error) throw feedRes.error;
  if (compsRes.error) throw compsRes.error;
  if (reportsRes.error) throw reportsRes.error;
  return {
    videos: videosRes.data ?? [],
    blogs: blogsRes.data ?? [],
    feedPosts: feedRes.data ?? [],
    competitions: compsRes.data ?? [],
    reports: reportsRes.data ?? [],
  };
}

// ─── Videos (content table, content_type=free_video) ───────────────────────
export async function upsertUgcVideo(payload: any): Promise<void> {
  const row: any = { ...payload, content_type: "free_video" };
  if (!row.slug && row.title) row.slug = slugifyUgc(row.title);
  if (row.id) {
    const { id, ...patch } = row;
    const { error } = await supabase.from("content").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("content").insert(row);
    if (error) throw error;
  }
}

export async function deleteUgcVideo(id: string): Promise<void> {
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) throw error;
}

// ─── Blogs ─────────────────────────────────────────────────────────────────
export async function upsertUgcBlog(payload: any): Promise<void> {
  const row: any = { ...payload };
  if (!row.slug && row.title) row.slug = slugifyUgc(row.title);
  if (row.id) {
    const { id, ...patch } = row;
    const { error } = await supabase.from("blog_posts").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    if (!row.author_id) {
      const { data: { user } } = await supabase.auth.getUser();
      row.author_id = user?.id;
    }
    const { error } = await supabase.from("blog_posts").insert(row);
    if (error) throw error;
  }
}

export async function deleteUgcBlog(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

// ─── Feed posts ────────────────────────────────────────────────────────────
export async function upsertUgcFeedPost(payload: any): Promise<void> {
  const row: any = { ...payload };
  if (row.id) {
    const { id, ...patch } = row;
    const { error } = await supabase.from("feed_posts").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    if (!row.author_user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      row.author_user_id = user?.id;
      row.author_name = row.author_name || user?.email || "Admin";
    }
    if (!row.content_type) row.content_type = "text";
    const { error } = await supabase.from("feed_posts").insert(row);
    if (error) throw error;
  }
}

export async function deleteUgcFeedPost(id: string): Promise<void> {
  const { error } = await supabase.from("feed_posts").delete().eq("id", id);
  if (error) throw error;
}

// ─── Competitions ──────────────────────────────────────────────────────────
export async function upsertUgcCompetition(payload: any): Promise<void> {
  const row: any = { ...payload };
  if (!row.slug && row.title) row.slug = slugifyUgc(row.title);
  if (typeof row.prizes === "string" && row.prizes.trim()) {
    try {
      row.prizes = JSON.parse(row.prizes);
    } catch {
      /* keep string, DB will reject */
    }
  }
  if (row.id) {
    const { id, ...patch } = row;
    const { error } = await supabase.from("competitions").update(patch).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("competitions").insert(row);
    if (error) throw error;
  }
}

export async function deleteUgcCompetition(id: string): Promise<void> {
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) throw error;
}

// ─── Content reports ───────────────────────────────────────────────────────
export async function resolveUgcReport(input: {
  id: string;
  status: "reviewed" | "dismissed" | "removed";
  notes?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("content_reports")
    .update({
      status: input.status,
      notes: input.notes ?? null,
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    } as any)
    .eq("id", input.id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Phase 10j.3b additions
// -----------------------------------------------------------------------------

export async function getProjectPublicSettings(projectId: string) {
  const { data, error } = await supabase
    .from("project_public_settings")
    .select("is_public, slug, view_count, share_count")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data as { is_public: boolean; slug: string | null; view_count: number | null; share_count: number | null } | null;
}

// ─── Phase 10j.5d additions ────────────────────────────────────────────────


export async function getCompetitionBySlug(slug: string) {
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as any;
}

export async function getMyCompetitionSubmission(opts: { competitionId: string; talentId: string }) {
  const { data, error } = await supabase
    .from("competition_submissions")
    .select("*")
    .eq("competition_id", opts.competitionId)
    .eq("talent_id", opts.talentId)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function upsertCompetitionSubmission(payload: {
  competition_id: string;
  talent_id: string;
  submission_url: string;
  description: string | null;
  status: string;
}): Promise<{ error: any }> {
  const { error } = await supabase.from("competition_submissions").upsert(payload as any);
  return { error };
}

// ─── Phase 10j.5h3: project public toggle RPC wrapper ─────────────────────
export async function toggleProjectPublic(args: { projectId: string; isPublic: boolean }) {
  const { data, error } = await supabase.rpc("toggle_project_public", {
    _project_id: args.projectId,
    _public: args.isPublic,
  });
  if (error) throw error;
  return data as unknown as { is_public: boolean; slug: string | null };
}
