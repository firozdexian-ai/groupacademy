import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* Career Insights Carousel Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-[260px] p-4 rounded-xl border bg-muted/30">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-[130px] rounded-md" />
      </div>

      {/* Feed Cards Skeleton - New Design */}
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden relative">
          {/* Circular badge skeleton */}
          <Skeleton className="absolute top-3 right-3 h-11 w-11 rounded-full" />
          
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Company logo skeleton */}
              <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
              
              {/* Content skeleton */}
              <div className="flex-1 space-y-2 pr-12">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            </div>

            {/* Tinder-style action buttons skeleton */}
            <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-border/50">
              <Skeleton className="w-14 h-14 rounded-full" />
              <Skeleton className="w-14 h-14 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
