import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { School, Handshake, Users, Calendar } from "lucide-react";

export default function InstitutionsOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["inst-overview-counts"],
    queryFn: async () => {
      const [insts, partners, reps, events] = await Promise.all([
        supabase.from("institutions").select("id", { count: "exact", head: true }),
        supabase.from("partner_organizations").select("id", { count: "exact", head: true }),
        supabase.from("institution_representatives" as any).select("id", { count: "exact", head: true }),
        supabase.from("institution_events" as any).select("id", { count: "exact", head: true }),
      ]);
      return {
        institutions: insts.count ?? 0,
        partners: partners.count ?? 0,
        reps: reps.count ?? 0,
        events: events.count ?? 0,
      };
    },
  });

  const tiles = [
    { label: "Institutions", value: data?.institutions ?? 0, icon: School, accent: "text-primary" },
    { label: "Partner Orgs", value: data?.partners ?? 0, icon: Handshake, accent: "text-emerald-500" },
    { label: "Representatives", value: data?.reps ?? 0, icon: Users, accent: "text-blue-500" },
    { label: "Events & Competitions", value: data?.events ?? 0, icon: Calendar, accent: "text-amber-500" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Institutions & Organizations</h2>
        <p className="text-sm text-muted-foreground">
          High-value education and partner organization relationships.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <t.icon className={`h-5 w-5 ${t.accent}`} />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "…" : t.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
