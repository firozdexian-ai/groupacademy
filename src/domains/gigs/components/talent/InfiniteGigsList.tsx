import { useEffect, useMemo, useRef } from "react";
import { Loader2, Briefcase, Coins, Clock, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRankedGigs } from "@/domains/gigs/hooks/useRankedGigs";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  talentId: string | null | undefined;
  search?: string;
}

/**
 * Infinite, zero-latency unified gig feed collection.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * featuring defensive IntersectionObserver management and clean tabular typography variables.
 */
export function InfiniteGigsList({ talentId, search }: Props) {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. TanStack Infinite Query Server State Synchronization Hook
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useRankedGigs(talentId);

  // 2. Defensive Infinite Scroll Handshake Sentinel Ingress Layer
  useEffect(() => {
    const activeSentinelNode = sentinelRef.current;
    if (!activeSentinelNode || !hasNextPage || isFetchingNextPage) return;

    const intersectionObserverInstance = new IntersectionObserver(
      (entries) => {
        const primaryEntry = entries[0];
        if (primaryEntry?.isIntersecting && !isFetchingNextPage) {
          trackEvent("infinite_gigs_sentinel_triggered", { talentId });
          fetchNextPage();
        }
      },
      {
        root: null, // Relative to device viewport bounds
        rootMargin: "400px", // Proactive pre-fetching trigger threshold
      },
    );

    intersectionObserverInstance.observe(activeSentinelNode);

    return () => {
      intersectionObserverInstance.unobserve(activeSentinelNode);
      intersectionObserverInstance.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, talentId]);

  // 3. Instrument Incident Telemetry Metrics Over Query Exceptions
  useEffect(() => {
    if (error) {
      trackError(error, {
        component: "InfiniteGigsList",
        action: "useRankedGigs_infinite_fetch_fault",
        talentId,
      });
    }
  }, [error, talentId]);

  // Downstream record compilation memo matrix pass
  const items = useMemo(() => {
    const aggregatedPages = (data?.pages ?? []).flat();
    if (!search) return aggregatedPages;

    const sanitizedSearchQuery = search.toLowerCase().trim();
    return aggregatedPages.filter((gigItem) => gigItem?.title?.toLowerCase().includes(sanitizedSearchQuery));
  }, [data, search]);

  // Trace rendering tracking parameters
  useEffect(() => {
    if (items.length > 0) {
      trackEvent("infinite_gigs_feed_compiled", {
        computedCount: items.length,
        searchQueryActive: !!search,
      });
    }
  }, [items, search]);

  if (isLoading) {
    return (
      <div className="space-y-3 select-none w-full">
        {[1, 2, 3, 4].map((skeletonIndex) => (
          <Skeleton key={skeletonIndex} className="h-20 w-full rounded-2xl opacity-60" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none animate-in fade-in duration-300 w-full">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 italic tracking-tight text-center">
          No open gigs match the active selection fields right now. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 w-full antialiased select-none sm:select-text">
      {items.map((gigItem) => {
        if (!gigItem || !gigItem.gig_id) return null;

        const runtimeGigIdentifier = gigItem.gig_id;
        const rewardValue = gigItem.credits != null ? Number(gigItem.credits) : null;
        const scoreMatchValue = Math.round(Number(gigItem.match_score || 0));

        return (
          <button
            key={`${gigItem.kind || "task"}-${runtimeGigIdentifier}`}
            type="button"
            onClick={() => {
              trackEvent("infinite_gigs_item_clicked", { gigId: runtimeGigIdentifier, targetKind: gigItem.kind });
              navigate(
                gigItem.kind === "marketplace" ? `/app/marketplace/${runtimeGigIdentifier}` : `/app/gigs?tab=tasks`,
              );
            }}
            className={cn(
              "w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-200 transform-gpu cursor-pointer",
              "p-3.5 sm:p-4 hover:border-primary/30 hover:shadow-md hover:bg-card/90 active:scale-[0.99] touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring group",
            )}
          >
            <div className="flex items-start gap-3.5 w-full min-w-0">
              {/* Asset Briefcase Branding Profile Icon */}
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:bg-primary/15 transition-colors">
                <Briefcase className="h-5 w-5 stroke-[2.2] transition-transform group-hover:scale-105" />
              </div>

              {/* Dynamic Identity Meta Frame */}
              <div className="min-w-0 flex-1 space-y-1 text-left flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-1.5 select-none leading-none">
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-extrabold h-4.5 px-2 uppercase tracking-wide bg-muted/40 text-muted-foreground/90 border-none rounded-md"
                  >
                    {gigItem.kind || "Task"}
                  </Badge>
                  {scoreMatchValue > 0 && (
                    <Badge className="text-[9px] font-extrabold h-4.5 px-2 uppercase tracking-wide bg-primary/10 text-primary border-none rounded-md shadow-sm tabular-nums">
                      <Sparkles className="h-3 w-3 mr-1 fill-primary/10 animate-pulse text-primary shrink-0" />
                      <span>Match {scoreMatchValue}%</span>
                    </Badge>
                  )}
                  {gigItem.skill_category && (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-extrabold h-4.5 px-2 uppercase tracking-wide border-border/40 text-muted-foreground/80 rounded-md"
                    >
                      {gigItem.skill_category?.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 leading-snug line-clamp-1 truncate w-full group-hover:text-primary transition-colors">
                  {gigItem.title}
                </h3>

                {/* Visual Ribbon Ledger Details */}
                <div className="flex items-center gap-3 text-[11px] font-bold tabular-nums tracking-tight text-muted-foreground/70 select-none">
                  {rewardValue !== null && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-full text-[10px]">
                      <Coins className="h-3 w-3 stroke-[2.2]" />
                      <span>{rewardValue.toLocaleString()} cr</span>
                    </span>
                  )}
                  {gigItem.deadline && (
                    <span className="flex items-center gap-1 bg-muted/20 px-2 py-0.5 border border-border/20 rounded-full font-medium lowercase">
                      <Clock className="h-3 w-3 text-primary stroke-[2.2]" />
                      <span>
                        due{" "}
                        {new Date(gigItem.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Trigger Link Vector Chevron Indicator */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-1 stroke-[2.5]" />
            </div>
          </button>
        );
      })}

      {/* Infinite Keyset Observer Sentinel Node */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center select-none w-full">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center text-[11px] font-bold text-muted-foreground/70 tracking-wide animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-primary stroke-[2.5]" />
            <span>Compiling subsequent timeline updates…</span>
          </div>
        ) : (
          !hasNextPage &&
          items.length > 6 && (
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/40 italic select-none animate-in fade-in duration-300">
              &mdash; You're all caught up &mdash;
            </p>
          )
        )}
      </div>
    </div>
  );
}
