import { Briefcase, Play, BookOpen, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FeedFilters, FeedFilterType, FeedSortType } from '@/hooks/useFeedRecommendations';

interface FeedFiltersProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
  counts?: { all: number; job: number; course: number; video: number };
}

const filterOptions: { value: FeedFilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { value: 'job', label: 'Jobs', icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: 'course', label: 'Courses', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: 'video', label: 'Videos', icon: <Play className="h-3.5 w-3.5" /> },
];

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const handleTypeChange = (type: FeedFilterType) => {
    onChange({ ...filters, type });
  };

  const handleSortChange = (sort: FeedSortType) => {
    onChange({ ...filters, sort });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Type Filter Pills - Horizontal Scrollable */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 flex-nowrap">
          {filterOptions.map((option) => {
            const count = counts?.[option.value] ?? 0;
            const isActive = filters.type === option.value;
            
            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeChange(option.value)}
                className={cn(
                  "gap-1 h-7 text-[10px] px-2 flex-shrink-0 transition-all",
                  isActive 
                    ? "shadow-sm" 
                    : "bg-background hover:bg-accent"
                )}
              >
                {option.icon}
                <span>{option.label}</span>
                {counts && (
                  <span className={cn(
                    "ml-0.5 px-1 py-0.5 rounded-full text-[9px] font-medium",
                    isActive 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Sort Dropdown - Compact */}
      <Select value={filters.sort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[90px] h-7 text-[10px] flex-shrink-0">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="match" className="text-xs">Best Match</SelectItem>
          <SelectItem value="newest" className="text-xs">Newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
