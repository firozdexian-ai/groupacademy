import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const KNOWN_TYPES = [
  { key: "university", label: "Universities" },
  { key: "college", label: "Colleges" },
  { key: "school", label: "Schools" },
  { key: "training_partner", label: "Training Partners" },
  { key: "accelerator", label: "Accelerators" },
  { key: "other", label: "Other" },
];

export default function InstitutionTypesManager() {
  const { data, isLoading } = useQuery({
    queryKey: ["institutions-by-type"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id,type");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        counts[r.type ?? "other"] = (counts[r.type ?? "other"] ?? 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Institution Types</h2>
        <p className="text-sm text-muted-foreground">
          Taxonomy of education and training organizations tracked on the platform.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {KNOWN_TYPES.map((t) => (
          <Card key={t.key} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.label}</p>
              <Badge variant="secondary">{isLoading ? "…" : data?.[t.key] ?? 0}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">type: {t.key}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Add new institutions via the Institutions registry under the existing Stakeholders area; types are picked from this list.
      </p>
    </div>
  );
}
