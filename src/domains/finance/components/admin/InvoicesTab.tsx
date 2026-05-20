import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Coins,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Upload,
  FileText,
  ExternalLink,
  Zap,
  ShieldCheck,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Capital Ingress Ledger (Invoices)
 * 2026 Standard: Blended Phase 6 UI (Deep Pagination & RPC Mutations)
 */

type InvoiceStatus = "all" | "pending" | "awaiting_payment" | "paid" | "cancelled" | "refunded";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  talent_id: string;
  bundle_credits: number;
  bundle_price_usd: number;
  currency: string;
  status: string;
  channel: string;
  whatsapp_message_sent: boolean;
  payment_method: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  admin_notes: string | null;
  cancellation_reason: string | null;
  credits_disbursed: boolean;
  credit_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  talents?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "PENDING_AUDIT", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  awaiting_payment: {
    label: "AWAITING_FUNDS",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: {
    label: "TRANSACTION_SETTLED",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: { label: "NODE_TERMINATED", className: "bg-muted text-muted-foreground", icon: XCircle },
  refunded: { label: "CAPITAL_REVERTED", className: "bg-muted text-muted-foreground", icon: XCircle },
};

export function InvoicesTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-credit-invoices", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("credit_invoices")
        .select("*, talents:talent_id (full_name, email, phone)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as InvoiceRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (!search.trim()) return invoices;
    const s = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number?.toLowerCase().includes(s) ||
        i.talents?.full_name?.toLowerCase().includes(s) ||
        i.talents?.email?.toLowerCase().includes(s) ||
        i.talents?.phone?.toLowerCase().includes(s),
    );
  }, [invoices, search]);

  const kpis = useMemo(() => {
    const list = invoices || [];
    const pending = list.filter((i) => i.status === "pending").length;
    const awaiting = list.filter((i) => i.status === "awaiting_payment");
    const awaitingValue = awaiting.reduce((sum, i) => sum + Number(i.bundle_price_usd || 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const paidThisMonth = list.filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart);
    const paidUsd = paidThisMonth.reduce((s, i) => s + Number(i.bundle_price_usd || 0), 0);
    const paidCredits = paidThisMonth.reduce((s, i) => s + (i.bundle_credits || 0), 0);
    return { pending, awaiting: awaiting.length, awaitingValue, paidUsd, paidCredits };
  }, [invoices]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-credit-invoices"] });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-fuchsia-500">
            <Receipt className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Invoices
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Capital Ingress Ledger
          </p>
        </div>
      </header>

      {/* EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiNode label="Pending Audit" value={kpis.pending.toString()} icon={Clock} color="text-amber-500" />
        <KpiNode
          label="Awaiting Capital"
          value={`$${kpis.awaitingValue.toFixed(0)}`}
          subtext={`${kpis.awaiting} Nodes`}
          icon={TrendingUp}
          color="text-fuchsia-500"
        />
        <KpiNode
          label="MTD Revenue"
          value={`$${kpis.paidUsd.toFixed(2)}`}
          icon={ShieldCheck}
          color="text-emerald-500"
        />
        <KpiNode
          label="Yield Disbursed"
          value={kpis.paidCredits.toLocaleString()}
          subtext="Credits"
          icon={Coins}
          color="text-blue-500"
        />
      </div>

      {/* COMMAND BAR */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-600" />
        <CardHeader className="p-8 border-b border-border/10">
          <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-fuchsia-500 transition-colors" />
              <Input
                placeholder="Search identity or invoice string..."
                className="pl-11 h-12 w-full bg-muted/20 border-2 border-border/10 rounded-xl font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus)}>
              <SelectTrigger className="w-full sm:w-[220px] h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  ALL LOGS
                </SelectItem>
                <SelectItem value="pending" className="font-bold text-[10px] uppercase">
                  Pending Audit
                </SelectItem>
                <SelectItem value="awaiting_payment" className="font-bold text-[10px] uppercase">
                  Awaiting payment
                </SelectItem>
                <SelectItem value="paid" className="font-bold text-[10px] uppercase text-emerald-600">
                  Paid settled
                </SelectItem>
                <SelectItem value="cancelled" className="font-bold text-[10px] uppercase">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* LEDGER TABLE */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-6">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                      Invoice Node
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Talent Identity</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">
                      Bundle Payload
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Status Protocol</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Ingress Date</TableHead>
                    <TableHead className="text-right py-6 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/5">
                  {filtered.map((inv) => {
                    const meta = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
                    const Icon = meta.icon;
                    return (
                      <TableRow key={inv.id} className="group hover:bg-fuchsia-500/[0.02]">
                        <TableCell className="pl-8 py-6">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] border-fuchsia-500/20 text-fuchsia-600 bg-fuchsia-500/5"
                          >
                            {inv.invoice_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <p className="font-black text-sm uppercase italic tracking-tight">
                            {inv.talents?.full_name || "NULL_ENTITY"}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {inv.talents?.email}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-black italic text-sm text-fuchsia-600">
                            {inv.bundle_credits.toLocaleString()} CR
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground">
                            ${Number(inv.bundle_price_usd).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-black text-[9px] uppercase italic border-2 px-3 py-1 rounded-full",
                              meta.className,
                            )}
                          >
                            <Icon className="h-3 w-3 mr-1.5" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] font-black italic text-muted-foreground/50 uppercase text-left">
                          {format(new Date(inv.created_at), "dd MMM, HH:mm")}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest hover:bg-fuchsia-600 hover:text-white transition-all shadow-sm opacity-20 group-hover:opacity-100"
                            onClick={() => setSelected(inv)}
                          >
                            Manage_Node
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl border-4 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl rounded-[40px] shadow-2xl text-left">
            <div className="h-2 w-full bg-gradient-to-r from-fuchsia-400 to-pink-600" />
            <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                      <Zap className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" /> {selected.invoice_number}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                      Transaction Audit Protocol Active
                    </DialogDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black italic tracking-tighter leading-none text-fuchsia-500">
                      {selected.bundle_credits.toLocaleString()} CR
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">
                      Payload Value: ${Number(selected.bundle_price_usd).toFixed(2)}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-border/10">
                <div className="space-y-4">
                  <DetailRow label="Talent identity" value={selected.talents?.full_name || "—"} />
                  <DetailRow label="Contact Link" value={selected.talents?.email || "—"} />
                  <DetailRow label="Channel Node" value={selected.channel.toUpperCase()} />
                  <DetailRow label="Verified Status" value={STATUS_BADGE[selected.status]?.label || selected.status} />
                </div>
                <div className="space-y-4">
                  {selected.payment_method && (
                    <DetailRow label="Methodology" value={selected.payment_method.toUpperCase()} />
                  )}
                  {selected.payment_reference && <DetailRow label="TXN Reference" value={selected.payment_reference} />}
                  {selected.payment_proof_url && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                        asChild
                      >
                        <a href={selected.payment_proof_url} target="_blank" rel="noreferrer">
                          <FileText className="h-4 w-4" /> View Payment Artifact <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {selected.admin_notes && (
                <div className="p-6 bg-muted/20 rounded-[24px] border-2 border-border/5">
                  <p className="text-[9px] font-black uppercase text-fuchsia-500 italic mb-2 tracking-widest">
                    Executive Audit Notes
                  </p>
                  <p className="text-sm font-medium italic leading-relaxed opacity-70">{selected.admin_notes}</p>
                </div>
              )}

              <DialogFooter className="pt-4 gap-4 flex-col sm:flex-row">
                {selected.talents?.phone && (
                  <Button
                    variant="outline"
                    className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => {
                      const phone = selected.talents!.phone!.replace(/[^0-9]/g, "");
                      const msg = encodeURIComponent(
                        `Hi ${selected.talents?.full_name || "there"}, regarding your GroUp Academy Invoice ${selected.invoice_number}...`,
                      );
                      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp Direct
                  </Button>
                )}
                {!selected.credits_disbursed && selected.status !== "cancelled" && (
                  <div className="flex-1 flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setCancelOpen(true)}
                      className="font-black uppercase text-[10px] text-destructive italic tracking-widest"
                    >
                      Terminate
                    </Button>
                    <Button
                      onClick={() => setApproveOpen(true)}
                      className="flex-1 h-14 rounded-2xl font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                    >
                      <ShieldCheck className="h-6 w-6 fill-current" /> Authorize & Disburse
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* APPROVAL & CANCELLATION SUB-MODALS */}
      {selected && (
        <>
          <ApproveDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            invoice={selected}
            onDone={() => {
              refresh();
              setApproveOpen(false);
              setSelected(null);
            }}
          />
          <CancelDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            invoice={selected}
            onDone={() => {
              refresh();
              setCancelOpen(false);
              setSelected(null);
            }}
          />
        </>
      )}
    </div>
  );
}

function KpiNode({ label, value, subtext, icon: Icon, color }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden group hover:border-fuchsia-500/40 transition-all">
      <CardContent className="p-6 flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-2xl bg-muted/50 border-2 border-border/10 group-hover:rotate-6 transition-transform",
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{label}</p>
          <p className="text-2xl font-black italic tracking-tighter leading-none mt-1">{value}</p>
          {subtext && <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{label}</span>
      <span className="font-bold text-sm tracking-tight text-right">{value}</span>
    </div>
  );
}

// [Note: Existing ApproveDialog and CancelDialog logic retained, unformatted for brevity in this response but kept fully functional]
function ApproveDialog({ open, onOpenChange, invoice, onDone }: any) {
  const [method, setMethod] = useState("bkash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Processing disbursement protocol...");
    try {
      let proofUrl: string | null = null;
      if (file) {
        const path = `proofs/${invoice.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        proofUrl = signed?.signedUrl || path;
      }
      const { data, error } = await supabase.rpc("approve_invoice_and_disburse", {
        p_invoice_id: invoice.id,
        p_payment_method: method,
        p_payment_reference: reference || null,
        p_payment_proof_url: proofUrl,
        p_admin_notes: notes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; credits_added?: number };
      if (!result?.success) throw new Error(result?.error || "Protocol Rejected");
      toast.success(`Success: ${result.credits_added} Credits Disbursed`, { id: toastId });
      onDone();
    } catch (err: any) {
      toast.error("Execution Fault: " + err.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[32px] border-4 text-left">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
            Finalize Settlement
          </DialogTitle>
          <DialogDescription className="text-xs font-medium italic">
            Disburse {invoice.bundle_credits} credits to node {invoice.talents?.full_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase italic text-fuchsia-500 ml-1">Payment Methodology</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="bkash" className="font-bold text-xs uppercase">
                  BKASH
                </SelectItem>
                <SelectItem value="nagad" className="font-bold text-xs uppercase">
                  NAGAD
                </SelectItem>
                <SelectItem value="bank" className="font-bold text-xs uppercase">
                  BANK_TRANSFER
                </SelectItem>
                <SelectItem value="other" className="font-bold text-xs uppercase">
                  OTHER_LOG
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase italic text-fuchsia-500 ml-1">
              Capital Reference (TXN_ID)
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-12 rounded-xl border-2 font-bold"
              placeholder="E.G. TRXN992..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase italic text-fuchsia-500 ml-1">
              Artifact Upload (PDF/IMG)
            </Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="h-12 rounded-xl border-2 border-dashed bg-muted/10 cursor-pointer pt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-black uppercase text-[10px] italic"
          >
            Abort
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-12 px-6 rounded-xl font-black uppercase italic text-xs gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          >
            {submitting ? <Clock className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />} DISBURSE_YIELD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, invoice, onDone }: any) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("cancel_invoice", { p_invoice_id: invoice.id, p_reason: reason || null });
      if (error) throw error;
      toast.success("Identity Protocol Terminated");
      onDone();
    } catch (err: any) {
      toast.error("Fault: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[32px] border-4 text-left">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-destructive">
            Terminate Node?
          </DialogTitle>
          <DialogDescription className="text-xs font-medium italic">
            Archive invoice {invoice.invoice_number} and cancel yield disbursement.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="TERMINATION REASONING (INTERNAL_AUDIT)..."
            className="rounded-2xl border-2 bg-muted/10 italic text-sm p-4"
            rows={3}
          />
        </div>
        <DialogFooter className="pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-black uppercase text-[10px] italic"
          >
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={submitting}
            className="h-12 px-6 rounded-xl font-black uppercase italic text-xs"
          >
            CONFIRM_TERMINATION
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InvoicesTab;
