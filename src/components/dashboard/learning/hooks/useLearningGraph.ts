import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentNode { id: string; title: string; content_type: string; status: string; is_published: boolean; created_at: string; }
export interface Enrollment { id: string; content_id: string; talent_id: string | null; status: string | null; created_at: string | null; }
export interface Cohort { id: string; content_id: string; name: string; starts_on: string | null; status: string; }
export interface CourseBrief { id: string; title: string; status: string; instructor_user_id: string | null; }
export interface CourseEngagement { id: string; brief_id: string | null; user_id: string; status: string; }
export interface CourseSession { id: string; cohort_id: string | null; content_id: string; title: string; scheduled_date: string; }
export interface Certificate { id: string; enrollment_id: string | null; talent_id: string; issued_at: string; }
export interface PayoutRequest { id: string; instructor_user_id: string; amount_credits: number; status: string; created_at: string; }

export function useLearningGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Learning Graph Query
  const learningGraphQuery = useQuery({
    queryKey: ["learning_graph_master"],
    queryFn: async () => {
      const [contentRes, enrollRes, cohortsRes, briefsRes, engageRes, sessionsRes, certsRes, payoutsRes] = await Promise.all([
        // `content` lacks a plain `status` column; surface `is_published` as status.
        supabase.from("content").select("id, title, content_type, is_published, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("enrollments").select("id, content_id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
        // `cohorts` uses `name` and `starts_on` instead of `title`/`start_date`.
        supabase.from("cohorts").select("id, content_id, name, starts_on, status").order("created_at", { ascending: false }).limit(200),
        supabase.from("course_briefs").select("id, title, status, instructor_user_id").order("created_at", { ascending: false }).limit(200),
        supabase.from("course_engagements").select("id, brief_id, user_id, status").order("created_at", { ascending: false }).limit(200),
        // `course_sessions` uses `scheduled_date` instead of `start_time`.
        supabase.from("course_sessions").select("id, cohort_id, content_id, title, scheduled_date").order("scheduled_date", { ascending: false }).limit(200),
        // `certificates` uses `issued_at` instead of `issue_date`.
        supabase.from("certificates").select("id, enrollment_id, talent_id, issued_at").order("issued_at", { ascending: false }).limit(200),
        // `instructor_payout_requests` uses `amount_credits` instead of `amount`.
        supabase.from("instructor_payout_requests").select("id, instructor_user_id, amount_credits, status, created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      if (contentRes.error) throw contentRes.error;
      if (enrollRes.error) throw enrollRes.error;
      if (cohortsRes.error) throw cohortsRes.error;
      if (briefsRes.error) throw briefsRes.error;
      if (engageRes.error) throw engageRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (certsRes.error) throw certsRes.error;
      if (payoutsRes.error) throw payoutsRes.error;

      return {
        content: (contentRes.data ?? []).map((c: any) => ({
          id: c.id,
          title: c.title,
          content_type: c.content_type,
          status: c.is_published ? "published" : "draft",
          is_published: !!c.is_published,
          created_at: c.created_at,
        })) as ContentNode[],
        enrollments: (enrollRes.data ?? []) as unknown as Enrollment[],
        cohorts: (cohortsRes.data ?? []) as unknown as Cohort[],
        courseBriefs: (briefsRes.data ?? []) as unknown as CourseBrief[],
        courseEngagements: (engageRes.data ?? []) as unknown as CourseEngagement[],
        courseSessions: (sessionsRes.data ?? []) as unknown as CourseSession[],
        certificates: (certsRes.data ?? []) as unknown as Certificate[],
        payouts: (payoutsRes.data ?? []) as unknown as PayoutRequest[],
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
        queryClient.invalidateQueries({ queryKey: ["learning_graph_master"] });
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
        queryClient.invalidateQueries({ queryKey: ["learning_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    learningGraphQuery,
    mutations: {
      upsertContent: createUpsertMutation("content", "Content Node"),
      deleteContent: createDeleteMutation("content", "Content Node"),
      upsertEnrollment: createUpsertMutation("enrollments", "Enrollment Record"),
      deleteEnrollment: createDeleteMutation("enrollments", "Enrollment Record"),
      upsertCohort: createUpsertMutation("cohorts", "Cohort Instance"),
      deleteCohort: createDeleteMutation("cohorts", "Cohort Instance"),
      upsertCourseBrief: createUpsertMutation("course_briefs", "Course Brief"),
      deleteCourseBrief: createDeleteMutation("course_briefs", "Course Brief"),
      upsertSession: createUpsertMutation("course_sessions", "Course Session"),
      deleteSession: createDeleteMutation("course_sessions", "Course Session"),
      upsertPayout: createUpsertMutation("instructor_payout_requests", "Payout Request"),
      deletePayout: createDeleteMutation("instructor_payout_requests", "Payout Request"),
    }
  };
}
