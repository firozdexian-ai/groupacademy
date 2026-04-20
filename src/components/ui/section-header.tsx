import { useNavigate } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Node Descriptor Protocol
 * Establishes hierarchical landmarks for content registries and dashboard partitions.
 */
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
  /** Size variant */
  size?: "sm" | "default";
}

export function SectionHeader({
  icon: Icon,
  title,
  count,
  viewAllPath,
  viewAllLabel = "Inspect All",
  onViewAll,
  className,
  size = "default",
}: SectionHeaderProps) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else if (viewAllPath) {
      navigate(viewAllPath);
    }
  };

  const showViewAll = !!(viewAllPath || onViewAll);

  return (
    <div
      className={cn(
        "flex items-center justify-between transition-all duration-300",
        size === "sm" ? "mb-4" : "mb-6",
        className,
      )}
    >
      {/* Identity Hub */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-primary/10 border border-primary/5 shadow-sm transition-transform hover:scale-110",
              size === "sm" ? "h-8 w-8" : "h-10 w-10",
            )}
          >
            <Icon className={cn("text-primary", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <h2
            className={cn(
              "font-black uppercase tracking-tighter text-foreground leading-none",
              size === "sm" ? "text-sm" : "text-xl md:text-2xl",
            )}
          >
            {title}
          </h2>

          {count !== undefined && (
            <span className="text-[10px] font-black font-mono tracking-widest text-muted-foreground/40 px-1.5 py-0.5 bg-muted/50 rounded-md border border-border/10">
              {count.toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {/* Global Sequence Trigger */}
      {showViewAll && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
            "hover:bg-primary/10 hover:text-primary active:scale-95 group",
            size === "sm" ? "px-2" : "px-4",
          )}
          onClick={handleViewAll}
        >
          {viewAllLabel}
          <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      )}
    </div>
  );
}
