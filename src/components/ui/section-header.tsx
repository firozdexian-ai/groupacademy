import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  /** Optional count badge next to title */
  count?: number;
  /** Path for "View All" link */
  viewAllPath?: string;
  /** Custom label for the link (default: "View all") */
  viewAllLabel?: string;
  /** Custom onClick for "View All" instead of navigation */
  onViewAll?: () => void;
  /** Extra className for the wrapper */
  className?: string;
  /** Size variant configuration token matrix */
  size?: "sm" | "default";
}

/**
 * GroUp Academy: Technical Architecture Landmark Descriptor Node (SectionHeader)
 * Hardened heading row isolating visual counters and securing micro-trigger alignment blocks from layout shifting.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Locked
 */
export function SectionHeader({
  icon: LandmarkIconNode,
  title,
  count,
  viewAllPath,
  viewAllLabel = "Inspect All",
  onViewAll,
  className,
  size = "default",
}: SectionHeaderProps) {
  const navigate = useNavigate();

  const handleViewAllActionHook = React.useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else if (viewAllPath) {
      navigate(viewAllPath);
    }
  }, [onViewAll, viewAllPath, navigate]);

  const hasActiveSequenceTriggerRoute = !!(viewAllPath || onViewAll);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 w-full select-none text-left antialiased transform-gpu leading-none shrink-0",
        className,
      )}
    >
      {/* HUD LEVEL 1: STRUCTURAL IDENTITY LANDMARK CORE INFO HUB */}
      <div className="flex items-center gap-2.5 min-w-0">
        {LandmarkIconNode && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg bg-primary/10 border border-primary/5 text-primary shrink-0 transition-colors duration-150 pointer-events-none",
              size === "sm" ? "h-7 w-7" : "h-9 w-9",
            )}
          >
            <LandmarkIconNode className={cn("stroke-[2.2]", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </div>
        )}

        <div className="flex items-center gap-2 min-w-0 leading-none">
          <h2
            className={cn(
              "font-bold uppercase tracking-wide text-foreground truncate block pt-0.5",
              size === "sm" ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg",
            )}
          >
            {title}
          </h2>

          {count !== undefined && (
            <span
              className="font-mono text-[9px] font-extrabold tracking-normal text-muted-foreground/50 h-4 min-w-[18px] inline-flex items-center justify-center rounded bg-muted/40 px-1 border border-border/40 select-text leading-none pointer-events-auto pt-0.5 shadow-xs tabular-nums"
              aria-label={`Registry payload tracking counter: ${count} elements loaded`}
            >
              {count.toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {/* HUD LEVEL 2: NAVIGATION SEQUENCE TARGET ACCESS ACTION CONTROLLERS */}
      {hasActiveSequenceTriggerRoute && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleViewAllActionHook}
          className={cn(
            "h-8 rounded-lg font-bold uppercase text-[10px] tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-accent gap-1 cursor-pointer transition-colors group shrink-0 transform-gpu active:scale-[0.985]",
            size === "sm" ? "px-2" : "px-3",
          )}
        >
          <span>{viewAllLabel}</span>
          <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] text-muted-foreground/30 group-hover:text-foreground transition-transform duration-150 transform group-hover:translate-x-0.5" />
        </Button>
      )}
    </div>
  );
}
