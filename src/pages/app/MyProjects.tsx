import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";

export default function MyProjects() {
  const { talent } = useTalent();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      const { data } = await supabase.rpc("get_talent_project_workload", { _talent_id: talent.id });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, [talent?.id]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="p-3 space-y-2">
      <h1 className="text-lg font-semibold">My Projects</h1>
      <p className="text-xs text-muted-foreground">Milestones you have been awarded across managed projects.</p>
      {items.length === 0 && <Card className="p-6 text-sm text-center text-muted-foreground">No project milestones yet.</Card>}
      {items.map((it: any, idx: number) => (
        <Link key={idx} to={`/app/projects/${it.project.id}`} className="block">
          <Card className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{it.project.title}</div>
              <Badge variant="outline" className="capitalize">{it.milestone.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{it.milestone.title}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{it.milestone.budget_credits} cr</span>
              <span>·</span>
              <span>{it.split_pct}% share</span>
              {it.milestone.due_at && <><span>·</span><span>due {new Date(it.milestone.due_at).toLocaleDateString()}</span></>}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
