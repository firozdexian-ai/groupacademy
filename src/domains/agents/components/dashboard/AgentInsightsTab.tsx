import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const CREDIT_TO_USD = 1 / 250; // ~ $0.004 / credit (1 credit = 2 BDT ≈ $0.018, but we use marginal cost lens)

export function AgentInsights() {
  const [days, setDays] = useState(7);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, [days]);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [agentsRes, eventsRes] = await Promise.all([
      supabase.from("ai_agents").select("id,name,agent_key,active_prompt_variant,prompt_variants"),
      supabase
        .from("agent_credit_events")
        .select(
          "id,agent_id,thread_id,subject_kind,event_kind,credits,llm_cost_usd,tokens_in,tokens_out,prompt_variant,created_at",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000), // CTO Patch: Expanded limit for higher volume telemetry
    ]);
    setAgents((agentsRes.data as AgentRow[]) ?? []);
    setEvents((eventsRes.data as CreditEvent[]) ?? []);
    setLoading(false);
  }

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
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Agent Insights</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Token usage · Profit margins · A/B Variant Performance
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px] h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)} className="font-bold text-[10px] uppercase">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[220px] h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-background/50">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="all" className="font-bold text-[10px] uppercase">
                All Agents
              </SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id} className="font-bold text-[10px] uppercase truncate">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/50 bg-muted/5 border-2 border-dashed border-border/20 rounded-[40px]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <span className="font-black uppercase tracking-widest text-[10px]">Syncing Telemetry...</span>
        </div>
      ) : (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPI
              icon={<Activity />}
              label="Messages"
              value={totals.msgs.toLocaleString()}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <KPI
              icon={<Coins />}
              label="Credits Used"
              value={totals.credits.toFixed(1)}
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
            <KPI
              icon={<DollarSign />}
              label="LLM Cost"
              value={`$${totals.cost.toFixed(3)}`}
              color="text-red-500"
              bg="bg-red-500/10"
            />
            <KPI
              icon={<TrendingUp />}
              label="Revenue (Est)"
              value={`$${totals.revenueUsd.toFixed(3)}`}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <KPI
              icon={<TrendingUp />}
              label="Margin"
              value={`$${totals.margin.toFixed(3)}`}
              color={totals.margin >= 0 ? "text-emerald-500" : "text-red-500"}
              bg={totals.margin >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
            />
            <KPI
              icon={<Cpu />}
              label="Tokens Burned"
              value={(totals.tIn + totals.tOut).toLocaleString()}
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
          </div>

          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1 mb-8 w-full md:w-auto flex flex-col md:flex-row h-auto gap-1">
              <TabsTrigger
                value="usage"
                className="md:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
              >
                <LineChart className="h-4 w-4" /> Usage Trend
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                className="md:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
              >
                <Layers className="h-4 w-4" /> Per-Agent Margin
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="md:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-6 data-[state=active]:bg-background data-[state=active]:shadow-lg flex items-center gap-2"
              >
                <SplitSquareHorizontal className="h-4 w-4" /> A/B Variants
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="animate-in slide-in-from-bottom-4 duration-700 outline-none">
              <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                    <LineChart className="h-4 w-4 text-primary" /> Daily Credits & Cost
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] p-8">
                  {timeSeries.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis
                          dataKey="date"
                          fontSize={10}
                          className="font-mono font-bold fill-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          yAxisId="left"
                          fontSize={10}
                          className="font-mono font-bold fill-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          fontSize={10}
                          className="font-mono font-bold fill-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "2px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--background))",
                            fontWeight: "bold",
                          }}
                          itemStyle={{ fontSize: "12px" }}
                          labelStyle={{
                            color: "hsl(var(--muted-foreground))",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          name="Credits Burned"
                          dataKey="credits"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fill="url(#colorCredits)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          name="LLM Cost ($)"
                          dataKey="cost"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={3}
                          fill="url(#colorCost)"
                        />
                        <defs>
                          <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="animate-in slide-in-from-bottom-4 duration-700 outline-none">
              <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                    <Layers className="h-4 w-4 text-emerald-500" /> Agent Profitability
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {perAgent.length === 0 ? (
                    <div className="p-8">
                      <EmptyState />
                    </div>
                  ) : (
                    <>
                      <div className="h-[300px] p-8 border-b border-border/10">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perAgent.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                            <XAxis
                              dataKey="name"
                              fontSize={9}
                              className="font-black uppercase fill-muted-foreground"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              fontSize={10}
                              className="font-mono font-bold fill-muted-foreground"
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                              contentStyle={{
                                borderRadius: "16px",
                                border: "2px solid hsl(var(--border))",
                                backgroundColor: "hsl(var(--background))",
                                fontWeight: "bold",
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
                            />
                            <Bar
                              dataKey="revenue"
                              name="Revenue ($)"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="cost"
                              name="LLM Cost ($)"
                              fill="hsl(var(--destructive))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-b-2">
                              <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 py-4">
                                Agent
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                                Messages
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                                Tokens
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                                Credits
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                                LLM Cost
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                                Margin
                              </TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-8">
                                Margin %
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {perAgent.map((row) => (
                              <TableRow
                                key={row.agent_id}
                                className="hover:bg-primary/[0.02] transition-colors border-b border-border/5 last:border-0"
                              >
                                <TableCell className="px-8 py-4 font-black italic uppercase text-sm">
                                  {row.name}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {row.messages.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {row.tokens.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">{row.credits.toFixed(1)}</TableCell>
                                <TableCell className="text-right font-mono text-xs text-destructive/80">
                                  ${row.cost.toFixed(4)}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right font-mono text-xs font-bold",
                                    row.margin >= 0 ? "text-emerald-500" : "text-destructive",
                                  )}
                                >
                                  ${row.margin.toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right px-8">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-black text-[9px]",
                                      row.marginPct >= 0
                                        ? "border-emerald-500/40 text-emerald-500"
                                        : "border-destructive/40 text-destructive",
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

            <TabsContent value="variants" className="animate-in slide-in-from-bottom-4 duration-700 outline-none">
              <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
                <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                    <SplitSquareHorizontal className="h-4 w-4 text-amber-500" /> Prompt Variant Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {variantStats.length === 0 ? (
                    <div className="p-8">
                      <EmptyState message="No variant data yet — start an A/B test from Agent Studio → Brain." />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-b-2">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 py-4">
                              Agent Node
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">
                              Variant Key
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                              Messages
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                              Avg Tokens
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                              Avg Cost
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                              Avg Credits
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-8">
                              Total Cost
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variantStats.map((row, i) => (
                            <TableRow
                              key={i}
                              className="hover:bg-primary/[0.02] transition-colors border-b border-border/5 last:border-0"
                            >
                              <TableCell className="px-8 py-4 font-black italic uppercase text-sm">
                                {row.agent_name}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-black text-[10px] bg-background">
                                    {row.variant}
                                  </Badge>
                                  {row.active && (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">{row.messages}</TableCell>
                              <TableCell className="text-right font-mono text-xs">{row.avgTokens}</TableCell>
                              <TableCell className="text-right font-mono text-xs">${row.avgCost.toFixed(5)}</TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {row.avgCredits.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right px-8 font-mono text-xs font-bold text-destructive/80">
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

// Internal customized KPI component matching Phase 6 Design Standard
function KPI({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="rounded-[24px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:scale-110",
            bg,
            color,
          )}
        >
          {icon}
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 line-clamp-1">
            {label}
          </div>
          <div className="text-xl font-black italic tracking-tighter leading-none truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "Insufficient telemetry available in this timeframe." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground/50 bg-muted/5 border-2 border-dashed border-border/20 rounded-[32px] m-6">
      <Activity className="h-8 w-8 mb-4 opacity-40" />
      <span className="font-black uppercase tracking-widest text-[10px] text-center max-w-xs">{message}</span>
    </div>
  );
}
