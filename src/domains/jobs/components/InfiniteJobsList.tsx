/**
 * Infinite Jobs List Component — Phase INST-Z2 Hardened
 * CTO Version: June 2026
 * Refactored for absolute layout alignment, plain-language parsing, and optimized cache invalidation loops.
 * Rules: All original event pipelines and properties remain fully immutable.
 */
import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { JobCard } from "./JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankedJobs } from "@/domains/jobs";
import { useSavedItems } from "@/hooks/useSavedItems";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  talentId: string | undefined;
}

/**
 * Infinite, ranked job list with keyset pagination and an IntersectionObserver sentinel.
 */
export function InfiniteJobsList({ talentId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSaved, toggleSave } = useSavedItems();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useRankedJobs(talentId);

  // Sentinel intersection observer for infinite scroll.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isFetchingNextPage) {
          trackEvent("infinite_jobs_sentinel_triggered", { talentId });
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "600px", // Expanded trigger threshold for seamless proactive data ingestion
      },
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, talentId]);

  useEffect(() => {
    if (queryError) {
      trackError(queryError, {
        component: "InfiniteJobsList",
        action: "fetch_ranked_jobs",
        talentId,
      });
    }
  }, [queryError, talentId]);

  const items = useMemo(() => {
    return (data?.pages ?? []).flat().filter(Boolean);
  }, [data]);

  useEffect(() => {
    if (items.length > 0) {
      trackEvent("infinite_jobs_loaded", {
        count: items.length,
        talentId,
      });
    }
  }, [items.length, talentId]);

  if (isLoading) {
    return (
      <div className="space-y-4 select-none w-full px-0.5">
        {[1, 2, 3, 4].map((skeletonIndex) => (
          <div
            key={skeletonIndex}
            className="w-full h-[140px] rounded-2xl bg-muted/20 animate-pulse border border-border/40 p-4 flex flex-col justify-between"
          >
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-xl bg-muted/40" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 bg-muted/40" />
                <Skeleton className="h-3 w-1/2 bg-muted/40" />
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-border/5 pt-3">
              <Skeleton className="h-4 w-20 bg-muted/40" />
              <Skeleton className="h-4 w-16 bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 select-none text-center w-full max-w-full animate-in fade-in duration-300">
        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center mb-3 shadow-inner border border-primary/5">
          <Sparkles className="h-5 w-5 text-primary/60 animate-pulse" />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 tracking-tight max-w-xs mx-auto">
          No matching jobs yet. Complete your profile to unlock personalized matches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full antialiased select-none sm:select-text px-0.5">
      {items.map((recordItem: any) => {
        if (!recordItem || !recordItem.job || !recordItem.job.id) return null;

        const currentJobId = recordItem.job.id;

        return (
          <JobCard
            key={currentJobId}
            job={recordItem.job as any}
            variant="default" // Shifted to default variant to bring vertical row items up to standard density map
            isSaved={!!isSaved(currentJobId, "job")}
            onSaveToggle={() => {
              trackEvent("infinite_jobs_item_save_toggled", { jobId: currentJobId, talentId });
              toggleSave(currentJobId, "job");

              // Synchronize cache pools instantly across adjacent elements and specific listings queries
              queryClient.invalidateQueries({ queryKey: ["saved-items"] });
              queryClient.invalidateQueries({ queryKey: ["ranked-jobs"] });
              queryClient.invalidateQueries({ queryKey: ["jobs-hub-dashboard"] });
            }}
            onClick={() => {
              trackEvent("infinite_jobs_item_navigation_triggered", { jobId: currentJobId, talentId });
              navigate(`/app/jobs/${currentJobId}`);
            }}
            matchInfo={{
              match_score: recordItem.match_score,
              reason:
                recordItem.match_reason === "verified_skill"
                  ? "Strong skill overlap with your verified profile credentials"
                  : recordItem.match_reason === "profession"
                    ? "Matches your chosen industry track profession"
                    : recordItem.match_reason === "location_only"
                      ? "Open for remote or local deployment in your region"
                      : "Recommended based on recent platform matches",
              match_reason: recordItem.match_reason === "profession" ? "keyword" : (recordItem.match_reason as any),
            }}
          />
        );
      })}

      {/* Sentinel for infinite scroll tracking configurations */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center select-none w-full pt-2">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center text-[11px] font-bold text-muted-foreground/70 tracking-wide animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-primary stroke-[2.5]" />
            <span>Loading more jobs…</span>
          </div>
        ) : (
          !hasNextPage &&
          items.length > 4 && (
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/40 select-none animate-in fade-in duration-300">
              — You're all caught up —
            </p>
          )
        )}
      </div>
    </div>
  );
}
