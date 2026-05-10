/**
 * Admin: Contact Unlocks ledger
 * Shows who unlocked which talent and when, across all companies.
 */
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Lock, TrendingUp, Coins, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
      if (error) {
        setLoading(false);
        return;
      }

      const companyIds = Array.from(new Set((data ?? []).map((r: any) => r.company_id).filter(Boolean)));
      const userIds = Array.from(new Set((data ?? []).map((r: any) => r.unlocked_by).filter(Boolean)));

      const [{ data: comps }, { data: tls }] = await Promise.all([
        companyIds.length
          ? supabase
              .from("companies")
              .select("id, name")
              .in("id", companyIds as string[])
          : Promise.resolve({ data: [] as any[] }),
        userIds.length
          ? supabase
              .from("talents")
              .select("user_id, email")
              .in("user_id", userIds as string[])
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const companyMap: Record<string, string> = Object.fromEntries((comps ?? []).map((c: any) => [c.id, c.name]));
      const emailMap: Record<string, string> = Object.fromEntries((tls ?? []).map((t: any) => [t.user_id, t.email]));

      const enriched: UnlockRow[] = (data ?? []).map((r: any) => ({
        ...r,
        company_name: companyMap[r.company_id] ?? r.company_id?.slice(0, 8),
        unlocker_email: r.unlocked_by ? (emailMap[r.unlocked_by] ?? r.unlocked_by.slice(0, 8)) : "—",
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
    return () => {
      cancelled = true;
    };
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Lock className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Contact Unlocks</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Audit log of paid contact reveals · Company ledger
          </p>
        </div>
      </header>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Unlocks", val: stats.total, icon: KeyRound, color: "text-primary", bg: "bg-primary/10" },
          {
            label: "Credits Earned",
            val: stats.credits.toLocaleString(),
            icon: Coins,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          { label: "Last 7 Days", val: stats.last7, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-7 w-7", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ledger Table */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-blue-500" />

        <div className="p-6 border-b border-border/10 bg-muted/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-11 h-12 rounded-xl border-2 bg-background/50 font-medium text-xs"
              placeholder="Search by company, talent, or unlocker email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic text-right shrink-0">
            Reuses by teammates are free & excluded
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Syncing Ledger...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 m-6 rounded-3xl">
              <Lock className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                No unlocks recorded yet.
              </div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b-2 border-border/20">
                <tr>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Company Entity
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Authorized By
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Talent Target
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Contact Exposed
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                    Burn Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {format(new Date(r.created_at), "MMM d · HH:mm")}
                    </td>
                    <td className="px-6 py-4 font-black italic text-sm group-hover:text-primary transition-colors">
                      {r.company_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-muted/50 px-2 py-1 rounded-md text-[10px] font-mono border border-border/50">
                        {r.unlocker_email}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-foreground/80">
                      {r.full_name ?? r.talent_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-muted-foreground">
                      {r.email && <div className="truncate max-w-[200px] text-foreground/70">{r.email}</div>}
                      {r.phone && <div>{r.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest border-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                      >
                        −{Number(r.credits_spent).toLocaleString()} CR
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ContactUnlocksTab;
