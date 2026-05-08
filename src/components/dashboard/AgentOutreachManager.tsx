// Phase A1 — Proactive Engine Dashboard.
// Live observability into the autonomous outreach swarm: KPI HUD + recent
// dispatch table fed by `agent_outreach_admin_v` and `agent_outreach_dedupe`.
// Auto-refreshes every 15s via React Query so admins always see live state.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Activity, Send, ShieldAlert, Coins, RefreshCcw, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type OutreachRow = {
  id: string;
  agent_key: string | null;
  agent_name: string | null;
  event_kind: string | null;
  channel: string | null;
  status: string | null;
  recipient_kind: string | null;
  recipient_id: string | null;
  body: string | null;
  credits_charged: number | null;
  error_message: string | null;
  external_message_id: string | null;
  created_at: string | null;
};

const STATUS_TONE: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  queued: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  pending: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  failed: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  error: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  deduped: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  skipped: "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

const CHANNEL_TONE: Record<string, string> = {
  whatsapp: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  in_app: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  telegram: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  email: "bg-zinc-500/10 text-zinc-700 border-zinc-500/30",
};

export function AgentOutreachManager() {
  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["agent-outreach-admin", "recent"],
    queryFn: async (): Promise<OutreachRow[]> => {
      const { data, error } = await supabase
        .from("agent_outreach_admin_v")
        .select(
          "id, agent_key, agent_name, event_kind, channel, status, recipient_kind, recipient_id, body, credits_charged, error_message, external_message_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as OutreachRow[];
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const { data: dedupeCount = 0 } = useQuery({
    queryKey: ["agent-outreach-dedupe", "24h"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("agent_outreach_dedupe")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", since);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: eventsPerMin = 0 } = useQuery({
    queryKey: ["platform-events", "5m"],
    queryFn: async () => {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("platform_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      if (error) throw error;
      return Math.round(((count ?? 0) / 5) * 10) / 10;
    },
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    const since24h = Date.now() - 24 * 60 * 60 * 1000;
    const last24 = rows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= since24h);
    const dispatched = last24.filter((r) =>
      ["sent", "delivered", "queued", "pending"].includes(String(r.status ?? "").toLowerCase()),
    );
    const inAppFallback = dispatched.filter((r) => r.channel === "in_app").length;
    const fallbackRate = dispatched.length ? (inAppFallback / dispatched.length) * 100 : 0;
    const creditsBurned = last24.reduce((acc, r) => acc + Number(r.credits_charged ?? 0), 0);
    return {
      dispatched24h: dispatched.length,
      fallbackRate,
      creditsBurned,
    };
  }, [rows]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Proactive Engine</h1>
          <Badge variant="outline" className="ml-2">live</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Activity className="h-4 w-4 text-sky-500" />}
          label="Events / min"
          value={String(eventsPerMin)}
          hint="rolling 5-min window"
        />
        <KpiCard
          icon={<Send className="h-4 w-4 text-emerald-500" />}
          label="Dispatched 24h"
          value={String(stats.dispatched24h)}
          hint="sent + queued outreach"
        />
        <KpiCard
          icon={<ShieldAlert className="h-4 w-4 text-violet-500" />}
          label="In-App Fallback"
          value={`${stats.fallbackRate.toFixed(1)}%`}
          hint={`${dedupeCount} dedupe blocks 24h`}
        />
        <KpiCard
          icon={<Coins className="h-4 w-4 text-amber-500" />}
          label="Credits Burned 24h"
          value={stats.creditsBurned.toFixed(1)}
          hint="across all channels"
        />
      </div>

      {/* Live table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent dispatches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Loading swarm activity…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              No outreach yet. The swarm is idle — wire more triggers in <span className="font-medium">Channel Triggers</span>.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const statusKey = String(r.status ?? "unknown").toLowerCase();
                  const channelKey = String(r.channel ?? "unknown").toLowerCase();
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.agent_name ?? r.agent_key ?? "—"}
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] bg-muted/40 px-1.5 py-0.5 rounded">
                          {r.event_kind ?? "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CHANNEL_TONE[channelKey] ?? ""}>
                          {r.channel ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{r.recipient_kind ?? "—"}</div>
                        {r.recipient_id ? (
                          <div className="font-mono text-[10px] truncate max-w-[140px]">
                            {r.recipient_id.slice(0, 12)}…
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm line-clamp-2">{r.body ?? "—"}</div>
                        {r.error_message ? (
                          <div className="text-[11px] text-rose-600 mt-1 line-clamp-1">
                            {r.error_message}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={STATUS_TONE[statusKey] ?? ""}>
                          {r.status ?? "—"}
                        </Badge>
                        {r.credits_charged ? (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {Number(r.credits_charged).toFixed(1)} cr
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon, label, value, hint,
}: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
        {hint ? <div className="text-[11px] text-muted-foreground mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export default AgentOutreachManager;
