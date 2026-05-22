import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { insertToolRun, listToolRunsForUser } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: AI Credit Consumption Ledger (V5.6.0)
 * CTO Reference: High-performance auditing observer tracking computational asset runs.
 * Architecture: Optimized via TanStack Query v5 with atomic mutation invalidations.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
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

// --- SENSORS: AUDITING TRANSACTION OBSERVERS ---

/**
 * Fetches an audited history of micro-billing execution items completed by the active session.
 */
export function useToolRuns(limit = 5) {
  return useQuery({
    queryKey: ["tool-runs", limit],
    staleTime: 60 * 1000, // 1-minute visual consistency window for ledger grids
    queryFn: async (): Promise<ToolRun[]> => {
      // HUD: SECURE_USER_SESSION_INGRESS_CHECK
      const user = await getCurrentUser();
      if (!user) return [];

      let data: any[] = [];
      try {
        data = await listToolRunsForUser(user.id, limit);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: tool_runs collection channel dropped.", error);
        throw error;
      }

      // Hardened Data Normalization Layer: Protects display logs against schema drifts
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

// --- ACTIONS: LEDGER MUTATION WORKFLOWS ---

export interface RecordToolRunInput {
  toolKey: ToolKey;
  costCredits: number;
  payload?: Record<string, any>;
  jobId?: string | null;
}

/**
 * Initializes a transaction-isolated hook to log tool runs and systematically evict stale state keys.
 */
export function useRecordToolRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts: RecordToolRunInput): Promise<void> => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Authentication session required.");

      try {
        await insertToolRun({
          user_id: user.id,
          tool_key: opts.toolKey,
          cost_credits: opts.costCredits,
          payload: opts.payload ?? {},
          job_id: opts.jobId ?? null,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: tool_runs ledger logging rejected.", {
          toolKey: opts.toolKey,
          costCredits: opts.costCredits,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Force programmatic cache eviction across all billing listeners globally
      void qc.invalidateQueries({ queryKey: ["tool-runs"] });
      void qc.invalidateQueries({ queryKey: ["talent-profile"] }); // Evict profile to refresh remaining credit totals smoothly
    },
  });
}

/**
 * Fire-and-forget ledger insert for non-hook call sites.
 */
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
    console.error("[Digital Workforce] FAULT: recordToolRun threw.", e);
  }
}

/**
 * Explicit callback proxy to trigger manual billing query invalidations when necessary.
 */
export function useInvalidateToolRuns() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["tool-runs"] });
}
