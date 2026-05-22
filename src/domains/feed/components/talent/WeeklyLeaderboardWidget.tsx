import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyLeaderboard } from "@/domains/feed/repo/feedRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Trophy } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Row {
  talent_id: string;
  full_name: string | null;
  profile_photo_url: string | null;
  credits_earned: number;
  hype_count: number;
}

/**
 * GroUp Academy: Community Consensus Node (WeeklyLeaderboardWidget)
 * CTO Reference: Interactive gamification leaderboard tracking community ledger metrics.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function WeeklyLeaderboardWidget() {

  // 1. TanStack Query Server State Synchronization (staleTime 5 min configuration)
  const { data: rows = [], isLoading, error } = useQuery<Row[]>({
    queryKey: ["weekly-leaderboard-top10"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await getWeeklyLeaderboard();
      return data as Row[];
    }
  });

  // 2. Instrument Operational Telemetry Boundaries
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "WeeklyLeaderboardWidget",
        action: "fetch_weekly_leaderboard_view_query"
      });
    }
  }, [error]);

  useEffect(() => {
    if (rows.length > 0) {
      trackEvent("weekly_leaderboard_widget_viewed", {
        yieldedCount: rows.length,
        leaderCreditsEarned: rows[0]?.credits_earned || 0
      });
    }
  }, [rows]);

  // Handle high-fidelity loading skeleton states to eliminate visual popping layout shifts
  if (isLoading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none animate-pulse">
        <CardHeader className="py-3 px-4 border-b border-border/20">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-primary" /> 
            <span>Weekly Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center gap-3 w-full">
              <Skeleton className="h-4 w-4 rounded-md opacity-50 shrink-0" />
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-3 flex-1 rounded-sm opacity-60" />
              <Skeleton className="h-3 w-8 rounded-sm opacity-40 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none">
      
      {/* Decorative Blur Background Mesh Pattern */}
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Primary Container Header Section */}
      <CardHeader className="py-3 px-4 border-b border-border/20">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
          <Trophy className="h-4 w-4 text-primary drop-shadow-[0_1px_4px_rgba(var(--primary-rgb),0.2)] animate-pulse" /> 
          <span>Weekly Leaderboard</span>
        </CardTitle>
      </CardHeader>

      {/* Main Iteration Record Container Block */}
      <CardContent className="space-y-2.5 p-4 w-full min-w-0">
        {rows.map((r, i) => {
          if (!r || !r.talent_id) return null;
          
          const isTopOne = i === 0;
          const nameInitials = r.full_name?.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

          return (
            <div 
              key={r.talent_id} 
              className={cn(
                "flex items-center gap-3 text-xs font-bold tracking-tight py-0.5 rounded-xl transition-colors duration-150 w-full min-w-0 group",
                isTopOne && "bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 px-2 -mx-2 shadow-inner"
              )}
            >
              {/* Dynamic Chronological Rank Badge Node */}
              <span className="w-5 text-center font-extrabold text-muted-foreground/90 tabular-nums text-xs flex items-center justify-center shrink-0">
                {isTopOne ? (
                  <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500/10 drop-shadow-[0_1px_4px_rgba(234,179,8,0.3)] transform-gpu rotate-6" />
                ) : (
                  i + 1
                )}
              </span>

              {/* User Identity Avatar presentation block */}
              <Avatar className="h-6 w-6 border border-border/30 shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-200">
                <AvatarImage src={r.profile_photo_url ?? undefined} alt={`${r.full_name || 'User'}'s leaderboard rank photo`} className="object-cover" />
                <AvatarFallback className="text-[10px] font-extrabold bg-primary/10 text-primary uppercase select-none">
                  {nameInitials}
                </AvatarFallback>
              </Avatar>

              {/* Sanitized Typography Node Elements */}
              <span className="flex-1 truncate text-left text-foreground/90 font-bold select-text text-xs tracking-tight break-all pr-2">
                {r.full_name || "Academy Member"}
              </span>

              {/* Fractional Wallet Credit Asset Aggregate Element */}
              <span className="font-extrabold text-primary tabular-nums tracking-wide shrink-0 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                {Number(r.credits_earned || 0).toLocaleString()} cr
              </span>
            </div>
          );
        })}

        {/* Informative Platform Terms and Incentive Label */}
        <p className="text-[10px] font-medium text-muted-foreground/80 pt-2 border-t border-border/10 select-text leading-normal text-left">
          Top 10 players win <span className="font-bold text-foreground tabular-nums">100&ndash;500 credits</span> settled directly into ledger balances every Monday morning.
        </p>
      </CardContent>
    </Card>
  );
}