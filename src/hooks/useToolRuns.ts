import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { insertToolRun, listToolRunsForUser } from "@/domains/jobs/repo/jobsRepo";

/**
 * Tool runs ledger — tracks each AI tool invocation by the current user
 * so we can show "Recent activity" and "Up next" recommendations.
 */

export type ToolKey = "cv" | "assessment" | "salary" | "portfolio" | "score" | "answers" | "interview";

export interface ToolRun {
  id: string;
  tool_key: ToolKey;
  cost_credits: number;
  payload: Record<string, any>;
  job_id: string | null;
  created_at: string;
}

const VALID_TOOL_KEYS: Set<ToolKey> = new Set([
  "cv",
  "assessment",
  "salary",
  "portfolio",
  "score",
  "answers",
  "interview",
]);

/** Fetches recent tool runs for the current user. */
export function useToolRuns(limit = 5) {
  return useQuery({
    queryKey: ["tool-runs", limit],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ToolRun[]> => {
      const user = await getCurrentUser();
      if (!user) return [];

      let data: any[] = [];
      try {
        data = await listToolRunsForUser(user.id, limit);
      } catch (error) {
        console.error("Failed to load tool runs", error);
        throw error;
      }

      return (data || []).map((row: any) => {
        const rawKey = String(row.tool_key);
        const validatedKey: ToolKey = VALID_TOOL_KEYS.has(rawKey as ToolKey) ? (rawKey as ToolKey) : "assessment";

        return {
          id: String(row.id),
          tool_key: validatedKey,
          cost_credits: Number(row.cost_credits ?? 0),
          payload: typeof row.payload === "object" && row.payload !== null ? row.payload : {},
          job_id: row.job_id ? String(row.job_id) : null,
          created_at: String(row.created_at),
        };
      });
    },
  });
}

export interface RecordToolRunInput {
  toolKey: ToolKey;
  costCredits: number;
  payload?: Record<string, any>;
  jobId?: string | null;
}

/** React hook to record a tool run and invalidate dependent caches. */
export function useRecordToolRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts: RecordToolRunInput): Promise<void> => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Please sign in first.");

      try {
        await insertToolRun({
          user_id: user.id,
          tool_key: opts.toolKey,
          cost_credits: opts.costCredits,
          payload: opts.payload ?? {},
          job_id: opts.jobId ?? null,
        });
      } catch (error: any) {
        console.error("Failed to record tool run", {
          toolKey: opts.toolKey,
          costCredits: opts.costCredits,
          message: error?.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tool-runs"] });
      void qc.invalidateQueries({ queryKey: ["next-best-tool"] });
      void qc.invalidateQueries({ queryKey: ["talent-profile"] });
    },
  });
}

/** Fire-and-forget ledger insert for non-hook call sites. */
export async function recordToolRun(opts: RecordToolRunInput): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    await insertToolRun({
      user_id: user.id,
      tool_key: opts.toolKey,
      cost_credits: opts.costCredits,
      payload: opts.payload ?? {},
      job_id: opts.jobId ?? null,
    });
  } catch (e) {
    console.error("recordToolRun failed", e);
  }
}

/** Returns a callback to manually invalidate the tool-runs cache. */
export function useInvalidateToolRuns() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["tool-runs"] });
}
