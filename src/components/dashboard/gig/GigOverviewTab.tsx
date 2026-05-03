import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function GigOverviewTab() {
  const { data } = useQuery({
    queryKey: ["gig-overview"],
    queryFn: async () => {
      const [g, s, w] = await Promise.all([
        supabase.from("gigs").select("id", { count: "exact", head: true }),
        supabase.from("gig_submissions").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("id", { count: "exact", head: true }),
      ]);
      return { gigs: g.count ?? 0, subs: s.count ?? 0, w: w.count ?? 0 };
    },
  });
  const stats = [
    { label: "Total Gigs", value: data?.gigs ?? "—" },
    { label: "Submissions", value: data?.subs ?? "—" },
    { label: "Withdrawal Requests", value: data?.w ?? "—" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Gig Economy — Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Health of the platform's micro-earning system.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
