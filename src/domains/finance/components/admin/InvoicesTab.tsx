import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  uploadPaymentProof,
  createPaymentProofSignedUrl,
  approveInvoiceAndDisburse,
  cancelInvoice,
  listAdminCreditInvoices,
} from "@/domains/finance/repo/financeRepo";
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
  pending: { label: "Under Review", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  awaiting_payment: {
    label: "Awaiting Payment",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: {
    label: "Paid & Settled",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground", icon: XCircle },
};

/**
 * GroUp Academy: Invoices Ledger Manager
 * Administrative interface for reviewing incoming payments, verifying deposits, and disbursing credits.
 */
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
      const data = await listAdminCreditInvoices(statusFilter, 500);
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
    const currentYear = monthStart.getFullYear();
    const currentMonth = monthStart.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);

    const paidThisMonth = list.filter(
      (i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= firstDayOfMonth,
    );
    const paidUsd = paidThisMonth.reduce((s, i) => s + Number(i.bundle_price_usd || 0), 0);
    const paidCredits = paidThisMonth.reduce((s, i) => s + (i.bundle_credits || 0), 0);
    return { pending, awaiting: awaiting.length, awaitingValue, paidUsd, paidCredits };
  }, [invoices]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-credit-invoices"] });

  return (
    <div className="space-y-10 animate-in fade-in duration-300 p-4 md:p-6 text-left">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-fuchsia-600 dark:text-fuchsia-400">
            <Receipt className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Invoice Management</h2>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Audit credit invoices, review deposit confirmations, and fulfill account balances.
          </p>
        </div>
      </header>

      {/* KPI METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <KpiNode label="Under Review" value={kpis.pending.toString()} icon={Clock} color="text-amber-500" />
        <KpiNode
          label="Awaiting Payment"
          value={`$${kpis.awaitingValue.toFixed(0)}`}
          subtext={`${kpis.awaiting} pending orders`}
          icon={TrendingUp}
          color="text-fuchsia-500"
        />
        <KpiNode
          label="Month-to-Date Revenue"
          value={`$${kpis.paidUsd.toFixed(2)}`}
          icon={ShieldCheck}
          color="text-emerald-500"
        />
        <KpiNode
          label="Credits Distributed"
          value={kpis.paidCredits.toLocaleString()}
          subtext="Total credits"
          icon={Coins}
          color="text-blue-500"
        />
      </div>

      {/* CONTROL FILTERS BAR */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-600" />
        <CardHeader className="p-6 border-b border-border/10">
          <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-fuchsia-500 transition-colors" />
              <Input
                placeholder="Search user name, email, or invoice number..."
                className="pl-11 h-12 w-full bg-muted/20 border border-border/40 rounded-xl font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus)}>
              <SelectTrigger className="w-full sm:w-[220px] h-12 rounded-xl border font-semibold text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border">
                <SelectItem value="all" className="font-semibold text-xs">
                  All Records
                </SelectItem>
                <SelectItem value="pending" className="font-semibold text-xs">
                  Under Review
                </SelectItem>
                <SelectItem value="awaiting_payment" className="font-semibold text-xs">
                  Awaiting Payment
                </SelectItem>
                <SelectItem value="paid" className="font-semibold text-xs text-emerald-600">
                  Verified Paid
                </SelectItem>
                <SelectItem value="cancelled" className="font-semibold text-xs">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* LEDGER DATA TABLE */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/20 border" />
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/20 border" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs py-5 pl-8 text-muted-foreground">
                      Invoice Reference
                    </TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">User Profile</TableHead>
                    <TableHead className="font-bold text-xs text-right text-muted-foreground">
                      Package Content
                    </TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">Created Date</TableHead>
                    <TableHead className="text-right py-5 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {filtered.map((inv) => {
                    const meta = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
                    const Icon = meta.icon;
                    return (
                      <TableRow
                        key={inv.id}
                        className="group hover:bg-fuchsia-500/[0.01] transition-colors duration-150"
                      >
                        <TableCell className="pl-8 py-5">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold text-[11px] border-fuchsia-500/20 text-fuchsia-600 bg-fuchsia-500/5 px-2.5 py-0.5 rounded-md"
                          >
                            {inv.invoice_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <p className="font-semibold text-sm text-foreground">
                            {inv.talents?.full_name || "Unverified Profile"}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground/70">
                            {inv.talents?.email || "No email linked"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-sm text-fuchsia-600">
                            {inv.bundle_credits.toLocaleString()} credits
                          </div>
                          <div className="text-[11px] font-semibold text-muted-foreground">
                            ${Number(inv.bundle_price_usd).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-bold text-[10px] uppercase tracking-wider border px-2.5 py-0.5 rounded-full shadow-none",
                              meta.className,
                            )}
                          >
                            <Icon className="h-3 w-3 mr-1 shrink-0" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground/70">
                          {format(new Date(inv.created_at), "dd MMM, HH:mm")}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-4 rounded-xl font-bold text-xs hover:bg-fuchsia-600 hover:text-white transition-all shadow-sm opacity-40 group-hover:opacity-100"
                            onClick={() => setSelected(inv)}
                          >
                            Review Order
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

      {/* COMPONENT DETAIL SHEET MODAL */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl border border-border/40 p-0 overflow-hidden bg-card rounded-2xl shadow-xl text-left animate-in fade-in duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 to-pink-600" />
            <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                      <Zap className="h-6 w-6 text-fuchsia-500 fill-fuchsia-500/10 shrink-0" /> Invoice #
                      {selected.invoice_number}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground mt-1">
                      Reviewing user details and settlement metadata variables.
                    </DialogDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tracking-tight text-fuchsia-600">
                      {selected.bundle_credits.toLocaleString()} credits
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                      Order Price: ${Number(selected.bundle_price_usd).toFixed(2)}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-y border-border/40">
                <div className="space-y-3.5">
                  <DetailRow label="User Account" value={selected.talents?.full_name || "—"} />
                  <DetailRow label="Email Link" value={selected.talents?.email || "—"} />
                  <DetailRow label="Channel Ingress" value={selected.channel || "Manual"} />
                  <DetailRow label="Current Status" value={STATUS_BADGE[selected.status]?.label || selected.status} />
                </div>
                <div className="space-y-3.5">
                  {selected.payment_method && <DetailRow label="Payment Mode" value={selected.payment_method} />}
                  {selected.payment_reference && (
                    <DetailRow label="Transaction Ref" value={selected.payment_reference} />
                  )}
                  {selected.payment_proof_url && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl font-bold text-xs gap-2 border border-border"
                        asChild
                      >
                        <a
                          href={selected.payment_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          Bertram-id="download-link"
                        >
                          <FileText className="h-4 w-4 shrink-0" /> View Receipt Image{" "}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {selected.admin_notes && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-[10px] font-bold uppercase text-fuchsia-600 tracking-wider mb-1">
                    Internal Internal Notes
                  </p>
                  <p className="text-xs font-medium leading-relaxed text-muted-foreground">{selected.admin_notes}</p>
                </div>
              )}

              <DialogFooter className="pt-2 gap-3 flex-col sm:flex-row">
                {selected.talents?.phone && (
                  <Button
                    variant="outline"
                    className="h-10 px-4 rounded-xl font-bold text-xs gap-2 border border-border"
                    onClick={() => {
                      const phone = selected.talents!.phone!.replace(/[^0-9]/g, "");
                      const msg = encodeURIComponent(
                        `Hi ${selected.talents?.full_name || "there"}, regarding your GroUp Academy Invoice ${selected.invoice_number}...`,
                      );
                      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500 shrink-0" /> WhatsApp Customer
                  </Button>
                )}
                {!selected.credits_disbursed && selected.status !== "cancelled" && (
                  <div className="flex-1 flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setCancelOpen(true)}
                      className="font-bold text-xs text-destructive hover:bg-destructive/5 px-4 rounded-xl transition-colors ml-auto sm:ml-0"
                    >
                      Cancel Order
                    </Button>
                    <Button
                      onClick={() => setApproveOpen(true)}
                      className="flex-1 h-10 rounded-xl font-bold text-xs gap-2 shadow-sm bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                    >
                      <ShieldCheck className="h-4 w-4 fill-current shrink-0" /> Approve & Fulfill Credits
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODALS HOOK CONTAINER */}
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

interface KpiNodeProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}

function KpiNode({ label, value, subtext, icon: Icon, color }: KpiNodeProps) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden group hover:border-fuchsia-500/30 transition-all duration-200">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-2xl bg-muted/40 border border-border/10 transition-transform duration-300 group-hover:scale-105",
            color,
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtext && <p className="text-[10px] font-semibold text-muted-foreground/50 truncate mt-0.5">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs font-semibold text-muted-foreground/70">{label}</span>
      <span className="font-bold text-sm tracking-tight text-foreground text-right">{value}</span>
    </div>
  );
}

function ApproveDialog({ open, onOpenChange, invoice, onDone }: any) {
  const [method, setMethod] = useState("bkash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Processing balance adjustment...");
    try {
      let proofUrl: string | null = null;
      if (file) {
        const path = `proofs/${invoice.id}/${Date.now()}-${file.name}`;
        await uploadPaymentProof(path, file);
        proofUrl = await createPaymentProofSignedUrl(path, 60 * 60 * 24 * 365).catch(() => path);
      }
      const result = await approveInvoiceAndDisburse({
        invoiceId: invoice.id,
        paymentMethod: method,
        paymentReference: reference || null,
        paymentProofUrl: proofUrl,
        adminNotes: notes || null,
      });
      if (!result?.success) throw new Error(result?.error || "Fulfillment request rejected");
      toast.success(`Successfully added ${result.credits_added} credits to account`, { id: toastId });
      onDone();
    } catch (err: any) {
      toast.error("Execution error: " + err.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-border/40 bg-card p-6 text-left animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Approve Order Fulfillment</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground mt-1">
            Fulfill and disburse {invoice.bundle_credits} credits to {invoice.talents?.full_name || "user account"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground ml-0.5">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-11 rounded-xl border font-semibold text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border">
                <SelectItem value="bkash" className="font-semibold text-xs">
                  bKash Balance Transfer
                </SelectItem>
                <SelectItem value="nagad" className="font-semibold text-xs">
                  Nagad Mobile Wallet
                </SelectItem>
                <SelectItem value="bank" className="font-semibold text-xs">
                  Direct Bank Transfer
                </SelectItem>
                <SelectItem value="other" className="font-semibold text-xs">
                  Alternative Gateway Channel
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground ml-0.5">Payment Reference (Transaction ID)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-11 rounded-xl border font-medium text-sm"
              placeholder="e.g. TRX1094832"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground ml-0.5">
              Receipt / Statement Upload (PDF/Image)
            </Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="h-11 rounded-xl border border-dashed bg-muted/20 cursor-pointer pt-2 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold text-xs rounded-xl">
            Go Back
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-11 px-5 rounded-xl font-bold text-xs gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          >
            {submitting ? <Clock className="animate-spin h-4 w-4 shrink-0" /> : <Upload className="h-4 w-4 shrink-0" />}{" "}
            Fulfill Allocation
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
      await cancelInvoice({ invoiceId: invoice.id, reason: reason || null });
      toast.success("Invoice cancelled successfully");
      onDone();
    } catch (err: any) {
      toast.error("Operation failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-border/40 bg-card p-6 text-left animate-in fade-in duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">Cancel Credit Invoice</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground mt-1">
            Void invoice reference #{invoice.invoice_number} and discard outstanding credit disbursement loops.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide cancellation parameters or feedback reasoning for account logs..."
            className="rounded-xl border bg-muted/20 text-xs p-3.5 font-medium leading-relaxed"
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold text-xs rounded-xl">
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={submitting}
            className="h-11 px-5 rounded-xl font-bold text-xs"
          >
            Confirm Void Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InvoicesTab;
