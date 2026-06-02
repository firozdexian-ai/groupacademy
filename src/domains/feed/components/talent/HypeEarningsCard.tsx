import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, TrendingUp } from "lucide-react";
import { getHypeEarnings } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface HypeStats {
  totalCredits: number;
  last30DaysCredits: number;
  totalHypesReceived: number;
}

/**
 * Premium creator earnings summary card.
 * Pulls from the ledger history to calculate total hypes and splits.
 */
export function HypeEarningsCard() {
  const { talent } = useTalent();

  // Fetch creator earnings data with structured state caching layer
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<HypeStats>({
    queryKey: ["creator-hype-earnings", talent?.id],
    queryFn: async () => {
      if (!talent?.id) throw new Error("User session not found.");

      const sinceTimestamp = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { all, recent } = await getHypeEarnings(talent.id, sinceTimestamp);

      const totalCredits = all.reduce((sum, item) => sum + Number(item.amount_credits ?? 0), 0);
      const last30DaysCredits = recent.reduce((sum, item) => sum + Number(item.amount_credits ?? 0), 0);
      const totalHypesReceived = all.length;

      return {
        totalCredits,
        last30DaysCredits,
        totalHypesReceived,
      };
    },
    enabled: !!talent?.id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Track database lookup faults securely in the background
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "HypeEarningsCard",
        action: "aggregate_ledger_balance",
        talentId: talent?.id,
      });
    }
  }, [error, talent?.id]);

  // Log post viewing events safely to monitor monetization trends
  useEffect(() => {
    if (stats && talent?.id) {
      trackEvent("hype_earnings_viewed", {
        talentId: talent.id,
        totalAccumulatedCredits: stats.totalCredits,
      });
    }
  }, [stats, talent?.id]);

  if (isLoading) {
    return (
      <Card className="p-4 border border-border/40 bg-card/50 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((placeholderIndex) => (
            <div key={placeholderIndex} className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-7 w-12 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-sm opacity-60" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const currentStats = stats ?? { totalCredits: 0, last30DaysCredits: 0, totalHypesReceived: 0 };

  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none">
      {/* Visual backdrop accent layer */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Card Title Header */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/5 shadow-inner">
          <Flame className="h-4 w-4 animate-pulse fill-current" />
        </div>
        <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Hype Earnings</h3>
      </div>

      {/* Metrics Row Split Matrix Layout */}
      <div className="grid grid-cols-3 gap-3 text-center items-end">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
            {currentStats.totalCredits.toFixed(1)}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground/80 tracking-tight uppercase">Total Credits</div>
        </div>

        <div className="space-y-1 border-x border-border/30 px-1">
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums flex items-center justify-center gap-0.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5]" />
            {currentStats.last30DaysCredits.toFixed(1)}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground/80 tracking-tight uppercase">Last 30d</div>
        </div>

        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
            {currentStats.totalHypesReceived.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground/80 tracking-tight uppercase">Received</div>
        </div>
      </div>
    </Card>
  );
}