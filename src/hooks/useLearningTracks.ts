import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  owner_kind: string;
  company_id: string | null;
  is_sequential: boolean;
  is_published: boolean;
  enrollment_credits: number;
  b2b_enabled: boolean;
  created_at: string;
}

export interface TrackAssignment {
  id: string;
  track_id: string;
  user_id: string;
  status: "invited" | "active" | "completed" | "overdue" | "cancelled";
  due_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  org_id: string | null;
  learning_tracks?: Pick<LearningTrack, "id" | "slug" | "title" | "summary" | "cover_url"> | null;
}

export interface TrackProgress {
  assignment_id: string;
  track_id: string;
  status: string;
  due_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  items: Array<{
    content_id: string;
    title: string;
    position: number;
    is_required: boolean;
    status: string;
    completed_at: string | null;
    percent: number;
  }>;
  required_total: number;
  required_done: number;
  optional_done: number;
  is_complete: boolean;
}

export function useMyTrackAssignments() {
  return useQuery({
    queryKey: ["my-track-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_track_assignments")
        .select("*, learning_tracks(id, slug, title, summary, cover_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrackAssignment[];
    },
  });
}

export function useTrackProgress(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ["track-progress", assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_track_progress", {
        p_assignment_id: assignmentId!,
      });
      if (error) throw error;
      return data as unknown as TrackProgress;
    },
  });
}

export function useCompanyTracks(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-tracks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LearningTrack[];
    },
  });
}

export function usePublishedTracks() {
  return useQuery({
    queryKey: ["published-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as LearningTrack[];
    },
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<LearningTrack> & { title: string; slug: string }) => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .insert({ ...input, created_by: (await supabase.auth.getUser()).data.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as LearningTrack;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-tracks"] }),
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LearningTrack> & { id: string }) => {
      const { data, error } = await supabase
        .from("learning_tracks")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as LearningTrack;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-tracks"] }),
  });
}

export function useTrackItems(trackId: string | undefined) {
  return useQuery({
    queryKey: ["track-items", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_track_items")
        .select("id, content_id, position, is_required, content(title, slug, credit_cost)")
        .eq("track_id", trackId!)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddTrackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      track_id,
      content_id,
      position,
      is_required,
    }: {
      track_id: string;
      content_id: string;
      position: number;
      is_required: boolean;
    }) => {
      const { error } = await supabase
        .from("learning_track_items")
        .insert({ track_id, content_id, position, is_required });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["track-items", v.track_id] }),
  });
}

export function useRemoveTrackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, track_id: _track_id }: { id: string; track_id: string }) => {
      const { error } = await supabase.from("learning_track_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["track-items", v.track_id] }),
  });
}

export function useAssignTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      track_id,
      company_id,
      user_ids,
      due_at,
    }: {
      track_id: string;
      company_id: string;
      user_ids: string[];
      due_at?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("org_assign_track", {
        p_track_id: track_id,
        p_company_id: company_id,
        p_user_ids: user_ids,
        p_due_at: due_at ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-track-assignments"] }),
  });
}

export function useEnrollTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (track_id: string) => {
      const { data, error } = await supabase.rpc("talent_enroll_track", { p_track_id: track_id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-track-assignments"] }),
  });
}
