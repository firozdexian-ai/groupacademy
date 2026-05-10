import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentNode { id: string; title: string; content_type: string; status: string; created_at: string; }
export interface Enrollment { id: string; content_id: string; talent_id: string; status: string; created_at: string; }
export interface Cohort { id: string; content_id: string; title: string; start_date: string; status: string; }
export interface CourseBrief { id: string; title: string; status: string; instructor_user_id: string | null; }
export interface CourseEngagement { id: string; brief_id: string; user_id: string; status: string; }
export interface CourseSession { id: string; cohort_id: string | null; content_id: string; title: string; start_time: string; }
export interface Certificate { id: string; enrollment_id: string; talent_id: string; issue_date: string; }
export interface PayoutRequest { id: string; instructor_user_id: string; amount: number; status: string; created_at: string; }

export function useLearningGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Learning Graph Query
  const learningGraphQuery = useQuery({
    queryKey: ["learning_graph_master"],
    queryFn: async () => {
      const [contentRes, enrollRes, cohortsRes, briefsRes, engageRes, sessionsRes, certsRes, payoutsRes] = await Promise.all([
        supabase.from("content").select("id, title, content_type, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("enrollments").select("id, content_id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("cohorts").select("id, content_id, title, start_date, status").order("created_at", { ascending: false }).limit(200),
        supabase.from("course_briefs").select("id, title, status, instructor_user_id").order("created_at", { ascending: false }).limit(200),
        supabase.from("course_engagements").select("id, brief_id, user_id, status").order("created_at", { ascending: false }).limit(200),
        supabase.from("course_sessions").select("id, cohort_id, content_id, title, start_time").order("start_time", { ascending: false }).limit(200),
        supabase.from("certificates").select("id, enrollment_id, talent_id, issue_date").order("issue_date", { ascending: false }).limit(200),
        supabase.from("instructor_payout_requests").select("id, instructor_user_id, amount, status, created_at").order("created_at", { ascending: false }).limit(200),
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
        content: contentRes.data as ContentNode[],
        enrollments: enrollRes.data as Enrollment[],
        cohorts: cohortsRes.data as Cohort[],
        courseBriefs: briefsRes.data as CourseBrief[],
        courseEngagements: engageRes.data as CourseEngagement[],
        courseSessions: sessionsRes.data as CourseSession[],
        certificates: certsRes.data as Certificate[],
        payouts: payoutsRes.data as PayoutRequest[],
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await supabase.from(table).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table).insert(payload);
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
        const { error } = await supabase.from(table).delete().eq("id", id);
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
