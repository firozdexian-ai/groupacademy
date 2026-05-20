import { useMemo } from "react";
import { Coins, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  variant?: "default" | "compact" | "full" | "vault";
  onClick?: () => void;
  className?: string;
}

/**
 * GroUp Academy: Fiscal Asset HUD Terminal (V5.6.0)
 * CTO Reference: High-performance financial telemetry panel showing user system credit allocations.
 * Architecture: Optimized via type-safe arithmetic coercions and layout-matched skeleton states.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function CreditBalance({ variant = "default", onClick, className }: CreditBalanceProps) {
  const { balance: rawBalance, earnedBalance: rawEarned, freeBalance: rawFree, isLoading } = useCredits();

  // --- PHASE: LEAD_METRICS_COERCION_BARRIER ---
  // Architecture Fix: Defensively protect the layout from throwing NaN exceptions if raw state records arrive null
  const ledgerMetrics = useMemo(() => {
    return {
      balance: Number(rawBalance ?? 0),
      earnedBalance: Number(rawEarned ?? 0),
      freeBalance: Number(rawFree ?? 0),
    };
  }, [rawBalance, rawEarned, rawFree]);

  // --- PHASE: POLYMORPHIC_VARIANT_LOADING_GRID ---
  // Architecture Fix: Skeletons dynamically match output styles to stop layout shift glitches
  if (isLoading) {
    if (variant === "compact") {
      return <Skeleton className={cn("h-7 w-12 rounded-full bg-warning/10", className)} />;
    }
    if (variant === "full" || variant === "vault") {
      return <Skeleton className={cn("h-[164px] w-full rounded-[24px] bg-muted/20 border-2", className)} />;
    }
    return <Skeleton className={cn("h-11 w-32 rounded-2xl bg-muted/10 border-2", className)} />;
  }

  // --- HUD VIEWPORT: COMPACT_NAVBAR_CHIP_INGRESS ---
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/5 border border-warning/20 select-none animate-in fade-in duration-300",
          className,
        )}
      >
        <Coins className="h-4 w-4 text-warning fill-current animate-pulse shrink-0" />
        <span className="font-black text-xs italic tabular-nums tracking-tighter text-warning font-mono">
          {ledgerMetrics.balance}
        </span>
      </div>
    );
  }

  // --- HUD VIEWPORT: FULL_REGISTRY_WALLET_CARD ---
  if (variant === "full" || variant === "vault") {
    return (
      <div
        className={cn(
          "relative overflow-hidden space-y-4 p-5 rounded-[24px] border-2 backdrop-blur-xl transition-all duration-500 text-left select-none animate-in fade-in duration-500",
          "bg-card/30 border-border/40 shadow-2xl",
          className,
        )}
      >
        {/* ATMOSPHERIC_GLOW_EFFECT */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-warning/10 blur-[64px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground/60 font-mono">
              Registry_Total
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-warning/10 border border-warning/20 shrink-0">
                <Coins className="h-5 w-5 text-warning" />
              </div>
              <span className="text-3xl font-black italic tracking-tighter tabular-nums text-foreground font-mono">
                {ledgerMetrics.balance}
              </span>
            </div>
          </div>

          {variant === "vault" && (
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 shrink-0 animate-in zoom-in-95 duration-300">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* METRICS_LEDGER_BREAKDOWN_SUBGRID */}
        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border/10 font-mono">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group transition-all hover:border-emerald-500/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Earned_Assets</span>
            </div>
            <span className="font-black italic tabular-nums text-emerald-500 text-sm">
              {ledgerMetrics.earnedBalance}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 group transition-all hover:border-sky-500/30">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-500 fill-current shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-600/80">Grant_Ingress</span>
            </div>
            <span className="font-black italic tabular-nums text-sky-500 text-sm">{ledgerMetrics.freeBalance}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- HUD VIEWPORT: DEFAULT_INTERACTIVE_TRIGGER_BUTTON ---
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "h-11 px-4 rounded-2xl gap-3 bg-muted/10 border-2 border-border/40 transition-all hover:bg-muted/20 active:scale-95 text-left select-none font-sans",
        !onClick && "cursor-default hover:bg-muted/10",
        className,
      )}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-warning/10 shadow-inner shrink-0">
        <Coins className="h-4 w-4 text-warning fill-current" />
      </div>
      <div className="flex flex-col items-start leading-none space-y-0.5 font-mono">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Sync_Balance</span>
        <span className="text-sm font-black italic tracking-tighter tabular-nums text-foreground">
          {ledgerMetrics.balance}
        </span>
      </div>
    </Button>
  );
}
