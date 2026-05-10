import { useFinOpsGraph } from "hooks/useFinOpsGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Coins,
  Wallet,
  Building2,
  Receipt,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Clock,
} from "lucide-react";

/**
 * Platform Logic: FinOps Command Center
 * 2026 Standard: Blended Phase 6 UI (Global Capital Telemetry)
 */

export function FinOverviewTab() {
  const { finOpsGraphQuery } = useFinOpsGraph();
  const { data, isLoading } = finOpsGraphQuery;

  // KPIs
  const totalTalentWallets = data?.talentWallets?.length || 0;
  const totalCompanyWallets = (data?.companyWallets?.length || 0) + (data?.gro10xWallets?.length || 0);
  const totalInvoices = data?.invoices?.length || 0;
  const pendingWithdrawals = data?.withdrawals?.filter((w) => w.status === "pending")?.length || 0;

  const latestInvoices = data?.invoices?.slice(0, 4) || [];
  const latestWithdrawals = data?.withdrawals?.slice(0, 4) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-indigo-500">
            <Coins className="h-8 w-8 text-indigo-500 fill-indigo-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              FinOps Command
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Capital Telemetry & Ledger Control
          </p>
        </div>
        <Badge
          variant="outline"
          className="h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest gap-2 border-indigo-500/50 text-indigo-600 bg-indigo-500/10 animate-pulse"
        >
          <Activity className="h-4 w-4" /> Ledgers Synced
        </Badge>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Talent Wallets"
              value={totalTalentWallets}
              icon={Wallet}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="B2B Wallets"
              value={totalCompanyWallets}
              icon={Building2}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Total Invoices"
              value={totalInvoices}
              icon={Receipt}
              color="text-fuchsia-500"
              bg="bg-fuchsia-500/10"
            />
            <MetricTile
              label="Pending Payouts"
              value={pendingWithdrawals}
              icon={Banknote}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
          </div>

          {/* Telemetry Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Capital Ingress */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 px-2">
                <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
                  Capital Ingress (Purchases)
                </h3>
              </div>
              <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardContent className="p-0">
                  {latestInvoices.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground/50 font-black uppercase text-[10px] tracking-widest italic">
                      No recent ingress detected.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/5">
                      {latestInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-6 flex items-center justify-between group hover:bg-emerald-500/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
                              <Receipt className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm uppercase italic tracking-tight">
                                {inv.talent.full_name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {inv.invoice_number}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={cn(
                                "font-black text-[9px] uppercase tracking-widest px-3 border-none",
                                inv.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-600"
                                  : "bg-amber-500/20 text-amber-600",
                              )}
                            >
                              +{inv.bundle_credits || 0} CR
                            </Badge>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1 flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> {new Date(inv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Capital Egress */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 px-2">
                <ArrowUpRight className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
                  Capital Egress (Withdrawals)
                </h3>
              </div>
              <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-rose-500" />
                <CardContent className="p-0">
                  {latestWithdrawals.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground/50 font-black uppercase text-[10px] tracking-widest italic">
                      No recent egress detected.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/5">
                      {latestWithdrawals.map((req) => (
                        <div
                          key={req.id}
                          className="p-6 flex items-center justify-between group hover:bg-orange-500/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20">
                              <Banknote className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm uppercase italic tracking-tight">
                                {req.talent.full_name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {req.method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-black text-[9px] uppercase tracking-widest px-3 border-2",
                                req.status === "completed"
                                  ? "border-emerald-500/20 text-emerald-500"
                                  : req.status === "pending"
                                    ? "border-amber-500/20 text-amber-500"
                                    : "border-rose-500/20 text-rose-500",
                              )}
                            >
                              -{req.amount_credits} CR
                            </Badge>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1 flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-4xl font-black italic tracking-tighter leading-none text-foreground/90">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinOverviewTab;
