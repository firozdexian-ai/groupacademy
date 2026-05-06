import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ToolKey = "cv" | "assessment" | "salary" | "portfolio" | "score" | "answers" | "interview";

export interface ToolRun {
  id: string;
  tool_key: ToolKey;
  cost_credits: number;
  payload: Record<string, any>;
  job_id: string | null;
  created_at: string;
}

export function useToolRuns(limit = 5) {
  return useQuery({
    queryKey: ["tool-runs", limit],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return [] as ToolRun[];
      const { data, error } = await supabase
        .from("tool_runs" as any)
        .select("id, tool_key, cost_credits, payload, job_id, created_at")
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as ToolRun[];
    },
    staleTime: 60_000,
  });
}

/**
 * Record a tool run after credits have been successfully deducted.
 * Fire-and-forget — failures are logged but never thrown.
 */
export async function recordToolRun(opts: {
  toolKey: ToolKey;
  costCredits: number;
  payload?: Record<string, any>;
  jobId?: string | null;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    await supabase.from("tool_runs" as any).insert({
      user_id: userRes.user.id,
      tool_key: opts.toolKey,
      cost_credits: opts.costCredits,
      payload: opts.payload ?? {},
      job_id: opts.jobId ?? null,
    });
  } catch (e) {
    console.warn("recordToolRun failed", e);
  }
}

export function useInvalidateToolRuns() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["tool-runs"] });
}
