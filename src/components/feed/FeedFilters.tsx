import { Play, BookOpen, LayoutGrid, Newspaper, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedFilters, FeedFilterType, FeedSortType } from '@/hooks/useFeedRecommendations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedFiltersProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
  counts?: { all: number; course: number; video: number; blog: number; post: number; poll: number };
}

const filterOptions: { value: FeedFilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { value: 'post', label: 'Posts', icon: <FileText className="h-3.5 w-3.5" /> },
  { value: 'poll', label: 'Polls', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { value: 'course', label: 'Courses', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: 'video', label: 'Videos', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 'blog', label: 'Articles', icon: <Newspaper className="h-3.5 w-3.5" /> },
];

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const handleTypeChange = (type: FeedFilterType) => {
    onChange({ ...filters, type });
  };

  const handleSortChange = (sort: FeedSortType) => {
    onChange({ ...filters, sort });
  };

  return (
    <div className="space-y-2">
      {/* Segmented Control - All Options Visible */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
        {filterOptions.map((option) => {
          const count = counts?.[option.value] ?? 0;
          const isActive = filters.type === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleTypeChange(option.value)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-all text-center",
                isActive 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <span className="flex items-center gap-1">
                {option.icon}
              </span>
              <span className="text-[9px] font-medium mt-0.5">{option.label}</span>
              {counts && (
                <span className={cn(
                  "text-[8px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end">
        <Select value={filters.sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[110px] h-7 text-[10px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match" className="text-xs">Best Match</SelectItem>
            <SelectItem value="newest" className="text-xs">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
