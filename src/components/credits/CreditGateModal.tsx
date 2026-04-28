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

/**
 * GroUp Academy: Fiscal Authorization Gate
 * CTO Reference: Authoritative transaction sentinel for premium service ingress.
 */

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

export function CreditGateModal({
  isOpen,
  onClose,
  onConfirm,
  onBuyCredits,
  serviceName,
  cost,
  currentBalance,
  isLoading = false,
}: CreditGateModalProps) {
  const canAfford = currentBalance >= cost;
  const balanceAfter = currentBalance - cost;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl overflow-hidden p-0">
        {/* HUD: TRANSACTION_HEADER */}
        <div
          className={cn(
            "p-6 border-b-2",
            canAfford ? "bg-primary/5 border-primary/10" : "bg-rose-500/5 border-rose-500/10",
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              {canAfford ? (
                <>
                  <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
                  AUTHORIZE_SYNC
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-rose-500 animate-bounce" />
                  FISCAL_DEFICIT
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
              {canAfford
                ? `Ready to initialize synchronization for: ${serviceName.toUpperCase()}`
                : `Insufficient credits to authorize: ${serviceName.toUpperCase()}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* HUD: LEDGER_SUMMARY */}
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target_Node</span>
            <span className="text-xs font-bold italic text-foreground">{serviceName}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/10 border border-border/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                Node_Cost
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-warning fill-current" />
                <span className="text-lg font-black italic tabular-nums">{cost}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-muted/10 border border-border/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                Current_Vault
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-warning opacity-40" />
                <span className="text-lg font-black italic tabular-nums opacity-60">{currentBalance}</span>
              </div>
            </div>
          </div>

          {/* HUD: CALCULATED_DELTA */}
          {canAfford ? (
            <div className="flex items-center justify-between p-5 border-2 border-primary/20 rounded-[22px] bg-primary/5 shadow-inner animate-in zoom-in-95 duration-500">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic">
                  Post_Sync_Balance
                </span>
                <p className="text-[8px] text-primary/40 font-bold uppercase">Authorization_Ready</p>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary fill-current" />
                <span className="text-2xl font-black italic tabular-nums text-primary tracking-tighter">
                  {balanceAfter}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 border-2 border-rose-500/20 rounded-[22px] bg-rose-500/5 shadow-inner animate-in shake-2">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 italic">
                  Credits_Required
                </span>
                <p className="text-[8px] text-rose-500/40 font-bold uppercase">Registry_Locked</p>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-rose-500" />
                <span className="text-2xl font-black italic tabular-nums text-rose-500 tracking-tighter">
                  {cost - currentBalance}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* HUD: TRANSACTION_ACTIONS */}
        <DialogFooter className="p-6 bg-muted/5 flex-col sm:flex-row gap-3">
          {canAfford ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 rounded-xl font-black uppercase italic text-[10px] tracking-widest border-2"
              >
                ABORT_SYNC
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="h-12 flex-1 rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SYNCING...
                  </>
                ) : (
                  <>
                    CONFIRM_INITIALIZATION
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-xl font-black uppercase italic text-[10px] tracking-widest border-2"
              >
                DISMISS
              </Button>
              <Button
                onClick={onBuyCredits}
                className="h-12 flex-1 rounded-xl bg-warning text-warning-foreground font-black uppercase italic text-[10px] tracking-[0.2em] shadow-lg shadow-warning/20 hover:bg-warning/90 transition-all active:scale-95 gap-2"
              >
                <Coins className="h-4 w-4 fill-current" />
                ACQUIRE_CREDITS
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
