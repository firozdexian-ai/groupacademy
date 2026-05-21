import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getUgcGraphMaster,
  upsertUgcVideo,
  deleteUgcVideo,
  upsertUgcBlog,
  deleteUgcBlog,
  upsertUgcFeedPost,
  deleteUgcFeedPost,
  upsertUgcCompetition,
  deleteUgcCompetition,
  resolveUgcReport,
} from "@/domains/ugc/repo/ugcRepo";

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
      const master = await getUgcGraphMaster();
      return {
        videos: master.videos as unknown as UgcVideo[],
        blogs: master.blogs as unknown as UgcBlog[],
        feedPosts: master.feedPosts as unknown as UgcFeedPost[],
        competitions: master.competitions as unknown as UgcCompetition[],
        reports: master.reports as unknown as UgcReport[],
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

  const upsertVideo = useMutation({
    mutationFn: (payload: any) => upsertUgcVideo(payload),
    onSuccess: okSync("Video"),
    onError: fail("Video sync"),
  });
  const deleteVideo = useMutation({
    mutationFn: (id: string) => deleteUgcVideo(id),
    onSuccess: okPurge("Video"),
    onError: fail("Video purge"),
  });

  const upsertBlog = useMutation({
    mutationFn: (payload: any) => upsertUgcBlog(payload),
    onSuccess: okSync("Article"),
    onError: fail("Article sync"),
  });
  const deleteBlog = useMutation({
    mutationFn: (id: string) => deleteUgcBlog(id),
    onSuccess: okPurge("Article"),
    onError: fail("Article purge"),
  });

  const upsertFeedPost = useMutation({
    mutationFn: (payload: any) => upsertUgcFeedPost(payload),
    onSuccess: okSync("Post"),
    onError: fail("Post sync"),
  });
  const deleteFeedPost = useMutation({
    mutationFn: (id: string) => deleteUgcFeedPost(id),
    onSuccess: okPurge("Post"),
    onError: fail("Post purge"),
  });

  const upsertCompetition = useMutation({
    mutationFn: (payload: any) => upsertUgcCompetition(payload),
    onSuccess: okSync("Tournament"),
    onError: fail("Tournament sync"),
  });
  const deleteCompetition = useMutation({
    mutationFn: (id: string) => deleteUgcCompetition(id),
    onSuccess: okPurge("Tournament"),
    onError: fail("Tournament purge"),
  });

  const resolveReport = useMutation({
    mutationFn: (input: { id: string; status: "reviewed" | "dismissed" | "removed"; notes?: string }) =>
      resolveUgcReport(input),
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
