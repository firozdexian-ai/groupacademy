import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, TrendingUp, Users, Mail, Handshake, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function IROverviewTab() {
  const [stats, setStats] = useState({ vcs: 0, investors: 0, influencers: 0, outreach30: 0, mrrTarget: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const sb = supabase as any;
        const [vc, inv, infl, out, target] = await Promise.all([
          sb.from("vc_firms").select("*", { count: "exact", head: true }),
          sb.from("investors").select("*", { count: "exact", head: true }),
          sb.from("ir_influencers").select("*", { count: "exact", head: true }),
          sb.from("ir_outreach_log").select("*", { count: "exact", head: true }).gte("created_at", since),
          sb
            .from("ir_mrr_targets")
            .select("target_mrr_usd")
            .order("target_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        setStats({
          vcs: vc.count || 0,
          investors: inv.count || 0,
          influencers: infl.count || 0,
          outreach30: out.count || 0,
          mrrTarget: (target.data as any)?.target_mrr_usd || 0,
        });
      } catch (error) {
        console.error("Failed to fetch IR metrics", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "VC Firms", value: stats.vcs, icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Investors", value: stats.investors, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    {
      label: "Key Influencers",
      value: stats.influencers,
      icon: Handshake,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    { label: "Outreach (30d)", value: stats.outreach30, icon: Mail, color: "text-sky-500", bg: "bg-sky-500/10" },
    {
      label: "Latest MRR Target",
      value: `$${stats.mrrTarget.toLocaleString()}`,
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-32 w-full rounded-[40px] bg-muted/40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Landmark className="h-8 w-8 text-emerald-500 fill-emerald-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Investor Relations</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            High-Value Stakeholder Pulse · Capital Networks
          </p>
        </div>
      </header>

      {/* Telemetry HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((c) => (
          <Card
            key={c.label}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex flex-col gap-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  c.bg,
                  "border-white/5",
                )}
              >
                <c.icon className={cn("h-6 w-6", c.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 truncate">
                  {c.label}
                </p>
                <p className="text-2xl font-black tracking-tighter italic leading-none truncate">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
