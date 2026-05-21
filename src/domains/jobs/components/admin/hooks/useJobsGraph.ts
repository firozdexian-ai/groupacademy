import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getJobsGraphMaster,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/jobs/repo/jobsRepo";

export interface JobNode { id: string; title: string; company_id: string; status: string; is_published: boolean; created_at: string; }
export interface JobApplication { id: string; job_id: string; talent_id: string; status: string; created_at: string; }
export interface TalentCrmRecord { id: string; talent_id: string; company_id: string; stage: string; created_at: string; }
export interface JobAssessment { id: string; job_id: string; talent_id: string; status: string; score?: number; created_at: string; }
export interface JobInvitation { id: string; job_id: string; talent_id: string; status: string; created_at: string; }

export function useJobsGraph() {
  const queryClient = useQueryClient();

  // 1. The Master ATS Graph Query
  const jobsGraphQuery = useQuery({
    queryKey: ["jobs_graph_master"],
    queryFn: async () => {
      const { jobsRaw, applications, crmRecords, assessments, invitations } = await getJobsGraphMaster();
      return {
        jobs: (jobsRaw as any[]).map((j) => ({
          id: j.id,
          title: j.title,
          company_id: j.company_id,
          status: j.is_active ? "active" : "inactive",
          is_published: !!j.is_active,
          created_at: j.created_at,
        })) as JobNode[],
        applications: applications as unknown as JobApplication[],
        crmRecords: crmRecords as unknown as TalentCrmRecord[],
        assessments: assessments as unknown as JobAssessment[],
        invitations: invitations as unknown as JobInvitation[],
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => upsertGraphRow(table, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["jobs_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => deleteGraphRow(table, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["jobs_graph_master"] });
        toast.success(`${entityName} purged from the pipeline.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    jobsGraphQuery,
    mutations: {
      upsertJob: createUpsertMutation("jobs", "Job Posting"),
      deleteJob: createDeleteMutation("jobs", "Job Posting"),
      upsertApplication: createUpsertMutation("job_applications", "Application Node"),
      deleteApplication: createDeleteMutation("job_applications", "Application Node"),
      upsertCrmRecord: createUpsertMutation("talent_relationships", "CRM Record"),
      deleteCrmRecord: createDeleteMutation("talent_relationships", "CRM Record"),
      upsertAssessment: createUpsertMutation("job_assessments", "Assessment Instance"),
      deleteAssessment: createDeleteMutation("job_assessments", "Assessment Instance"),
      upsertInvitation: createUpsertMutation("job_invitations", "Sourcing Invitation"),
      deleteInvitation: createDeleteMutation("job_invitations", "Sourcing Invitation"),
    }
  };
}
