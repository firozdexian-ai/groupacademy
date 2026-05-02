/**
 * Period Overview — same KPI shape as Lifetime, scoped to a calendar window
 * (this month or this quarter), with delta vs. the previous window.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "month" | "quarter";

function periodFor(mode: Mode, offset = 0) {
  const now = new Date();
  if (mode === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return { from, to, label: from.toLocaleString(undefined, { month: "long", year: "numeric" }) };
  }
  const q = Math.floor(now.getMonth() / 3) + offset;
  const year = now.getFullYear() + Math.floor(q / 4);
  const qq = ((q % 4) + 4) % 4;
  const from = new Date(year, qq * 3, 1);
  const to = new Date(year, qq * 3 + 3, 1);
  return { from, to, label: `Q${qq + 1} ${year}` };
}

async function metric(name: string, from: Date, to: Date): Promise<number> {
  const { data, error } = await supabase.rpc("analyst_metric" as any, {
    metric: name, period: { from: from.toISOString(), to: to.toISOString() },
  });
  if (error) return 0;
  return Number((data as any)?.value ?? 0);
}

interface Row { key: string; label: string; }
const ROWS: Row[] = [
  { key: "talents_count", label: "New Talents" },
  { key: "transactions_count", label: "Transactions" },
  { key: "transactions_revenue_bdt", label: "Revenue (BDT)" },
  { key: "jobs_count", label: "Jobs Posted" },
  { key: "job_applications_count", label: "Applications" },
  { key: "companies_count", label: "New Companies" },
  { key: "enrollments_count", label: "Enrollments" },
  { key: "agent_sessions_count", label: "Agent Sessions" },
];

export function PeriodOverviewTab({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [previous, setPrevious] = useState<Record<string, number>>({});

  const cur = useMemo(() => periodFor(mode, 0), [mode]);
  const prev = useMemo(() => periodFor(mode, -1), [mode]);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      Promise.all(ROWS.map((r) => metric(r.key, cur.from, cur.to))),
      Promise.all(ROWS.map((r) => metric(r.key, prev.from, prev.to))),
    ]);
    setCurrent(Object.fromEntries(ROWS.map((r, i) => [r.key, c[i]])));
    setPrevious(Object.fromEntries(ROWS.map((r, i) => [r.key, p[i]])));
    setLoading(false);
  }, [cur.from, cur.to, prev.from, prev.to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            {mode === "month" ? "This Month" : "This Quarter"}
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">{cur.label}</h2>
          <p className="text-xs text-muted-foreground mt-1">vs. {prev.label}</p>
        </div>
        <Button variant="outline" size="icon" onClick={load} className="rounded-xl h-12 w-12 border-2">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROWS.map((r) => {
          const c = current[r.key] ?? 0;
          const p = previous[r.key] ?? 0;
          const delta = p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);
          const positive = delta >= 0;
          return (
            <Card key={r.key} className="rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {r.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-1">
                {loading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <>
                    <p className="text-3xl font-black italic tracking-tighter">{c.toLocaleString()}</p>
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${positive ? "text-success" : "text-destructive"}`}>
                      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(delta)}% vs prev. {mode}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">prev: {p.toLocaleString()}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
