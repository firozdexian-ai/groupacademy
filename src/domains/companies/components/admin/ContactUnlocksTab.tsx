/**
 * Contact Unlocks Ledger — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: A7 (Server-side KPI Aggregation), R1 (Missing Button Import)
 * Restored: Artifact Trace (Email/Phone) for Audit Visibility
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // R1 Fix: Critical import restored
import { Loader2, Search, Lock, TrendingUp, Coins, KeyRound, RefreshCw, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listRecentContactUnlocks,
  listCompaniesByIds,
  listTalentEmailsByUserIds,
} from "@/domains/companies/repo/companiesRepo";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ContactUnlocksTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total_unlocks: 0, total_credits: 0, last_7d: 0 });

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      // A7 Fix: Fetch global aggregates server-side, bypassing the client 500-row limit
      const [statsRes, ledgerRows] = await Promise.all([
        supabase.rpc("get_contact_unlocks_summary"),
        listRecentContactUnlocks(500),
      ]);

      if (statsRes.data) setStats(statsRes.data as any);

      if (ledgerRows.length) {
        const companyIds = Array.from(new Set(ledgerRows.map((r: any) => r.company_id).filter(Boolean))) as string[];
        const userIds = Array.from(new Set(ledgerRows.map((r: any) => r.unlocked_by).filter(Boolean))) as string[];

        const [comps, users] = await Promise.all([
          listCompaniesByIds(companyIds),
          listTalentEmailsByUserIds(userIds),
        ]);

        const compMap = Object.fromEntries(comps.map((c) => [c.id, c.name]));
        const userMap = Object.fromEntries(users.map((u) => [u.user_id, u.email]));

        const enriched = ledgerRows.map((r: any) => ({
          ...r,
          company_name: compMap[r.company_id] || "Independent Entity",
          unlocker_email: r.unlocked_by ? userMap[r.unlocked_by] || "Internal Agent" : "—",
        }));

        setRows(enriched);
      }
    } catch (err) {
      toast.error("Ledger synchronization fault.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const filtered = rows.filter(
    (r) =>
      !searchQuery ||
      r.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.unlocker_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Action Bar */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-primary">
            <Lock className="h-6 w-6" /> Contact Ledger
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
            Institutional Audit Trail · Institutional Credit Burn
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadLedger} className="rounded-xl h-12 w-12 border-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Scalable KPI HUD powered by RPC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Lifetime Unlocks"
          value={stats.total_unlocks}
          icon={KeyRound}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Revenue Volume"
          value={`${stats.total_credits.toLocaleString()} CR`}
          icon={Coins}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Velocity (7D)"
          value={stats.last_7d}
          icon={TrendingUp}
          color="text-primary"
          bg="bg-primary/10"
        />
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-blue-500" />

        <div className="p-6 border-b border-border/10">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search employer, talent, or handle..."
              className="pl-12 h-12 rounded-xl border-2 bg-muted/10 font-bold text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/20 border-b-2">
              <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-6 py-6">Employer Node</th>
                <th className="px-6 py-6">Target Talent</th>
                <th className="px-6 py-6">Artifact Trace</th> {/** Restored Feature */}
                <th className="px-6 py-6 text-right pr-8">Burn Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-8 py-4 font-mono text-[10px] opacity-60">
                      {format(new Date(r.created_at), "MMM d · HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-sm uppercase italic group-hover:text-primary transition-colors">
                        {r.company_name}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                        {r.unlocker_email}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs uppercase tracking-tight">
                      {r.full_name || "Anonymous Node"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {r.email && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/70">
                            <Mail className="h-3 w-3 opacity-40" /> {r.email}
                          </div>
                        )}
                        {r.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/70">
                            <Phone className="h-3 w-3 opacity-40" /> {r.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                      <Badge
                        variant="outline"
                        className="font-black text-[10px] border-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                      >
                        −{r.credits_spent} CR
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group hover:border-primary/30 transition-all shadow-xl">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1">{label}</p>
          <p className="text-2xl font-black italic tracking-tighter text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}

export default ContactUnlocksTab;
