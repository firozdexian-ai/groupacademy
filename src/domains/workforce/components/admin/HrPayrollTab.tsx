/**
 * HR Payroll Ledger — Phase HR-Z1 Hardened
 * CTO Version: May 2026
 * Fixes: W11 (Temporal Grouping & CSV Export), W4 (Relation Mapping)
 * Features: Financial KPI Tracking, Institutional Ledger Export
 */
import { useState, useMemo } from "react";
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
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

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
      // W4 Fix: Accurate Workforce-to-Talent join
      const [payrollRes, workforceRes] = await Promise.all([
        supabase.from("hr_payroll_runs").select("*").order("period_end", { ascending: false }),
        supabase.from("workforce_members").select("user_id, talents(full_name)").eq("status", "active"),
      ]);

      if (payrollRes.error) throw payrollRes.error;
      if (workforceRes.error) throw workforceRes.error;

      const userMap = new Map<string, string>();
      (workforceRes.data || []).forEach((w: any) => {
        if (w.user_id) userMap.set(w.user_id, (w.talents as any)?.full_name || "Unknown Agent");
      });

      const runs = payrollRes.data || [];

      // W11: Group by Month
      const groupedRuns = runs.reduce((acc: any, run) => {
        const month = run.period_end ? format(parseISO(run.period_end), "MMMM yyyy") : "Unscheduled";
        if (!acc[month]) acc[month] = [];
        acc[month].push(run);
        return acc;
      }, {});

      return {
        runs,
        groupedRuns,
        userMap,
        workforce: workforceRes.data || [],
        totalDisbursed: runs.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.total_amount || 0), 0),
        pendingLiability: runs
          .filter((r) => ["pending", "draft"].includes(r.status))
          .reduce((s, r) => s + Number(r.total_amount || 0), 0),
      };
    },
  });

  const upsertPayroll = useMutation({
    mutationFn: async (payload: any) => {
      const total = Number(payload.base_amount || 0) + Number(payload.incentive_amount || 0);
      const finalPayload = { ...payload, total_amount: total };

      const query = finalPayload.id
        ? supabase.from("hr_payroll_runs").update(finalPayload).eq("id", finalPayload.id)
        : supabase.from("hr_payroll_runs").insert([finalPayload]);

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_payroll"] });
      toast.success("Financial Ledger Updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  // W11: CSV Export Protocol
  const exportToCSV = () => {
    if (!data?.runs.length) return;
    const headers = ["Beneficiary", "Start", "End", "Base", "Incentive", "Total", "Currency", "Status"];
    const rows = data.runs.map((r) => [
      data.userMap.get(r.user_id) || "Unknown",
      r.period_start,
      r.period_end,
      r.base_amount,
      r.incentive_amount,
      r.total_amount,
      r.currency,
      r.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `group_payroll_export_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Financial Artifact Exported");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "DISBURSED" };
      case "pending":
        return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "PENDING" };
      default:
        return { icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10", label: "DRAFT" };
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6 text-left">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/10 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-emerald-600">
            <Banknote className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Payroll Ledger</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Capital Deployment & Yield Registry
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => {
              setDraft({ status: "draft", currency: "USD", base_amount: 0, incentive_amount: 0 });
              setOpen(true);
            }}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            <Plus className="h-4 w-4" /> New Entry
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiTile icon={DollarSign} label="Total Disbursed Capital" value={data?.totalDisbursed} accent="emerald" />
        <KpiTile icon={Activity} label="Pending Liabilities" value={data?.pendingLiability} accent="amber" />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-[40px]" />
      ) : (
        <div className="space-y-8">
          {Object.entries(data?.groupedRuns || {}).map(([month, runs]: [string, any]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <h3 className="font-black uppercase italic text-sm tracking-widest text-muted-foreground/60">
                  {month}
                </h3>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/10 text-[10px] font-black uppercase tracking-widest">
                    <TableRow className="border-b-2">
                      <TableHead className="py-5 pl-8">Beneficiary Node</TableHead>
                      <TableHead>Temporal Window</TableHead>
                      <TableHead>Financial Yield</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/5">
                    {runs.map((r: any) => {
                      const sc = getStatusConfig(r.status);
                      return (
                        <TableRow key={r.id} className="group hover:bg-emerald-500/[0.03] transition-colors">
                          <TableCell className="py-5 pl-8">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground/40" />
                              <p className="font-black text-sm uppercase italic tracking-tight">
                                {data?.userMap.get(r.user_id) || "Orphaned"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                            {r.period_start ? format(parseISO(r.period_start), "MMM dd") : "—"} to{" "}
                            {r.period_end ? format(parseISO(r.period_end), "MMM dd") : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black text-emerald-600 text-sm">
                                {currencySymbol(r.currency)}
                                {Number(r.total_amount || 0).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                                Base: {r.base_amount} | Inc: {r.incentive_amount}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black uppercase text-[9px] tracking-widest border",
                                sc.bg,
                                sc.color,
                              )}
                            >
                              <sc.icon className="h-3 w-3" /> {sc.label}
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
                                className="hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  supabase
                                    .from("hr_payroll_runs")
                                    .delete()
                                    .eq("id", r.id)
                                    .then(() => qc.invalidateQueries({ queryKey: ["hr_payroll"] }))
                                }
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] p-0 overflow-hidden border-4 shadow-2xl">
          <div className="h-2 w-full bg-emerald-500" />
          <div className="p-10 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic">Financial Command</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Beneficiary Member</Label>
                <Select value={draft.user_id || ""} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                    <SelectValue placeholder="SELECT WORKFORCE NODE" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.workforce
                      .filter((w) => w.user_id)
                      .map((w) => (
                        <SelectItem key={w.user_id} value={w.user_id} className="font-bold text-xs uppercase">
                          {w.talents?.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Base Yield</Label>
                  <Input
                    type="number"
                    value={draft.base_amount ?? 0}
                    onChange={(e) => setDraft({ ...draft, base_amount: Number(e.target.value) })}
                    className="h-14 rounded-xl border-2 font-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Incentive Yield</Label>
                  <Input
                    type="number"
                    value={draft.incentive_amount ?? 0}
                    onChange={(e) => setDraft({ ...draft, incentive_amount: Number(e.target.value) })}
                    className="h-14 rounded-xl border-2 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Window Start</Label>
                  <Input
                    type="date"
                    value={draft.period_start || ""}
                    onChange={(e) => setDraft({ ...draft, period_start: e.target.value })}
                    className="h-14 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Window End</Label>
                  <Input
                    type="date"
                    value={draft.period_end || ""}
                    onChange={(e) => setDraft({ ...draft, period_end: e.target.value })}
                    className="h-14 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6 border-t gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-12 rounded-xl font-black uppercase text-[10px]"
              >
                Abort
              </Button>
              <Button
                disabled={!draft.user_id || upsertPayroll.isPending}
                onClick={() => upsertPayroll.mutate(draft)}
                className="h-12 px-10 rounded-2xl font-black uppercase italic text-[11px] gap-2 shadow-xl bg-emerald-600 text-white flex-1"
              >
                <ShieldCheck className="h-4 w-4" /> Commit Ledger
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, accent }: any) {
  const accentText = accent === "emerald" ? "text-emerald-600" : "text-amber-600";
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 flex items-center gap-5">
      <div
        className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-border/10 shadow-inner bg-background",
        )}
      >
        <Icon className={cn("h-7 w-7", accentText)} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{label}</p>
        <p className={cn("text-3xl font-black tracking-tighter italic", accentText)}>
          ${value?.toLocaleString() || "0"}
        </p>
      </div>
    </Card>
  );
}

export default HrPayrollTab;
