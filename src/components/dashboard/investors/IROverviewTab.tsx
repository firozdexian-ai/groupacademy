import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Landmark, TrendingUp, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function IROverviewTab() {
  const [stats, setStats] = useState({ vcs: 0, investors: 0, influencers: 0, outreach30: 0, mrrTarget: 0 });

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const sb = supabase as any;
      const [vc, inv, infl, out, target] = await Promise.all([
        sb.from("vc_firms").select("*", { count: "exact", head: true }),
        sb.from("investors").select("*", { count: "exact", head: true }),
        sb.from("ir_influencers").select("*", { count: "exact", head: true }),
        sb.from("ir_outreach_log").select("*", { count: "exact", head: true }).gte("created_at", since),
        sb.from("ir_mrr_targets").select("target_mrr_usd").order("target_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setStats({
        vcs: vc.count || 0,
        investors: inv.count || 0,
        influencers: infl.count || 0,
        outreach30: out.count || 0,
        mrrTarget: (target.data as any)?.target_mrr_usd || 0,
      });
    })();
  }, []);

  const cards = [
    { label: "VC Firms", value: stats.vcs, icon: Landmark },
    { label: "Investors", value: stats.investors, icon: Users },
    { label: "Key Influencers", value: stats.influencers, icon: Users },
    { label: "Outreach (30d)", value: stats.outreach30, icon: Mail },
    { label: "Latest MRR Target", value: `$${stats.mrrTarget.toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Landmark className="h-8 w-8 text-primary" />
          Investor Relations Overview
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
          High-Value Stakeholder Pulse
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <c.icon className="h-4 w-4" /> {c.label}
            </div>
            <div className="text-3xl font-black mt-2">{c.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
