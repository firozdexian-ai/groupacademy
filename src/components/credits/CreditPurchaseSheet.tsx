import { useState } from "react";
import { Coins, MessageCircle, Check, Sparkles, CreditCard, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { SUPPORT_CONFIG, getCreditPurchaseMessage } from "@/lib/constants/support";
import { usePaymentConfig } from "@/hooks/usePaymentConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Fiscal Ingress Controller (CreditPurchaseSheet)
 * CTO Reference: Authoritative interface for bundle acquisition and gateway routing.
 */

export function CreditPurchaseSheet({
  isOpen,
  onClose,
  currentBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}) {
  const { showWhatsApp, showStripe, isStripeConfigured } = usePaymentConfig();
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const handleWhatsAppSync = async (credits: number, price: number) => {
    let invoiceNumber: string | undefined;
    try {
      const { data, error } = await supabase.rpc("create_credit_invoice", {
        p_bundle_credits: credits,
        p_bundle_price_usd: price,
      });
      if (error) throw error;
      const result = data as { success: boolean; invoice_number?: string };
      if (result?.success) {
        invoiceNumber = result.invoice_number;
        toast.success(`INVOICE_${result.invoice_number}_STAGED`);
      }
    } catch (err) {
      console.error("LEDGER_FAULT:", err);
    }
    const message = getCreditPurchaseMessage(credits, price, currentBalance, invoiceNumber);
    window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleStripeHandshake = async (credits: number, price: number) => {
    setCheckoutLoading(credits);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return toast.error("AUTH_REQUIRED");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          credits,
          priceInCents: Math.round(price * 100),
          successUrl: `${window.location.origin}/app/feed?checkout=success`,
          cancelUrl: `${window.location.origin}/app/feed?checkout=cancelled`,
        },
      });

      if (error || !data?.url) throw new Error("GATEWAY_SYNC_FAULT");
      window.location.href = data.url;
    } catch (err) {
      toast.error("TRANSACTION_FAULT: Contact Faculty Support");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleBundleClick = (credits: number, price: number) => {
    if (showStripe && isStripeConfigured) {
      handleStripeHandshake(credits, price);
    } else if (showWhatsApp) {
      handleWhatsAppSync(credits, price);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-auto sm:max-h-[92vh] rounded-t-[40px] border-t-2 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden"
      >
        {/* HUD: HEADER_SYNC */}
        <div className="p-8 pb-4 border-b-2 border-border/10">
          <SheetHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shadow-lg shadow-warning/5">
                <Coins className="h-6 w-6 text-warning animate-pulse" />
              </div>
              <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Acquire_Capital</SheetTitle>
            </div>
            <SheetDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              {showStripe && isStripeConfigured ? "STRIPE_SECURE_SYNC_ACTIVE" : "WHATSAPP_LEDGER_SYNC_ACTIVE"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-8 pt-6 space-y-8 overflow-y-auto no-scrollbar max-h-[calc(90vh-140px)]">
          {/* HUD: BALANCE_LEDGER */}
          <div className="flex items-center justify-between p-6 rounded-[28px] bg-card border-2 border-border/40 shadow-inner relative overflow-hidden">
            <Zap className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 rotate-12" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-1">
                Current_Vault
              </span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-black italic text-emerald-600 uppercase">Verified_Liquidity</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/50 px-5 py-3 rounded-2xl border-2 border-border/20 shadow-xl">
              <Coins className="h-5 w-5 text-warning fill-current" />
              <span className="text-3xl font-black italic tracking-tighter tabular-nums">{currentBalance}</span>
            </div>
          </div>

          {/* BUNDLE_GRID: YIELD_MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDIT_CONFIG.BUNDLES.map((bundle, index) => {
              const isHighYield = index === 2;
              const isLoading = checkoutLoading === bundle.credits;
              return (
                <Card
                  key={bundle.credits}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-500 rounded-[24px] border-2 overflow-hidden",
                    "bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary hover:shadow-[0_20px_50px_rgba(var(--primary),0.1)] active:scale-95",
                    isHighYield && "border-primary/40 bg-primary/5 shadow-2xl scale-[1.02]",
                  )}
                  onClick={() => handleBundleClick(bundle.credits, bundle.price)}
                >
                  {isHighYield && (
                    <Badge className="absolute top-3 right-3 bg-primary text-white font-black italic text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">
                      HIGH_YIELD_NODE
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6",
                            isHighYield ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Coins className="h-6 w-6" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-black italic tracking-tighter tabular-nums">
                            {bundle.credits}
                          </span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground italic">
                            GRO_CREDITS
                          </span>
                        </div>
                      </div>
                      {bundle.savings > 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-black italic text-[9px] px-2 h-6"
                        >
                          YIELD_+${bundle.savings}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/10">
                      <span className="text-2xl font-black italic text-foreground tracking-tighter">
                        ${bundle.price}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-40">
                        <span className="text-[9px] font-bold uppercase tracking-widest italic">
                          ${(bundle.price / bundle.credits).toFixed(3)}_UNIT
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* HUD: TRUST_BAR */}
          <div className="flex items-center gap-4 p-5 bg-muted/20 border-2 border-border/10 rounded-2xl">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 opacity-40" />
            <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground/80">
              Institutional capital ingress is protected via{" "}
              <span className="text-primary font-black not-italic">AES-256</span> encryption protocols. Yield is
              distributed across career readiness artifacts.
            </p>
          </div>
        </div>

        {/* HUD: TRANSACTION_FOOTER */}
        <div className="p-8 pt-4 border-t-2 border-border/10 bg-muted/5">
          <div className="flex flex-col gap-4">
            {showWhatsApp && (
              <Button
                variant={showStripe && isStripeConfigured ? "outline" : "default"}
                className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all gap-4"
                onClick={() => handleWhatsAppSync(500, 9)}
              >
                <MessageCircle className="h-6 w-6 fill-current opacity-30" /> INITIALIZE_WHATSAPP_LEDGER
              </Button>
            )}
            <div className="flex items-center justify-center gap-3 opacity-30">
              <div className="h-[1px] flex-1 bg-border" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Encrypted_Ingress_Channel</span>
              <div className="h-[1px] flex-1 bg-border" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
