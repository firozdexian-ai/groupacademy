import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useUnitEconomics() {
  const qc = useQueryClient();

  const snapshots = useQuery({
    queryKey: ["ir-snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_metrics_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as IRSnapshot[];
    },
  });

  const upsertSnapshot = useMutation({
    mutationFn: async (input: Partial<IRSnapshot> & { snapshot_date: string }) => {
      const { error } = await supabase
        .from("ir_metrics_snapshots")
        .upsert(input as any, { onConflict: "snapshot_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-snapshots"] });
      toast.success("Snapshot saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ordered = (snapshots.data ?? []).slice().reverse();
  const latest = ordered[ordered.length - 1];
  const prior = ordered[ordered.length - 2];

  const delta = (cur?: number | null, prev?: number | null) => {
    if (cur == null || prev == null || prev === 0) return null;
    return ((Number(cur) - Number(prev)) / Number(prev)) * 100;
  };

  const kpis = {
    nrr: latest?.net_revenue_retention_pct ?? null,
    grr: latest?.gross_revenue_retention_pct ?? null,
    usageRetention: latest?.usage_retention_pct ?? null,
    revPerEmp: latest?.revenue_per_employee_usd ?? null,
    aiCogs: latest?.ai_inference_cogs_usd ?? null,
    hitlCogs: latest?.hitl_labor_cogs_usd ?? null,
    deltas: {
      nrr: delta(latest?.net_revenue_retention_pct, prior?.net_revenue_retention_pct),
      grr: delta(latest?.gross_revenue_retention_pct, prior?.gross_revenue_retention_pct),
      revPerEmp: delta(latest?.revenue_per_employee_usd, prior?.revenue_per_employee_usd),
    },
  };

  return { snapshots, ordered, latest, kpis, upsertSnapshot };
}
