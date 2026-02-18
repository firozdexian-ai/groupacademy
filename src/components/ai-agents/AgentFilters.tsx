import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgentCategory = "all" | "career" | "education" | "finance" | "wellness" | "company";

interface AgentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: AgentCategory;
  onCategoryChange: (category: AgentCategory) => void;
  showCompanyTab?: boolean;
}

const CATEGORIES: { value: AgentCategory; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "career", label: "Career", emoji: "🎯" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "wellness", label: "Wellness", emoji: "🧘" },
  { value: "company", label: "Companies", emoji: "🏢" },
];

export function AgentFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showCompanyTab = false,
}: AgentFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);

  const visibleCategories = CATEGORIES.filter(
    (c) => c.value !== "company" || showCompanyTab
  );

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        />
        <Input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-9 pr-9 h-11 bg-muted/50 border-0 focus-visible:ring-1"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {visibleCategories.map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              "whitespace-nowrap shrink-0",
              selectedCategory === category.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
