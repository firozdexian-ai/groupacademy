import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import {
  updateLearningTrack,
  deleteLearningTrackItem,
  getTrackProgress,
  orgAssignTrack,
  listMyTrackAssignments,
  listLearningTracksByCompany,
  listPublishedLearningTracks,
  insertLearningTrack,
  listLearningTrackItems,
  insertLearningTrackItem,
} from "@/domains/learning/repo/learningRepo";
import { toast } from "sonner";

/**
 * GroUp Academy: B2B Learning Tracks & Assignments (V5.6.0)
 * Architecture: Repo-pattern enforced; Supabase calls live in learningRepo.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

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
    queryFn: async (): Promise<TrackAssignment[]> => {
      try {
        const data = await listMyTrackAssignments();
        return (data ?? []) as unknown as TrackAssignment[];
      } catch (error) {
        console.error("[Digital Workforce] FAULT: track_assignments selection rejected.", error);
        throw error;
      }
    },
  });
}

export function useTrackProgress(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ["track-progress", assignmentId],
    enabled: !!assignmentId,
    staleTime: 30000,
    queryFn: async (): Promise<TrackProgress> => {
      return await getTrackProgress<TrackProgress>(assignmentId!);
    },
  });
}

export function useCompanyTracks(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-tracks", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<LearningTrack[]> => {
      const data = await listLearningTracksByCompany(companyId!);
      return (data ?? []) as unknown as LearningTrack[];
    },
  });
}

export function usePublishedTracks() {
  return useQuery({
    queryKey: ["published-tracks"],
    queryFn: async (): Promise<LearningTrack[]> => {
      const data = await listPublishedLearningTracks(24);
      return (data ?? []) as unknown as LearningTrack[];
    },
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<LearningTrack> & { title: string; slug: string }) => {
      const user = await getCurrentUser();
      const data = await insertLearningTrack({ ...input, created_by: user?.id ?? null });
      return data as LearningTrack;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["company-tracks", data.company_id] });
      toast.success("Learning track created successfully.");
    },
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LearningTrack> & { id: string }) => {
      const data = (await updateLearningTrack(id, patch)) as LearningTrack;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["company-tracks", data.company_id] });
      toast.success("Track parameters updated.");
    },
  });
}

export function useTrackItems(trackId: string | undefined) {
  return useQuery({
    queryKey: ["track-items", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      return await listLearningTrackItems(trackId!);
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
      await insertLearningTrackItem({ track_id, content_id, position, is_required });
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["track-items", v.track_id] });
      toast.success("Content node added to track.");
    },
  });
}

export function useRemoveTrackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, track_id: _track_id }: { id: string; track_id: string }) => {
      await deleteLearningTrackItem(id);
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["track-items", v.track_id] });
      toast.error("Content node removed.");
    },
  });
}

export function useAssignTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { track_id: string; company_id: string; user_ids: string[]; due_at?: string | null }) => {
      try {
        return await orgAssignTrack(input);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: org_assign_track bulk handshake failed.", error);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-track-assignments"] });
      toast.success("Assignment batch committed successfully.");
    },
  });
}

export function useEnrollTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (track_id: string) => {
      const { enrollLearningTrack } = await import("@/domains/learning/repo/learningRepo");
      try {
        return await enrollLearningTrack(track_id);
      } catch (error) {
        console.error("[Digital Workforce] ANOMALY: talent_enroll_track credit consumption failure.", error);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-track-assignments"] });
      toast.success("Enrolled in learning track.");
    },
  });
}
