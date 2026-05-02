/**
 * Period Overview — KPIs scoped to a chosen month or quarter,
 * with delta vs. the previous period and a picker.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, ChevronLeft, ChevronRight, RefreshCw,
  Users, DollarSign, Briefcase, FileText, Building2, BookOpen, Bot, CreditCard,
  ArrowDownRight, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PeriodMode, Period, currentPeriod, listPeriods, parseToken,
  previousPeriod, shiftPeriod,
} from "./period";

async function metric(name: string, from: Date, to: Date): Promise<number> {
  const { data, error } = await supabase.rpc("analyst_metric" as any, {
    metric: name, period: { from: from.toISOString(), to: to.toISOString() },
  });
  if (error) return 0;
  return Number((data as any)?.value ?? 0);
}

const ROWS = [
  { key: "talents_count", label: "New Talents", icon: Users },
  { key: "transactions_count", label: "Transactions", icon: CreditCard },
  { key: "transactions_revenue_bdt", label: "Revenue (BDT)", icon: DollarSign },
  { key: "jobs_count", label: "Jobs Posted", icon: Briefcase },
  { key: "job_applications_count", label: "Applications", icon: FileText },
  { key: "companies_count", label: "New Companies", icon: Building2 },
  { key: "enrollments_count", label: "Enrollments", icon: BookOpen },
  { key: "agent_sessions_count", label: "Agent Sessions", icon: Bot },
] as const;

export function PeriodOverviewTab({ mode }: { mode: PeriodMode }) {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [previous, setPrevious] = useState<Record<string, number>>({});

  const cur: Period = useMemo(() => {
    return parseToken(mode, params.get("p")) ?? currentPeriod(mode);
  }, [mode, params]);
  const prev = useMemo(() => previousPeriod(cur, mode), [cur, mode]);
  const choices = useMemo(
    () => listPeriods(mode, mode === "month" ? 24 : 12),
    [mode],
  );

  const setPeriod = useCallback(
    (p: Period) => {
      const next = new URLSearchParams(params);
      next.set("p", p.token);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Branded header — matches Lifetime */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Calendar className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {mode === "month" ? "Monthly Overview" : "Quarterly Overview"}
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {cur.label} · vs. {prev.label}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon"
            onClick={() => setPeriod(shiftPeriod(cur, mode, -1))}
            className="rounded-xl h-12 w-12 border-2"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Select value={cur.token} onValueChange={(v) => {
            const p = parseToken(mode, v); if (p) setPeriod(p);
          }}>
            <SelectTrigger className="h-12 w-[200px] rounded-xl border-2 font-black uppercase text-xs tracking-wider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map((p) => (
                <SelectItem key={p.token} value={p.token}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline" size="icon"
            onClick={() => setPeriod(shiftPeriod(cur, mode, 1))}
            className="rounded-xl h-12 w-12 border-2"
            aria-label="Next period"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button variant="outline" size="icon" onClick={load} className="rounded-xl h-12 w-12 border-2" aria-label="Refresh">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ROWS.map((r) => {
          const c = current[r.key] ?? 0;
          const p = previous[r.key] ?? 0;
          const delta = p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);
          const positive = delta >= 0;
          const Icon = r.icon;
          return (
            <Card key={r.key} className="relative overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl group hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 bg-gradient-to-br from-primary to-blue-600" />
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                    {r.label}
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center border-2 shadow-inner border-primary/20 text-primary bg-gradient-to-br from-primary/20 to-blue-600/20">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <>
                    <p className="text-3xl font-black italic tracking-tighter leading-none">{c.toLocaleString()}</p>
                    <div className="flex items-center pt-3">
                      <div className={`flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase italic tracking-wider border ${positive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                        {positive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        <span>{Math.abs(delta)}%</span>
                      </div>
                      <span className="ml-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                        prev: {p.toLocaleString()}
                      </span>
                    </div>
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
