import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Wallet, Check, X, Banknote, Activity, ShieldCheck, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    void load();
  }, [tab]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("agent_payout_requests")
      .select("*, talent:talents(full_name,email)")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    setRows((data as PayoutRow[]) ?? []);
    setLoading(false);
  }

  // CTO FIX: Pass the entire row so we can trigger targeted notifications
  async function update(row: PayoutRow, status: string, notes?: string) {
    setBusyId(row.id);
    try {
      if (status === "paid") {
        const { error } = await supabase.rpc("mark_payout_paid", { p_request_id: row.id, p_notes: notes ?? null });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_payout_requests")
          .update({ status, admin_notes: notes ?? null, processed_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) throw error;
      }

      // Dispatch notification to the creator
      await supabase.from("notifications").insert({
        talent_id: row.talent_id,
        title: `Payout ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message:
          status === "paid"
            ? `Your payout of ${Number(row.amount_credits).toFixed(1)} credits has been successfully transferred to your ${row.payout_method} account.`
            : `Your payout request for ${Number(row.amount_credits).toFixed(1)} credits was marked as ${status}.`,
        type: "system",
        link: "/app/wallet",
      });

      toast.success(`Protocol Committed: Marked as ${status}`);
      void load();
    } catch (err: any) {
      toast.error(err.message || "Transaction failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Wallet className="h-8 w-8 text-emerald-500 fill-emerald-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Creator Payouts</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Financial Operations · Review & Disburse Agent Earnings
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof STATUSES)[number])} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1 mb-8 w-full md:w-auto flex flex-col md:flex-row h-auto gap-1">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="md:flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 px-8 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="animate-in slide-in-from-bottom-4 duration-700 outline-none">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
            <div
              className={cn(
                "h-1.5 w-full bg-gradient-to-r",
                tab === "pending"
                  ? "from-amber-400 to-orange-500"
                  : tab === "approved"
                    ? "from-blue-400 to-indigo-500"
                    : tab === "paid"
                      ? "from-emerald-400 to-emerald-600"
                      : "from-destructive/50 to-destructive",
              )}
            />

            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                <Activity className="h-4 w-4 text-primary" /> {tab} Ledger ({rows.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-[24px] border-2 border-border/20 bg-muted/20" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/50 bg-muted/5">
                  <ShieldCheck className="h-8 w-8 mb-4 opacity-40" />
                  <div className="text-[10px] font-black uppercase tracking-widest max-w-sm text-center">
                    Queue Clear. No {tab} payout requests.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-border/20">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest">
                          Creator Identity
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                          Amount (CR)
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Method</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest max-w-[200px]">
                          Details
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
                        <TableHead className="px-6 text-right text-[10px] font-black uppercase tracking-widest">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y-2 divide-border/5">
                      {rows.map((r) => (
                        <TableRow key={r.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <TableCell className="px-6 py-4">
                            <div className="font-black italic text-sm group-hover:text-primary transition-colors uppercase">
                              {r.talent?.full_name ?? "UNKNOWN_ENTITY"}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                              {r.talent?.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1.5 font-black text-lg italic tracking-tighter">
                              <Coins className="h-4 w-4 text-amber-500" />
                              {Number(r.amount_credits).toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-black uppercase tracking-widest border-2 bg-background"
                            >
                              {r.payout_method}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-[10px] font-mono text-muted-foreground/80 max-w-[200px] truncate"
                            title={(r.payout_details as { note?: string })?.note ?? "—"}
                          >
                            {(r.payout_details as { note?: string })?.note ?? "—"}
                          </TableCell>
                          <TableCell className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-6 text-right">
                            <div className="flex justify-end gap-2">
                              {tab === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => update(r, "approved")}
                                    disabled={busyId === r.id}
                                    className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest bg-blue-500 hover:bg-blue-600 text-white gap-2 shadow-md shadow-blue-500/20"
                                  >
                                    {busyId === r.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => update(r, "rejected")}
                                    disabled={busyId === r.id}
                                    className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors gap-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {tab === "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => update(r, "paid")}
                                  disabled={busyId === r.id}
                                  className="h-9 rounded-xl font-black uppercase text-[9px] tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-md shadow-emerald-500/20"
                                >
                                  {busyId === r.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Banknote className="h-3 w-3" />
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
