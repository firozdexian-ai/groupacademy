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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Send, ShieldAlert, Coins, RefreshCcw, Zap, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

// Refactored to match Phase 6 Badge Standards
const STATUS_TONE: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  queued: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  pending: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  error: "bg-destructive/10 text-destructive border-destructive/30",
  deduped: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  skipped: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

const CHANNEL_TONE: Record<string, string> = {
  whatsapp: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  in_app: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  telegram: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  email: "bg-zinc-500/10 text-zinc-600 border-zinc-500/30",
};

export function AgentOutreachManager() {
  const {
    data: rows = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
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
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Proactive Engine</h2>
            <Badge
              variant="outline"
              className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-black uppercase tracking-widest"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" /> Live
            </Badge>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Autonomous Swarm Telemetry · Real-time Dispatch Logs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-background/50 shadow-sm"
        >
          <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin text-primary")} />
          Sync Swarm
        </Button>
      </header>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={<Activity />}
          label="Events / Min"
          value={String(eventsPerMin)}
          hint="Rolling 5-min window"
          color="text-sky-500"
          bg="bg-sky-500/10"
        />
        <KpiCard
          icon={<Send />}
          label="Dispatched 24h"
          value={String(stats.dispatched24h)}
          hint="Sent + Queued Outreach"
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <KpiCard
          icon={<ShieldAlert />}
          label="In-App Fallback"
          value={`${stats.fallbackRate.toFixed(1)}%`}
          hint={`${dedupeCount} dedupe blocks 24h`}
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <KpiCard
          icon={<Coins />}
          label="Credits Burned"
          value={stats.creditsBurned.toFixed(1)}
          hint="Across all channels (24h)"
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Live Table Viewport */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
            <Network className="h-4 w-4 text-amber-500" /> Recent Dispatches
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted/20" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/50 bg-muted/5">
              <Zap className="h-8 w-8 mb-4 opacity-40" />
              <div className="text-[10px] font-black uppercase tracking-widest max-w-sm text-center">
                No outreach yet. The swarm is idle. Wire more triggers in the Channel Triggers panel.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b-2 border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Agent Node</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Event</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Channel</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Target Entity</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Payload</TableHead>
                    <TableHead className="px-6 text-right text-[10px] font-black uppercase tracking-widest">
                      Status / Cost
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y-2 divide-border/5">
                  {rows.map((r) => {
                    const statusKey = String(r.status ?? "unknown").toLowerCase();
                    const channelKey = String(r.channel ?? "unknown").toLowerCase();
                    return (
                      <TableRow key={r.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <TableCell className="px-6 py-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                          {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : "—"}
                        </TableCell>
                        <TableCell className="font-black italic text-sm group-hover:text-primary transition-colors">
                          {r.agent_name ?? r.agent_key ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[9px] font-bold bg-muted/50 border border-border/50 px-2 py-1 rounded-md text-muted-foreground uppercase">
                            {r.event_kind ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest border-2",
                              CHANNEL_TONE[channelKey],
                            )}
                          >
                            {r.channel ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                            {r.recipient_kind ?? "—"}
                          </div>
                          {r.recipient_id && (
                            <div
                              className="font-mono text-[9px] text-muted-foreground/60 mt-1 truncate max-w-[140px]"
                              title={r.recipient_id}
                            >
                              {r.recipient_id.slice(0, 12)}…
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-xs font-medium italic text-muted-foreground line-clamp-2">
                            {r.body ?? "—"}
                          </div>
                          {r.error_message && (
                            <div className="text-[10px] font-bold text-destructive/80 mt-1 line-clamp-1 bg-destructive/10 px-2 py-0.5 rounded-md inline-block">
                              ERR: {r.error_message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest border-2",
                              STATUS_TONE[statusKey],
                            )}
                          >
                            {r.status ?? "—"}
                          </Badge>
                          {r.credits_charged ? (
                            <div className="text-[10px] font-black text-muted-foreground mt-1.5 uppercase tracking-widest">
                              {Number(r.credits_charged).toFixed(1)} CR
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Trace Footer */}
      <footer className="mt-12 pt-8 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Agent OS: Proactive Swarm Runtime</p>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}

// Internal customized KPI component matching Phase 6 Design Standard
function KpiCard({
  icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 line-clamp-1">
            {label}
          </p>
          <p className="text-2xl font-black italic tracking-tighter leading-none truncate">{value}</p>
          {hint && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1.5 truncate">
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentOutreachManager;
