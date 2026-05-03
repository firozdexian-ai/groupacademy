import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Layers, Network, Coins, Target } from "lucide-react";

export default function HrOverviewTab() {
  const counts = useQuery({
    queryKey: ["hr-overview-counts"],
    queryFn: async () => {
      const tables = ["hr_grades", "hr_verticals", "hr_functions", "hr_teams", "hr_targets", "hr_payroll_runs"] as const;
      const out: Record<string, number> = {};
      for (const t of tables) {
        const { count } = await supabase.from(t as any).select("*", { count: "exact", head: true });
        out[t] = count ?? 0;
      }
      const { count: workforceCount } = await supabase
        .from("workforce_members" as any).select("*", { count: "exact", head: true });
      out["workforce_members"] = workforceCount ?? 0;
      return out;
    },
  });

  const c = counts.data ?? {};
  const tiles = [
    { label: "Workforce", value: c.workforce_members ?? 0, icon: Users },
    { label: "Grades", value: c.hr_grades ?? 0, icon: Layers },
    { label: "Verticals", value: c.hr_verticals ?? 0, icon: Network },
    { label: "Functions", value: c.hr_functions ?? 0, icon: Network },
    { label: "Teams", value: c.hr_teams ?? 0, icon: Users },
    { label: "Targets", value: c.hr_targets ?? 0, icon: Target },
    { label: "Payroll runs", value: c.hr_payroll_runs ?? 0, icon: Coins },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Team & Workforce</h2>
        <p className="text-sm text-muted-foreground">
          Org structure, targets, onboarding & payroll. Conversational HR agents (CHRO, Onboarding, Recruiter) live in the Agentic Dashboard.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 flex items-center gap-3">
            <t.icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="text-xl font-bold">{t.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
