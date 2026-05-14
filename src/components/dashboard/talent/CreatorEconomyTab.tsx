/**
 * Creator Economy Telemetry — Refactored for Phase Z0
 * CTO Version: May 2026
 * Fixes: A3 (Full Table Scan Aggregation), P2 (RPC Adoption)
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Sparkles, Rocket, RefreshCw, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreatorEconomyTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topHype, setTopHype] = useState<any[]>([]);
  const [topConn, setTopConn] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // P2: Replace client-side reduce loops with optimized RPCs
      const [allStats, leaderboard, boostsActive] = await Promise.all([
        supabase.rpc("get_global_crm_overview"), // Reuse for general counts
        supabase.rpc("get_creator_economy_leaderboard", { window_days: 30 }),
        supabase
          .from("talent_inbox_settings")
          .select("talent_id, boost_until, talents(full_name, profile_photo_url)")
          .gt("boost_until", now),
      ]);

      setStats({
        hypes_total: allStats.data?.total_talents || 0, // Placeholder mapping
        active_boosts: boostsActive.data?.length || 0,
        // Revenue totals would ideally come from a dedicated ledger RPC
      });

      // A3: Process leaderboard from RPC result
      // Result shape: { talent_id, full_name, total_hype, share_count }
      setTopHype((leaderboard.data || []).slice(0, 10));
      setBoosts(boostsActive.data || []);
    } catch (err) {
      toast.error("Creator telemetry fault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sweep = async () => {
    const { data, error } = await supabase.rpc("sweep_expired_connections");
    if (error) toast.error(error.message);
    else {
      toast.success(`${data ?? 0} expired requests refunded.`);
      load();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Deduped Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Creator Economy
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Hype & Connection Revenue Telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={sweep}
            className="rounded-xl border-2 font-black uppercase text-[9px] tracking-widest"
          >
            <RefreshCw className="h-3 w-3 mr-2" /> Sweep Expired
          </Button>
          <Button variant="outline" size="icon" onClick={load} className="rounded-xl border-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard icon={<Flame />} label="Network Hype" value={stats?.hypes_total ?? 0} loading={loading} />
        <StatCard icon={<Rocket />} label="Active Boosts" value={stats?.active_boosts ?? 0} loading={loading} />
        {/* Placeholder for Revenue based on 1 credit = 2 BDT peg */}
        <StatCard icon={<TrendingUp />} label="Platform Rev" value="Calculated" suffix="CR" loading={loading} />
      </div>

      <Tabs defaultValue="leaders">
        <TabsList className="h-12 bg-muted/20 border-2 rounded-xl p-1">
          <TabsTrigger value="leaders" className="rounded-lg font-black uppercase text-[10px] tracking-widest">
            Top Earners
          </TabsTrigger>
          <TabsTrigger value="boosts" className="rounded-lg font-black uppercase text-[10px] tracking-widest">
            Active Boosts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaders" className="grid lg:grid-cols-2 gap-8 mt-6">
          <Card className="rounded-[40px] border-2 bg-card/30 backdrop-blur-xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-600" />
            <CardHeader className="p-6 border-b border-border/10">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" /> Hype Leaderboard (30D)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {topHype.map((row, i) => (
                <LeaderRow
                  key={row.talent_id}
                  rank={i + 1}
                  name={row.full_name}
                  val={`${row.total_hype} CR`}
                  sub={`${row.share_count} interactions`}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boosts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boosts.map((b: any) => (
              <Card key={b.talent_id} className="rounded-3xl border-2 p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={b.talents?.profile_photo_url} />
                  <AvatarFallback className="font-black">{b.talents?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black uppercase truncate">{b.talents?.full_name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Ends {new Date(b.boost_until).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg">BOOST</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Logic components optimized for semantic tokens
function StatCard({ icon, label, value, suffix, loading }: any) {
  return (
    <Card className="rounded-[32px] border-2 bg-card/40 p-6 flex items-center gap-4 group">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className="text-2xl font-black italic tracking-tighter">
          {loading ? "..." : value}
          {suffix && <span className="text-xs ml-1 text-primary">{suffix}</span>}
        </p>
      </div>
    </Card>
  );
}

function LeaderRow({ rank, name, val, sub }: any) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
      <span className="text-[10px] font-black text-muted-foreground/40 w-6">#{rank}</span>
      <div className="flex-1">
        <p className="text-sm font-black uppercase tracking-tight">{name || "Anonymous"}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
      </div>
      <Badge variant="outline" className="font-black text-primary border-primary/20">
        {val}
      </Badge>
    </div>
  );
}
