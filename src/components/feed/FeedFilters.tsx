import { Play, BookOpen, LayoutGrid, Newspaper, FileText, BarChart3, LucideIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedFilters as FeedFiltersType, FeedFilterType } from "@/hooks/useFeedRecommendations";

/**
 * FeedFilters — segmented control to filter feed by content type.
 */

interface FeedFiltersProps {
  filters: FeedFiltersType;
  onChange: (filters: FeedFiltersType) => void;
  counts?: {
    all: number;
    course: number;
    video: number;
    blog: number;
    post: number;
    poll: number;
  };
}

const filterOptions: {
  value: FeedFilterType;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "post", label: "Posts", icon: FileText },
  { value: "poll", label: "Polls", icon: BarChart3 },
  { value: "course", label: "Courses", icon: BookOpen },
  { value: "video", label: "Videos", icon: Play },
  { value: "blog", label: "Articles", icon: Newspaper },
];

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const handleTypeChange = (type: FeedFilterType) => {
    onChange({ ...filters, type });
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 animate-in fade-in duration-500">
      <div className="flex sm:grid sm:grid-cols-6 gap-2 p-1.5 bg-muted/20 backdrop-blur-md rounded-[20px] border-2 border-border/40 min-w-max sm:min-w-full shadow-inner">
        {filterOptions.map((option) => {
          const count = counts?.[option.value] ?? 0;
          const isActive = filters.type === option.value;
          const isEmpty = counts && count === 0 && !isActive;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => handleTypeChange(option.value)}
              className={cn(
                "group relative flex flex-col items-center justify-center py-3 px-4 sm:px-1 rounded-2xl transition-all duration-300 min-w-[85px] sm:min-w-0 border-2",
                isActive
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-transparent border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/10",
                isEmpty && "opacity-30 grayscale pointer-events-none",
              )}
            >
              {/* Hardware-Accelerated Icon Node */}
              <Icon
                className={cn(
                  "h-5 w-5 mb-1.5 transition-all duration-500",
                  isActive ? "scale-110 rotate-0" : "group-hover:scale-110 group-hover:rotate-3",
                )}
              />

              <span
                className={cn(
                  "text-[10px] font-semibold leading-none transition-colors",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-primary",
                )}
              >
                {option.label}
              </span>

              {/* Real-time Telemetry Counter */}
              {counts && (
                <div
                  className={cn(
                    "absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1.5 rounded-full border-2 text-[8px] font-black tabular-nums transition-all",
                    isActive
                      ? "bg-white text-primary border-white"
                      : "bg-muted text-muted-foreground border-border/40 group-hover:border-primary/20",
                  )}
                >
                  {count}
                </div>
              )}

              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
