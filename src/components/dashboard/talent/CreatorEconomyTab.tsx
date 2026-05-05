import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Sparkles, Rocket, AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      supabase.from("talent_inbox_settings").select("talent_id, boost_until").gt("boost_until", new Date().toISOString()),
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
    const topHypeIds = Array.from(hypeAgg.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

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
    const topConnIds = Array.from(connAgg.entries()).sort((a, b) => b[1].earned - a[1].earned).slice(0, 10);

    const allIds = Array.from(new Set([...topHypeIds.map((x) => x[0]), ...topConnIds.map((x) => x[0]), ...(boostsActive.data ?? []).map((b: any) => b.talent_id)]));
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
    setPending((pendList ?? []).map((r: any) => ({
      ...r,
      sender_name: pMap.get(r.sender_talent_id),
      recipient_name: pMap.get(r.recipient_talent_id),
    })));

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

  const filteredPending = pending.filter((p) =>
    !search.trim() ||
    (p.sender_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.recipient_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Creator Economy
          </h2>
          <p className="text-xs text-muted-foreground">Hype, connections & boost activity across the platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sweep} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Sweep expired
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} label="Total Hypes" value={stats?.hypes_total ?? 0} loading={loading} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-green-500" />} label="Hype Rev (30d)" value={stats?.hype_revenue_30d?.toFixed(1) ?? "0"} loading={loading} suffix="cr" />
        <StatCard icon={<Sparkles className="h-4 w-4 text-primary" />} label="Pending Conns" value={stats?.conn_pending ?? 0} loading={loading} />
        <StatCard icon={<Sparkles className="h-4 w-4 text-primary" />} label="Accepted Conns" value={stats?.conn_accepted ?? 0} loading={loading} />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-green-500" />} label="Conn Rev (30d)" value={stats?.conn_revenue_30d?.toFixed(1) ?? "0"} loading={loading} suffix="cr" />
        <StatCard icon={<Rocket className="h-4 w-4 text-primary" />} label="Active Boosts" value={stats?.active_boosts ?? 0} loading={loading} />
      </div>

      <Tabs defaultValue="leaders">
        <TabsList>
          <TabsTrigger value="leaders">Top Earners</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="boosts">Active Boosts</TabsTrigger>
        </TabsList>

        <TabsContent value="leaders" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" />Top Hyped Creators</h3>
              <div className="space-y-2">
                {loading ? <Skeleton className="h-32 w-full" /> :
                  topHype.length === 0 ? <p className="text-xs text-muted-foreground">No data yet.</p> :
                  topHype.map((row: any, i: number) => (
                    <LeaderRow key={i} rank={i + 1} talent={row.talent} primary={`${row.count} hypes`} secondary={`+${row.earned.toFixed(1)} cr`} />
                  ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Top Connection Earners</h3>
              <div className="space-y-2">
                {loading ? <Skeleton className="h-32 w-full" /> :
                  topConn.length === 0 ? <p className="text-xs text-muted-foreground">No accepted connections yet.</p> :
                  topConn.map((row: any, i: number) => (
                    <LeaderRow key={i} rank={i + 1} talent={row.talent} primary={`${row.count} accepted`} secondary={`+${row.earned.toFixed(1)} cr`} />
                  ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          <Input placeholder="Filter by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Card className="divide-y">
            {loading ? <Skeleton className="h-32 w-full" /> :
              filteredPending.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No pending requests.</p> :
              filteredPending.map((p) => {
                const expSoon = new Date(p.expires_at).getTime() - Date.now() < 24 * 3600 * 1000;
                return (
                  <div key={p.id} className="p-3 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate"><strong>{p.sender_name}</strong> → <strong>{p.recipient_name}</strong></div>
                      <div className="text-xs text-muted-foreground">
                        {p.fee_paid} cr escrowed · expires {new Date(p.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    {expSoon && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Soon</Badge>}
                  </div>
                );
              })}
          </Card>
        </TabsContent>

        <TabsContent value="boosts" className="mt-4">
          <Card className="divide-y">
            {loading ? <Skeleton className="h-32 w-full" /> :
              boosts.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No active boosts.</p> :
              boosts.map((b: any) => (
                <div key={b.talent_id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={b.talent?.profile_photo_url ?? undefined} />
                    <AvatarFallback>{b.talent?.full_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{b.talent?.full_name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">Boost ends {new Date(b.boost_until).toLocaleString()}</div>
                  </div>
                  <Badge className="gap-1"><Rocket className="h-3 w-3" />Boosted</Badge>
                </div>
              ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, loading, suffix }: { icon: React.ReactNode; label: string; value: number | string; loading?: boolean; suffix?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      {loading ? <Skeleton className="h-6 w-16" /> : (
        <div className="text-xl font-bold">{value}{suffix && <span className="text-sm text-muted-foreground ml-0.5">{suffix}</span>}</div>
      )}
    </Card>
  );
}

function LeaderRow({ rank, talent, primary, secondary }: { rank: number; talent: any; primary: string; secondary: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-5">#{rank}</span>
      <Avatar className="h-7 w-7">
        <AvatarImage src={talent?.profile_photo_url ?? undefined} />
        <AvatarFallback className="text-xs">{talent?.full_name?.[0] ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{talent?.full_name ?? "Unknown"}</div>
        <div className="text-xs text-muted-foreground truncate">{primary}</div>
      </div>
      <Badge variant="secondary" className="text-xs">{secondary}</Badge>
    </div>
  );
}
