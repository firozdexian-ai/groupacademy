import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { SUPPORT_CONFIG, getCreditPurchaseMessage } from "@/lib/constants/support";
import { usePaymentConfig } from "@/hooks/usePaymentConfig";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Coins, MessageCircle, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CreditPurchaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

interface BundlePayload {
  credits: number;
  price: number;
}

/**
 * GroUp Academy: Fiscal Ingress Controller (V5.6.0)
 * CTO Reference: Control sheet provisioning automated credit bundle checkout handshakes.
 * Architecture: Mutation-isolated click boundaries preventing concurrent duplicate gate invocations.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function CreditPurchaseSheet({ isOpen, onClose, currentBalance = 0 }: CreditPurchaseSheetProps) {
  const qc = useQueryClient();
  const { showWhatsApp, showStripe, isStripeConfigured } = usePaymentConfig();
  const [activeProcessingCredits, setActiveProcessingCredits] = useState<number | null>(null);

  const queryKeyBalanceContext = useMemo(() => ["user-credits-balance"], []);

  // --- ACTION: WHATSAPP_LEDGER_SYNC_MUTATION ---
  const whatsappSyncMutation = useMutation({
    mutationKey: ["sync-whatsapp-invoice-ledger"],
    mutationFn: async (payload: BundlePayload): Promise<string | undefined> => {
      // HUD: STAGING_LOCAL_LEDGER_INVOICE_ROW
      const { data, error } = await supabase.rpc("create_credit_invoice", {
        p_bundle_credits: payload.credits,
        p_bundle_price_usd: payload.price,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; invoice_number?: string };
      if (result?.success) {
        return result.invoice_number;
      }
      return undefined;
    },
    onSuccess: (invoiceNumber, payload) => {
      if (invoiceNumber) {
        toast.success(`INVOICE_${invoiceNumber}_STAGED`);
      }
      
      const outboundMessageString = getCreditPurchaseMessage(payload.credits, payload.price, currentBalance, invoiceNumber);
      const secureWhatsAppLink = `${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(outboundMessageString)}`;
      
      window.open(secureWhatsAppLink, "_blank", "noopener,noreferrer");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] FAULT: WhatsApp RPC ledger commit failed.", err);
      toast.error("Ledger compilation error. Bypassing directly to manual chat line.");
      
      // Fallback manual channel sync path execution
      const explicitMessageFallback = getCreditPurchaseMessage(500, 9, currentBalance, undefined);
      window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(explicitMessageFallback)}`, "_blank");
    }
  });

  // --- ACTION: STRIPE_CHECKOUT_GATEWAY_MUTATION ---
  const stripeCheckoutMutation = useMutation({
    mutationKey: ["create-stripe-checkout-session"],
    mutationFn: async (payload: BundlePayload): Promise<string> => {
      const { data: sessionRes, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionRes.session?.access_token) {
        throw new Error("AUTH_REQUIRED");
      }

      // HUD: INVOKING_STRIPE_CHECKOUT_EDGE_FUNCTION
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          credits: payload.credits,
          priceInCents: Math.round(payload.price * 100),
          successUrl: `${window.location.origin}/app/feed?checkout=success`,
          cancelUrl: `${window.location.origin}/app/feed?checkout=cancelled`,
        },
      });

      if (error || !data?.url) {
        throw new Error("GATEWAY_SYNC_FAULT");
      }
      return String(data.url);
    },
    onSuccess: (checkoutRedirectUrl) => {
      // Execute absolute hard redirect to unified payment gate canvas
      window.location.href = checkoutRedirectUrl;
    },
    onError: (err: Error) => {
      console.error("[Digital Workforce] ANOMALY: Stripe checkout session generation failed.", err.message);
      toast.error(err.message === "AUTH_REQUIRED" ? "Authentication Sync Required." : "Transaction pipeline drop. Contact Faculty Support.");
    },
    onSettled: () => {
      setActiveProcessingCredits(null);
    }
  });

  const isGlobalPendingState = whatsappSyncMutation.isPending || stripeCheckoutMutation.isPending;

  // --- HANDLER: SECURE_BUNDLE_CLICK_ROUTING ---
  const handleBundleSelectionHandshake = (credits: number, price: number) => {
    if (isGlobalPendingState) return; // Completely freeze subsequent pointer actions during active data flights

    const payload: BundlePayload = { credits, price };

    if (showStripe && isStripeConfigured) {
      setActiveProcessingCredits(credits);
      stripeCheckoutMutation.mutate(payload);
    } else if (showWhatsApp) {
      whatsappSyncMutation.mutate(payload);
    } else {
      toast.error("INTERFACE_ERROR: No payment gateways active for this node.");
    }
  };

  const handleCloseSheetViewport = () => {
    if (isGlobalPendingState) return; // Block dismiss loops mid-transit
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && handleCloseSheetViewport()}>
      <SheetContent
        side="bottom"
        onPointerDownOutside={(e) => isGlobalPendingState && e.preventDefault()}
        className="h-[90vh] sm:h-auto sm:max-h-[92vh] rounded-t-[40px] border-t-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden select-none text-left"
      >
        {/* HUD: HEADER_SECTOR_BAR */}
        <div className="p-8 pb-4 border-b-2 border-border/10 bg-muted/5">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shadow-lg">
                <Coins className="h-6 w-6 text-warning animate-pulse shrink-0" />
              </div>
              <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-foreground">Acquire_Capital</SheetTitle>
            </div>
            <SheetDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic font-mono pt-0.5">
              {showStripe && isStripeConfigured ? "STRIPE_SECURE_SYNC_ACTIVE" : "WHATSAPP_LEDGER_SYNC_ACTIVE"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-8 pt-6 space-y-6 overflow-y-auto no-scrollbar max-h-[calc(90vh-140px)]">
          {/* HUD: CURRENT_BALANCE_VAULT_LEDGER */}
          <div className="flex items-center justify-between p-5 rounded-[28px] bg-card border-2 border-border/40 shadow-inner relative overflow-hidden">
            <Zap className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 rotate-12 pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-1 font-mono">
                Current_Vault
              </span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-black italic text-emerald-600 uppercase tracking-wide">Verified_Liquidity</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/50 px-5 py-3 rounded-2xl border-2 border-border/20 shadow-xl font-mono">
              <Coins className="h-5 w-5 text-warning fill-current shrink-0" />
              <span className="text-3xl font-black italic tracking-tighter tabular-nums text-foreground">{currentBalance}</span>
            </div>
          </div>

          {/* BUNDLE_GRID: PACKAGES_YIELD_MATRIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(CREDIT_CONFIG.BUNDLES || []).map((bundle, index) => {
              const isHighYield = index === 2;
              const isThisCardLoading = activeProcessingCredits === bundle.credits && stripeCheckoutMutation.isPending;

              return (
                <Card
                  key={bundle.credits}
                  tabIndex={isGlobalPendingState ? -1 : 0}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-500 rounded-[24px] border-2 overflow-hidden outline-none focus:border-primary",
                    "bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary hover:shadow-[0_20px_50px_rgba(var(--primary),0.1)] active:scale-[0.99]",
                    isHighYield && "border-primary/40 bg-primary/5 shadow-2xl scale-[1.01] focus:border-primary",
                    isGlobalPendingState && "opacity-60 cursor-not-allowed active:scale-100 focus:border-border/40 hover:border-border/40 hover:shadow-none"
                  )}
                  onClick={() => handleBundleSelectionHandshake(bundle.credits, bundle.price)}
                  onKeyDown={(e) => e.key === "Enter" && handleBundleSelectionHandshake(bundle.credits, bundle.price)}
                >
                  {isHighYield && (
                    <Badge className="absolute top-3 right-3 bg-primary text-white font-black italic text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg z-10">
                      HIGH_YIELD_NODE
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6 shrink-0",
                            isHighYield ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                            isThisCardLoading && "bg-primary/20 rotate-0 scale-100 group-hover:scale-100 group-hover:rotate-0"
                          )}
                        >
                          {isThisCardLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <Coins className="h-5 w-5 fill-current opacity-80" />
                          )}
                        </div>
                        <div className="flex flex-col font-mono">
                          <span className="text-2xl font-black italic tracking-tighter tabular-nums text-foreground leading-none">
                            {bundle.credits}
                          </span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground/60 italic tracking-wider mt-1">
                            GRO_CREDITS
                          </span>
                        </div>
                      </div>
                      {bundle.savings > 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-black italic text-[9px] px-2 h-6 tracking-wide shrink-0 rounded-md"
                        >
                          YIELD_+${bundle.savings}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/10 font-mono">
                      <span className="text-2xl font-black italic text-foreground tracking-tighter">
                        ${bundle.price}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold uppercase tracking-widest italic">
                        <span>${(bundle.price / bundle.credits).toFixed(3)}_UNIT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* PRIVACY_NOTICE_HUD: CRYPTO PROTECTED ENVELOPE */}
          <div className="flex items-start gap-4 p-5 bg-muted/20 border-2 border-border/10 rounded-2xl">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 opacity-40 mt-0.5" />
            <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground/80">
              Institutional capital ingress is protected via{" "}
              <span className="text-primary font-black not-italic font-mono">AES-256</span> encryption protocols. Yield parameters are securely balanced across real-time diagnostic ledger lines seamlessly.
            </p>
          </div>
        </div>

        {/* HUD: FALLBACK_WHATSAPP_MANUAL_LEDGER_TRIGGER */}
        {showWhatsApp && (
          <div className="p-8 pt-4 border-t-2 border-border/10 bg-muted/5">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant={showStripe && isStripeConfigured ? "outline" : "default"}
                disabled={isGlobalPendingState}
                className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all gap-3 border-2 text-xs"
                onClick={() => handleBundleSelectionHandshake(500, 9)}
              >
                {whatsappSyncMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <MessageCircle className="h-5 w-5 fill-current opacity-40" />
                )}
                {whatsappSyncMutation.isPending ? "Staging Invoice Ledger..." : "Initialize WhatsApp Ledger"}
              </Button>
              <div className="flex items-center justify-center gap-3 opacity-20 font-mono">
                <div className="h-[1px] flex-1 bg-border" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Encrypted_Ingress_Channel</span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}