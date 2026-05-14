/**
 * Cohort Retention Heatmap
 * Reads ir_retention_cohorts and pivots cohort_month × period_index into
 * a retention triangle (active_users / cohort_size).
 * Phase IR-Z1.1: orphaned-feature revival.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface CohortRow {
  cohort_month: string;
  period_index: number;
  cohort_size: number;
  active_users: number;
  retained_revenue_usd: number | null;
  expansion_revenue_usd: number | null;
}

function retentionColor(pct: number | null): string {
  if (pct == null) return "bg-muted/20 text-muted-foreground/30";
  if (pct >= 90) return "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300";
  if (pct >= 75) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  if (pct >= 60) return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  if (pct >= 40) return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-destructive/20 text-destructive";
}

export function CohortRetentionCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["ir-retention-cohorts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_retention_cohorts")
        .select("cohort_month, period_index, cohort_size, active_users, retained_revenue_usd, expansion_revenue_usd")
        .order("cohort_month", { ascending: true })
        .order("period_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CohortRow[];
    },
  });

  const { cohorts, maxPeriod } = useMemo(() => {
    if (!data || data.length === 0) return { cohorts: [], maxPeriod: 0 };
    const map = new Map<string, { size: number; periods: Map<number, CohortRow> }>();
    let maxP = 0;
    for (const row of data) {
      if (!map.has(row.cohort_month)) {
        map.set(row.cohort_month, { size: row.cohort_size, periods: new Map() });
      }
      map.get(row.cohort_month)!.periods.set(row.period_index, row);
      if (row.period_index > maxP) maxP = row.period_index;
    }
    return {
      cohorts: Array.from(map.entries()).map(([month, v]) => ({
        month,
        size: v.size,
        periods: v.periods,
      })),
      maxPeriod: maxP,
    };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-[280px] w-full rounded-2xl bg-muted/40" />;
  }

  if (cohorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">
          No cohort data yet
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 italic max-w-md">
          Populate <code className="not-italic font-mono text-[10px]">ir_retention_cohorts</code> with monthly cohort
          rows (period 0 = signup month) to unlock the retention triangle.
        </p>
      </div>
    );
  }

  const periodCols = Array.from({ length: maxPeriod + 1 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[10px] font-bold">
        <thead>
          <tr>
            <th className="text-left uppercase tracking-widest text-muted-foreground/60 px-2 py-1">Cohort</th>
            <th className="text-right uppercase tracking-widest text-muted-foreground/60 px-2 py-1">Size</th>
            {periodCols.map((p) => (
              <th
                key={p}
                className="text-center uppercase tracking-widest text-muted-foreground/60 px-1 py-1 min-w-[44px]"
              >
                M{p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.month}>
              <td className="px-2 py-1 font-black italic uppercase tracking-widest text-foreground/80 whitespace-nowrap">
                {format(parseISO(c.month), "MMM yyyy")}
              </td>
              <td className="px-2 py-1 text-right font-black tabular-nums text-foreground/70">
                {c.size.toLocaleString()}
              </td>
              {periodCols.map((p) => {
                const row = c.periods.get(p);
                const pct = row && c.size > 0 ? (row.active_users / c.size) * 100 : null;
                return (
                  <td
                    key={p}
                    className={cn(
                      "px-1 py-1 text-center font-black tabular-nums rounded-md transition-colors",
                      retentionColor(pct),
                    )}
                    title={
                      row
                        ? `${row.active_users}/${c.size} active${
                            row.retained_revenue_usd != null
                              ? ` · $${Number(row.retained_revenue_usd).toLocaleString()} retained`
                              : ""
                          }${
                            row.expansion_revenue_usd
                              ? ` · +$${Number(row.expansion_revenue_usd).toLocaleString()} expansion`
                              : ""
                          }`
                        : ""
                    }
                  >
                    {pct == null ? "—" : `${pct.toFixed(0)}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CohortRetentionCard;
