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
  LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Marketplace Filter Node (V5.6.0)
 * CTO Reference: High-performance category selection grid handling dynamic overlay states.
 * Architecture: Optimized via explicit trigger bindings ensuring unbreakable sheet accessibility.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
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

  // Filter extra categories based on company feature flags defensively
  const extras = useMemo(() => {
    return EXTRA.filter((c) => c.value !== "company" || showCompanyTab);
  }, [showCompanyTab]);

  // Determine if active classification resides within the auxiliary drawer array
  const selectedExtra = useMemo(() => {
    return extras.find((c) => c.value === selectedCategory);
  }, [extras, selectedCategory]);

  return (
    <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-500 select-none">
      {/* SECTOR: RENDER PRIMARY STABLE CATEGORY NODES */}
      {PRIMARY.map((c) => (
        <FilterTile
          key={c.value}
          icon={c.icon}
          label={c.label}
          active={selectedCategory === c.value}
          onClick={() => onCategoryChange(c.value)}
        />
      ))}

      {/* SECTOR: ADAPTIVE TRIGGER INTERFACE CONTROL MODULE */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {!selectedExtra ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 bg-card/30 backdrop-blur-sm p-2 h-[72px] transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary/40",
                "border-border/40 hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <MoreHorizontal className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic group-hover:text-foreground transition-colors">
                More
              </span>
            </button>
          ) : (
            <FilterTile
              icon={selectedExtra.icon}
              label={selectedExtra.label}
              active={true}
              aria-haspopup="dialog"
              aria-expanded={open}
              // Architecture Guard: Pass empty callback to satisfy types. Radix will override and bind trigger.
              onClick={() => {}}
            />
          )}
        </SheetTrigger>

        {/* OVERLAY PANEL CONTENT DECK */}
        <SheetContent
          side="bottom"
          onPointerDownOutside={(e) => !open && e.preventDefault()}
          className="rounded-t-[40px] border-t-4 border-border/40 bg-background/95 backdrop-blur-2xl p-6 shadow-2xl"
        >
          <SheetHeader className="pb-4 border-b border-border/10 mb-4 text-left">
            <SheetTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Extended Matrix
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-3 gap-3">
            {/* RESET TARGET OPTION */}
            <FilterTile
              icon={Sparkles}
              label="All_Nodes"
              active={selectedCategory === "all"}
              onClick={() => {
                onCategoryChange("all");
                setOpen(false);
              }}
            />
            {/* RENDER REMAINING AUXILIARY SYSTEM CHANNELS */}
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
 * Isolated visual tile handling forwardRef assignments defensively to support trigger injection maps.
 */
const FilterTile = React.forwardRef<HTMLButtonElement, FilterTileProps>(
  ({ icon: Icon, label, active = false, className, ...props }, ref) => {
    // Normalize string designations cleanly to avoid code frame parsing hydration lags
    const standardizedLabel = useMemo(() => {
      return String(label || "NODE")
        .trim()
        .replace(/\s+/g, "_");
    }, [label]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 p-2 h-[72px] transition-all duration-300 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary/40",
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
          {standardizedLabel}
        </span>
      </button>
    );
  },
);

FilterTile.displayName = "FilterTile";
