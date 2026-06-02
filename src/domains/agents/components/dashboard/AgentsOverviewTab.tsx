import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentsOverview } from "@/domains/agents/repo/agentsRepo";
import { trackError } from "@/lib/errorTracking";
import { Bot, Sparkles, Zap, Plug, Users, Building2, UserPlus, Store, Activity, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Platform Assistants Summary Telemetry Panel Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=overview (System Telemetry Hub View)
 * Operations Mode: Automated Efficiency engine aggregating metrics across communication and tools pipelines.
 */

export function AgentsOverviewTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let activeQuery = true;

    getAgentsOverview()
      .then(({ agents, channelCount, tools, sessions7dCount }) => {
        if (!activeQuery) return;

        const byType: Record<string, number> = {};
        let activeCount = 0;
        let convsCount = 0;

        for (const r of (agents || []) as any[]) {
          const k = r.agent_type ?? "unknown";
          byType[k] = (byType[k] ?? 0) + 1;
          if (r.is_active) activeCount++;
          convsCount += r.total_conversations ?? 0;
        }

        const toolsByKind: Record<string, number> = {};
        for (const t of (tools ?? []) as any[]) {
          toolsByKind[t.handler_kind] = (toolsByKind[t.handler_kind] ?? 0) + 1;
        }

        setStats({
          totalAgents: agents.length,
          active: activeCount,
          byType,
          channels: channelCount,
          tools: (tools ?? []).length,
          toolsByKind,
          sessions7d: sessions7dCount,
          convs: convsCount,
        });
      })
      .catch((err: any) => {
        trackError("agents-overview-tab-aggregation-failure", { error: err?.message || String(err) });
      });

    return () => {
      activeQuery = false;
    };
  }, []);

  if (!stats) {
    return (
      <div className="space-y-4 text-left animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl bg-muted/30" />
      </div>
    );
  }

  const Tile = ({ icon: Icon, label, value, sub, color, bg }: any) => (
    <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center border border-transparent transition-transform duration-300 group-hover:scale-102 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground/70 mb-0.5 tracking-tight line-clamp-1">{label}</p>
          <p className="text-xl font-bold text-foreground leading-none tracking-tight">{value.toLocaleString()}</p>
          {sub && <p className="text-[10px] font-medium text-muted-foreground/50 mt-1 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Executive Overview Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Cpu className="h-6 w-6" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Platform Assistants Overview</h2>
          </div>
          <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">
            Track structural assistant models, connected communication channels, and external integration connectors
            bandwidth.
          </p>
        </div>
      </header>

      {/* Primary KPI Metrics Summary Widgets Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          icon={Bot}
          label="Total Assistant Profiles"
          value={stats.totalAgents}
          sub={`${stats.active} Active Workers`}
          color="text-primary"
          bg="bg-primary/10"
        />
        <Tile
          icon={Zap}
          label="Active Channels"
          value={stats.channels}
          sub="External messaging endpoints"
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
        <Tile
          icon={Plug}
          label="Integrated Tools"
          value={stats.tools}
          sub="Authorized actions list"
          color="text-emerald-600"
          bg="bg-emerald-500/10"
        />
        <Tile
          icon={Activity}
          label="Active Sessions (7d)"
          value={stats.sessions7d}
          sub={`${stats.convs.toLocaleString()} Lifetime Runs`}
          color="text-blue-600"
          bg="bg-blue-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assistant Categorization Topology Grid */}
        <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card xl:col-span-2 flex flex-col">
          <div className="h-1 w-full bg-primary" />
          <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
              <Users className="h-4 w-4 text-primary" /> Assistant Classification Topology
            </h3>
          </CardHeader>
          <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 items-center bg-background/50">
            {[
              { key: "b2c", label: "Talent (B2C)", icon: Users },
              { key: "platform_tool", label: "Platform Tools", icon: Sparkles },
              { key: "b2b", label: "Employer (B2B)", icon: Building2 },
              { key: "ugc", label: "Community UGC", icon: UserPlus },
              { key: "marketplace", label: "Marketplace Listing", icon: Store },
            ].map((t) => (
              <div
                key={t.key}
                className="rounded-xl border border-border bg-background p-4 text-center flex flex-col items-center justify-center hover:border-primary/30 hover:bg-primary/[0.01] transition-all group"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border/40 shadow-sm mb-2.5 group-hover:scale-102 transition-transform">
                  <t.icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-xl font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors">
                  {stats.byType[t.key] ?? 0}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground/70 leading-tight">{t.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Component Action Connectors Inventory Box */}
        <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
              <Plug className="h-4 w-4 text-emerald-500" /> Configured Action Connectors
            </h3>
          </CardHeader>
          <div className="p-5 flex-1 overflow-y-auto bg-background/50">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.toolsByKind).map(([k, v]: any) => (
                <div
                  key={k}
                  className="rounded-lg bg-background border border-border px-2.5 py-1 flex items-center gap-2.5 shadow-sm hover:border-emerald-500/30 transition-colors"
                >
                  <span className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">{k}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-bold text-xs text-foreground/90">{v}</span>
                </div>
              ))}
            </div>
            {Object.keys(stats.toolsByKind).length === 0 && (
              <p className="text-center text-xs font-medium text-muted-foreground/40 py-8 italic">
                No external integration tool connectors mapped in this workspace slot.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AgentsOverviewTab;
