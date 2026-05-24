import { useMemo, useCallback } from "react";
import { Coins, AlertCircle, ArrowRight, Loader2, Zap, ShieldCheck } from "lucide-react";
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
 * GroUp Academy: Fiscal Authorization Gate (V5.6.0)
 * CTO Reference: Authoritative transaction gate securing compute resources against raw wallet deficits.
 * Architecture: Optimized via pointer overlay interceptors blocking dismissal races during active operations.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function CreditGateModal({
  isOpen,
  onClose,
  onConfirm,
  onBuyCredits,
  serviceName = "PREMIUM_SERVICE_NODE",
  cost = 0,
  currentBalance = 0,
  isLoading = false,
}: CreditGateModalProps) {
  // --- PHASE: WALLET_ARITHMETIC_COMPILATION ---
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

  // --- HANDLER: DEFENSIVE_DISMISSAL_INTERCEPTOR ---
  const handleOpenToggleChange = useCallback(
    (nextOpenState: boolean) => {
      // Architecture Fix: Lock down view tree changes completely if an upstream thread is executing background debits
      if (!nextOpenState && !isLoading && onClose) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  const handlePointerOutsideBlocker = useCallback(
    (e: Event) => {
      if (isLoading) {
        e.preventDefault(); // Seal mouse background interaction escapes
      }
    },
    [isLoading],
  );

  const handleEscapeKeyBlocker = useCallback(
    (e: KeyboardEvent) => {
      if (isLoading) {
        e.preventDefault(); // Lock keyboard hardware abort requests securely
      }
    },
    [isLoading],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenToggleChange}>
      <DialogContent
        onPointerDownOutside={handlePointerOutsideBlocker}
        onEscapeKeyDown={handleEscapeKeyBlocker}
        className="sm:max-w-md rounded-[32px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl overflow-hidden p-0 text-left select-none animate-in fade-in duration-300"
      >
        {/* HUD: TRANSACTION_HEADER_SECTOR */}
        <div
          className={cn(
            "p-6 border-b-2 transition-colors duration-500",
            fiscalLedger.canAfford ? "bg-primary/5 border-primary/10" : "bg-rose-500/5 border-rose-500/10",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter text-foreground">
              {fiscalLedger.canAfford ? (
                <>
                  <ShieldCheck className="h-6 w-6 text-primary animate-pulse shrink-0" />
                  AUTHORIZE_SYNC
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-rose-500 animate-bounce shrink-0" />
                  FISCAL_DEFICIT
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1.5 leading-relaxed">
              {fiscalLedger.canAfford
                ? `Ready to initialize synchronization for: ${String(serviceName).toUpperCase()}`
                : `Insufficient credits to authorize: ${String(serviceName).toUpperCase()}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* HUD: LEDGER_SUMMARY_METRICS_BODY */}
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 font-mono">
              Target_Node
            </span>
            <span className="text-xs font-black uppercase italic tracking-tight text-foreground truncate pl-2 max-w-[200px]">
              {serviceName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/10 border border-border/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                Node_Cost
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-warning fill-current shrink-0" />
                <span className="text-lg font-black italic tabular-nums text-foreground">{fiscalLedger.cleanCost}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/10 border border-border/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                Current_Vault
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-warning opacity-40 shrink-0" />
                <span className="text-lg font-black italic tabular-nums opacity-60 text-foreground">
                  {fiscalLedger.cleanBalance}
                </span>
              </div>
            </div>
          </div>

          {/* HUD: CALCULATED_DELTA_PANEL */}
          {fiscalLedger.canAfford ? (
            <div className="flex items-center justify-between p-5 border-2 border-primary/20 rounded-[22px] bg-primary/5 shadow-inner animate-in zoom-in-95 duration-500 font-mono">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic">
                  Post_Sync_Balance
                </span>
                <p className="text-[8px] text-primary/40 font-bold uppercase">Authorization_Ready</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Zap className="h-4 w-4 text-primary fill-current" />
                <span className="text-2xl font-black italic tabular-nums text-primary tracking-tighter">
                  {fiscalLedger.balanceAfter}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 border-2 border-rose-500/20 rounded-[22px] bg-rose-500/5 shadow-inner animate-in shake-2 font-mono">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 italic">
                  Credits_Required
                </span>
                <p className="text-[8px] text-rose-500/40 font-bold uppercase">Registry_Locked</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Coins className="h-5 w-5 text-rose-500" />
                <span className="text-2xl font-black italic tabular-nums text-rose-500 tracking-tighter">
                  {fiscalLedger.requiredDelta}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* HUD: TRANSACTION_ACTIONS_FOOTER */}
        <DialogFooter className="p-6 bg-muted/5 flex-col sm:flex-row gap-3 border-t">
          {fiscalLedger.canAfford ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 rounded-xl font-black uppercase italic text-[10px] tracking-widest border-2 transition-all disabled:opacity-40"
              >
                ABORT_SYNC
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-12 flex-1 rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-primary/10 group transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2 font-mono">
                    <InlineSpinner size="sm" />
                    DEBIT_IN_TRANSIT...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    CONFIRM_INITIALIZATION
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform shrink-0" />
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
                className="h-12 rounded-xl font-black uppercase italic text-[10px] tracking-widest border-2 transition-all"
              >
                DISMISS
              </Button>
              <Button
                type="button"
                onClick={onBuyCredits}
                disabled={isLoading}
                className="h-12 flex-1 rounded-xl bg-warning text-warning-foreground font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-warning/20 hover:bg-warning/90 transition-all active:scale-[0.99] gap-2 font-mono disabled:opacity-40"
              >
                <Coins className="h-4 w-4 fill-current shrink-0" />
                ACQUIRE_CREDITS
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
