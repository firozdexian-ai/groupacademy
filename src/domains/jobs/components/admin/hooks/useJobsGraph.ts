import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const [jobsRes, appsRes, crmRes, assessRes, inviteRes] = await Promise.all([
        // Schema aliases: `jobs` lacks status/is_published; surface is_active under both fields.
        supabase.from("jobs").select("id, title, company_id, is_active, created_at").order("created_at", { ascending: false }).limit(500),
        // `job_applications.status` lives on the `application_status` enum.
        supabase.from("job_applications").select("id, job_id, talent_id, status:application_status, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("talent_relationships").select("id, talent_id, company_id, stage, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("job_assessments").select("id, job_id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("job_invitations").select("id, job_id, talent_id, status, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (appsRes.error) throw appsRes.error;
      if (crmRes.error) throw crmRes.error;
      if (assessRes.error) throw assessRes.error;
      if (inviteRes.error) throw inviteRes.error;

      return {
        jobs: (jobsRes.data ?? []).map((j: any) => ({
          id: j.id,
          title: j.title,
          company_id: j.company_id,
          status: j.is_active ? "active" : "inactive",
          is_published: !!j.is_active,
          created_at: j.created_at,
        })) as JobNode[],
        applications: (appsRes.data ?? []) as unknown as JobApplication[],
        crmRecords: (crmRes.data ?? []) as unknown as TalentCrmRecord[],
        assessments: (assessRes.data ?? []) as unknown as JobAssessment[],
        invitations: (inviteRes.data ?? []) as unknown as JobInvitation[],
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
        queryClient.invalidateQueries({ queryKey: ["jobs_graph_master"] });
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
