import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankedJobs } from "@/hooks/useRankedJobs";
import { useSavedItems } from "@/hooks/useSavedItems";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  talentId: string | undefined;
}

/**
 * GroUp Academy: Infinite Opportunity Feed (InfiniteJobsList)
 * CTO Reference: Authoritative zero-latency job feed leveraging keyset pagination.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function InfiniteJobsList({ talentId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSaved, toggleSave } = useSavedItems();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. TanStack Infinite Query Server State Synchronization Hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: apiQueryError,
  } = useRankedJobs(talentId);

  // 2. High-Performance Defensive Intersection Observer Lifecycle Management
  useEffect(() => {
    const currentSentinelNode = sentinelRef.current;
    if (!currentSentinelNode || !hasNextPage || isFetchingNextPage) return;

    const intersectionObserverInstance = new IntersectionObserver(
      (entries) => {
        const structuralEntry = entries[0];
        if (structuralEntry?.isIntersecting && !isFetchingNextPage) {
          trackEvent("infinite_jobs_sentinel_triggered", { talentId });
          fetchNextPage();
        }
      },
      {
        root: null, // Bounds mapped directly to the viewport frame
        rootMargin: "400px", // Proactive pagination threshold pre-fetching line
      },
    );

    intersectionObserverInstance.observe(currentSentinelNode);

    return () => {
      if (currentSentinelNode) {
        intersectionObserverInstance.unobserve(currentSentinelNode);
      }
      intersectionObserverInstance.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, talentId]);

  // 3. Instrument Incident Telemetry Metrics Over Query Exceptions
  useEffect(() => {
    if (apiQueryError) {
      trackError(apiQueryError, {
        component: "InfiniteJobsList",
        action: "useRankedJobs_infinite_query_fetch",
        talentId,
      });
    }
  }, [apiQueryError, talentId]);

  // Consolidate dataset mapping allocations natively from nested infinity pages
  const items = useMemo(() => {
    return (data?.pages ?? []).flat().filter(Boolean);
  }, [data]);

  // Log active viewport compilation milestones
  useEffect(() => {
    if (items.length > 0) {
      trackEvent("infinite_jobs_feed_compiled", {
        computedCount: items.length,
        talentId,
      });
    }
  }, [items.length, talentId]);

  if (isLoading) {
    return (
      <div className="space-y-3 select-none w-full animate-pulse">
        {[1, 2, 3, 4].map((skeletonIndex) => (
          <Skeleton key={skeletonIndex} className="h-16 w-full rounded-2xl opacity-60" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-36 flex flex-col items-center justify-center border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-5 select-none text-center w-full max-w-full animate-in fade-in duration-300">
        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center mb-3 shadow-inner border border-primary/5">
          <Sparkles className="h-5 w-5 text-primary/60 animate-pulse" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 italic tracking-tight max-w-xs mx-auto">
          Complete your professional profile configuration tracks to unlock matched employment fields.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 w-full antialiased select-none sm:select-text">
      {items.map((recordItem: any) => {
        if (!recordItem || !recordItem.job || !recordItem.job.id) return null;

        const currentJobId = recordItem.job.id;

        return (
          <JobCard
            key={currentJobId}
            job={recordItem.job as any}
            variant="compact"
            isSaved={!!isSaved(currentJobId, "job")}
            onSaveToggle={() => {
              trackEvent("infinite_jobs_item_save_toggled", { jobId: currentJobId, talentId });
              toggleSave(currentJobId, "job");
              // Clear cache pools across adjacent job lists instantly
              queryClient.invalidateQueries({ queryKey: ["saved-items", talentId] });
            }}
            onClick={() => {
              trackEvent("infinite_jobs_item_navigation_triggered", { jobId: currentJobId, talentId });
              navigate(`/app/jobs/${currentJobId}`);
            }}
            matchInfo={{
              match_score: recordItem.match_score,
              reason:
                recordItem.match_reason === "verified_skill"
                  ? "Strong skill overlap with your profile"
                  : recordItem.match_reason === "profession"
                    ? "Matches your profession"
                    : recordItem.match_reason === "location_only"
                      ? "Open in your location"
                      : "Recently posted into feed",
              match_reason: recordItem.match_reason === "profession" ? "keyword" : (recordItem.match_reason as any),
            }}
          />
        );
      })}

      {/* Keyset Pagination Observer Sentinel Target Node */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center select-none w-full pt-1">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center text-[11px] font-bold text-muted-foreground/70 tracking-wide animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-primary stroke-[2.5]" />
            <span>Compiling subsequent timeline updates…</span>
          </div>
        ) : (
          !hasNextPage &&
          items.length > 6 && (
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/40 italic select-none animate-in fade-in duration-300">
              &mdash; Platform Career Stream Fully Synchronized &mdash;
            </p>
          )
        )}
      </div>
    </div>
  );
}
