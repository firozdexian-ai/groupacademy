/**
 * Typed client surface for the Jobs domain. Wraps every edge-function call
 * that powers ranking, matching, pipeline, sharing, and sourcing so UI
 * never imports `supabase.functions.invoke` directly.
 */
import { supabase } from "@/integrations/supabase/client";

async function invoke<T = unknown>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  return data as T;
}

export const jobsApi = {
  scoreMatch: (body: { job_id: string; talent_id?: string }) =>
    invoke("score-job-match", body),
  suggestForTalent: (body: { talent_id?: string; limit?: number }) =>
    invoke("suggest-jobs-for-talent", body),
  rebuildRecs: (body: { talent_id?: string } = {}) =>
    invoke("cron-rebuild-job-recs", body),
  notifyApplicationStatus: (body: {
    application_id: string;
    new_status: string;
  }) => invoke("notify-application-status", body),
  shareCaption: (body: { job_id: string }) =>
    invoke("ai-job-share-caption", body),
};

export type JobsApi = typeof jobsApi;
