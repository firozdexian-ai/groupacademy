/**
 * Admin Learn → Cohorts tab. Lists cohorts with capacity utilization and attendance rate.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar } from "lucide-react";

export default function CohortsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cohorts")
        .select("id,name,status,starts_on,ends_on,capacity,is_self_paced,content:content_id(id,title)")
        .order("created_at", { ascending: false })
        .limit(100);
      const enriched = await Promise.all((data ?? []).map(async (c: any) => {
        const { data: h } = await supabase.rpc("cohort_health", { _cohort_id: c.id });
        return { ...c, health: Array.isArray(h) ? h[0] : h };
      }));
      setRows(enriched); setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">Cohorts ({rows.length})</h2>
      {rows.length === 0 ? <Card className="p-4 text-xs text-muted-foreground">No cohorts yet.</Card> :
        rows.map((c) => (
          <Card key={c.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.content?.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                  {c.is_self_paced && <Badge variant="secondary" className="text-[10px]">self-paced</Badge>}
                  <Badge variant="outline" className="text-[10px]"><Calendar className="h-3 w-3 mr-0.5" />{c.starts_on ?? "—"}</Badge>
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground shrink-0">
                <div className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{c.health?.enrollment_count ?? 0}{c.capacity ? `/${c.capacity}` : ""}</div>
                <div className="text-emerald-600 font-medium">{c.health?.attendance_rate ?? 0}% att.</div>
                <div>{c.health?.upcoming_sessions ?? 0} upcoming</div>
              </div>
            </div>
          </Card>
        ))
      }
    </div>
  );
}
