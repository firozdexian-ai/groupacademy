import { Coins, MessageCircle, Check, Sparkles } from 'lucide-react';
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
import { CREDIT_CONFIG, creditsToTaka } from '@/lib/creditPricing';
import { cn } from '@/lib/utils';

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
  const handlePurchase = (credits: number, price: number) => {
    const message = encodeURIComponent(
      `Hi, I want to purchase ${credits} credits for BDT ${price}. My current balance is ${currentBalance} credits.`
    );
    window.open(`https://wa.me/8801708459008?text=${message}`, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-h-[90vh]">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-warning" />
            Buy Credits
          </SheetTitle>
          <SheetDescription>
            Choose a credit bundle. Pay via bKash/Nagad on WhatsApp.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
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
              const isPopular = index === 2; // 1000 credits bundle
              return (
                <Card
                  key={bundle.credits}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                    isPopular && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handlePurchase(bundle.credits, bundle.price)}
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
                        <Coins className="h-5 w-5 text-warning" />
                        <span className="text-xl font-bold">{bundle.credits}</span>
                      </div>
                      {bundle.savings > 0 && (
                        <Badge variant="secondary" className="text-accent">
                          Save ৳{bundle.savings}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">৳{bundle.price}</span>
                      <span className="text-xs text-muted-foreground">
                        ৳{(bundle.price / bundle.credits).toFixed(1)}/credit
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">What you can do with credits:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Career Assessments (50 credits each)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                AI Mock Interviews (50 credits each)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Salary Analysis (50 credits each)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Job Applications (25 credits after 5 free)
              </li>
            </ul>
          </div>

          {/* WhatsApp CTA */}
          <Button className="w-full" size="lg" onClick={() => handlePurchase(500, 900)}>
            <MessageCircle className="mr-2 h-5 w-5" />
            Purchase on WhatsApp
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Payment via bKash, Nagad, or bank transfer. Credits added within 30 minutes.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
