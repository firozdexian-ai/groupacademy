import React, { useEffect, useMemo, useState } from "react";
import { listAgentsForInsights, listAgentCreditEvents } from "@/domains/agents/repo/agentsRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trackError } from "@/lib/errorTracking";
import {
  Loader2,
  Coins,
  DollarSign,
  Activity,
  Cpu,
  TrendingUp,
  Sparkles,
  LineChart,
  SplitSquareHorizontal,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Agent Telemetry & Financial Insights Panel
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=insights (Operator Metrics Workspace)
 * Operations Mode: Automated Efficiency analytical canvas managing margins, split testing, and LLM costs.
 */

interface AgentRow {
  id: string;
  name: string;
  agent_key: string;
  active_prompt_variant: string | null;
  prompt_variants: Record<string, unknown> | null;
}

interface CreditEvent {
  id: string;
  agent_id: string;
  thread_id: string | null;
  subject_kind: string | null;
  event_kind: string;
  credits: number;
  llm_cost_usd: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  prompt_variant: string | null;
  created_at: string;
}

const RANGES = [
  { label: "Last 24h", value: 1 },
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const CREDIT_TO_USD = 1 / 250;

export function AgentInsights() {
  const [days, setDays] = useState(7);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    Promise.all([listAgentsForInsights(), listAgentCreditEvents(since, 10000)])
      .then(([agentsList, eventsList]) => {
        if (active) {
          setAgents((agentsList as AgentRow[]) ?? []);
          setEvents((eventsList as CreditEvent[]) ?? []);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        trackError("agent-insights-telemetry-sync-failure", { error: err?.message || String(err), days });
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [days]);

  const filtered = useMemo(
    () => (agentFilter === "all" ? events : events.filter((e) => e.agent_id === agentFilter)),
    [events, agentFilter],
  );

  const totals = useMemo(() => {
    let credits = 0,
      cost = 0,
      tIn = 0,
      tOut = 0,
      msgs = 0;
    for (const e of filtered) {
      credits += Number(e.credits ?? 0);
      cost += Number(e.llm_cost_usd ?? 0);
      tIn += e.tokens_in ?? 0;
      tOut += e.tokens_out ?? 0;
      if (e.event_kind === "message") msgs += 1;
    }
    const revenueUsd = credits * CREDIT_TO_USD;
    return { credits, cost, tIn, tOut, msgs, revenueUsd, margin: revenueUsd - cost };
  }, [filtered]);

  const timeSeries = useMemo(() => {
    const buckets = new Map<string, { date: string; credits: number; cost: number; messages: number }>();
    for (const e of filtered) {
      const day = e.created_at.slice(0, 10);
      const b = buckets.get(day) ?? { date: day, credits: 0, cost: 0, messages: 0 };
      b.credits += Number(e.credits ?? 0);
      b.cost += Number(e.llm_cost_usd ?? 0);
      if (e.event_kind === "message") b.messages += 1;
      buckets.set(day, b);
    }
    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const perAgent = useMemo(() => {
    const map = new Map<
      string,
      { agent_id: string; credits: number; cost: number; messages: number; tokens: number }
    >();
    for (const e of filtered) {
      const m = map.get(e.agent_id) ?? { agent_id: e.agent_id, credits: 0, cost: 0, messages: 0, tokens: 0 };
      m.credits += Number(e.credits ?? 0);
      m.cost += Number(e.llm_cost_usd ?? 0);
      m.tokens += (e.tokens_in ?? 0) + (e.tokens_out ?? 0);
      if (e.event_kind === "message") m.messages += 1;
      map.set(e.agent_id, m);
    }
    return Array.from(map.values())
      .map((row) => {
        const agent = agents.find((a) => a.id === row.agent_id);
        const revenue = row.credits * CREDIT_TO_USD;
        return {
          ...row,
          name: agent?.name ?? row.agent_id.slice(0, 8),
          revenue,
          margin: revenue - row.cost,
          marginPct: revenue > 0 ? ((revenue - row.cost) / revenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.credits - a.credits);
  }, [filtered, agents]);

  const variantStats = useMemo(() => {
    const map = new Map<
      string,
      { agent_id: string; variant: string; messages: number; tokens: number; cost: number; credits: number }
    >();
    for (const e of filtered) {
      if (e.event_kind !== "message") continue;
      const variant = e.prompt_variant || "default";
      const key = `${e.agent_id}::${variant}`;
      const m = map.get(key) ?? { agent_id: e.agent_id, variant, messages: 0, tokens: 0, cost: 0, credits: 0 };
      m.messages += 1;
      m.tokens += (e.tokens_in ?? 0) + (e.tokens_out ?? 0);
      m.cost += Number(e.llm_cost_usd ?? 0);
      m.credits += Number(e.credits ?? 0);
      map.set(key, m);
    }
    return Array.from(map.values())
      .map((r) => {
        const agent = agents.find((a) => a.id === r.agent_id);
        return {
          ...r,
          agent_name: agent?.name ?? r.agent_id.slice(0, 8),
          active: agent?.active_prompt_variant === r.variant,
          avgTokens: r.messages > 0 ? Math.round(r.tokens / r.messages) : 0,
          avgCost: r.messages > 0 ? r.cost / r.messages : 0,
          avgCredits: r.messages > 0 ? r.credits / r.messages : 0,
        };
      })
      .sort((a, b) => a.agent_name.localeCompare(b.agent_name) || b.messages - a.messages);
  }, [filtered, agents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Executive Control Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Agent Insights</h2>
          </div>
          <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
            Monitor language model operation parameters, token velocity, profit margins, and deployment metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border border-border text-xs font-semibold tracking-wide bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)} className="font-medium text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border border-border text-xs font-semibold tracking-wide bg-background/80">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="font-medium text-xs">
                All Workers
              </SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id} className="font-medium text-xs truncate">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-2xl space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
          <span className="text-xs font-medium text-muted-foreground/70">Loading telemetry dashboards...</span>
        </div>
      ) : (
        <>
          {/* Main KPI Segment Mapping */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI
              icon={<Activity />}
              label="Total Messages"
              value={totals.msgs.toLocaleString()}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <KPI
              icon={<Coins />}
              label="Credits Utilized"
              value={totals.credits.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
            <KPI
              icon={<DollarSign />}
              label="Model Compute Cost"
              value={`$${totals.cost.toFixed(3)}`}
              color="text-rose-600"
              bg="bg-rose-500/10"
            />
            <KPI
              icon={<TrendingUp />}
              label="Estimated Revenue"
              value={`$${totals.revenueUsd.toFixed(3)}`}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <KPI
              icon={<TrendingUp />}
              label="Operating Margin"
              value={`$${totals.margin.toFixed(3)}`}
              color={totals.margin >= 0 ? "text-emerald-600" : "text-rose-600"}
              bg={totals.margin >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}
            />
            <KPI
              icon={<Cpu />}
              label="Tokens Extracted"
              value={(totals.tIn + totals.tOut).toLocaleString()}
              color="text-purple-600"
              bg="bg-purple-500/10"
            />
          </div>

          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="bg-muted/40 border border-border p-1 mb-4 w-full md:w-auto flex flex-col md:flex-row h-auto gap-1 rounded-xl">
              <TabsTrigger
                value="usage"
                className="rounded-lg font-semibold text-xs tracking-tight py-2 px-4 flex items-center gap-2 flex-1 md:flex-none"
              >
                <LineChart className="h-4 w-4 text-primary" /> Usage Trajectory
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                className="rounded-lg font-semibold text-xs tracking-tight py-2 px-4 flex items-center gap-2 flex-1 md:flex-none"
              >
                <Layers className="h-4 w-4 text-emerald-600" /> Worker Margin Allocation
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="rounded-lg font-semibold text-xs tracking-tight py-2 px-4 flex items-center gap-2 flex-1 md:flex-none"
              >
                <SplitSquareHorizontal className="h-4 w-4 text-amber-600" /> A/B Deployment Testing
              </TabsTrigger>
            </TabsList>

            {/* Trajectory Analytics Tab Panel */}
            <TabsContent
              value="usage"
              className="animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none"
            >
              <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
                <div className="h-1 w-full bg-primary" />
                <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                    <LineChart className="h-4 w-4 text-primary" /> Daily Volume Metrics & Compute Scaling
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[380px] p-5">
                  {timeSeries.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                        <XAxis
                          dataKey="date"
                          fontSize={10}
                          className="font-mono font-medium fill-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          yAxisId="left"
                          fontSize={10}
                          className="font-mono font-medium fill-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          fontSize={10}
                          className="font-mono font-medium fill-muted-foreground"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--background))",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                          labelStyle={{
                            color: "hsl(var(--muted-foreground))",
                            fontSize: "10px",
                            textTransform: "uppercase",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "600", paddingTop: "10px" }} />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          name="Credits Consumed"
                          dataKey="credits"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#colorCredits)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          name="Model Cost ($)"
                          dataKey="cost"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          fill="url(#colorCost)"
                        />
                        <defs>
                          <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profit Margin Optimization Tab Panel */}
            <TabsContent
              value="agents"
              className="animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none"
            >
              <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
                <div className="h-1 w-full bg-emerald-500" />
                <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                    <Layers className="h-4 w-4 text-emerald-600" /> Individual Worker Profitability Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-background/50">
                  {perAgent.length === 0 ? (
                    <div className="p-5">
                      <EmptyState />
                    </div>
                  ) : (
                    <>
                      <div className="h-[280px] p-5 border-b border-border/40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perAgent.slice(0, 10)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                            <XAxis
                              dataKey="name"
                              fontSize={10}
                              className="font-semibold fill-muted-foreground"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={6}
                            />
                            <YAxis
                              fontSize={10}
                              className="font-mono font-medium fill-muted-foreground"
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid hsl(var(--border))",
                                backgroundColor: "hsl(var(--background))",
                                fontSize: "12px",
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "600", paddingTop: "5px" }} />
                            <Bar
                              dataKey="revenue"
                              name="Revenue Apportioned ($)"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="cost"
                              name="Model Overhead ($)"
                              fill="hsl(var(--destructive))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border/60">
                              <TableHead className="text-xs font-bold text-foreground px-5 py-3">Agent Unit</TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground">
                                Message Count
                              </TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground">
                                Token Metrics
                              </TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground">
                                Credits Balance
                              </TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground">
                                Compute Overhead
                              </TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground">
                                Net Variance
                              </TableHead>
                              <TableHead className="text-right text-xs font-bold text-foreground px-5">
                                Margin Yield
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {perAgent.map((row) => (
                              <TableRow
                                key={row.agent_id}
                                className="hover:bg-primary/[0.01] border-b border-border/40 last:border-none"
                              >
                                <TableCell className="px-5 py-3 font-semibold text-sm text-foreground">
                                  {row.name}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {row.messages.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {row.tokens.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {row.credits.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-rose-600">
                                  ${row.cost.toFixed(4)}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right font-mono text-xs font-bold",
                                    row.margin >= 0 ? "text-emerald-600" : "text-rose-600",
                                  )}
                                >
                                  ${row.margin.toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right px-5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-bold text-[10px] rounded px-2",
                                      row.marginPct >= 0
                                        ? "bg-emerald-500/10 border-none text-emerald-700"
                                        : "bg-rose-500/10 border-none text-rose-700",
                                    )}
                                  >
                                    {row.marginPct.toFixed(0)}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Split Testing Routing Experiment Tracker Panel */}
            <TabsContent
              value="variants"
              className="animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none"
            >
              <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
                <div className="h-1 w-full bg-amber-500" />
                <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                    <SplitSquareHorizontal className="h-4 w-4 text-amber-500" /> System Routing Prompts Optimization
                    Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-background/50">
                  {variantStats.length === 0 ? (
                    <div className="p-5">
                      <EmptyState message="No performance variants tracked. Initiate split profiles inside the System Studio dashboard panel to record vectors." />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-b border-border/60">
                            <ThemeHead>Agent Target Node</ThemeHead>
                            <ThemeHead>Instructions Variant Profile</ThemeHead>
                            <ThemeHead className="text-right">Volume Processed</ThemeHead>
                            <ThemeHead className="text-right">Average Response Size</ThemeHead>
                            <ThemeHead className="text-right">Average Call Overhead</ThemeHead>
                            <ThemeHead className="text-right">Average Credit Rate</ThemeHead>
                            <ThemeHead className="text-right px-5">Aggregated Overhead</ThemeHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variantStats.map((row, i) => (
                            <TableRow
                              key={i}
                              className="hover:bg-primary/[0.01] border-b border-border/40 last:border-none"
                            >
                              <TableCell className="px-5 py-3 font-semibold text-sm text-foreground">
                                {row.agent_name}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="font-semibold text-xs bg-background text-muted-foreground border-border rounded px-2"
                                  >
                                    {row.variant}
                                  </Badge>
                                  {row.active && (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                      Route
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                {row.messages}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                {row.avgTokens} tokens
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                ${row.avgCost.toFixed(5)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                {row.avgCredits.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right px-5 font-mono text-xs font-bold text-rose-600">
                                ${row.cost.toFixed(4)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Compact Sub-Panel Heading Selector Element Shortcut
function ThemeHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <TableHead className={cn("text-xs font-bold text-foreground py-3", className)} {...props} />;
}

interface KPIProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}

function KPI({ icon, label, value, color, bg }: KPIProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-2">
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center border border-transparent transition-transform group-hover:scale-105",
            bg,
            color,
          )}
        >
          {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
        </div>
        <div>
          <div className="text-[11px] font-bold text-muted-foreground/70 mb-0.5 tracking-tight line-clamp-1">
            {label}
          </div>
          <div className="text-lg font-bold text-foreground leading-none tracking-tight truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  message = "Insufficient transaction logs available inside this timeframe tracking boundary.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-muted-foreground/40 bg-muted/5 border border-dashed border-border/60 rounded-xl p-6">
      <Activity className="h-6 w-6 mb-3 text-muted-foreground/30 animate-pulse" />
      <p className="text-xs font-medium text-center max-w-xs leading-normal">{message}</p>
    </div>
  );
}

export default AgentInsights;
