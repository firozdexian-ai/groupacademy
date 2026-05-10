import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TALENT_REL_STAGES, type TalentRelStage } from "@/hooks/useTalentRelationships";

interface Row {
  id: string;
  company_id: string;
  stage: TalentRelStage;
  source: string | null;
  updated_at: string;
  talents: { full_name: string; profile_photo_url: string | null } | null;
  companies: { name: string } | null;
}

export function AdminSourcingPipeline() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("talent_relationships")
        .select(
          "id, company_id, stage, source, updated_at, talents(full_name, profile_photo_url), companies(name)",
        )
        .order("updated_at", { ascending: false })
        .limit(500);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Talent Pipeline (All Companies)</h1>
        <p className="text-sm text-muted-foreground">
          Read-only roll-up of talent relationships across companies.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {TALENT_REL_STAGES.map((s) => {
          const list = rows.filter((r) => r.stage === s.id);
          return (
            <div key={s.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{s.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {list.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {list.map((r) => (
                  <Card key={r.id} className="p-2 space-y-1">
                    <p className="text-sm font-medium truncate">
                      {r.talents?.full_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.companies?.name ?? "—"}
                    </p>
                    {r.source && (
                      <Badge variant="outline" className="text-[10px]">
                        {r.source}
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminSourcingPipeline;
