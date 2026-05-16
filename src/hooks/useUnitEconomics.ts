import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Financial Telemetry & Unit Economics Core (V5.6.0)
 * CTO Reference: Authoritative analytical engine parsing operating KPIs and financial snapshots.
 * Architecture: Optimized via memoized ledger pipelines with secure safe boundary checks.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface IRSnapshot {
  id: string;
  snapshot_date: string;
  mrr_usd: number | null;
  arr_usd: number | null;
  paying_users: number | null;
  total_users: number | null;
  active_users_dau: number | null;
  active_users_wau: number | null;
  active_users_mau: number | null;
  gross_revenue_retention_pct: number | null;
  net_revenue_retention_pct: number | null;
  usage_retention_pct: number | null;
  ai_inference_cogs_usd: number | null;
  hitl_labor_cogs_usd: number | null;
  automated_actions_count: number | null;
  hitl_actions_count: number | null;
  headcount_fte: number | null;
  contractor_fte: number | null;
  revenue_per_employee_usd: number | null;
}

export interface KPIDeltas {
  nrr: number | null;
  grr: number | null;
  revPerEmp: number | null;
}

export interface CompiledKPIs {
  nrr: number | null;
  grr: number | null;
  usageRetention: number | null;
  revPerEmp: number | null;
  aiCogs: number | null;
  hitlCogs: number | null;
  deltas: KPIDeltas;
}

/**
 * Calculates percentage variance between two numeric properties securely.
 */
function calculatePercentageDelta(cur?: number | null, prev?: number | null): number | null {
  if (cur == null || prev == null || Number(prev) === 0) return null;
  return ((Number(cur) - Number(prev)) / Number(prev)) * 100;
}

/**
 * Manages financial metrics ingress and handles operational KPIs compilation loops.
 */
export function useUnitEconomics() {
  const qc = useQueryClient();
  const queryKey = ["ir-snapshots"];

  // --- SENSOR: FINANCIAL_REGISTRY_QUERY ---
  const snapshotsQuery = useQuery({
    queryKey,
    staleTime: 60 * 1000, // 1-minute tracking caching baseline for investor data panels
    queryFn: async (): Promise<IRSnapshot[]> => {
      // HUD: EXECUTING_FINANCIAL_METRICS_INGRESS_SELECT
      const { data, error } = await supabase
        .from("ir_metrics_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(12);

      if (error) {
        console.error("[Digital Workforce] FAULT: ir_metrics_snapshots data link dropped.", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: String(row.id),
        snapshot_date: String(row.snapshot_date),
        mrr_usd: row.mrr_usd !== null ? Number(row.mrr_usd) : null,
        arr_usd: row.arr_usd !== null ? Number(row.arr_usd) : null,
        paying_users: row.paying_users !== null ? Number(row.paying_users) : null,
        total_users: row.total_users !== null ? Number(row.total_users) : null,
        active_users_dau: row.active_users_dau !== null ? Number(row.active_users_dau) : null,
        active_users_wau: row.active_users_wau !== null ? Number(row.active_users_wau) : null,
        active_users_mau: row.active_users_mau !== null ? Number(row.active_users_mau) : null,
        gross_revenue_retention_pct:
          row.gross_revenue_retention_pct !== null ? Number(row.gross_revenue_retention_pct) : null,
        net_revenue_retention_pct:
          row.net_revenue_retention_pct !== null ? Number(row.net_revenue_retention_pct) : null,
        usage_retention_pct: row.usage_retention_pct !== null ? Number(row.usage_retention_pct) : null,
        ai_inference_cogs_usd: row.ai_inference_cogs_usd !== null ? Number(row.ai_inference_cogs_usd) : null,
        hitl_labor_cogs_usd: row.hitl_labor_cogs_usd !== null ? Number(row.hitl_labor_cogs_usd) : null,
        automated_actions_count: row.automated_actions_count !== null ? Number(row.automated_actions_count) : null,
        hitl_actions_count: row.hitl_actions_count !== null ? Number(row.hitl_actions_count) : null,
        headcount_fte: row.headcount_fte !== null ? Number(row.headcount_fte) : null,
        contractor_fte: row.contractor_fte !== null ? Number(row.contractor_fte) : null,
        revenue_per_employee_usd: row.revenue_per_employee_usd !== null ? Number(row.revenue_per_employee_usd) : null,
      }));
    },
  });

  // --- ACTION: FINANCIAL_METRICS_UPSERT_MUTATION ---
  const upsertSnapshot = useMutation({
    mutationFn: async (input: Partial<IRSnapshot> & { snapshot_date: string }): Promise<void> => {
      // HUD: COMMITTING_INVESTOR_SNAPSHOT_UPSERT_TRANSACTION
      const { error } = await supabase.from("ir_metrics_snapshots").upsert(input, { onConflict: "snapshot_date" });

      if (error) {
        // Digital Workforce Anomaly Trigger: Crucial for logging financial write access failures
        console.error("[Digital Workforce] ANOMALY: ir_metrics_snapshots record update rejected.", {
          snapshotDate: input.snapshot_date,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      toast.success("Operational snapshot ledger updated successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to finalize ledger snapshot record.");
    },
  });

  // --- PHASE: CALCULATIONS_COMPILATION_PIPELINE ---
  const computations = useMemo(() => {
    const rawData = snapshotsQuery.data || [];

    // Chronological sorting re-ordering pass (Oldest to Newest for chronological layout charting)
    const ordered = [...rawData].reverse();

    const count = ordered.length;
    const latest = count > 0 ? ordered[count - 1] : null;
    const prior = count > 1 ? ordered[count - 2] : null;

    const kpis: CompiledKPIs = {
      nrr: latest?.net_revenue_retention_pct ?? null,
      grr: latest?.gross_revenue_retention_pct ?? null,
      usageRetention: latest?.usage_retention_pct ?? null,
      revPerEmp: latest?.revenue_per_employee_usd ?? null,
      aiCogs: latest?.ai_inference_cogs_usd ?? null,
      hitlCogs: latest?.hitl_labor_cogs_usd ?? null,
      deltas: {
        nrr:
          latest && prior
            ? calculatePercentageDelta(latest.net_revenue_retention_pct, prior.net_revenue_retention_pct)
            : null,
        grr:
          latest && prior
            ? calculatePercentageDelta(latest.gross_revenue_retention_pct, prior.gross_revenue_retention_pct)
            : null,
        revPerEmp:
          latest && prior
            ? calculatePercentageDelta(latest.revenue_per_employee_usd, prior.revenue_per_employee_usd)
            : null,
      },
    };

    return {
      ordered,
      latest,
      kpis,
    };
  }, [snapshotsQuery.data]);

  return {
    snapshots: snapshotsQuery,
    ordered: computations.ordered,
    latest: computations.latest,
    kpis: computations.kpis,
    upsertSnapshot,
  };
}
