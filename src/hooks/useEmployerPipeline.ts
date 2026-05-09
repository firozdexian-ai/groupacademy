import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useEmployerPipeline(opts: {
  companyId?: string | null;
  jobId?: string | null;
}) {
  const [apps, setApps] = useState<PipelineApplication[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_employer_pipeline_full", {
      p_company_id: opts.companyId ?? null,
      p_job_id: opts.jobId ?? null,
      p_limit: 500,
    });
    const payload = (data ?? {}) as { apps?: PipelineApplication[]; counts?: Record<string, number> };
    setApps((payload.apps ?? []) as PipelineApplication[]);
    setCounts(payload.counts ?? {});
    setLoading(false);
  }, [opts.companyId, opts.jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const move = useCallback(
    async (applicationId: string, to: PipelineStatus) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ application_status: to })
        .eq("id", applicationId);
      if (error) throw error;
      // notify (best-effort)
      try {
        await supabase.functions.invoke("notify-application-status", {
          body: { application_id: applicationId, status: to },
        });
      } catch (_) {
        /* ignore */
      }
      await load();
    },
    [load],
  );

  return { apps, counts, loading, move, reload: load };
}
