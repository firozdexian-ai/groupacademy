import { useMemo, useCallback } from "react";
import { Coins, AlertCircle, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

interface CreditGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onBuyCredits: () => void;
  serviceName: string;
  cost: number;
  currentBalance: number;
  isLoading?: boolean;
}

/**
 * GroUp Academy: Credit Authorization Gate Modal
 * Intercepts actions to verify adequate wallet funds before accessing premium platform tools.
 */
export function CreditGateModal({
  isOpen,
  onClose,
  onConfirm,
  onBuyCredits,
  serviceName = "Premium Service",
  cost = 0,
  currentBalance = 0,
  isLoading = false,
}: CreditGateModalProps) {
  
  // Calculate precise wallet balances and outstanding balance deltas safely
  const fiscalLedger = useMemo(() => {
    const costValue = Math.max(0, Number(cost));
    const balanceValue = Math.max(0, Number(currentBalance));
    const canAfford = balanceValue >= costValue;

    return {
      canAfford,
      balanceAfter: balanceValue - costValue,
      requiredDelta: costValue - balanceValue,
      cleanCost: costValue,
      cleanBalance: balanceValue,
    };
  }, [cost, currentBalance]);

  // Lock view interaction changes securely if background transactional mutations are processing
  const handleOpenToggleChange = useCallback(
    (nextOpenState: boolean) => {
      if (!nextOpenState && !isLoading && onClose) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  const handlePointerOutsideBlocker = useCallback(
    (e: Event) => {
      if (isLoading) {
        e.preventDefault(); // Defend against background pointer exit races mid-transit
      }
    },
    [isLoading],
  );

  const handleEscapeKeyBlocker = useCallback(
    (e: KeyboardEvent) => {
      if (isLoading) {
        e.preventDefault(); // Prevent keyboard closing overrides during payment processing
      }
    },
    [isLoading],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenToggleChange}>
      <DialogContent
        onPointerDownOutside={handlePointerOutsideBlocker}
        onEscapeKeyDown={handleEscapeKeyBlocker}
        className="sm:max-w-md rounded-[32px] border border-border/40 bg-card/90 backdrop-blur-3xl shadow-2xl overflow-hidden p-0 text-left select-none animate-in fade-in duration-200"
      >
        {/* DYNAMIC HEADER CORE CONTAINER */}
        <div
          className={cn(
            "p-6 border-b transition-colors duration-300",
            fiscalLedger.canAfford ? "bg-primary/5 border-primary/10" : "bg-destructive/5 border-destructive/10",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold tracking-tight text-foreground">
              {fiscalLedger.canAfford ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  Confirm & Unlock
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  Additional Credits Needed
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/90 mt-1 leading-relaxed">
              {fiscalLedger.canAfford
                ? `Confirm details to unlock: ${serviceName}`
                : `You need more credits to access: ${serviceName}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* LEDGER DETAILS BREAKDOWN CARD */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-xs font-semibold text-muted-foreground/70">
              Selected Service
            </span>
            <span className="text-xs font-bold text-foreground truncate pl-2 max-w-[220px]">
              {serviceName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/20 border border-border/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Service Cost
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500 fill-current shrink-0" />
                <span className="text-lg font-bold tracking-tight tabular-nums text-foreground">{fiscalLedger.cleanCost}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/20 border border-border/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Your Balance
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500 opacity-50 shrink-0" />
                <span className="text-lg font-bold tracking-tight tabular-nums opacity-70 text-foreground">
                  {fiscalLedger.cleanBalance}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC CALCULATION BREAKDOWN FOOTPRINT */}
          {fiscalLedger.canAfford ? (
            <div className="flex items-center justify-between p-4 border border-primary/20 rounded-xl bg-primary/5 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Remaining Balance
                </span>
                <p className="text-[9px] text-primary/60 font-medium">Account will update instantly</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Zap className="h-4 w-4 text-primary fill-current" />
                <span className="text-2xl font-bold tracking-tight tabular-nums text-primary">
                  {fiscalLedger.balanceAfter}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-xl bg-destructive/5 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                  Credits Needed
                </span>
                <p className="text-[9px] text-destructive/60 font-medium">Please top up to proceed</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Coins className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-bold tracking-tight tabular-nums text-destructive">
                  {fiscalLedger.requiredDelta}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* MODAL INTERACTIONS ACTION FOOTER BAR */}
        <DialogFooter className="p-6 bg-muted/10 flex flex-col sm:flex-row gap-3 border-t border-border/40">
          {fiscalLedger.canAfford ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-11 rounded-xl font-bold text-xs tracking-wide border border-border hover:bg-muted/50 disabled:opacity-40"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-11 flex-1 rounded-xl font-bold text-xs tracking-wide shadow-sm group disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <InlineSpinner size="sm" />
                    Unlocking...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Confirm & Unlock
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </span>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-11 rounded-xl font-bold text-xs tracking-wide border border-border"
              >
                Dismiss
              </Button>
              <Button
                type="button"
                onClick={onBuyCredits}
                disabled={isLoading}
                className="h-11 flex-1 rounded-xl bg-amber-500 text-white font-bold text-xs tracking-wide shadow-sm hover:bg-amber-600 transition-all active:scale-[0.99] gap-2 disabled:opacity-40"
              >
                <Coins className="h-4 w-4 fill-current shrink-0" />
                Purchase Credits
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}