import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Target,
  BookOpen,
  Coins,
  Heart,
  Building2,
  GraduationCap,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Marketplace Category Filter Node
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/marketplace?tab=all (Filter Navigation Shell)
 * Operations Mode: High-performance category selection matrix handling responsive overlay drawers.
 */

export type AgentCategory = "all" | "career" | "education" | "instructor" | "finance" | "wellness" | "company";

interface AgentFiltersProps {
  selectedCategory: AgentCategory;
  onCategoryChange: (c: AgentCategory) => void;
  showCompanyTab?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

interface CategoryDef {
  value: AgentCategory;
  label: string;
  icon: LucideIcon;
}

const PRIMARY: CategoryDef[] = [
  { value: "all", label: "All Agents", icon: Sparkles },
  { value: "career", label: "Career", icon: Target },
  { value: "education", label: "Learning", icon: BookOpen },
];

const EXTRA: CategoryDef[] = [
  { value: "instructor", label: "Mentors", icon: GraduationCap },
  { value: "finance", label: "Finance", icon: Coins },
  { value: "wellness", label: "Wellness", icon: Heart },
  { value: "company", label: "Corporate", icon: Building2 },
];

export function AgentFilters({ selectedCategory, onCategoryChange, showCompanyTab = false }: AgentFiltersProps) {
  const [open, setOpen] = useState(false);

  // Filter extra categories based on system organization permissions flags defensively
  const extras = useMemo(() => {
    return EXTRA.filter((c) => c.value !== "company" || showCompanyTab);
  }, [showCompanyTab]);

  // Determine if active classification resides within the hidden auxiliary drawer list
  const selectedExtra = useMemo(() => {
    return extras.find((c) => c.value === selectedCategory);
  }, [extras, selectedCategory]);

  return (
    <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 select-none text-left">
      {/* Primary Filtering Options Display */}
      {PRIMARY.map((c) => (
        <FilterTile
          key={c.value}
          icon={c.icon}
          label={c.label}
          active={selectedCategory === c.value}
          onClick={() => onCategoryChange(c.value)}
        />
      ))}

      {/* Auxiliary Overlay Filter Switch Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {!selectedExtra ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-2 h-16 transition-all active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
                "hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <MoreHorizontal className="h-4 w-4 text-primary transition-transform group-hover:scale-105" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                More Filters
              </span>
            </button>
          ) : (
            <FilterTile
              icon={selectedExtra.icon}
              label={selectedExtra.label}
              active={true}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => {}}
            />
          )}
        </SheetTrigger>

        {/* Dynamic Category Overlay Target Content */}
        <SheetContent
          side="bottom"
          onPointerDownOutside={(e) => !open && e.preventDefault()}
          className="rounded-t-3xl border-t border-border bg-background/95 backdrop-blur-xl p-5 shadow-xl"
        >
          <SheetHeader className="pb-3 border-b border-border/40 mb-4 text-left">
            <SheetTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Filter Categories
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-3">
            {/* Standard Global Categories Reset Option */}
            <FilterTile
              icon={Sparkles}
              label="All Agents"
              active={selectedCategory === "all"}
              onClick={() => {
                onCategoryChange("all");
                setOpen(false);
              }}
            />
            {/* Render Auxiliary Channel Options */}
            {extras.map((c) => (
              <FilterTile
                key={c.value}
                icon={c.icon}
                label={c.label}
                active={selectedCategory === c.value}
                onClick={() => {
                  onCategoryChange(c.value);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface FilterTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

/**
 * Isolated structural choice element configured cleanly to intercept forwardRef parameters
 */
const FilterTile = React.forwardRef<HTMLButtonElement, FilterTileProps>(
  ({ icon: Icon, label, active = false, className, ...props }, ref) => {
    const cleanLabel = useMemo(() => {
      return String(label || "").trim();
    }, [label]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-xl border p-2 h-16 transition-all duration-200 active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 text-center",
          active
            ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.01]"
            : "bg-card/50 border-border text-foreground hover:border-primary/40 hover:bg-primary/5",
          className,
        )}
        {...props}
      >
        <Icon
          className={cn(
            "h-4 w-4 transition-transform duration-200 group-hover:scale-105",
            active ? "text-primary-foreground" : "text-primary",
          )}
        />
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider line-clamp-1 truncate w-full px-1",
            active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {cleanLabel}
        </span>
      </button>
    );
  },
);

FilterTile.displayName = "FilterTile";

export default AgentFilters;
