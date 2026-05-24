import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingSkeletonProps {
  showNavbar?: boolean;
  showFooter?: boolean;
  variant?: "cards" | "list" | "detail" | "dashboard";
  title?: boolean;
}

/**
 * Full-page loading skeleton with an optional navbar, footer, and title row.
 * Use as a route-level Suspense fallback.
 */
export function PageLoadingSkeleton({
  showNavbar = true,
  showFooter = true,
  variant = "cards",
  title = false,
}: PageLoadingSkeletonProps) {
  const renderBody = () => {
    switch (variant) {
      case "cards":
        return <CardGridSkeleton count={6} />;

      case "list":
        return (
          <div className="space-y-3 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`sk-row-${i}`}
                className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-between gap-4 w-full"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-1/4 max-w-[140px]" />
                    <Skeleton className="h-3 w-1/2 max-w-[220px]" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        );

      case "detail":
        return (
          <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-6 w-2/3 max-w-[480px] rounded-md" />
              <Skeleton className="h-3.5 w-1/3 max-w-[240px] rounded-md" />
            </div>

            <Skeleton className="h-[260px] sm:h-[380px] w-full rounded-xl" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start w-full">
              <div className="md:col-span-2 space-y-4 w-full">
                <Skeleton className="h-4 w-1/3 max-w-[180px] rounded-md" />
                <div className="space-y-2 w-full pt-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              </div>

              <div className="space-y-4 w-full bg-muted/10 border border-border/60 p-4 rounded-xl">
                <Skeleton className="h-[140px] w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6 sm:space-y-8 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`sk-stat-${i}`}
                  className="rounded-xl border border-border/60 bg-card p-4 space-y-2.5 w-full"
                >
                  <Skeleton className="h-3 w-1/2 max-w-[80px] rounded" />
                  <Skeleton className="h-6 w-2/3 max-w-[120px] rounded-md" />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-5 w-full">
              <div className="flex justify-between items-center gap-4 w-full">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>

              <div className="space-y-2 w-full pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`sk-line-${i}`} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      {showNavbar ? (
        <div className="w-full border-b border-border/60 bg-card h-14 flex items-center shrink-0">
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 w-full">
            <Skeleton className="h-6 w-24 rounded-md" />
            <div className="flex gap-4 sm:gap-5 items-center">
              <Skeleton className="h-3 w-12 rounded hidden sm:block" />
              <Skeleton className="h-3 w-12 rounded hidden sm:block" />
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 w-full container mx-auto px-4 sm:px-6 py-6 sm:py-10 min-w-0">
        {title && (
          <div className="mb-6 sm:mb-8 space-y-2 w-full">
            <Skeleton className="h-7 w-64 max-w-[280px] rounded-lg" />
            <Skeleton className="h-4 w-full max-w-[420px] rounded" />
          </div>
        )}
        {renderBody()}
      </main>

      {showFooter ? (
        <div className="w-full h-32 border-t border-border/60 bg-muted/10 shrink-0 flex flex-col items-center justify-center gap-3 p-4 mt-8">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex gap-6 items-center">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Compact section-level skeleton: a stack of rounded rows.
 */
export function SectionSkeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={`sk-sec-${i}`} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Responsive grid of card skeletons.
 */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className = "",
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-2 lg:grid-cols-4",
    }[columns] || "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:gap-6 w-full", colClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`sk-card-${i}`}
          className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4 w-full"
        >
          <Skeleton className="h-40 sm:h-44 w-full rounded-lg" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-3/4 max-w-[200px] rounded-md" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
