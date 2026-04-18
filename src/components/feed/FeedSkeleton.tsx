import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FeedSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Banner Skeleton - Matches aspect-[3/1] */}
      <div className="relative overflow-hidden rounded-2xl aspect-[3/1] sm:aspect-[4/1] bg-muted/50">
        <div className="absolute inset-0 flex items-center px-6 gap-4">
          <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-4 ring-background" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 sm:w-48" />
            <Skeleton className="h-4 w-24 sm:w-32 opacity-60" />
          </div>
        </div>
      </div>

      {/* AI Insights Carousel Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20 opacity-50" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden -mx-4 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="shrink-0 w-[280px] sm:w-[320px] p-5 rounded-2xl border bg-card/50 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6 opacity-50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Filter Skeleton */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 p-1 bg-muted/20 rounded-xl border border-border/40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-2 space-y-2">
              <Skeleton className="h-4 w-4 rounded-md" />
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Redesigned Feed Cards Skeleton */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden border-border/40 rounded-2xl">
            {/* Media Area Skeleton */}
            <Skeleton className="aspect-video w-full rounded-none" />

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>

              {/* Skills/Badges Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>

              {/* AI Reason Skeleton */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex gap-2 items-start">
                  <Skeleton className="h-4 w-4 rounded-full mt-0.5 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              </div>

              {/* Footer Actions Skeleton */}
              <div className="flex gap-2 pt-4 border-t border-border/20">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
