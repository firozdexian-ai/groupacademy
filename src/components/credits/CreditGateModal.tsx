import { useState } from 'react';
import { Coins, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreditGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onBuyCredits: () => void;
  serviceName: string;
  cost: number;
  currentBalance: number;
  isFirstUse: boolean;
  isLoading?: boolean;
}

export function CreditGateModal({
  isOpen,
  onClose,
  onConfirm,
  onBuyCredits,
  serviceName,
  cost,
  currentBalance,
  isFirstUse,
  isLoading = false,
}: CreditGateModalProps) {
  const canAfford = currentBalance >= cost;
  const balanceAfter = currentBalance - cost;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFirstUse ? (
              <>
                <Sparkles className="h-5 w-5 text-accent" />
                First Use - FREE!
              </>
            ) : canAfford ? (
              <>
                <Coins className="h-5 w-5 text-warning" />
                Confirm Credit Usage
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                Insufficient Credits
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFirstUse
              ? `Your first ${serviceName} is completely free!`
              : canAfford
              ? `This will use credits from your balance.`
              : `You don't have enough credits for ${serviceName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="font-medium">{serviceName}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Cost</span>
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-warning" />
              <span className={cn(
                "font-semibold",
                isFirstUse && "line-through text-muted-foreground"
              )}>
                {cost}
              </span>
              {isFirstUse && (
                <span className="font-semibold text-accent ml-1">FREE</span>
              )}
            </div>
          </div>

          {!isFirstUse && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className="font-semibold">{currentBalance}</span>
                </div>
              </div>

              {canAfford && (
                <div className="flex items-center justify-between p-3 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <span className="text-sm font-medium">Balance After</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-warning" />
                    <span className="font-bold text-primary">{balanceAfter}</span>
                  </div>
                </div>
              )}

              {!canAfford && (
                <div className="flex items-center justify-between p-3 border-2 border-destructive/20 rounded-lg bg-destructive/5">
                  <span className="text-sm font-medium text-destructive">Credits Needed</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-destructive" />
                    <span className="font-bold text-destructive">{cost - currentBalance}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canAfford || isFirstUse ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : isFirstUse ? (
                  <>
                    Start Free
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Proceed
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onBuyCredits}>
                <Coins className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
