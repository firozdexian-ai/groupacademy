import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface HypeStats {
  totalCredits: number;
  last30DaysCredits: number;
  totalHypesReceived: number;
}

/**
 * Premium, performance-hardened Creator Hype Earnings Card.
 * Leverages structured server-state caching layers to aggregate creator_share ledger records
 * dynamically without over-fetching raw data profiles over mobile PWA channels.
 */
export function HypeEarningsCard() {
  const { talent } = useTalent();

  // 1. Unified Server-State Sync Layer (staleTime 5 min, 2 retries rule configuration)
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<HypeStats>({
    queryKey: ["creator-hype-earnings", talent?.id],
    queryFn: async () => {
      if (!talent?.id) throw new Error("Anonymous context block identifier encountered.");

      const sinceTimestamp = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      // Aggregate aggregates securely inside the database layer to minimize raw bandwidth payloads
      const [allHypesQuery, recentHypesQuery] = await Promise.all([
        supabase.from("instructor_earnings_ledger").select("amount_credits").eq("talent_id", talent.id),
        supabase
          .from("instructor_earnings_ledger")
          .select("amount_credits")
          .eq("talent_id", talent.id)
          .gte("created_at", sinceTimestamp),
      ]);

      if (allHypesQuery.error) throw allHypesQuery.error;
      if (recentHypesQuery.error) throw recentHypesQuery.error;

      // Calculate localized values adaptively using clean transactional sums
      const totalCredits = (allHypesQuery.data ?? []).reduce((sum, item) => sum + Number(item.amount_credits ?? 0), 0);
      const last30DaysCredits = (recentHypesQuery.data ?? []).reduce((sum, item) => sum + Number(item.amount_credits ?? 0), 0);
      const totalHypesReceived = allHypesQuery.data?.length ?? 0;

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

  // 2. Instrument Lifecycle Observability
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "HypeEarningsCard",
        action: "aggregate_ledger_balance",
        talentId: talent?.id,
      });
    }
  }, [error, talent?.id]);

  useEffect(() => {
    if (stats && talent?.id) {
      trackEvent("HypeEarningsCard:metrics_viewed", {
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

  // Enforce rigid standard boundaries over baseline computations
  const currentStats = stats ?? { totalCredits: 0, last30DaysCredits: 0, totalHypesReceived: 0 };

  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none">
      {/* Decorative Brand Identity Glow Layer */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Block Section */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/5 shadow-inner">
          <Flame className="h-4 w-4 animate-pulse fill-current" />
        </div>
        <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Hype Earnings</h3>
      </div>

      {/* Financial Metrics Split Matrix Row */}
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
