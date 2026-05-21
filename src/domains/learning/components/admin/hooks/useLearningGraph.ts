import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getLearningGraphSlice,
  upsertLearningGraphRow,
  deleteLearningGraphRow,
  type LearningGraphTable,
} from "@/domains/learning/repo/learningRepo";

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

  const learningGraphQuery = useQuery({
    queryKey: ["learning_graph_master"],
    queryFn: async () => {
      const slice = await getLearningGraphSlice();
      return {
        content: (slice.content ?? []).map((c: any) => ({
          id: c.id,
          title: c.title,
          content_type: c.content_type,
          status: c.is_published ? "published" : "draft",
          is_published: !!c.is_published,
          created_at: c.created_at,
        })) as ContentNode[],
        enrollments: (slice.enrollments ?? []) as unknown as Enrollment[],
        cohorts: (slice.cohorts ?? []) as unknown as Cohort[],
        courseBriefs: (slice.courseBriefs ?? []) as unknown as CourseBrief[],
        courseEngagements: (slice.courseEngagements ?? []) as unknown as CourseEngagement[],
        courseSessions: (slice.courseSessions ?? []) as unknown as CourseSession[],
        certificates: (slice.certificates ?? []) as unknown as Certificate[],
        payouts: (slice.payouts ?? []) as unknown as PayoutRequest[],
      };
    },
  });

  const createUpsertMutation = (table: LearningGraphTable, entityName: string) =>
    useMutation({
      mutationFn: (payload: any) => upsertLearningGraphRow(table, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["learning_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });

  const createDeleteMutation = (table: LearningGraphTable, entityName: string) =>
    useMutation({
      mutationFn: (id: string) => deleteLearningGraphRow(table, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["learning_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });

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
    },
  };
}

