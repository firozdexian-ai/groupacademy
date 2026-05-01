import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Coins, DollarSign, Activity, Cpu, TrendingUp, Sparkles } from "lucide-react";
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
        .select("id,agent_id,thread_id,subject_kind,event_kind,credits,llm_cost_usd,tokens_in,tokens_out,prompt_variant,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
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
    const revenueUsd = credits * (1 / 250); // approx COGS lens — purely indicative
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
    const map = new Map<string, { agent_id: string; credits: number; cost: number; messages: number; tokens: number }>();
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
    // Group per agent + variant
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Agent Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Token usage, profit margins, and A/B variant performance across the Agent OS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All agents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading insights…
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI icon={<Activity className="h-4 w-4" />} label="Messages" value={totals.msgs.toLocaleString()} />
            <KPI icon={<Coins className="h-4 w-4" />} label="Credits used" value={totals.credits.toFixed(1)} />
            <KPI icon={<DollarSign className="h-4 w-4" />} label="LLM cost" value={`$${totals.cost.toFixed(3)}`} />
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="Revenue (est)" value={`$${totals.revenueUsd.toFixed(3)}`} />
            <KPI
              icon={<TrendingUp className="h-4 w-4" />}
              label="Margin"
              value={`$${totals.margin.toFixed(3)}`}
              accent={totals.margin >= 0 ? "text-emerald-500" : "text-red-500"}
            />
            <KPI icon={<Cpu className="h-4 w-4" />} label="Tokens" value={`${(totals.tIn + totals.tOut).toLocaleString()}`} />
          </div>

          <Tabs defaultValue="usage" className="space-y-4">
            <TabsList>
              <TabsTrigger value="usage">Usage Trend</TabsTrigger>
              <TabsTrigger value="agents">Per-Agent Margin</TabsTrigger>
              <TabsTrigger value="variants">A/B Variants</TabsTrigger>
            </TabsList>

            <TabsContent value="usage">
              <Card>
                <CardHeader><CardTitle>Daily credits & cost</CardTitle></CardHeader>
                <CardContent className="h-[320px]">
                  {timeSeries.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis yAxisId="left" fontSize={11} />
                        <YAxis yAxisId="right" orientation="right" fontSize={11} />
                        <Tooltip />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="credits" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                        <Area yAxisId="right" type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.15)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents">
              <Card>
                <CardHeader><CardTitle>Agent profitability</CardTitle></CardHeader>
                <CardContent>
                  {perAgent.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      <div className="h-[260px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={perAgent.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={60} />
                            <YAxis fontSize={11} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue ($)" fill="hsl(var(--primary))" />
                            <Bar dataKey="cost" name="LLM Cost ($)" fill="hsl(var(--destructive))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead className="text-right">Messages</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-right">Credits</TableHead>
                            <TableHead className="text-right">LLM Cost</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                            <TableHead className="text-right">Margin %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perAgent.map((row) => (
                            <TableRow key={row.agent_id}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-right">{row.messages}</TableCell>
                              <TableCell className="text-right">{row.tokens.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.credits.toFixed(1)}</TableCell>
                              <TableCell className="text-right">${row.cost.toFixed(4)}</TableCell>
                              <TableCell className={`text-right ${row.margin >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                ${row.margin.toFixed(4)}
                              </TableCell>
                              <TableCell className="text-right">{row.marginPct.toFixed(0)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variants">
              <Card>
                <CardHeader>
                  <CardTitle>Prompt variant performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {variantStats.length === 0 ? (
                    <EmptyState message="No variant data yet — start an A/B test from Agent Studio → Brain." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Variant</TableHead>
                          <TableHead className="text-right">Messages</TableHead>
                          <TableHead className="text-right">Avg Tokens</TableHead>
                          <TableHead className="text-right">Avg Cost</TableHead>
                          <TableHead className="text-right">Avg Credits</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variantStats.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.agent_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{row.variant}</span>
                                {row.active && <Badge variant="default" className="text-[10px]">ACTIVE</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{row.messages}</TableCell>
                            <TableCell className="text-right">{row.avgTokens}</TableCell>
                            <TableCell className="text-right">${row.avgCost.toFixed(5)}</TableCell>
                            <TableCell className="text-right">{row.avgCredits.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${row.cost.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <div className={`text-xl font-bold ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "No data in this range yet." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
      {message}
    </div>
  );
}
