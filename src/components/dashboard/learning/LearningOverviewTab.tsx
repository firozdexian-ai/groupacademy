import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export function LearningOverviewTab() {
  const { data } = useQuery({
    queryKey: ["learn-overview"],
    queryFn: async () => {
      const [acad, sch, prof, enr] = await Promise.all([
        supabase.from("academies").select("id", { count: "exact", head: true }),
        supabase.from("schools").select("id", { count: "exact", head: true }),
        supabase.from("professional_lives").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
      ]);
      return {
        academies: acad.count ?? 0,
        schools: sch.count ?? 0,
        prof: prof.count ?? 0,
        enrollments: enr.count ?? 0,
      };
    },
  });
  const stats = [
    { label: "Academies", value: data?.academies ?? "—" },
    { label: "Schools", value: data?.schools ?? "—" },
    { label: "Professional Lives", value: data?.prof ?? "—" },
    { label: "Enrollments", value: data?.enrollments ?? "—" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Learn — Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot across academies, schools, courses and enrollments.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LearningOverviewTab;
