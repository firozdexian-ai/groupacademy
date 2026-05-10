import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Banknote,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Wallet,
  DollarSign,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sb = supabase as any;

const currencySymbol = (c: string) => (c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : c);

export function HrPayrollTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({
    status: "draft",
    currency: "USD",
    base_amount: 0,
    incentive_amount: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["hr_payroll"],
    queryFn: async () => {
      const [payrollRes, workforceRes] = await Promise.all([
        sb.from("hr_payroll_runs").select("*").order("period_end", { ascending: false }),
        sb.from("workforce_members").select("user_id, talents(full_name)").eq("status", "active"),
      ]);

      if (payrollRes.error) throw payrollRes.error;
      if (workforceRes.error) throw workforceRes.error;

      const userMap = new Map<string, string>();
      (workforceRes.data || []).forEach((w: any) => {
        if (w.user_id) userMap.set(w.user_id, (w.talents as any)?.full_name || "Unknown");
      });

      const runs: any[] = payrollRes.data || [];
      const totalDisbursed = runs
        .filter((r) => r.status === "paid")
        .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
      const pendingLiability = runs
        .filter((r) => r.status === "pending" || r.status === "draft")
        .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

      return {
        runs,
        userMap,
        workforce: (workforceRes.data || []) as any[],
        totalDisbursed,
        pendingLiability,
      };
    },
  });

  const upsertPayroll = useMutation({
    mutationFn: async (payload: any) => {
      const total = Number(payload.base_amount || 0) + Number(payload.incentive_amount || 0);
      const finalPayload = { ...payload, total_amount: total };

      if (finalPayload.id) {
        const { error } = await sb.from("hr_payroll_runs").update(finalPayload).eq("id", finalPayload.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("hr_payroll_runs").insert(finalPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_payroll"] });
      toast.success("Financial Protocol Synchronized");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  const deletePayroll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("hr_payroll_runs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_payroll"] });
      toast.success("Ledger Entry Purged");
    },
    onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "DISBURSED" };
      case "pending":
        return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "PENDING TRANSFER" };
      default:
        return { icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10", label: "DRAFT" };
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-emerald-600">
            <Banknote className="h-8 w-8 fill-emerald-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Payroll Ledger</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Workforce Compensation &amp; Financial Yields
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "draft", currency: "USD", base_amount: 0, incentive_amount: 0 });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Initialize Ledger Entry
        </Button>
      </header>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiTile
          icon={DollarSign}
          label="Total Capital Disbursed"
          value={data?.totalDisbursed}
          accent="emerald"
        />
        <KpiTile icon={Activity} label="Pending Liabilities" value={data?.pendingLiability} accent="amber" />
      </div>

      {/* Ledger Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500/50 to-primary/50" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Beneficiary Node
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Temporal Period
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Capital Yield
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 text-right pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.runs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero ledger entries detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.runs.map((r: any) => {
                    const sc = getStatusConfig(r.status);
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={r.id} className="group hover:bg-emerald-500/[0.03]">
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground/60" />
                            <p className="font-black text-sm uppercase italic tracking-tight">
                              {data?.userMap.get(r.user_id) || "Orphaned User"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                            <span>STR: {r.period_start ? new Date(r.period_start).toLocaleDateString() : "N/A"}</span>
                            <span>END: {r.period_end ? new Date(r.period_end).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-emerald-600 text-sm">
                              {currencySymbol(r.currency)}
                              {Number(r.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                              Base: {r.base_amount} | Inc: {r.incentive_amount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black uppercase text-[9px] tracking-widest",
                              sc.bg,
                              sc.color,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" /> {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDraft(r);
                                setOpen(true);
                              }}
                              className="hover:bg-emerald-500/10 hover:text-emerald-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Purge Entry?")) deletePayroll.mutate(r.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Banknote className="h-7 w-7 text-emerald-600" />
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Ledger Entry
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest">
                  Define compensation parameters for workforce node.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Beneficiary Node (Workforce)</Label>
              <Select value={draft.user_id || ""} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue placeholder="Select workforce member" />
                </SelectTrigger>
                <SelectContent>
                  {data?.workforce
                    .filter((w: any) => w.user_id)
                    .map((w: any) => (
                      <SelectItem key={w.user_id} value={w.user_id}>
                        {(w.talents as any)?.full_name || "Unknown"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Base Capital Yield</Label>
                <Input
                  type="number"
                  value={draft.base_amount ?? 0}
                  onChange={(e) => setDraft({ ...draft, base_amount: Number(e.target.value) })}
                  className="h-14 rounded-xl border-2 font-black text-lg bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Incentive / Bonus Yield</Label>
                <Input
                  type="number"
                  value={draft.incentive_amount ?? 0}
                  onChange={(e) => setDraft({ ...draft, incentive_amount: Number(e.target.value) })}
                  className="h-14 rounded-xl border-2 font-black text-lg bg-muted/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Period Start</Label>
                <Input
                  type="date"
                  value={draft.period_start || ""}
                  onChange={(e) => setDraft({ ...draft, period_start: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-background/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Period End</Label>
                <Input
                  type="date"
                  value={draft.period_end || ""}
                  onChange={(e) => setDraft({ ...draft, period_end: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-background/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Currency</Label>
                <Select value={draft.currency || "USD"} onValueChange={(v) => setDraft({ ...draft, currency: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Ledger Status</Label>
                <Select value={draft.status || "draft"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Transfer</SelectItem>
                    <SelectItem value="paid">Disbursed (Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground"
            >
              Abort
            </Button>
            <Button
              disabled={!draft.user_id || upsertPayroll.isPending}
              onClick={() => upsertPayroll.mutate(draft)}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="h-5 w-5" /> Authorize Ledger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | undefined;
  accent: "emerald" | "amber";
}) {
  const accentBg = accent === "emerald" ? "bg-emerald-500/10" : "bg-amber-500/10";
  const accentText = accent === "emerald" ? "text-emerald-600" : "text-amber-600";
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", accentBg, accentText)}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {label}
          </p>
          <p className={cn("text-3xl font-black tracking-tighter italic", accentText)}>
            ${value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default HrPayrollTab;
