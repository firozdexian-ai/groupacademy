/**
 * Admin → Learn → B2B Engagements
 * Cross-company view of sponsored learning assignments.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

export function LearningB2BEngagementsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-b2b-engagements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_course_assignments")
        .select(
          "id, status, due_at, completed_at, budget_credits, created_at, company:company_id(id,name), content:content_id(id,title), assigned_to",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totals = (data ?? []).reduce(
    (acc, r: any) => {
      acc.total++;
      acc.budget += Number(r.budget_credits ?? 0);
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, budget: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">B2B Engagements</h2>
          <p className="text-xs text-muted-foreground">
            Sponsored course assignments across all companies.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Stat label="Total" value={totals.total} />
        <Stat label="Active" value={totals.active ?? 0} />
        <Stat label="Completed" value={totals.completed ?? 0} />
        <Stat label="Overdue" value={totals.overdue ?? 0} />
        <Stat label="Credits committed" value={totals.budget} />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs">
            <tr>
              <th className="text-left px-3 py-2">Company</th>
              <th className="text-left px-3 py-2">Course</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Due</th>
              <th className="text-left px-3 py-2">Credits</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No engagements yet.
                </td>
              </tr>
            ) : (
              data!.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.company?.name ?? "—"}</td>
                  <td className="px-3 py-2">{r.content?.title ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.due_at ? new Date(r.due_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{r.budget_credits ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

export default LearningB2BEngagementsTab;
