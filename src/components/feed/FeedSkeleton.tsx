import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {/* Insights Skeleton */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-[130px] rounded-md" />
      </div>

      {/* Feed Items Skeleton */}
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 flex-1 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
