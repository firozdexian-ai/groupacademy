/**
 * Period Overview — Refactored Monthly/Quarterly HUD
 * CTO Version: May 2026
 * Fixes: P2, P3, P4, P9
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { analystMetricsBulk } from "@/domains/analytics/repo/analyticsRepo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  Building2,
  BookOpen,
  Bot,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodMode, Period, currentPeriod, listPeriods, parseToken, previousPeriod, shiftPeriod } from "./period";

const ROWS = [
  { key: "talents_count", label: "New Talents", icon: Users, format: "number" },
  { key: "transactions_count", label: "Transactions", icon: CreditCard, format: "number" },
  { key: "transactions_revenue_bdt", label: "Revenue", icon: DollarSign, format: "currency" },
  { key: "jobs_count", label: "Jobs Posted", icon: Briefcase, format: "number" },
  { key: "job_applications_count", label: "Applications", icon: FileText, format: "number" },
  { key: "companies_count", label: "New Companies", icon: Building2, format: "number" },
  { key: "enrollments_count", label: "Enrollments", icon: BookOpen, format: "number" },
  { key: "agent_sessions_count", label: "Agent Sessions", icon: Bot, format: "number" },
] as const;

export function PeriodOverviewTab({ mode }: { mode: PeriodMode }) {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [previous, setPrevious] = useState<Record<string, number>>({});

  const cur: Period = useMemo(() => {
    return parseToken(mode, params.get("p")) ?? currentPeriod(mode);
  }, [mode, params]);

  const prev = useMemo(() => previousPeriod(cur, mode), [cur, mode]);
  const choices = useMemo(() => listPeriods(mode, mode === "month" ? 24 : 12), [mode]);

  const setPeriod = useCallback(
    (p: Period) => {
      const next = new URLSearchParams(params);
      next.set("p", p.token);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const load = useCallback(
    async (manual = false) => {
      if (manual) setIsRefreshing(true);
      else setLoading(true);

      try {
        // P3: Single bulk RPC call replaces 16 sequential fetches
        const metricKeys = ROWS.map((r) => r.key);
        const data = await analystMetricsBulk({
          metrics: metricKeys as unknown as string[],
          periods: [
            { from: cur.from.toISOString(), to: cur.to.toISOString(), label: "current" },
            { from: prev.from.toISOString(), to: prev.to.toISOString(), label: "previous" },
          ],
        });

        if (data) {
          // Data expected: array of { metric, period_label, value }
          const curData: Record<string, number> = {};
          const prevData: Record<string, number> = {};

          data.forEach((row) => {
            if (row.period_label === "current") curData[row.metric] = Number(row.value);
            else prevData[row.metric] = Number(row.value);
          });

          setCurrent(curData);
          setPrevious(prevData);
        }
      } catch (err) {
        console.error("Bulk metric fetch failed:", err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [cur.from, cur.to, prev.from, prev.to],
  );

  useEffect(() => {
    load();
  }, [load]);

  const formatValue = (val: number, type: string) => {
    if (type === "currency") {
      // P4: Global BDT Tokenization standard
      return `৳${val.toLocaleString("en-BD")}`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* P2: Action row only. Header context provided by Dashboard shell. */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10 p-6 rounded-[32px] border-2 border-border/40 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
            {mode === "month" ? "Monthly" : "Quarterly"} Performance
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            {cur.label} vs. {prev.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPeriod(shiftPeriod(cur, mode, -1))}
            disabled={isRefreshing}
            className="rounded-xl h-12 w-12 border-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Select
            value={cur.token}
            onValueChange={(v) => {
              const p = parseToken(mode, v);
              if (p) setPeriod(p);
            }}
          >
            <SelectTrigger className="h-12 w-[220px] rounded-xl border-2 font-black uppercase text-xs tracking-wider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map((p) => (
                <SelectItem key={p.token} value={p.token}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPeriod(shiftPeriod(cur, mode, 1))}
            disabled={isRefreshing}
            className="rounded-xl h-12 w-12 border-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="rounded-xl h-12 w-12 border-2"
          >
            <RefreshCw className={isRefreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ROWS.map((r) => {
          const c = current[r.key] ?? 0;
          const p = previous[r.key] ?? 0;
          const delta = p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);
          const positive = delta >= 0;
          const Icon = r.icon;

          return (
            <Card
              key={r.key}
              className="relative overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl group hover:-translate-y-1"
            >
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
                    <p className="text-3xl font-black italic tracking-tighter leading-none">
                      {formatValue(c, r.format)}
                    </p>
                    <div className="flex items-center pt-3">
                      <div
                        className={`flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase italic tracking-wider border ${positive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                      >
                        {positive ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        <span>{Math.abs(delta)}%</span>
                      </div>
                      <span className="ml-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                        prev: {formatValue(p, r.format)}
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
