import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGigGraph } from "./hooks/useGigGraph";
import { Briefcase, Zap, ShieldCheck, Coins, Activity, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GigOverviewTab() {
  const { gigGraphQuery } = useGigGraph();
  const { data, isLoading } = gigGraphQuery;

  const activeGigs = (data?.quickActions?.length || 0) + (data?.marketplaceGigs?.length || 0);
  const pendingSubmissions = data?.submissions?.filter(s => s.status === "pending" || s.status === "in_review") || [];
  const pendingVerifications = data?.verifications?.filter(v => v.status === "pending") || [];
  const pendingWithdrawals = data?.withdrawals?.filter(w => w.status === "pending") || [];

  const totalPendingActions = pendingSubmissions.length + pendingVerifications.length + pendingWithdrawals.length;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Gig Command</h2>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
            Workforce Telemetry &amp; Transaction Ledger
          </p>
        </div>
        {totalPendingActions > 0 && (
          <Badge variant="warning" className="h-8 px-3 text-xs">
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
            {totalPendingActions} Pending Actions
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Active Gigs"
              value={activeGigs}
              icon={Zap}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
            <MetricTile
              label="Pending Submissions"
              value={pendingSubmissions.length}
              icon={Clock}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Trust Verifications"
              value={pendingVerifications.length}
              icon={ShieldCheck}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Withdrawal Queue"
              value={pendingWithdrawals.length}
              icon={Coins}
              color="text-rose-600"
              bg="bg-rose-500/10"
            />
          </div>

          {/* Data Splits: Escalations & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Priority Action Queue */}
            <Card className="lg:col-span-2 rounded-2xl border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Priority Financial &amp; Trust Queue</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingWithdrawals.length === 0 && pendingVerifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Zero Active Escalations</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingWithdrawals.slice(0, 3).map(req => (
                        <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                              <Coins className="h-4 w-4 text-rose-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">Withdrawal Request</p>
                              <p className="text-xs text-muted-foreground">
                                Amount: {req.amount} Credits
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline" className="text-[9px]">
                              Talent ID: {req.talent_id.substring(0, 8)}
                            </Badge>
                            <Badge variant="destructive" className="text-[9px]">
                              Requires Payout
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {pendingVerifications.slice(0, 3).map(verif => (
                        <div key={verif.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">Trust Verification</p>
                              <p className="text-xs text-muted-foreground">Identity Check Required</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline" className="text-[9px]">
                              Talent ID: {verif.talent_id.substring(0, 8)}
                            </Badge>
                            <Badge variant="warning" className="text-[9px]">
                              Requires Audit
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Platform Pulse */}
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Gig Distribution Pulse</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PulseBar
                    label="Quick Actions"
                    value={data.quickActions?.length || 0}
                    max={Math.max(activeGigs, 1)}
                    color="bg-amber-500"
                  />
                  <PulseBar
                    label="Marketplace"
                    value={data.marketplaceGigs?.length || 0}
                    max={Math.max(activeGigs, 1)}
                    color="bg-primary"
                  />
                  <PulseBar
                    label="Course Projects"
                    value={data.courseProjects?.length || 0}
                    max={Math.max(data.courseProjects?.length || 0, activeGigs, 1)}
                    color="bg-emerald-500"
                  />
                  <PulseBar
                    label="Submissions"
                    value={data.submissions?.length || 0}
                    max={Math.max(data.submissions?.length || 0, 1)}
                    color="bg-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PulseBar({ label, value, max, color }: any) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="font-black tabular-nums">{value} Nodes</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default GigOverviewTab;
