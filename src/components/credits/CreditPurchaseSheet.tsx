import { useState } from 'react';
import { Coins, MessageCircle, Check, Sparkles, CreditCard, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CREDIT_CONFIG } from '@/lib/creditPricing';
import { cn } from '@/lib/utils';
import { SUPPORT_CONFIG, getCreditPurchaseMessage } from '@/lib/constants/support';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditPurchaseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function CreditPurchaseSheet({
  isOpen,
  onClose,
  currentBalance,
}: CreditPurchaseSheetProps) {
  const { showWhatsApp, showStripe, isStripeConfigured } = usePaymentConfig();
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const handleWhatsAppPurchase = async (credits: number, price: number) => {
    let invoiceNumber: string | undefined;
    try {
      const { data, error } = await supabase.rpc('create_credit_invoice', {
        p_bundle_credits: credits,
        p_bundle_price_usd: price,
      });
      if (error) throw error;
      const result = data as { success: boolean; invoice_number?: string; error?: string };
      if (result?.success) {
        invoiceNumber = result.invoice_number;
        toast.success(`Invoice ${result.invoice_number} created — opening WhatsApp`);
      } else if (result?.error) {
        // Fall back to plain WhatsApp message even if invoice fails
        toast.error(result.error);
      }
    } catch (err) {
      console.error('create_credit_invoice failed:', err);
      // Continue without invoice — user can still chat
    }
    const message = getCreditPurchaseMessage(credits, price, currentBalance, invoiceNumber);
    window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleStripeCheckout = async (credits: number, price: number) => {
    setCheckoutLoading(credits);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error('Please sign in to purchase credits');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          credits,
          priceInCents: Math.round(price * 100),
          successUrl: `${window.location.origin}/app/feed?checkout=success`,
          cancelUrl: `${window.location.origin}/app/feed?checkout=cancelled`,
        },
      });

      if (error || !data?.url) {
        toast.error(data?.error || 'Failed to create checkout session');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleBundleClick = (credits: number, price: number) => {
    if (showStripe && isStripeConfigured) {
      handleStripeCheckout(credits, price);
    } else if (showWhatsApp) {
      handleWhatsAppPurchase(credits, price);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-h-[90vh]">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-warning" />
            Buy Credits
          </SheetTitle>
          <SheetDescription>
            Choose a credit bundle.{' '}
            {showStripe && isStripeConfigured
              ? 'Secure online payment via Stripe.'
              : 'Secure online payment via WhatsApp.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <div className="flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-warning" />
              <span className="text-xl font-bold">{currentBalance}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
          </div>

          {/* Bundles Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {CREDIT_CONFIG.BUNDLES.map((bundle, index) => {
              const isPopular = index === 2;
              const isLoading = checkoutLoading === bundle.credits;
              return (
                <Card
                  key={bundle.credits}
                  className={cn(
                    'relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                    isPopular && 'border-primary ring-2 ring-primary/20',
                    isLoading && 'opacity-70 pointer-events-none'
                  )}
                  onClick={() => handleBundleClick(bundle.credits, bundle.price)}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Coins className="h-5 w-5 text-warning" />
                        )}
                        <span className="text-xl font-bold">{bundle.credits}</span>
                      </div>
                      {bundle.savings > 0 && (
                        <Badge variant="secondary" className="text-accent">
                          Save ${bundle.savings}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${bundle.price}</span>
                      <span className="text-xs text-muted-foreground">
                        ${(bundle.price / bundle.credits).toFixed(3)}/credit
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Use for assessments, mock interviews, salary analysis, portfolio & more.
            </p>
          </div>

          {/* Payment CTAs */}
          <div className="space-y-2">
            {showWhatsApp && (
              <Button
                className="w-full"
                size="lg"
                variant={showStripe && isStripeConfigured ? 'outline' : 'default'}
                onClick={() => handleWhatsAppPurchase(500, 9)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Purchase on WhatsApp
              </Button>
            )}

            {showStripe && (
              <Button
                className="w-full"
                size="lg"
                variant={showWhatsApp ? (isStripeConfigured ? 'default' : 'outline') : 'default'}
                disabled={!isStripeConfigured || checkoutLoading !== null}
                onClick={() => handleStripeCheckout(500, 9)}
              >
                {checkoutLoading !== null ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                {isStripeConfigured ? 'Pay with Card' : 'Card Payments Coming Soon'}
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {showStripe && isStripeConfigured
              ? 'Secure checkout powered by Stripe. Credits added instantly.'
              : showWhatsApp
                ? 'Secure payment via card, bank transfer, or mobile wallet. Credits added within 30 minutes.'
                : 'Secure checkout powered by Stripe.'}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
