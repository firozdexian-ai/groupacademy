import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function AbroadOverviewTab() {
  const { data } = useQuery({
    queryKey: ["abroad-overview"],
    queryFn: async () => {
      const [p, l] = await Promise.all([
        supabase.from("study_abroad_programs").select("id", { count: "exact", head: true }),
        supabase.from("study_abroad_roadmap_leads").select("id", { count: "exact", head: true }),
      ]);
      return { programs: p.count ?? 0, leads: l.count ?? 0 };
    },
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Career Abroad — Dashboard</h2>
        <p className="text-sm text-muted-foreground">University programs, IELTS prep and roadmap leads.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">University Programs</p>
          <p className="text-2xl font-semibold mt-1">{data?.programs ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Roadmap Leads</p>
          <p className="text-2xl font-semibold mt-1">{data?.leads ?? "—"}</p>
        </Card>
      </div>
    </div>
  );
}
