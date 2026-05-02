import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Sparkles, Zap, Plug, Users, Building2, UserPlus, Store } from "lucide-react";

export function AgentsOverviewTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [agents, channels, tools, sessions] = await Promise.all([
        supabase.from("ai_agents").select("agent_type,is_active,visibility,total_conversations"),
        supabase.from("agent_channels").select("id", { count: "exact", head: true }),
        supabase.from("agent_tools").select("handler_kind"),
        supabase.from("agent_chat_sessions").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);
      const a = agents.data ?? [];
      const byType: Record<string, number> = {};
      let active = 0;
      let convs = 0;
      for (const r of a as any[]) {
        const k = r.agent_type ?? "unknown";
        byType[k] = (byType[k] ?? 0) + 1;
        if (r.is_active) active++;
        convs += r.total_conversations ?? 0;
      }
      const toolsByKind: Record<string, number> = {};
      for (const t of (tools.data ?? []) as any[]) {
        toolsByKind[t.handler_kind] = (toolsByKind[t.handler_kind] ?? 0) + 1;
      }
      setStats({
        totalAgents: a.length,
        active,
        byType,
        channels: channels.count ?? 0,
        tools: (tools.data ?? []).length,
        toolsByKind,
        sessions7d: sessions.count ?? 0,
        convs,
      });
    })();
  }, []);

  if (!stats) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const Tile = ({ icon: Icon, label, value, sub }: any) => (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );

  return (
    <div className="space-y-4 p-2">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6" /> Agent OS Overview</h2>
        <p className="text-sm text-muted-foreground">Health and footprint of every agent across the platform.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={Bot} label="Total Agents" value={stats.totalAgents} sub={`${stats.active} active`} />
        <Tile icon={Zap} label="Channels" value={stats.channels} />
        <Tile icon={Plug} label="Tools / Skills / Connectors" value={stats.tools} />
        <Tile icon={Sparkles} label="Sessions (7d)" value={stats.sessions7d} sub={`${stats.convs} lifetime convs`} />
      </div>
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Agents by type</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { key: "b2c", label: "B2C", icon: Users },
            { key: "platform_tool", label: "Platform Tool", icon: Sparkles },
            { key: "b2b", label: "B2B", icon: Building2 },
            { key: "ugc", label: "User-Generated", icon: UserPlus },
            { key: "marketplace", label: "Marketplace", icon: Store },
          ].map((t) => (
            <div key={t.key} className="rounded-md border p-3 text-center">
              <t.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-semibold">{stats.byType[t.key] ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tools by kind</div>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(stats.toolsByKind).map(([k, v]: any) => (
            <div key={k} className="rounded-full bg-muted px-3 py-1">
              <span className="font-mono text-xs">{k}</span> · <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
