import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SchoolRow {
  school_id: string;
  school_name: string;
  total_courses: number;
  ready_courses: number;
  pct: number;
}

export function ContentReadinessBoard() {
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("school_readiness_v" as any)
        .select("school_id, school_name, total_courses, ready_courses, pct")
        .order("pct", { ascending: false });
      if (!error && data) setRows(data as any);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">School readiness</h2>
        <p className="text-xs text-muted-foreground">A school becomes public only when all its courses reach 100% ready.</p>
      </div>
      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No schools yet.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <Card key={r.school_id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{r.school_name}</p>
                <Badge variant={r.pct >= 100 ? "default" : "secondary"}>
                  {r.ready_courses}/{r.total_courses}
                </Badge>
              </div>
              <Progress value={Number(r.pct) || 0} />
              <p className="text-[11px] text-muted-foreground">{Math.round(Number(r.pct) || 0)}% ready</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentReadinessBoard;
