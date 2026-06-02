import { useEffect, useState } from "react";
import {
  listPayoutRequestsByStatus,
  markPayoutPaid,
  updatePayoutRequestStatus,
  insertNotification,
} from "@/domains/agents/repo/agentsRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError } from "@/lib/errorTracking";
import { Loader2, Wallet, Check, X, Banknote, Activity, ShieldCheck, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Agent Creator Financial Payout Management Panel
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=payouts (Operator Financial Administration Area)
 * Operations Mode: Automated Efficiency ledger processing system disbursements across status boundaries.
 */

interface PayoutRow {
  id: string;
  talent_id: string;
  amount_credits: number;
  payout_method: string;
  payout_details: Record<string, unknown>;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  talent?: { full_name: string | null; email: string | null };
}

const STATUSES = ["pending", "approved", "paid", "rejected"] as const;

export function AgentPayoutsManager() {
  const [tab, setTab] = useState<(typeof STATUSES)[number]>("pending");
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listPayoutRequestsByStatus(tab);
      setRows((data as PayoutRow[]) ?? []);
    } catch (err: any) {
      trackError("agent-payouts-manager-load-failure", { error: err.message, tab });
      toast.error("Failed to load payout records ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (active) {
      load();
    }
    return () => {
      active = false;
    };
  }, [tab]);

  async function update(row: PayoutRow, status: string, notes?: string) {
    setBusyId(row.id);
    try {
      if (status === "paid") {
        await markPayoutPaid(row.id, notes ?? null);
      } else {
        await updatePayoutRequestStatus(row.id, status, notes ?? null);
      }

      await insertNotification({
        talent_id: row.talent_id,
        title: `Payout Request ${status}`,
        message:
          status === "paid"
            ? `Your payout of ${Number(row.amount_credits).toLocaleString(undefined, { maximumFractionDigits: 1 })} credits has been disbursed to your selected ${row.payout_method} account mapping destination.`
            : `Your creator payout request for ${Number(row.amount_credits).toLocaleString(undefined, { maximumFractionDigits: 1 })} credits has been marked as ${status}.`,
        type: "system",
        link: "/app/wallet",
      });

      toast.success(`Transaction committed: Status marked as ${status}`);
      await load();
    } catch (err: any) {
      trackError("agent-payouts-manager-update-failure", { error: err.message, id: row.id, status });
      toast.error(err.message || "Financial transaction processing operation dropped");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Financial System Administrative Overview Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Wallet className="h-6 w-6 text-emerald-600 fill-emerald-500/10" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Creator Payouts Management</h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Financial operations interface workspace to audit, approve, and disburse accumulated creator assistant
            earnings.
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof STATUSES)[number])} className="w-full">
        <TabsList className="bg-muted/40 border border-border p-1 mb-4 w-full md:w-auto flex flex-col md:flex-row h-auto gap-1 rounded-xl">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-lg font-semibold text-xs tracking-tight py-2 px-5 capitalize flex-1 md:flex-none"
            >
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none">
          <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
            <div
              className={cn(
                "h-1 w-full transition-all duration-300",
                tab === "pending"
                  ? "bg-amber-500"
                  : tab === "approved"
                    ? "bg-blue-500"
                    : tab === "paid"
                      ? "bg-emerald-500"
                      : "bg-destructive",
              )}
            />

            <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                <Activity className="h-4 w-4 text-primary" /> Requests Overview &mdash;{" "}
                <span className="capitalize">{tab}</span> ({rows.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 bg-background/50">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl border border-border/40 bg-muted/30" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-center">
                    Payout Queue Clear. No records match the {tab} filter parameters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b border-border/60">
                        <TableHead className="px-5 py-3 text-xs font-bold text-foreground">Creator Profile</TableHead>
                        <TableHead className="text-right text-xs font-bold text-foreground">
                          Disbursement Amount
                        </TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Payment Route</TableHead>
                        <TableHead className="text-xs font-bold text-foreground max-w-[200px]">
                          Notes / Context
                        </TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Submission Date</TableHead>
                        <TableHead className="px-5 text-right text-xs font-bold text-foreground">
                          Processing Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow
                          key={r.id}
                          className="hover:bg-primary/[0.01] border-b border-border/40 last:border-none group"
                        >
                          <TableCell className="px-5 py-3">
                            <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-none">
                              {r.talent?.full_name ?? "Unknown User"}
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground mt-1">{r.talent?.email}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1.5 font-bold text-base text-foreground tabular-nums">
                              <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              {Number(r.amount_credits).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold tracking-wide border-border bg-background px-2 py-0 rounded text-muted-foreground"
                            >
                              {r.payout_method}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-xs text-muted-foreground/90 max-w-[200px] truncate font-medium"
                            title={(r.payout_details as { note?: string })?.note ?? "—"}
                          >
                            {(r.payout_details as { note?: string })?.note ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground/70 font-medium whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-1.5 sm:self-center">
                              {tab === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => update(r, "approved")}
                                    disabled={busyId === r.id}
                                    className="h-8 rounded-lg font-semibold text-xs tracking-wide bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm px-3"
                                  >
                                    {busyId === r.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    Approve Request
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => update(r, "rejected")}
                                    disabled={busyId === r.id}
                                    className="h-8 w-8 rounded-lg text-rose-600 border-border hover:bg-rose-500/10 hover:border-rose-300 transition-colors"
                                    aria-label="Reject request"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {tab === "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => update(r, "paid")}
                                  disabled={busyId === r.id}
                                  className="h-8 rounded-lg font-semibold text-xs tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm px-3"
                                >
                                  {busyId === r.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Banknote className="h-3.5 w-3.5" />
                                  )}
                                  Mark Disbursed
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentPayoutsManager;
