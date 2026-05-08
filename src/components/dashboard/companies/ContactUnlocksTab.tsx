/**
 * Admin: Contact Unlocks ledger
 * Shows who unlocked which talent and when, across all companies.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Lock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UnlockRow {
  id: string;
  company_id: string;
  talent_id: string;
  credits_spent: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  unlocked_by: string | null;
  company_name?: string;
  unlocker_email?: string;
}

export function ContactUnlocksTab() {
  const [rows, setRows] = useState<UnlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stats, setStats] = useState({ total: 0, credits: 0, last7: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("talent_contact_unlocks")
        .select("id, company_id, talent_id, credits_spent, full_name, email, phone, created_at, unlocked_by")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) { setLoading(false); return; }

      const companyIds = Array.from(new Set((data ?? []).map((r: any) => r.company_id).filter(Boolean)));
      const userIds = Array.from(new Set((data ?? []).map((r: any) => r.unlocked_by).filter(Boolean)));

      const [{ data: comps }, { data: tls }] = await Promise.all([
        companyIds.length
          ? supabase.from("companies").select("id, name").in("id", companyIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase.from("talents").select("user_id, email").in("user_id", userIds as string[])
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const companyMap: Record<string, string> = Object.fromEntries((comps ?? []).map((c: any) => [c.id, c.name]));
      const emailMap: Record<string, string> = Object.fromEntries((tls ?? []).map((t: any) => [t.user_id, t.email]));

      const enriched: UnlockRow[] = (data ?? []).map((r: any) => ({
        ...r,
        company_name: companyMap[r.company_id] ?? r.company_id?.slice(0, 8),
        unlocker_email: r.unlocked_by ? emailMap[r.unlocked_by] ?? r.unlocked_by.slice(0, 8) : "—",
      }));

      const sevenDaysAgo = Date.now() - 7 * 86400_000;
      setRows(enriched);
      setStats({
        total: enriched.length,
        credits: enriched.reduce((s, r) => s + Number(r.credits_spent || 0), 0),
        last7: enriched.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      (r.company_name ?? "").toLowerCase().includes(t) ||
      (r.full_name ?? "").toLowerCase().includes(t) ||
      (r.unlocker_email ?? "").toLowerCase().includes(t) ||
      (r.email ?? "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-5 w-5" /> Contact Unlocks
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Audit log of every paid contact unlock across all companies. Reuses by teammates are not charged and not shown here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total unlocks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Credits earned</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.credits.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Last 7 days</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.last7}</p></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by company, talent, or unlocker email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">No unlocks yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">When</th>
                  <th className="text-left px-3 py-2">Company</th>
                  <th className="text-left px-3 py-2">Unlocked by</th>
                  <th className="text-left px-3 py-2">Talent</th>
                  <th className="text-left px-3 py-2">Contact</th>
                  <th className="text-right px-3 py-2">Credits</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, HH:mm")}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.company_name}</td>
                    <td className="px-3 py-2 text-xs">{r.unlocker_email}</td>
                    <td className="px-3 py-2">{r.full_name ?? r.talent_id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.email && <div className="truncate max-w-[200px]">{r.email}</div>}
                      {r.phone && <div>{r.phone}</div>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant="secondary">−{Number(r.credits_spent).toLocaleString()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ContactUnlocksTab;
