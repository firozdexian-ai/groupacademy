import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UgcVideo { id: string; title: string; type: string; status: string; created_at: string; }
export interface UgcBlog { id: string; title: string; status: string; author_id: string; created_at: string; }
export interface UgcFeedPost { id: string; content: string; author_user_id: string; created_at: string; }
export interface UgcCompetition { id: string; title: string; status: string; created_at: string; }
export interface UgcReport { id: string; scope: string; scope_id: string; reason: string; status: string; created_at: string; }

export function useUgcGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Social Graph Query
  const ugcGraphQuery = useQuery({
    queryKey: ["ugc_graph_master"],
    queryFn: async () => {
      const [videosRes, blogsRes, feedRes, compsRes, reportsRes] = await Promise.all([
        supabase.from("content").select("id, title, type, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("blog_posts").select("id, title, status, author_id, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("feed_posts").select("id, content, author_user_id, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("competitions").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("content_reports").select("id, scope, scope_id, reason, status, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      if (videosRes.error) throw videosRes.error;
      if (blogsRes.error) throw blogsRes.error;
      if (feedRes.error) throw feedRes.error;
      if (compsRes.error) throw compsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      return {
        videos: videosRes.data as unknown as UgcVideo[],
        blogs: blogsRes.data as unknown as UgcBlog[],
        feedPosts: feedRes.data as unknown as UgcFeedPost[],
        competitions: compsRes.data as unknown as UgcCompetition[],
        reports: reportsRes.data as unknown as UgcReport[],
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await supabase.from(table as any).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table as any).insert(payload);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["ugc_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table as any).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["ugc_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    ugcGraphQuery,
    mutations: {
      upsertVideo: createUpsertMutation("content", "Video Node"),
      deleteVideo: createDeleteMutation("content", "Video Node"),
      upsertBlog: createUpsertMutation("blog_posts", "Blog Post"),
      deleteBlog: createDeleteMutation("blog_posts", "Blog Post"),
      upsertFeedPost: createUpsertMutation("feed_posts", "Feed Post"),
      deleteFeedPost: createDeleteMutation("feed_posts", "Feed Post"),
      upsertCompetition: createUpsertMutation("competitions", "Competition"),
      deleteCompetition: createDeleteMutation("competitions", "Competition"),
      upsertReport: createUpsertMutation("content_reports", "Moderation Report"),
      deleteReport: createDeleteMutation("content_reports", "Moderation Report"),
    }
  };
}
