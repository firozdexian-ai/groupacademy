import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UgcVideo {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  is_published: boolean | null;
  created_at: string;
}
export interface UgcBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  featured_image: string | null;
  status: string | null;
  is_featured: boolean | null;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
}
export interface UgcFeedPost {
  id: string;
  text_content: string | null;
  content_type: string;
  author_user_id: string | null;
  author_name: string | null;
  is_active: boolean | null;
  created_at: string;
}
export interface UgcCompetition {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  featured_image: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  submission_deadline: string | null;
  prizes: any;
  max_participants: number | null;
  created_at: string;
}
export interface UgcReport {
  id: string;
  scope: string;
  scope_id: string;
  reason: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface UgcDashboard {
  free_videos: number;
  blogs: number;
  feed_posts: number;
  competitions: number;
  open_reports: number;
  published_blogs: number;
  published_videos: number;
  active_comps: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) ||
  `entry-${Date.now()}`;

export function useUgcGraph() {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["ugc_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ugc_dashboard" as any);
      if (error) throw error;
      return data as unknown as UgcDashboard;
    },
  });

  const ugcGraphQuery = useQuery({
    queryKey: ["ugc_graph_master"],
    queryFn: async () => {
      const [videosRes, blogsRes, feedRes, compsRes, reportsRes] = await Promise.all([
        supabase
          .from("content")
          .select("id, title, slug, content_type, description, thumbnail_url, youtube_url, is_published, created_at")
          .eq("content_type", "free_video")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, content, category, featured_image, status, is_featured, author_id, author_name, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("feed_posts")
          .select("id, text_content, content_type, author_user_id, author_name, is_active, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("competitions")
          .select("id, title, slug, description, category, featured_image, status, start_date, end_date, submission_deadline, prizes, max_participants, created_at")
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
        videos: (videosRes.data ?? []) as unknown as UgcVideo[],
        blogs: (blogsRes.data ?? []) as unknown as UgcBlog[],
        feedPosts: (feedRes.data ?? []) as unknown as UgcFeedPost[],
        competitions: (compsRes.data ?? []) as unknown as UgcCompetition[],
        reports: (reportsRes.data ?? []) as unknown as UgcReport[],
      };
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ugc_graph_master"] });
    queryClient.invalidateQueries({ queryKey: ["ugc_dashboard"] });
  };

  const okSync = (label: string) => () => {
    invalidate();
    toast.success(`${label} synchronized.`);
  };
  const okPurge = (label: string) => () => {
    invalidate();
    toast.success(`${label} purged.`);
  };
  const fail = (verb: string) => (e: Error) => toast.error(`${verb} failed: ${e.message}`);

  // VIDEOS (content table, filtered to free_video)
  const upsertVideo = useMutation({
    mutationFn: async (payload: any) => {
      const row: any = { ...payload, content_type: "free_video" };
      if (!row.slug && row.title) row.slug = slugify(row.title);
      if (row.id) {
        const { id, ...patch } = row;
        const { error } = await supabase.from("content").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: okSync("Video"),
    onError: fail("Video sync"),
  });
  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: okPurge("Video"),
    onError: fail("Video purge"),
  });

  // BLOGS
  const upsertBlog = useMutation({
    mutationFn: async (payload: any) => {
      const row: any = { ...payload };
      if (!row.slug && row.title) row.slug = slugify(row.title);
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
    },
    onSuccess: okSync("Article"),
    onError: fail("Article sync"),
  });
  const deleteBlog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: okPurge("Article"),
    onError: fail("Article purge"),
  });

  // FEED POSTS
  const upsertFeedPost = useMutation({
    mutationFn: async (payload: any) => {
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
    },
    onSuccess: okSync("Post"),
    onError: fail("Post sync"),
  });
  const deleteFeedPost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: okPurge("Post"),
    onError: fail("Post purge"),
  });

  // COMPETITIONS
  const upsertCompetition = useMutation({
    mutationFn: async (payload: any) => {
      const row: any = { ...payload };
      if (!row.slug && row.title) row.slug = slugify(row.title);
      if (typeof row.prizes === "string" && row.prizes.trim()) {
        try { row.prizes = JSON.parse(row.prizes); } catch { /* keep string, DB will reject */ }
      }
      if (row.id) {
        const { id, ...patch } = row;
        const { error } = await supabase.from("competitions").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitions").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: okSync("Tournament"),
    onError: fail("Tournament sync"),
  });
  const deleteCompetition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: okPurge("Tournament"),
    onError: fail("Tournament purge"),
  });

  // REPORTS
  const resolveReport = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "reviewed" | "dismissed" | "removed"; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("content_reports")
        .update({ status, notes: notes ?? null, resolved_by: user?.id, resolved_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: okSync("Report"),
    onError: fail("Report update"),
  });

  return {
    ugcGraphQuery,
    dashboardQuery,
    mutations: {
      upsertVideo,
      deleteVideo,
      upsertBlog,
      deleteBlog,
      upsertFeedPost,
      deleteFeedPost,
      upsertCompetition,
      deleteCompetition,
      resolveReport,
    },
  };
}
