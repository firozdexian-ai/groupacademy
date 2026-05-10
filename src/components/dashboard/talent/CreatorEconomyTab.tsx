import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Sparkles, Rocket, AlertTriangle, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Stats {
  hypes_total: number;
  hype_revenue_30d: number;
  conn_pending: number;
  conn_accepted: number;
  conn_revenue_30d: number;
  active_boosts: number;
}

export function CreatorEconomyTab() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [topHype, setTopHype] = useState<any[]>([]);
  const [topConn, setTopConn] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [hypesAll, hypesRecent, connPend, connAcc, connAccRecent, boostsActive] = await Promise.all([
      supabase.from("post_hypes").select("id", { count: "exact", head: true }),
      supabase.from("post_hypes").select("platform_share").gte("created_at", since),
      supabase.from("talent_connections").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("talent_connections").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      supabase.from("talent_connections").select("platform_share").eq("status", "accepted").gte("created_at", since),
      supabase
        .from("talent_inbox_settings")
        .select("talent_id, boost_until")
        .gt("boost_until", new Date().toISOString()),
    ]);
    setStats({
      hypes_total: hypesAll.count ?? 0,
      hype_revenue_30d: (hypesRecent.data ?? []).reduce((s: number, r: any) => s + Number(r.platform_share ?? 0), 0),
      conn_pending: connPend.count ?? 0,
      conn_accepted: connAcc.count ?? 0,
      conn_revenue_30d: (connAccRecent.data ?? []).reduce((s: number, r: any) => s + Number(r.platform_share ?? 0), 0),
      active_boosts: boostsActive.data?.length ?? 0,
    });

    // Top hyped recipients
    const { data: hypeRows } = await supabase.from("post_hypes").select("recipient_talent_id, creator_share");
    const hypeAgg = new Map<string, { count: number; earned: number }>();
    (hypeRows ?? []).forEach((r: any) => {
      const cur = hypeAgg.get(r.recipient_talent_id) ?? { count: 0, earned: 0 };
      cur.count += 1;
      cur.earned += Number(r.creator_share ?? 0);
      hypeAgg.set(r.recipient_talent_id, cur);
    });
    const topHypeIds = Array.from(hypeAgg.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    // Top connection earners
    const { data: connRows } = await supabase
      .from("talent_connections")
      .select("recipient_talent_id, recipient_share")
      .eq("status", "accepted");
    const connAgg = new Map<string, { count: number; earned: number }>();
    (connRows ?? []).forEach((r: any) => {
      const cur = connAgg.get(r.recipient_talent_id) ?? { count: 0, earned: 0 };
      cur.count += 1;
      cur.earned += Number(r.recipient_share ?? 0);
      connAgg.set(r.recipient_talent_id, cur);
    });
    const topConnIds = Array.from(connAgg.entries())
      .sort((a, b) => b[1].earned - a[1].earned)
      .slice(0, 10);

    const allIds = Array.from(
      new Set([
        ...topHypeIds.map((x) => x[0]),
        ...topConnIds.map((x) => x[0]),
        ...(boostsActive.data ?? []).map((b: any) => b.talent_id),
      ]),
    );
    const { data: tNames } = allIds.length
      ? await supabase.from("talents").select("id, full_name, profile_photo_url, custom_profession").in("id", allIds)
      : { data: [] as any[] };
    const tMap = new Map((tNames ?? []).map((t: any) => [t.id, t]));

    setTopHype(topHypeIds.map(([id, v]) => ({ ...v, talent: tMap.get(id) ?? { id, full_name: "Unknown" } })));
    setTopConn(topConnIds.map(([id, v]) => ({ ...v, talent: tMap.get(id) ?? { id, full_name: "Unknown" } })));
    setBoosts(((boostsActive.data ?? []) as any[]).map((b: any) => ({ ...b, talent: tMap.get(b.talent_id) })));

    // Pending requests overview
    const { data: pendList } = await supabase
      .from("talent_connections")
      .select("id, sender_talent_id, recipient_talent_id, fee_paid, expires_at, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);
    const pIds = Array.from(new Set((pendList ?? []).flatMap((r: any) => [r.sender_talent_id, r.recipient_talent_id])));
    const { data: pNames } = pIds.length
      ? await supabase.from("talents").select("id, full_name").in("id", pIds)
      : { data: [] as any[] };
    const pMap = new Map((pNames ?? []).map((t: any) => [t.id, t.full_name]));
    setPending(
      (pendList ?? []).map((r: any) => ({
        ...r,
        sender_name: pMap.get(r.sender_talent_id),
        recipient_name: pMap.get(r.recipient_talent_id),
      })),
    );

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const sweep = async () => {
    const { data, error } = await supabase.rpc("sweep_expired_connections");
    if (error) toast({ title: "Sweep failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Sweep complete", description: `${data ?? 0} expired requests refunded.` });
      load();
    }
  };

  const filteredPending = pending.filter(
    (p) =>
      !search.trim() ||
      (p.sender_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.recipient_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Creator Economy</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Hype, connections & boost activity telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={sweep}
            className="rounded-xl h-12 border-2 px-6 font-bold uppercase text-[10px] tracking-wider"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Sweep Expired
          </Button>
          <Button variant="outline" size="icon" onClick={load} className="rounded-xl h-12 w-12 border-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Total Hypes"
          value={stats?.hypes_total ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Hype Rev (30d)"
          value={stats?.hype_revenue_30d?.toFixed(1) ?? "0"}
          loading={loading}
          suffix="CR"
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-blue-500" />}
          label="Pending Conns"
          value={stats?.conn_pending ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label="Accepted Conns"
          value={stats?.conn_accepted ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Conn Rev (30d)"
          value={stats?.conn_revenue_30d?.toFixed(1) ?? "0"}
          loading={loading}
          suffix="CR"
        />
        <StatCard
          icon={<Rocket className="h-4 w-4 text-purple-500" />}
          label="Active Boosts"
          value={stats?.active_boosts ?? 0}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="leaders">
        <TabsList className="bg-muted/30 border-2 border-border/40 p-1 h-auto rounded-2xl mb-6">
          <TabsTrigger
            value="leaders"
            className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Top Earners
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Pending Requests
          </TabsTrigger>
          <TabsTrigger
            value="boosts"
            className="rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            Active Boosts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaders" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-500" />
              <CardHeader className="p-6 pb-2 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-black uppercase tracking-tighter italic flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" /> Top Hyped Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  ) : topHype.length === 0 ? (
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 text-center py-8">
                      No data yet
                    </p>
                  ) : (
                    topHype.map((row: any, i: number) => (
                      <LeaderRow
                        key={i}
                        rank={i + 1}
                        talent={row.talent}
                        primary={`${row.count} hypes`}
                        secondary={`+${row.earned.toFixed(1)} CR`}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-blue-500" />
              <CardHeader className="p-6 pb-2 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-black uppercase tracking-tighter italic flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Top Connection Earners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  ) : topConn.length === 0 ? (
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 text-center py-8">
                      No data yet
                    </p>
                  ) : (
                    topConn.map((row: any, i: number) => (
                      <LeaderRow
                        key={i}
                        rank={i + 1}
                        talent={row.talent}
                        primary={`${row.count} accepted`}
                        secondary={`+${row.earned.toFixed(1)} CR`}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Input
            placeholder="Filter by talent name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm h-12 rounded-xl border-2"
          />
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden divide-y divide-border/20">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : filteredPending.length === 0 ? (
              <p className="p-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                No pending requests.
              </p>
            ) : (
              filteredPending.map((p) => {
                const expSoon = new Date(p.expires_at).getTime() - Date.now() < 24 * 3600 * 1000;
                return (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        <span className="font-bold">{p.sender_name}</span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-bold">{p.recipient_name}</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                        {p.fee_paid} CR escrowed · Expires {new Date(p.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    {expSoon && (
                      <Badge variant="destructive" className="gap-1 rounded-sm">
                        <AlertTriangle className="h-3 w-3" />
                        Expiring
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </TabsContent>

        <TabsContent value="boosts">
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden divide-y divide-border/20">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : boosts.length === 0 ? (
              <p className="p-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                No active boosts.
              </p>
            ) : (
              boosts.map((b: any) => (
                <div key={b.talent_id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                  <Avatar className="h-10 w-10 border-2 border-purple-500/20">
                    <AvatarImage src={b.talent?.profile_photo_url ?? undefined} />
                    <AvatarFallback className="bg-purple-500/10 text-purple-500 font-bold">
                      {b.talent?.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-sm">{b.talent?.full_name ?? "Unknown"}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Ends {new Date(b.boost_until).toLocaleString()}
                    </div>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20 rounded-sm gap-1">
                    <Rocket className="h-3 w-3" /> Active
                  </Badge>
                </div>
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
  suffix?: string;
}) {
  return (
    <Card className="rounded-[24px] border-2 border-border/40 bg-card/20 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">{icon}</div>
      <div className="p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic z-10">
          {label}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-black italic tracking-tighter leading-none z-10">
            {value}
            {suffix && <span className="text-sm text-primary ml-1">{suffix}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

function LeaderRow({
  rank,
  talent,
  primary,
  secondary,
}: {
  rank: number;
  talent: any;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
      <span className="text-[10px] font-black text-muted-foreground/40 w-6">#{rank}</span>
      <Avatar className="h-8 w-8 border border-border/50">
        <AvatarImage src={talent?.profile_photo_url ?? undefined} />
        <AvatarFallback className="text-xs font-bold bg-primary/5 text-primary">
          {talent?.full_name?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate">{talent?.full_name ?? "Unknown"}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{primary}</div>
      </div>
      <Badge variant="outline" className="text-[9px] font-black tracking-widest border-2">
        {secondary}
      </Badge>
    </div>
  );
}
