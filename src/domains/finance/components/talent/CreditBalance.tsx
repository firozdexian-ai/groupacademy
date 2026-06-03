import { useMemo } from "react";
import { Coins, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  variant?: "default" | "compact" | "full" | "vault";
  onClick?: () => void;
  className?: string;
}

/**
 * GroUp Academy: Wallet Balance Monitor Component
 * Renders user credit balances across multiple UI scopes with matched skeleton states.
 */
export function CreditBalance({ variant = "default", onClick, className }: CreditBalanceProps) {
  const { balance: rawBalance, earnedBalance: rawEarned, freeBalance: rawFree, isLoading } = useCredits();

  // Safeguard layout variables from parsing anomalies if backend telemetry values arrive undefined
  const ledgerMetrics = useMemo(() => {
    return {
      balance: Number(rawBalance ?? 0),
      earnedBalance: Number(rawEarned ?? 0),
      freeBalance: Number(rawFree ?? 0),
    };
  }, [rawBalance, rawEarned, rawFree]);

  // Loading frameworks optimized to match standard component layout parameters
  if (isLoading) {
    if (variant === "compact") {
      return <Skeleton className={cn("h-7 w-12 rounded-full bg-amber-500/10", className)} />;
    }
    if (variant === "full" || variant === "vault") {
      return <Skeleton className={cn("h-[164px] w-full rounded-[24px] bg-muted/20 border-2", className)} />;
    }
    return <Skeleton className={cn("h-11 w-32 rounded-2xl bg-muted/10 border-2", className)} />;
  }

  // --- VIEWPORT VARIANT: COMPACT NAVBAR STATUS CHIP ---
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 border border-amber-500/20 select-none animate-in fade-in duration-300",
          className,
        )}
      >
        <Coins className="h-4 w-4 text-amber-500 fill-current animate-pulse shrink-0" />
        <span className="font-bold text-xs tabular-nums tracking-tight text-amber-600">
          {ledgerMetrics.balance}
        </span>
      </div>
    );
  }

  // --- VIEWPORT VARIANT: DETAILED WALLET INTERFACE CARD ---
  if (variant === "full" || variant === "vault") {
    return (
      <div
        className={cn(
          "relative overflow-hidden space-y-4 p-5 rounded-[24px] border-2 backdrop-blur-xl transition-all duration-300 text-left select-none animate-in fade-in",
          "bg-card/30 border-border/40 shadow-sm",
          className,
        )}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-amber-500/5 blur-[64px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Total Balance
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
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

        {/* METRICS SEGMENTATION BREAKDOWN */}
        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border/10">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group transition-all duration-200 hover:border-emerald-500/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80">Earned Balance</span>
            </div>
            <span className="font-bold tabular-nums text-emerald-600 text-sm">
              {ledgerMetrics.earnedBalance}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 group transition-all duration-200 hover:border-sky-500/30">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-500 fill-current shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700/80">Promo Credits</span>
            </div>
            <span className="font-bold tabular-nums text-sky-600 text-sm">
              {ledgerMetrics.freeBalance}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEWPORT VARIANT: DEFAULT INTERACTIVE ACCOUNT BUTTON ---
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "h-11 px-4 rounded-2xl gap-3 bg-muted/10 border-2 border-border/40 transition-all duration-200 hover:bg-muted/20 active:scale-95 text-left select-none font-sans",
        !onClick && "cursor-default hover:bg-muted/10",
        className,
      )}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/10 shadow-inner shrink-0">
        <Coins className="h-4 w-4 text-amber-500 fill-current" />
      </div>
      <div className="flex flex-col items-start leading-none space-y-0.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Credits</span>
        <span className="text-sm font-bold tracking-tight tabular-nums text-foreground">
          {ledgerMetrics.balance}
        </span>
      </div>
    </Button>
  );
}