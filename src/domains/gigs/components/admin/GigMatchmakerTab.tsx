import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp } from "lucide-react";

export function GigMatchmakerTab() {
  const { data: funnel, isLoading } = useQuery({
    queryKey: ["admin-matchmaker-funnel"],
    queryFn: async () => {
      const { data } = await supabase.from("gig_matches").select("status, gig_kind, score");
      const rows = (data || []) as any[];
      const totals: Record<string, number> = {};
      const avgScore: Record<string, { sum: number; n: number }> = {};
      rows.forEach(r => {
        totals[r.status] = (totals[r.status] || 0) + 1;
        const k = r.gig_kind;
        avgScore[k] = avgScore[k] || { sum: 0, n: 0 };
        avgScore[k].sum += Number(r.score);
        avgScore[k].n += 1;
      });
      return { totals, avgScore };
    },
  });

  const { data: digests } = useQuery({
    queryKey: ["admin-matchmaker-digests"],
    queryFn: async () => {
      const { count } = await supabase.from("gig_match_digests").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const order = ["offered", "viewed", "bid", "shortlisted", "won", "lost", "dismissed", "expired"];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Match funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {order.map(s => (
              <div key={s} className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground capitalize">{s}</div>
                <div className="text-2xl font-bold">{funnel?.totals?.[s] || 0}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Average score by kind</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(funnel?.avgScore || {}).map(([k, v]: any) => (
            <Badge key={k} variant="outline" className="text-sm">{k}: {(v.sum / v.n).toFixed(1)}</Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Digests sent</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{digests}</div></CardContent>
      </Card>
    </div>
  );
}
