import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SimpleAdminRegistry } from "@/components/dashboard/common/SimpleAdminRegistry";

function ReadOnlyDistinct({ table, column, title, description }: {
  table: string; column: string; title: string; description: string;
}) {
  const q = useQuery({
    queryKey: ["distinct", table, column],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as any).select(column).not(column, "is", null).limit(2000);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data as any[]) ?? []) {
        const v = (row as any)[column];
        if (!v) continue;
        counts[v] = (counts[v] ?? 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    },
  });
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-1.5">
          {(q.data ?? []).slice(0, 200).map(([name, n]) => (
            <Card key={name} className="p-2 px-3 flex items-center justify-between text-sm">
              <span className="truncate">{name}</span>
              <span className="text-xs text-muted-foreground">{n}</span>
            </Card>
          ))}
          {(q.data ?? []).length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">No data yet.</Card>
          )}
        </div>
      )}
    </div>
  );
}

export const GtmCountriesTab = () => (
  <ReadOnlyDistinct
    table="talents" column="country"
    title="Countries"
    description="Distinct countries from the talent pool, ranked by talent count."
  />
);

function ComingSoonTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Coming soon — will populate once `state` / `city` are captured on talents and companies.
      </Card>
    </div>
  );
}

export const GtmStatesTab = () => (
  <ComingSoonTab
    title="States / Regions / Divisions"
    description="Sub-country administrative areas. Used for regional GTM targeting."
  />
);

export const GtmCitiesTab = () => (
  <ComingSoonTab
    title="Cities"
    description="City-level GTM view aggregated from talents, companies and jobs."
  />
);

export const GtmClustersTab = () => (
  <SimpleAdminRegistry
    table="gtm_clusters"
    title="Clusters"
    description='Custom geographic groupings (e.g. "Dhaka Metro", "GCC region"). Used for targeting and reporting.'
    fields={[
      { key: "name", label: "Cluster name", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ]}
  />
);
