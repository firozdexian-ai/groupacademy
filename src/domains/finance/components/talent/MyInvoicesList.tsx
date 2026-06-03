import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyCreditInvoices } from "@/domains/finance/repo/financeRepo";
import { format, isValid } from "date-fns";
import { useTalent } from "@/hooks/useTalent";
import { SUPPORT_CONFIG } from "@/lib/constants/support";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Clock, XCircle, FileText, Zap, ShieldCheck } from "lucide-react";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  bundle_credits: number;
  bundle_price_usd: number;
  status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
}

const LEDGER_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Under Review", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  awaiting_payment: {
    label: "Awaiting Payment",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: { label: "Verified Paid", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ShieldCheck },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border/10", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground border-border/10", icon: XCircle },
};

/**
 * GroUp Academy: Customer Invoice History List
 * Renders an explicit audit trail of past credit invoices, purchase states, and receipts.
 */
export function MyInvoicesList() {
  const { talent } = useTalent();

  // Fetches transaction and receipt lines matching user profile parameters
  const { data: rawInvoices, isLoading } = useQuery<InvoiceRow[], Error>({
    queryKey: ["my-credit-invoices", talent?.id],
    enabled: !!talent?.id,
    staleTime: 30 * 1000, // 30-second memory consistency caching threshold
    queryFn: async (): Promise<InvoiceRow[]> => {
      try {
        const data = await listMyCreditInvoices(talent!.id, 50);
        return (data || []) as InvoiceRow[];
      } catch (error) {
        console.error("[Wallet Operations] Credit invoices historical query failure:", error);
        throw error;
      }
    },
  });

  // Normalize timestamp instances completely to protect view layout rendering execution speeds
  const processedInvoices = useMemo((): Array<
    InvoiceRow & { meta: (typeof LEDGER_META)[string]; formattedDate: string }
  > => {
    if (!rawInvoices || !Array.isArray(rawInvoices)) return [];

    return rawInvoices.map((inv) => {
      const statusMeta = LEDGER_META[inv.status] || LEDGER_META.pending;
      const dateInstance = new Date(inv.created_at);

      let formattedDate = "Pending Verification";
      if (isValid(dateInstance)) {
        try {
          formattedDate = format(dateInstance, "dd MMM yyyy, HH:mm");
        } catch {
          // Structural safety fallback preserves layout row constraints if data formatting encounters anomalies
        }
      }

      return {
        ...inv,
        meta: statusMeta,
        formattedDate,
      };
    });
  }, [rawInvoices]);

  if (isLoading) {
    return (
      <div className="space-y-3 select-none">
        {[1, 2, 3].map((idx) => (
          <Skeleton
            key={`skeleton-row-${idx}`}
            className="h-[128px] w-full rounded-2xl bg-muted/20 border border-border/10 opacity-40"
          />
        ))}
      </div>
    );
  }

  if (processedInvoices.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[32px] select-none animate-in fade-in duration-200">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 border border-border/10">
            <Zap className="h-5 w-5 text-muted-foreground/30 shrink-0" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground/60">
            No past transactions or invoices found on your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-300 text-left select-none">
      {processedInvoices.map((inv) => {
        const StatusIcon = inv.meta.icon;

        const handleSupportSyncHandshake = () => {
          const cleanRef = String(inv.invoice_number || "N/A").trim();
          const cleanCredits = Number(inv.bundle_credits || 0);
          const cleanPrice = Number(inv.bundle_price_usd || 0).toFixed(2);

          const outboundMessagePayload = encodeURIComponent(
            `Inquiry regarding Invoice Reference ${cleanRef} | Package: ${cleanCredits} Credits ($${cleanPrice}). Please help verify my payment.`
          );

          window.open(
            `${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${outboundMessagePayload}`,
            "_blank",
            "noopener,noreferrer"
          );
        };

        return (
          <Card
            key={inv.id}
            className="group overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-[11px] font-bold tracking-wider text-muted-foreground/50 uppercase truncate">
                    Invoice #{inv.invoice_number}
                  </div>
                  <div className="text-lg font-bold tracking-tight text-foreground">
                    {inv.bundle_credits} Credits <span className="mx-1 text-muted-foreground/30 font-normal">|</span> ${Number(inv.bundle_price_usd).toFixed(2)}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground/60 tracking-normal">
                    {inv.formattedDate}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider h-7 px-3 border rounded-lg shrink-0 transition-colors",
                    inv.meta.className
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {inv.meta.label}
                </Badge>
              </div>

              {/* PAID VERIFICATION METADATA BOX */}
              {inv.status === "paid" && (
                <div className="flex items-center justify-between pt-4 border-t border-border/10 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    Processed via {inv.payment_method || "Payment Gateway"}
                  </div>
                  {inv.payment_proof_url && (
                    <a
                      href={inv.payment_proof_url}
                      target="_blank"
                      Bertram-id="download-link"
                      rel="noreferrer noopener"
                      className="text-[11px] font-bold text-primary hover:text-primary/70 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary/60 shrink-0" /> Download Receipt
                    </a>
                  )}
                </div>
              )}

              {/* MANUAL INTERACTIVE SETTLEMENT ACTIONS BUTTON */}
              {(inv.status === "pending" || inv.status === "awaiting_payment") && (
                <Button
                  size="sm"
                  type="button"
                  className="w-full h-11 rounded-xl font-bold text-xs tracking-wide gap-2 transition-all active:scale-[0.99] shadow-sm shadow-primary/5"
                  onClick={handleSupportSyncHandshake}
                >
                  <MessageCircle className="h-4 w-4 fill-current opacity-60 shrink-0" />
                  Complete Payment via WhatsApp
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}