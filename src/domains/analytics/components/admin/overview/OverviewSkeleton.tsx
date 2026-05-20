import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OverviewSkeleton() {
  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <header className="flex justify-between items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40">
        <div className="space-y-3 w-1/3">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </header>

      {/* 4-Card Top Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-[32px] border-border/30 bg-card/20 shadow-sm h-32">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/10 h-80">
          <CardHeader className="p-8 border-b border-border/10">
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[40px] border-2 border-border/40 bg-card/10 h-80">
          <CardHeader className="p-8 pb-2">
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
