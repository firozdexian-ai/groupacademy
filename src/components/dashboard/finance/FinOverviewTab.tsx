import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function FinOverviewTab() {
  const { data } = useQuery({
    queryKey: ["fin-overview"],
    queryFn: async () => {
      const [t, w, i] = await Promise.all([
        supabase.from("credit_transactions").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
      ]);
      return { tx: t.count ?? 0, w: w.count ?? 0, i: i.count ?? 0 };
    },
  });
  const stats = [
    { label: "Transactions", value: data?.tx ?? "—" },
    { label: "Withdrawals", value: data?.w ?? "—" },
    { label: "Invoices", value: data?.i ?? "—" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Finance & Monetization — Dashboard</h2>
        <p className="text-sm text-muted-foreground">Money in, money out, in one screen.</p>
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
