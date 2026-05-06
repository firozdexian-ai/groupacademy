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
    let q = supabase
      .from("job_applications")
      .select(
        "id, job_id, talent_id, ai_match_score, application_status, created_at, last_status_at, cv_url, cover_letter, jobs!inner(title, company_id, company_name), talents(full_name, headline)",
      )
      .order("last_status_at", { ascending: false })
      .limit(500);

    if (opts.jobId) q = q.eq("job_id", opts.jobId);
    if (opts.companyId) q = q.eq("jobs.company_id", opts.companyId);

    const { data } = await q;
    const flat: PipelineApplication[] = (data ?? []).map((r: any) => ({
      id: r.id,
      job_id: r.job_id,
      job_title: r.jobs?.title ?? null,
      company_id: r.jobs?.company_id ?? null,
      company_name: r.jobs?.company_name ?? null,
      talent_id: r.talent_id,
      talent_name: r.talents?.full_name ?? null,
      talent_headline: r.talents?.headline ?? null,
      ai_match_score: r.ai_match_score,
      application_status: r.application_status,
      created_at: r.created_at,
      last_status_at: r.last_status_at,
      cv_url: r.cv_url,
      cover_letter: r.cover_letter,
    }));
    setApps(flat);

    const { data: counts } = await supabase.rpc("get_employer_pipeline", {
      p_company_id: opts.companyId ?? null,
      p_job_id: opts.jobId ?? null,
    });
    setCounts((counts as Record<string, number>) ?? {});
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
