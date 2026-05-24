import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordMatchEvent, matchGigsForTalent } from "@/domains/gigs/repo/gigsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sparkles, X, ChevronRight, Coins, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Premium, performance-hardened Talent Recommended Gig Matching Panel.
 * Synchronizes algorithmic RPC lookups with automated event telemetry logging
 * and real-time query invalidation pipelines over vertical PWA workspace grids.
 */
export function GigForYouTab() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // 1. Algorithmic Match Query Execution Layer (staleTime 5 min configuration)
  const {
    data: matches = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["gig-matches-for-you", talent?.id],
    enabled: !!talent?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await matchGigsForTalent(talent!.id, 20);
    },
  });

  // 2. Instrument Centralized Telemetry Boundary for Query Phase
  useEffect(() => {
    if (queryError) {
      trackError(queryError, {
        component: "GigForYouTab",
        action: "fetch_gig_matches_rpc",
        talentId: talent?.id,
      });
    }
  }, [queryError, talent?.id]);

  // 3. Hardened Dismiss Mutation Pipeline
  const dismiss = useMutation({
    mutationFn: async (matchId: string) => {
      await recordMatchEvent(matchId, "dismiss");
      return matchId;
    },
    onMutate: async (matchId) => {
      trackEvent("gig_match_dismiss_initiated", { matchId, talentId: talent?.id });
    },
    onSuccess: (matchId) => {
      trackEvent("gig_match_dismiss_success", { matchId, talentId: talent?.id });
      // Clear precise query keys dynamically across user viewport boundaries
      queryClient.invalidateQueries({ queryKey: ["gig-matches-for-you", talent?.id] });
    },
    onError: (mutationErr: any) => {
      trackError(mutationErr, {
        component: "GigForYouTab",
        action: "dismiss_gig_match_mutation",
        talentId: talent?.id,
      });
    },
  });

  // 4. Background Impression Synchronization Node (Resolving fire-and-forget loops)
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const offeredMatches = matches.filter((m: any) => m && m.status === "offered").slice(0, 10);

    if (offeredMatches.length === 0) return;

    let traceCount = 0;

    // Process background state sync requests securely with rigorous exception captures
    const recordImpressionsBatch = async () => {
      for (const matchItem of offeredMatches) {
        if (!matchItem?.match_id) continue;
        try {
          await recordMatchEvent(matchItem.match_id, "view");
          traceCount++;
        } catch (loopErr) {
          trackError(loopErr, {
            component: "GigForYouTab",
            action: "background_impression_sync_loop_exception",
            matchId: matchItem.match_id,
            talentId: talent?.id,
          });
        }
      }

      if (traceCount > 0) {
        trackEvent("gig_matches_batch_impressions_logged", {
          processedCount: traceCount,
          talentId: talent?.id,
        });
      }
    };

    recordImpressionsBatch();
  }, [matches, talent?.id]);

  if (isLoading) {
    return (
      <div className="space-y-3 select-none w-full">
        {[1, 2, 3].map((skeletonIndex) => (
          <Skeleton key={skeletonIndex} className="h-24 w-full rounded-2xl opacity-60" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl select-none">
        <CardContent className="p-6 text-center space-y-3 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center shadow-inner border border-primary/5">
            <Sparkles className="w-6 h-6 text-primary/60 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-foreground/90 tracking-tight">No match records compiled yet</p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-xs mx-auto">
              Inject verified technical skill sets and calibrate your work capacity sliders to get recommendations
              pushed to your feed.
            </p>
          </div>
          <div className="flex gap-2 items-center justify-center pt-2 w-full max-w-xs">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl font-bold text-xs flex-1 cursor-pointer"
            >
              <Link to="/app/profile">Calibrate Profile</Link>
            </Button>
            <Button asChild size="sm" className="h-9 px-4 rounded-xl font-bold text-xs flex-1 cursor-pointer">
              <Link to="/app/gigs?tab=tasks">Browse Feed Catalog</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 w-full antialiased select-none">
      {matches.map((matchItem: any) => {
        if (!matchItem || !matchItem.match_id) return null;

        const rewardValue = matchItem.credits != null ? Number(matchItem.credits) : null;
        const matchingPercentageScore = Math.round(Number(matchItem.score || 0));

        return (
          <Card
            key={matchItem.match_id}
            className="hover:border-primary/30 bg-card/60 backdrop-blur-md rounded-2xl transition-all duration-300 shadow-sm relative overflow-hidden group"
          >
            <CardContent className="p-4 space-y-3 text-left w-full min-w-0">
              <div className="flex items-start justify-between gap-3 w-full min-w-0">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap w-full">
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-extrabold h-4.5 px-2 rounded-md uppercase bg-muted/40 text-muted-foreground/90 tracking-wider select-none border-none"
                    >
                      {matchItem.gig_kind || "Task"}
                    </Badge>
                    <Badge className="text-[9px] font-extrabold h-4.5 px-2 rounded-md uppercase select-none tracking-wider bg-primary/10 border-none text-primary hover:bg-primary/15 shadow-sm tabular-nums">
                      Match Score: {matchingPercentageScore}%
                    </Badge>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-foreground/90 leading-snug tracking-tight line-clamp-2 break-words select-text selection:bg-primary/20">
                    {matchItem.title}
                  </h3>

                  {matchItem.why_text && (
                    <p className="text-[11px] font-medium leading-normal text-muted-foreground line-clamp-2 select-text selection:bg-primary/10 mt-1 break-words">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-primary shrink-0 fill-primary/10 animate-pulse" />
                      <span>{matchItem.why_text}</span>
                    </p>
                  )}
                </div>

                {/* Dismiss Vector Control Anchor */}
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={dismiss.isPending}
                  className="h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer active:scale-90 transition-all select-none"
                  onClick={() => dismiss.mutate(matchItem.match_id)}
                  aria-label="Dismiss task option matching track"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.2]" />
                </Button>
              </div>

              {/* Functional Analytics Footer Ribbon Strip */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border/20 text-xs text-muted-foreground/80 font-bold tabular-nums tracking-tight select-none">
                <div className="flex items-center gap-3 truncate max-w-[70%]">
                  {rewardValue !== null && (
                    <span className="flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                      <Coins className="w-3 h-3 stroke-[2.2]" />
                      <span>{rewardValue.toLocaleString()} cr</span>
                    </span>
                  )}
                  {matchItem.deadline && (
                    <span className="flex items-center gap-1 bg-muted/20 px-2 py-0.5 border border-border/20 rounded-full text-muted-foreground font-medium lowercase">
                      <Clock className="w-3 h-3 text-primary stroke-[2.2]" />
                      <span>
                        due{" "}
                        {new Date(matchItem.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </span>
                  )}
                </div>

                {/* Outward Target Anchor Dispatcher Node */}
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs font-bold tracking-tight text-primary hover:text-primary hover:bg-primary/5 active:scale-95 transition-all rounded-lg cursor-pointer ml-auto"
                >
                  <Link
                    to={
                      matchItem.gig_kind === "marketplace"
                        ? `/app/marketplace/${matchItem.gig_id}`
                        : `/app/gigs?tab=tasks`
                    }
                    onClick={() =>
                      trackEvent("gig_match_open_navigated", {
                        matchId: matchItem.match_id,
                        targetKind: matchItem.gig_kind,
                      })
                    }
                  >
                    <span>Open Task</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
