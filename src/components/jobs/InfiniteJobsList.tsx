import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { JobCard } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankedJobs } from "@/hooks/useRankedJobs";
import { useSavedItems } from "@/hooks/useSavedItems";

interface Props {
  talentId: string | undefined;
}

/**
 * Infinite, zero-latency ranked job list.
 * Renders the deterministic match score on every card for free.
 */
export function InfiniteJobsList({ talentId }: Props) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSavedItems();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useRankedJobs(talentId);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[64px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = (data?.pages ?? []).flat();
  if (items.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center border border-dashed rounded-xl bg-muted/20">
        <p className="text-sm text-muted-foreground italic">
          Complete your profile to unlock matched jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <JobCard
          key={r.job.id}
          job={r.job as any}
          variant="compact"
          isSaved={isSaved(r.job.id, "job")}
          onSaveToggle={() => toggleSave(r.job.id, "job")}
          onClick={() => navigate(`/app/jobs/${r.job.id}`)}
          matchInfo={{
            match_score: r.match_score,
            reason:
              r.match_reason === "verified_skill"
                ? "Strong skill overlap with your profile"
                : r.match_reason === "profession"
                ? "Matches your profession"
                : r.match_reason === "location_only"
                ? "Open in your location"
                : "Recently posted",
            match_reason: r.match_reason === "profession" ? "keyword" : (r.match_reason as any),
          }}
        />
      ))}

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!hasNextPage && items.length > 6 && (
          <p className="text-[10px] text-muted-foreground italic">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}
