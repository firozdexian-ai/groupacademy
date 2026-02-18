import { useNavigate } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  viewAllLabel = "View all",
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

  const showViewAll = viewAllPath || onViewAll;

  return (
    <div className={`flex items-center justify-between mb-3 sm:mb-4 ${className || ""}`}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className={`${size === "sm" ? "p-1" : "p-1.5"} rounded-lg bg-primary/10`}>
            <Icon className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} text-primary`} />
          </div>
        )}
        <h2 className={`${size === "sm" ? "text-sm" : "text-base"} font-bold`}>
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </div>
      {showViewAll && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary font-medium h-8 text-xs gap-0.5 px-2"
          onClick={handleViewAll}
        >
          {viewAllLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
