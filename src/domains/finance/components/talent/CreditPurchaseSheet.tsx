import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";
import { createCreditInvoice } from "@/domains/finance/repo/financeRepo";
import { createCheckout } from "@/domains/finance/api/financeApi";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { SUPPORT_CONFIG, getCreditPurchaseMessage } from "@/lib/constants/support";
import { usePaymentConfig } from "@/domains/finance/hooks/usePaymentConfig";
import { toast } from "sonner";

import { Coins, MessageCircle, Zap, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InlineSpinner } from "@/components/common/InlineSpinner";

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
 * GroUp Academy: Wallet & Credit Purchase Controller
 * Handles secure customer account top-ups and checkout session generation.
 */
export function CreditPurchaseSheet({ isOpen, onClose, currentBalance = 0 }: CreditPurchaseSheetProps) {
  const qc = useQueryClient();
  const { showWhatsApp, showStripe, isStripeConfigured } = usePaymentConfig();
  const [activeProcessingCredits, setActiveProcessingCredits] = useState<number | null>(null);

  const queryKeyBalanceContext = useMemo(() => ["user-credits-balance"], []);

  // --- ACTION: WHATSAPP RECONCILIATION INVOICE MUTATION ---
  const whatsappSyncMutation = useMutation({
    mutationKey: ["sync-whatsapp-invoice-ledger"],
    mutationFn: async (payload: BundlePayload): Promise<string | undefined> => {
      const result = await createCreditInvoice({
        credits: payload.credits,
        priceUsd: payload.price,
      });
      if (result?.success) {
        return result.invoice_number;
      }
      return undefined;
    },
    onSuccess: (invoiceNumber, payload) => {
      if (invoiceNumber) {
        toast.success(`Invoice ${invoiceNumber} created successfully.`);
      }
      
      const outboundMessageString = getCreditPurchaseMessage(payload.credits, payload.price, currentBalance, invoiceNumber);
      const secureWhatsAppLink = `${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(outboundMessageString)}`;
      
      window.open(secureWhatsAppLink, "_blank", "noopener,noreferrer");
    },
    onError: (err: any) => {
      console.error("[Wallet Operations] Error creating WhatsApp invoice:", err);
      toast.error("Invoice creation delayed. Connecting you directly with billing support.");
      
      const explicitMessageFallback = getCreditPurchaseMessage(500, 9, currentBalance, undefined);
      window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(explicitMessageFallback)}`, "_blank");
    }
  });

  // --- ACTION: STRIPE CHECKOUT GATEWAY MUTATION ---
  const stripeCheckoutMutation = useMutation({
    mutationKey: ["create-stripe-checkout-session"],
    mutationFn: async (payload: BundlePayload): Promise<string> => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("AUTH_REQUIRED");
      }

      let data: { url?: string };
      try {
        data = await createCheckout({
          credits: payload.credits,
          priceInCents: Math.round(payload.price * 100),
          successUrl: `${window.location.origin}/app/feed?checkout=success`,
          cancelUrl: `${window.location.origin}/app/feed?checkout=cancelled`,
        });
      } catch {
        throw new Error("GATEWAY_SYNC_FAULT");
      }

      if (!data?.url) {
        throw new Error("GATEWAY_SYNC_FAULT");
      }
      return String(data.url);
    },
    onSuccess: (checkoutRedirectUrl) => {
      window.location.href = checkoutRedirectUrl;
    },
    onError: (err: Error) => {
      console.error("[Wallet Operations] Stripe checkout session generation failed:", err.message);
      toast.error(err.message === "AUTH_REQUIRED" ? "Please sign in to continue." : "Payment gateway error. Please try again or contact support.");
    },
    onSettled: () => {
      setActiveProcessingCredits(null);
    }
  });

  const isGlobalPendingState = whatsappSyncMutation.isPending || stripeCheckoutMutation.isPending;

  // --- HANDLER: BUNDLE SELECTION ROUTING ---
  const handleBundleSelectionHandshake = (credits: number, price: number) => {
    if (isGlobalPendingState) return;

    const payload: BundlePayload = { credits, price };

    if (showStripe && isStripeConfigured) {
      setActiveProcessingCredits(credits);
      stripeCheckoutMutation.mutate(payload);
    } else if (showWhatsApp) {
      whatsappSyncMutation.mutate(payload);
    } else {
      toast.error("No active payment channels are configured for your account.");
    }
  };

  const handleCloseSheetViewport = () => {
    if (isGlobalPendingState) return;
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && handleCloseSheetViewport()}>
      <SheetContent
        side="bottom"
        onPointerDownOutside={(e) => isGlobalPendingState && e.preventDefault()}
        className="h-[90vh] sm:h-auto sm:max-h-[92vh] rounded-t-[40px] border-t-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden select-none text-left"
      >
        <div className="p-8 pb-4 border-b border-border/10 bg-muted/5">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg">
                <Coins className="h-6 w-6 text-amber-500 animate-pulse shrink-0" />
              </div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">Add Wallet Credits</SheetTitle>
            </div>
            <SheetDescription className="text-xs font-semibold tracking-wider text-muted-foreground/80 pt-0.5">
              {showStripe && isStripeConfigured ? "Secure payment processing via Stripe" : "Manual payment verification via support"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-8 pt-6 space-y-6 overflow-y-auto no-scrollbar max-h-[calc(90vh-140px)]">
          {/* CURRENT BALANCE VIEW */}
          <div className="flex items-center justify-between p-5 rounded-[28px] bg-card border border-border/60 shadow-inner relative overflow-hidden">
            <Zap className="absolute -top-4 -right-4 h-24 w-24 text-primary opacity-5 rotate-12 pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground/80 mb-1">
                Available Wallet Balance
              </span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Verified Funds</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/50 px-5 py-3 rounded-2xl border border-border/20 shadow-sm">
              <Coins className="h-5 w-5 text-amber-500 fill-current shrink-0" />
              <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">{currentBalance}</span>
            </div>
          </div>

          {/* BUNDLES MATRIX GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(CREDIT_CONFIG.BUNDLES || []).map((bundle, index) => {
              const isBestValue = index === 2;
              const isThisCardLoading = activeProcessingCredits === bundle.credits && stripeCheckoutMutation.isPending;

              return (
                <Card
                  key={bundle.credits}
                  tabIndex={isGlobalPendingState ? -1 : 0}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-300 rounded-[24px] border-2 overflow-hidden outline-none focus:border-primary",
                    "bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary hover:shadow-md active:scale-[0.99]",
                    isBestValue && "border-primary/40 bg-primary/5 shadow-md scale-[1.01] focus:border-primary",
                    isGlobalPendingState && "opacity-60 cursor-not-allowed active:scale-100 focus:border-border/40 hover:border-border/40 hover:shadow-none"
                  )}
                  onClick={() => handleBundleSelectionHandshake(bundle.credits, bundle.price)}
                  onKeyDown={(e) => e.key === "Enter" && handleBundleSelectionHandshake(bundle.credits, bundle.price)}
                >
                  {isBestValue && (
                    <Badge className="absolute top-3 right-3 bg-primary text-white font-bold text-[9px] px-3 py-1 rounded-lg z-10">
                      Best Value
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 shrink-0",
                            isBestValue ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                            isThisCardLoading && "bg-primary/20 scale-100 group-hover:scale-100"
                          )}
                        >
                          {isThisCardLoading ? (
                            <InlineSpinner size="md" />
                          ) : (
                            <Coins className="h-5 w-5 fill-current opacity-80" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground leading-none">
                            {bundle.credits}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider mt-1">
                            Credits
                          </span>
                        </div>
                      </div>
                      {bundle.savings > 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-bold text-[10px] px-2 h-6 tracking-wide shrink-0 rounded-md"
                        >
                          Save ${bundle.savings}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/10">
                      <span className="text-2xl font-bold text-foreground tracking-tight">
                        ${bundle.price}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-50 text-[10px] font-semibold tracking-wider">
                        <span>${(bundle.price / bundle.credits).toFixed(3)} / credit</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* SECURE TRUST BANNER */}
          <div className="flex items-start gap-4 p-5 bg-muted/20 border border-border/10 rounded-2xl">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 opacity-60 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/90">
              Payments are protected with end-to-end security encryption protocols. Your account balance will update automatically upon successful transaction confirmation.
            </p>
          </div>
        </div>

        {/* WhatsApp Manual Top-up Action */}
        {showWhatsApp && (
          <div className="p-8 pt-4 border-t border-border/10 bg-muted/5">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant={showStripe && isStripeConfigured ? "outline" : "default"}
                disabled={isGlobalPendingState}
                className="w-full h-16 rounded-[24px] font-bold tracking-wider shadow-sm active:scale-[0.98] transition-all gap-3 border border-border text-sm"
                onClick={() => handleBundleSelectionHandshake(500, 9)}
              >
                {whatsappSyncMutation.isPending ? (
                  <InlineSpinner size="md" />
                ) : (
                  <MessageCircle className="h-5 w-5 fill-current opacity-60" />
                )}
                {whatsappSyncMutation.isPending ? "Generating invoice..." : "Top up via WhatsApp"}
              </Button>
              <div className="flex items-center justify-center gap-3 opacity-30">
                <div className="h-[1px] flex-1 bg-border" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Secure Verification Channel</span>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}