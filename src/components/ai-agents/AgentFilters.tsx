import React, { useState } from "react";
import {
  Sparkles,
  Target,
  BookOpen,
  Coins,
  Heart,
  Building2,
  GraduationCap,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Marketplace Filter Node
 * CTO Audit: Applied 2026 Premium SaaS aesthetic.
 * Fixed Radix UI `asChild` trap by implementing forwardRef on FilterTile.
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
  { value: "all", label: "All_Nodes", icon: Sparkles },
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
  const extras = EXTRA.filter((c) => c.value !== "company" || showCompanyTab);

  // If user has an extra category selected, surface that into slot 4 instead of "More"
  const selectedExtra = extras.find((c) => c.value === selectedCategory);
  const slot4: CategoryDef | "more" = selectedExtra ?? "more";

  return (
    <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
      {PRIMARY.map((c) => (
        <FilterTile
          key={c.value}
          icon={c.icon}
          label={c.label}
          active={selectedCategory === c.value}
          onClick={() => onCategoryChange(c.value)}
        />
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {slot4 === "more" ? (
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 bg-card/30 backdrop-blur-sm p-2 h-[72px] transition-all active:scale-95 group",
                "border-border/40 hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic group-hover:text-primary transition-colors">
                More
              </span>
            </button>
          ) : (
            <FilterTile
              icon={slot4.icon}
              label={slot4.label}
              active
              // Let the SheetTrigger handle the onClick to open the sheet
            />
          )}
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="rounded-t-[40px] border-t-4 border-border/40 bg-background/95 backdrop-blur-2xl p-6"
        >
          <SheetHeader className="pb-4 border-b border-border/10 mb-4 text-left">
            <SheetTitle className="text-xl font-black uppercase tracking-tighter italic">Extended Matrix</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3">
            <FilterTile
              icon={Sparkles}
              label="All_Nodes"
              active={selectedCategory === "all"}
              onClick={() => {
                onCategoryChange("all");
                setOpen(false);
              }}
            />
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

// CTO FIX: Wrapped in React.forwardRef to satisfy Radix UI `<SheetTrigger asChild>` requirements.
interface FilterTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const FilterTile = React.forwardRef<HTMLButtonElement, FilterTileProps>(
  ({ icon: Icon, label, active, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 p-2 h-[72px] transition-all duration-300 active:scale-95 group",
          active
            ? "bg-primary border-primary text-primary-foreground shadow-[0_10px_30px_rgba(var(--primary),0.3)] scale-[1.02]"
            : "bg-card/30 border-border/40 text-foreground hover:border-primary/40 hover:bg-primary/5",
          className,
        )}
        {...props}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
            active ? "text-primary-foreground" : "text-primary",
          )}
        />
        <span
          className={cn(
            "text-[9px] font-black uppercase tracking-widest italic line-clamp-1 truncate w-full text-center px-1",
            !active && "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {label}
        </span>
      </button>
    );
  },
);

FilterTile.displayName = "FilterTile";
