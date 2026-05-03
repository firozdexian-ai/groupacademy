import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Briefcase, ClipboardList, FileCheck, Users } from "lucide-react";

export default function JobsOverviewTab() {
  const counts = useQuery({
    queryKey: ["jobs-overview-counts"],
    queryFn: async () => {
      const out: Record<string, number> = {};
      const { count: jobs } = await supabase.from("jobs" as any).select("*", { count: "exact", head: true });
      out["jobs"] = jobs ?? 0;
      const { count: pending } = await supabase
        .from("jobs" as any).select("*", { count: "exact", head: true }).eq("is_active", false);
      out["pending"] = pending ?? 0;
      const { count: apps } = await supabase
        .from("job_applications" as any).select("*", { count: "exact", head: true });
      out["applications"] = apps ?? 0;
      return out;
    },
  });
  const c = counts.data ?? {};
  const tiles = [
    { label: "Total jobs", value: c.jobs ?? 0, icon: Briefcase },
    { label: "Pending approval", value: c.pending ?? 0, icon: ClipboardList },
    { label: "Applications", value: c.applications ?? 0, icon: Users },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jobs Overview</h2>
        <p className="text-sm text-muted-foreground">
          End-to-end job pipeline: uploads, approvals, applications, assessments. Outreach to hiring managers happens in the chat.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
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
