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
 * GroUp Academy: Authoritative Immersive Pre-render Suite Node (PageLoadingSkeleton)
 * Hardened transitional structural layout providing seamless visual blueprints during network latency.
 * Version: Launch Candidate · Phase Z0 Geometric & Token Balance Lock
 */
export function PageLoadingSkeleton({
  showNavbar = true,
  showFooter = true,
  variant = "cards",
  title = false,
}: PageLoadingSkeletonProps) {
  const renderLayoutContentBlockNode = () => {
    switch (variant) {
      case "cards":
        return <CardGridSkeleton count={6} />;

      case "list":
        return (
          <div className="space-y-3.5 w-full block">
            {Array.from({ length: 5 }).map((_, indexNum) => (
              <div
                key={`sk-list-row-${indexNum}`}
                className="rounded-xl border border-border/40 bg-card/40 p-4 flex items-center justify-between gap-4 sm:gap-5 w-full shrink-0 antialiased transform-gpu"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0 leading-none">
                    <Skeleton className="h-3.5 w-1/4 max-w-[140px]" />
                    <Skeleton className="h-3 w-1/2 max-w-[220px] opacity-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        );

      case "detail":
        return (
          <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 block antialiased transform-gpu">
            <div className="space-y-2 leading-none">
              <Skeleton className="h-6 w-2/3 max-w-[480px] rounded-md" />
              <Skeleton className="h-3.5 w-1/3 max-w-[240px] opacity-40 rounded-md" />
            </div>

            <Skeleton className="h-[260px] sm:h-[380px] w-full rounded-xl shadow-xs" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start w-full">
              <div className="md:col-span-2 space-y-4 w-full">
                <Skeleton className="h-4.5 w-1/3 max-w-[180px] rounded-md" />
                <div className="space-y-2 w-full leading-none pt-1">
                  <Skeleton className="h-3.5 w-full rounded-xs" />
                  <Skeleton className="h-3.5 w-full rounded-xs" />
                  <Skeleton className="h-3.5 w-4/5 rounded-xs opacity-60" />
                </div>
              </div>

              <div className="space-y-4 w-full bg-muted/10 border border-border/20 p-4 rounded-xl shrink-0">
                <Skeleton className="h-[140px] w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6 sm:space-y-8 w-full block antialiased transform-gpu">
            {/* Stats Metric Panel Grid Rows */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 w-full">
              {Array.from({ length: 4 }).map((_, indexNum) => (
                <div
                  key={`sk-metric-${indexNum}`}
                  className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2.5 shadow-xs leading-none w-full shrink-0"
                >
                  <Skeleton className="h-3 w-1/2 max-w-[80px] opacity-40 rounded-xs" />
                  <Skeleton className="h-6 w-2/3 max-w-[120px] rounded-md" />
                </div>
              ))}
            </div>

            {/* Main Central Workspace Sheet Container Content */}
            <div className="rounded-xl border border-border/40 bg-card/40 p-4 sm:p-5 space-y-5 w-full block">
              <div className="flex justify-between items-center gap-4 w-full shrink-0 leading-none">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>

              <div className="space-y-2 w-full block pt-1">
                {Array.from({ length: 4 }).map((_, indexNum) => (
                  <Skeleton key={`sk-registry-row-${indexNum}`} className="h-11 w-full rounded-lg opacity-40" />
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between items-center w-full transform-gpu antialiased select-none font-sans">
      {/* MOCK FRAME LEVEL 1: APPLICATION SHELL NAVBAR ROW CONTAINER */}
      {showNavbar ? (
        <div className="w-full border-b border-border/40 bg-card/60 backdrop-blur-md h-14 flex items-center justify-center shrink-0 select-none pointer-events-none">
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 w-full">
            <Skeleton className="h-6 w-24 rounded-md" />
            <div className="flex gap-4 sm:gap-5 items-center">
              <Skeleton className="h-3 w-12 rounded-xs hidden sm:block" />
              <Skeleton className="h-3 w-12 rounded-xs hidden sm:block" />
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-1 shrink-0 select-none pointer-events-none" aria-hidden="true" />
      )}

      {/* MOCK FRAME LEVEL 2: COMPOSITE DOWNSTREAM ELEMENT VIEW CANVAS */}
      <main className="flex-1 w-full container mx-auto px-4 sm:px-6 py-6 sm:py-10 min-w-0">
        {title && (
          <div className="mb-6 sm:mb-8 space-y-2 leading-none text-left select-none pointer-events-none w-full block">
            <Skeleton className="h-7 w-64 max-w-[280px] rounded-lg" />
            <Skeleton className="h-4 w-full max-w-[420px] opacity-40 rounded-xs" />
          </div>
        )}
        {renderLayoutContentBlockNode()}
      </main>

      {/* MOCK FRAME LEVEL 3: FOOTER ACCORDION STRUCTURAL SIMULATION WALL */}
      {showFooter ? (
        <div className="w-full h-44 border-t border-border/10 bg-muted/10 shrink-0 flex flex-col items-center justify-center gap-4 select-none pointer-events-none p-4 mt-12">
          <Skeleton className="h-4.5 w-32 opacity-20 rounded-md" />
          <div className="flex gap-6 sm:gap-8 items-center justify-center leading-none">
            <Skeleton className="h-3 w-14 opacity-10 rounded-xs" />
            <Skeleton className="h-3 w-14 opacity-10 rounded-xs" />
            <Skeleton className="h-3 w-14 opacity-10 rounded-xs" />
          </div>
        </div>
      ) : (
        <div className="h-1 shrink-0 select-none pointer-events-none" aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * SectionSkeleton: Modular context inline disclosure mapping card arrays
 */
export function SectionSkeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn("space-y-2.5 w-full block select-none pointer-events-none transform-gpu antialiased", className)}
    >
      {Array.from({ length: rows }).map((_, indexNum) => (
        <Skeleton key={`sk-section-row-${indexNum}`} className="h-11 w-full rounded-lg opacity-50" />
      ))}
    </div>
  );
}

/**
 * CardGridSkeleton: Universal responsive masonry structure simulation block
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
  const gridResponsiveLayoutClassMapStr =
    {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-2 lg:grid-cols-4",
    }[columns] || "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:gap-6 w-full select-none pointer-events-none transform-gpu antialiased",
        gridResponsiveLayoutClassMapStr,
        className,
      )}
    >
      {Array.from({ length: count }).map((_, indexNum) => (
        <div
          key={`sk-grid-cell-${indexNum}`}
          className="rounded-xl border border-border/40 bg-card/40 p-4 sm:p-5 space-y-4 shadow-none w-full shrink-0 flex flex-col justify-center text-left leading-none"
        >
          <Skeleton className="h-40 sm:h-44 w-full rounded-lg shrink-0" />
          <div className="space-y-2 w-full block leading-none pt-0.5">
            <Skeleton className="h-4 w-3/4 max-w-[200px] rounded-md" />
            <Skeleton className="h-3.5 w-full rounded-xs opacity-50" />
            <Skeleton className="h-3.5 w-2/3 rounded-xs opacity-50" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl shrink-0 pt-1" />
        </div>
      ))}
    </div>
  );
}
