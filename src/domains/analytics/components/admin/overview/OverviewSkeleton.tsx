/**
 * Overview Skeleton Layout (Phase 10i — Hardened).
 * Aligns directly with standard shadcn system variables to preserve premium UI tokens.
 * Visually mimics the hydrated state of the Lifetime Overview tab to eliminate component thrashing.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OverviewSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Upper Action Align Strip Placeholder */}
      <div className="flex justify-end mb-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* 4-Card Primary KPI Row Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border border-border bg-card shadow-sm h-32">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
              <Skeleton className="h-7 w-3/4 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Performance & Analytics Layout Frame Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Performance Overview Skeleton */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10 space-y-2">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 sm:p-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-12 rounded-md" />
                    <Skeleton className="h-3 w-3 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Learning Progress Hub Skeleton */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <Skeleton className="h-5 w-1/3 rounded" />
            </CardHeader>
            <CardContent className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/2 rounded" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        {/* Right-Hand Column: Agent Anomaly Feed Placeholder */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <CardHeader className="p-6 border-b border-border bg-muted/20 space-y-2">
              <Skeleton className="h-5 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start border-b border-border pb-3 last:border-0 last:pb-0">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-1/3 rounded" />
                      <Skeleton className="h-3 w-10 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OverviewSkeleton;
