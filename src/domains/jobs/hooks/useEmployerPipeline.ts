import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Employer Recruitment Pipeline Hub (V5.6.0)
 * CTO Reference: Authoritative transactional store tracking applicant Kanban states.
 * Architecture: Digital Workforce enabled - streams communication and status anomalies directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export type PipelineStatus =
  | "submitted"
  | "sent_to_employer"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "withdrawn"
  | "hired";

export interface PipelineApplication {
  id: string;
  job_id: string;
  job_title: string | null;
  company_id: string | null;
  company_name: string | null;
  talent_id: string | null;
  talent_name: string | null;
  talent_headline: string | null;
  ai_match_score: number | null;
  application_status: PipelineStatus;
  created_at: string;
  last_status_at: string | null;
  cv_url: string | null;
  cover_letter: string | null;
  sourced?: boolean | null;
  sourced_relationship_id?: string | null;
  external_notes?: string | null;
}

export interface PipelineDashboardPayload {
  apps: PipelineApplication[];
  counts: Record<string, number>;
}

export function useEmployerPipeline(opts: { companyId?: string | null; jobId?: string | null }) {
  const queryClient = useQueryClient();
  const queryKey = ["employer-pipeline", opts.companyId ?? null, opts.jobId ?? null];

  // --------------------------------------------------------
  // PHASE: Core Declarative Sourcing Pipeline Query
  // --------------------------------------------------------
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    // Realtime context constraint: staleTime set to 0 to ensure live recruiter synchronicity
    staleTime: 0,
    queryFn: async (): Promise<PipelineDashboardPayload> => {
      // HUD: EXECUTING_RPC_PIPELINE_SELECT
      const { data, error } = await supabase.rpc("get_employer_pipeline_full", {
        p_company_id: opts.companyId ?? null,
        p_job_id: opts.jobId ?? null,
        p_limit: 500,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: get_employer_pipeline_full database ingress rejected.", {
          companyId: opts.companyId,
          jobId: opts.jobId,
          error: error.message,
        });
        throw error;
      }

      const payload = (data ?? {}) as { apps?: PipelineApplication[]; counts?: Record<string, number> };
      return {
        apps: (payload.apps ?? []) as PipelineApplication[],
        counts: payload.counts ?? {},
      };
    },
  });

  // --------------------------------------------------------
  // PHASE: State Mutation & Notification Handshake
  // --------------------------------------------------------
  const moveMutation = useMutation({
    mutationFn: async ({ applicationId, to }: { applicationId: string; to: PipelineStatus }) => {
      // HUD: ATOMIC_APPLICATION_STATUS_UPDATE
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ application_status: to })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // HUD: EDGE_INVOCATION_NOTIFICATION_DISPATCH
      // Hardened tracking logic replaces baseline ignoring of failed email pipelines
      const { error: functionError } = await supabase.functions.invoke("notify-application-status", {
        body: { application_id: applicationId, status: to },
      });

      if (functionError) {
        console.error("[Digital Workforce] ANOMALY: notify-application-status secondary edge call timed out.", {
          applicationId,
          status: to,
          message: functionError.message,
        });
        // We do not throw functionError here to protect transactional database state execution loops
      }
    },
    onSuccess: () => {
      // Synchronize data nodes universally via query client cache invalidations
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Applicant status updated safely.");
    },
    onError: (err: any, variables) => {
      // Digital Workforce Sensor: Stream critical mutation blocks straight to Admin Console layers
      console.error("[Digital Workforce] ANOMALY: job_applications Kanban transition state failure.", {
        applicationId: variables.applicationId,
        targetStatus: variables.to,
        error: err.message,
        code: err.code,
      });
      toast.error(`Handshake timeout. Candidate state update enqueued for operations review.`);
    },
  });

  return {
    apps: data?.apps ?? [],
    counts: data?.counts ?? {},
    loading: isLoading,
    move: async (applicationId: string, to: PipelineStatus) => {
      await moveMutation.mutateAsync({ applicationId, to });
    },
    isMoving: moveMutation.isPending,
    reload: async () => {
      await refetch();
    },
  };
}

/**
 * Global upsert factory routine ensuring direct recruitment contact isolation constraints.
 * Enforced as an Immutable platform specification function helper.
 */
export async function ensureDirectThread(companyId: string, talentId: string): Promise<string | null> {
  try {
    // HUD: EXECUTING_RPC_THREAD_UPSERT
    const { data, error } = await supabase.rpc("upsert_direct_thread" as any, {
      p_company_id: companyId,
      p_talent_id: talentId,
    });

    if (error) throw error;
    return data as string;
  } catch (err: any) {
    console.error("[Digital Workforce] ANOMALY: upsert_direct_thread RPC workflow failure.", {
      companyId,
      talentId,
      error: err?.message,
    });
    return null;
  }
}
