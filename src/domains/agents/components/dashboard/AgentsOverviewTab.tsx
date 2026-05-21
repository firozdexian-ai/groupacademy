import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAgentsOverview } from "@/domains/agents/repo/agentsRepo";
import { Bot, Sparkles, Zap, Plug, Users, Building2, UserPlus, Store, Activity, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AgentsOverviewTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { agents, channelCount, tools, sessions7dCount } = await getAgentsOverview();
      const byType: Record<string, number> = {};
      let active = 0;
      let convs = 0;
      for (const r of agents as any[]) {
        const k = r.agent_type ?? "unknown";
        byType[k] = (byType[k] ?? 0) + 1;
        if (r.is_active) active++;
        convs += r.total_conversations ?? 0;
      }
      const toolsByKind: Record<string, number> = {};
      for (const t of (tools ?? []) as any[]) {
        toolsByKind[t.handler_kind] = (toolsByKind[t.handler_kind] ?? 0) + 1;
      }
      setStats({
        totalAgents: agents.length,
        active,
        byType,
        channels: channelCount,
        tools: (tools ?? []).length,
        toolsByKind,
        sessions7d: sessions7dCount,
        convs,
      });
    })();
  }, []);

  if (!stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-[40px] bg-muted/40" />
      </div>
    );
  }

  const Tile = ({ icon: Icon, label, value, sub, color, bg }: any) => (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm">
      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            "border-white/5",
          )}
        >
          <Icon className={cn("h-7 w-7", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
          <p className="text-3xl font-black tracking-tighter italic leading-none">{value.toLocaleString()}</p>
          {sub && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic mt-1.5 truncate">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Cpu className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Agent OS Telemetry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Logic deployment · Skill connectors · System bandwidth
          </p>
        </div>
      </header>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Tile
          icon={Bot}
          label="Total Agents"
          value={stats.totalAgents}
          sub={`${stats.active} Nodes Active`}
          color="text-primary"
          bg="bg-primary/10"
        />
        <Tile
          icon={Zap}
          label="Comms Channels"
          value={stats.channels}
          sub="WhatsApp, Telegram, etc."
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <Tile
          icon={Plug}
          label="Logic Tools"
          value={stats.tools}
          sub="APIs & DB Connectors"
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <Tile
          icon={Activity}
          label="Sessions (7d)"
          value={stats.sessions7d}
          sub={`${stats.convs.toLocaleString()} Lifetime Executions`}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Distribution */}
        <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl xl:col-span-2 flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-6 border-b border-border/10 bg-muted/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
              <Users className="h-4 w-4 text-primary" /> Agent Architecture Topology
            </h3>
          </div>
          <div className="p-8 grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 items-center">
            {[
              { key: "b2c", label: "Talent (B2C)", icon: Users },
              { key: "platform_tool", label: "Platform Tool", icon: Sparkles },
              { key: "b2b", label: "Employer (B2B)", icon: Building2 },
              { key: "ugc", label: "User Generated", icon: UserPlus },
              { key: "marketplace", label: "Marketplace", icon: Store },
            ].map((t) => (
              <div
                key={t.key}
                className="rounded-[24px] border-2 border-border/20 bg-muted/10 p-5 text-center flex flex-col items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border/40 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <t.icon className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-2xl font-black italic tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">
                  {stats.byType[t.key] ?? 0}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-tight">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tool Topology */}
        <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="p-6 border-b border-border/10 bg-muted/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
              <Plug className="h-4 w-4 text-emerald-500" /> Skill Integration Endpoints
            </h3>
          </div>
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.toolsByKind).map(([k, v]: any) => (
                <div
                  key={k}
                  className="rounded-xl bg-background border-2 border-border/40 px-3 py-2 flex items-center gap-3 shadow-sm hover:border-emerald-500/40 transition-colors"
                >
                  <span className="font-mono text-[10px] font-bold text-muted-foreground/80 uppercase">{k}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-black italic text-foreground/80">{v}</span>
                </div>
              ))}
            </div>
            {Object.keys(stats.toolsByKind).length === 0 && (
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 py-10">
                No tool endpoints detected
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
