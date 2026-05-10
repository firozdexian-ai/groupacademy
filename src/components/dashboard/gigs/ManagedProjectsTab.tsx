import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ManagedProjectsTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("gig_projects")
        .select("*, gig_escrow_accounts(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      setProjects(p || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="space-y-2">
      {projects.length === 0 && <Card className="p-6 text-sm text-center text-muted-foreground">No projects yet.</Card>}
      {projects.map((p) => {
        const e = p.gig_escrow_accounts?.[0] || p.gig_escrow_accounts;
        return (
          <Card key={p.id} className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{p.title}</div>
              <Badge variant="outline" className="capitalize">{p.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Budget {p.budget_credits} · Bal {e?.balance_credits ?? 0} · Held {e?.held_credits ?? 0} · Released {e?.released_credits ?? 0} · Refunded {e?.refunded_credits ?? 0}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
