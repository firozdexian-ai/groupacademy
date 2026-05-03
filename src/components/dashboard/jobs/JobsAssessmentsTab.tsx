import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JobsAssessmentsTab() {
  const list = useQuery({
    queryKey: ["job-assessments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_assessment_results" as any)
        .select("id,job_id,user_id,score,status,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return [];
      return (data ?? []) as any[];
    },
  });
  const rows = list.data ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jobs Assessments</h2>
        <p className="text-sm text-muted-foreground">
          Recent assessment attempts per job. Detailed authoring tools live under each job in the Jobs Manager.
        </p>
      </div>
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No assessment attempts yet.</Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium truncate">Job {String(r.job_id ?? "").slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">User {String(r.user_id ?? "").slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{r.status ?? "—"}</Badge>
                <span className="text-sm font-bold">{r.score ?? 0}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
