import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listRecentAgentOutreachAdmin,
  countAgentOutreachDedupeSince,
  countPlatformEventsSince,
} from "@/domains/agents/repo/agentsRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError } from "@/lib/errorTracking";
import { Activity, Send, ShieldAlert, Coins, RefreshCcw, Zap, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Proactive Outreach Swarm Dispatch Monitor Dashboard
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=outreach (Autonomous Dispatch Management Workspace)
 * Operations Mode: Automated Efficiency engine reporting rolling telemetry logs with automated 15s cache invalidation.
 */

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
  sent: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none",
  delivered: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none",
  queued: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 border-none",
  pending: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 border-none",
  failed: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 border-none",
  error: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 border-none",
  deduped: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 border-none",
  skipped: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 border-none",
};

const CHANNEL_TONE: Record<string, string> = {
  whatsapp: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none rounded",
  in_app: "bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 border-none rounded",
  telegram: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 border-none rounded",
  email: "bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/10 border-none rounded",
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
      try {
        const result = await listRecentAgentOutreachAdmin(200);
        return result as OutreachRow[];
      } catch (err: any) {
        trackError("agent-outreach-manager-fetch-rows-failure", { error: err.message });
        throw err;
      }
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const { data: dedupeCount = 0 } = useQuery({
    queryKey: ["agent-outreach-dedupe", "24h"],
    queryFn: async () => {
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        return await countAgentOutreachDedupeSince(since);
      } catch (err: any) {
        trackError("agent-outreach-manager-fetch-dedupe-failure", { error: err.message });
        return 0;
      }
    },
    refetchInterval: 30000,
  });

  const { data: eventsPerMin = 0 } = useQuery({
    queryKey: ["platform-events", "5m"],
    queryFn: async () => {
      try {
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const count = await countPlatformEventsSince(since);
        return Math.round((count / 5) * 10) / 10;
      } catch (err: any) {
        trackError("agent-outreach-manager-fetch-events-failure", { error: err.message });
        return 0;
      }
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
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Executive Overview Control Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="h-6 w-6 text-amber-500 fill-amber-500/10" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Outreach Engine Logs</h2>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-none text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0 flex items-center h-5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" /> Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Automated background dispatch tracking and proactive interaction auditing ledger loops.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl h-10 px-4 border border-border font-semibold text-xs text-foreground bg-background hover:bg-muted gap-2 shadow-sm shrink-0"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", isFetching && "animate-spin text-primary")} />
          Refresh Live Data
        </Button>
      </header>

      {/* Structured KPI Performance Canvas Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Activity />}
          label="System Events / Min"
          value={String(eventsPerMin)}
          hint="Rolling 5-min window"
          color="text-sky-600"
          bg="bg-sky-500/10"
        />
        <KpiCard
          icon={<Send />}
          label="Dispatched (24h)"
          value={String(stats.dispatched24h)}
          hint="Sent & pending distribution"
          color="text-emerald-600"
          bg="bg-emerald-500/10"
        />
        <KpiCard
          icon={<ShieldAlert />}
          label="In-App Fallback Rate"
          value={`${stats.fallbackRate.toFixed(1)}%`}
          hint={`${dedupeCount} validation skips (24h)`}
          color="text-violet-600"
          bg="bg-violet-500/10"
        />
        <KpiCard
          icon={<Coins />}
          label="Operational Cost"
          value={`${stats.creditsBurned.toLocaleString(undefined, { maximumFractionDigits: 1 })} Credits`}
          hint="Across all guidance channels (24h)"
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Main Dispatch Logs Data Canvas */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
            <Network className="h-4 w-4 text-amber-500" /> Recent Message Dispatches
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 bg-background/50">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl bg-muted/30" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 space-y-2">
              <Zap className="h-6 w-6 text-muted-foreground/20 animate-pulse" />
              <p className="text-xs font-medium max-w-xs text-center leading-normal">
                No outbound logs captured within this timeframe slot window. Background workers are monitoring activity
                hooks.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border/60">
                    <TableHead className="px-5 py-3 text-xs font-bold text-foreground">Timestamp</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Assistant Node</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Hook Trigger</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Conduit</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Recipient Target</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Payload Content</TableHead>
                    <TableHead className="px-5 text-right text-xs font-bold text-foreground">Status / Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const statusKey = String(r.status ?? "unknown").toLowerCase();
                    const channelKey = String(r.channel ?? "unknown").toLowerCase();
                    return (
                      <TableRow
                        key={r.id}
                        className="hover:bg-primary/[0.01] border-b border-border/40 last:border-none group"
                      >
                        <TableCell className="px-5 py-3 whitespace-nowrap text-xs font-semibold font-mono text-muted-foreground/80 tabular-nums">
                          {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : "—"}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {r.agent_name ?? r.agent_key ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[10px] font-semibold bg-muted border border-border/50 px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tight">
                            {r.event_kind ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-bold px-2 py-0 rounded", CHANNEL_TONE[channelKey])}
                          >
                            {r.channel ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-foreground/90 capitalize leading-none">
                            {r.recipient_kind ?? "—"}
                          </div>
                          {r.recipient_id && (
                            <div
                              className="font-mono text-[10px] text-muted-foreground/60 mt-1 truncate max-w-[120px]"
                              title={r.recipient_id}
                            >
                              {r.recipient_id.slice(0, 10)}…
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-muted-foreground/80 font-medium leading-normal line-clamp-2">
                            {r.body ?? "—"}
                          </p>
                          {r.error_message && (
                            <div className="text-[10px] font-bold text-rose-700 bg-rose-500/10 px-2 py-0.5 rounded border-none mt-1 line-clamp-1 inline-block">
                              Error message: {r.error_message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-bold px-2 py-0 rounded-full", STATUS_TONE[statusKey])}
                          >
                            {r.status ?? "—"}
                          </Badge>
                          {r.credits_charged ? (
                            <div className="text-[10px] font-bold text-muted-foreground/80 font-mono mt-1 tracking-tight">
                              {Number(r.credits_charged).toFixed(1)} Credits
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
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color?: string;
  bg?: string;
}

function KpiCard({ icon, label, value, hint, color, bg }: KpiCardProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center border border-transparent transition-transform group-hover:scale-102 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground/70 mb-0.5 tracking-tight line-clamp-1">{label}</p>
          <p className="text-xl font-bold text-foreground leading-none tracking-tight truncate">{value}</p>
          {hint && (
            <p className="text-[10px] text-muted-foreground/50 font-medium truncate mt-1 tracking-tight">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentOutreachManager;
