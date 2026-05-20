import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isValid } from "date-fns";
import { useTalent } from "@/hooks/useTalent";
import { SUPPORT_CONFIG } from "@/lib/constants/support";
import { cn } from "@/lib/utils";

// UI Primitive Matrix Registries
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
  pending: { label: "AUDITING", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  awaiting_payment: {
    label: "AWAITING_SYNC",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: { label: "VERIFIED", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ShieldCheck },
  cancelled: { label: "VOID", className: "bg-muted text-muted-foreground border-border/10", icon: XCircle },
  refunded: { label: "REVERSED", className: "bg-muted text-muted-foreground border-border/10", icon: XCircle },
};

/**
 * GroUp Academy: Fiscal Audit Ledger Node (V5.6.0)
 * CTO Reference: Authoritative historical record list logging talent capital collections.
 * Architecture: Optimized via pre-parsed memoized data transformations eliminating inline object instantiation leaks.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function MyInvoicesList() {
  const { talent } = useTalent();

  // --- SENSOR: CORE_LEDGER_DATA_STREAM_QUERY ---
  const { data: rawInvoices, isLoading } = useQuery<InvoiceRow[], Error>({
    queryKey: ["my-credit-invoices", talent?.id],
    enabled: !!talent?.id,
    staleTime: 30 * 1000, // 30-second ledger consistency caching boundary
    queryFn: async (): Promise<InvoiceRow[]> => {
      // HUD: RUNNING_INVOICE_LEDGER_INGRESS_SELECT
      const { data, error } = await supabase
        .from("credit_invoices")
        .select("*")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Digital Workforce] FAULT: credit_invoices ledger lookup failed.", error);
        throw error;
      }
      return (data || []) as InvoiceRow[];
    },
  });

  // --- PHASE: TOTAL_LEDGER_NORMALIZATION_MATRIX ---
  // Architecture Fix: Memoize data formats entirely to block layout render-time parsing overloads
  const processedInvoices = useMemo((): Array<
    InvoiceRow & { meta: (typeof LEDGER_META)[string]; formattedDate: string }
  > => {
    if (!rawInvoices || !Array.isArray(rawInvoices)) return [];

    return rawInvoices.map((inv) => {
      const statusMeta = LEDGER_META[inv.status] || LEDGER_META.pending;
      const dateInstance = new Date(inv.created_at);

      let formattedDate = "SYNC_PENDING";
      if (isValid(dateInstance)) {
        try {
          formattedDate = String(format(dateInstance, "dd_MMM_yyyy_HH:mm")).toUpperCase();
        } catch {
          // Fallback protects rows from collapsing during structural date conversions
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
            className="h-[128px] w-full rounded-2xl bg-muted/20 border-2 opacity-40"
          />
        ))}
      </div>
    );
  }

  if (processedInvoices.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[32px] select-none animate-in fade-in duration-300">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 border border-border/10">
            <Zap className="h-5 w-5 text-muted-foreground/30 shrink-0" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic font-mono">
            LEDGER_EMPTY: NO_TRANSACTIONS_DETECTED
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500 text-left select-none">
      {processedInvoices.map((inv) => {
        const StatusIcon = inv.meta.icon;

        const handleSupportSyncHandshake = () => {
          const cleanRef = String(inv.invoice_number || "N/A").trim();
          const cleanCredits = Number(inv.bundle_credits || 0);
          const cleanPrice = Number(inv.bundle_price_usd || 0).toFixed(2);

          const outboundMessagePayload = encodeURIComponent(
            `PROTOCOL_SYNC: Inquiry for Invoice ${cleanRef} | Payload: ${cleanCredits} Credits ($${cleanPrice}).`,
          );

          // HUD: DISPATCHING_EXTERNAL_LEDGER_ASSISTANCE_WORKFLOW
          window.open(
            `${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${outboundMessagePayload}`,
            "_blank",
            "noopener,noreferrer",
          );
        };

        return (
          <Card
            key={inv.id}
            className="group overflow-hidden rounded-2xl border-2 border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-xl"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-mono text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase truncate">
                    Ref: {inv.invoice_number}
                  </div>
                  <div className="text-base font-black italic tracking-tighter uppercase leading-none text-foreground font-mono">
                    {inv.bundle_credits}_CREDITS <span className="mx-1 text-muted-foreground/30 not-italic">|</span> $
                    {Number(inv.bundle_price_usd).toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest font-mono">
                    SYNC_{inv.formattedDate}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-black uppercase italic tracking-widest h-7 px-3 border-2 rounded-lg shrink-0 transition-colors",
                    inv.meta.className,
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {inv.meta.label}
                </Badge>
              </div>

              {/* HUD CONDITIONAL ACCREDITED VERIFICATION SUBSECTION */}
              {inv.status === "paid" && (
                <div className="flex items-center justify-between pt-4 border-t border-border/10 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    SYNCED_VIA_{inv.payment_method?.toUpperCase() || "SYSTEM"}
                  </div>
                  {inv.payment_proof_url && (
                    <a
                      href={inv.payment_proof_url}
                      target="_blank"
                      Bertram-id="download-link"
                      rel="noreferrer noopener"
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary/60 shrink-0" /> DOWNLOAD_ARTIFACT
                    </a>
                  )}
                </div>
              )}

              {/* MUTATION CALLBACK EXTERNAL ACTION FALLBACK TRIGGER */}
              {(inv.status === "pending" || inv.status === "awaiting_payment") && (
                <Button
                  size="sm"
                  type="button"
                  className="w-full h-11 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 transition-all active:scale-[0.99] shadow-md hover:shadow-lg shadow-primary/5"
                  onClick={handleSupportSyncHandshake}
                >
                  <MessageCircle className="h-4 w-4 fill-current opacity-40 shrink-0" />
                  CONTINUE_WHATSAPP_LEDGER
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
