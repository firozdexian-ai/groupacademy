import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * Hype Earnings card — shows how much a creator has earned from hypes received.
 * Drop into wallet/withdrawals page.
 */
export function HypeEarningsCard() {
  const { talent } = useTalent();
  const [stats, setStats] = useState({ total: 0, last30: 0, count: 0 });

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [{ data: all }, { data: recent }] = await Promise.all([
        supabase.from("post_hypes").select("creator_share").eq("recipient_talent_id", talent.id),
        supabase.from("post_hypes").select("creator_share").eq("recipient_talent_id", talent.id).gte("created_at", since),
      ]);
      const total = (all ?? []).reduce((s: number, r: any) => s + Number(r.creator_share ?? 0), 0);
      const last30 = (recent ?? []).reduce((s: number, r: any) => s + Number(r.creator_share ?? 0), 0);
      setStats({ total, last30, count: all?.length ?? 0 });
    })();
  }, [talent?.id]);

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-orange-200">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold">Hype Earnings</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold">{stats.total.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Total credits</div>
        </div>
        <div>
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            {stats.last30.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Last 30d</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.count}</div>
          <div className="text-xs text-muted-foreground">Hypes received</div>
        </div>
      </div>
    </Card>
  );
}
