import { useState } from "react";
import {
  Globe,
  MapPin,
  Briefcase,
  MoreHorizontal,
  Play,
  BookOpen,
  Newspaper,
  FileText,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";
import type {
  FeedFilters as FeedFiltersType,
  FeedFilterType,
  FeedScope,
} from "@/hooks/useFeedRecommendations";

/**
 * FeedFilters — single 4-slot row for community scope.
 * Slot 1: Global. Slot 4: More (content types). Slots 2 & 3: Country/Profession or fallback content types.
 */

interface FeedFiltersProps {
  filters: FeedFiltersType;
  onChange: (filters: FeedFiltersType) => void;
  counts?: Partial<Record<FeedFilterType, number>>;
}

interface ScopeTile {
  kind: "scope";
  scope: FeedScope;
  label: string;
  icon: LucideIcon;
}
interface TypeTile {
  kind: "type";
  value: FeedFilterType;
  label: string;
  icon: LucideIcon;
}
type Tile = ScopeTile | TypeTile;

const TYPE_DEFS: Record<Exclude<FeedFilterType, "all">, { label: string; icon: LucideIcon }> = {
  post: { label: "Posts", icon: FileText },
  course: { label: "Courses", icon: BookOpen },
  video: { label: "Videos", icon: Play },
  blog: { label: "Articles", icon: Newspaper },
  poll: { label: "Polls", icon: BarChart3 },
};

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const [open, setOpen] = useState(false);
  const { talent } = useTalent();
  const country = talent?.country;
  const profession = (talent as any)?.customProfession || (talent as any)?.custom_profession;

  // Build dynamic slots 2 & 3
  const middleSlots: Tile[] = [];
  if (country) {
    middleSlots.push({ kind: "scope", scope: "country", label: country, icon: MapPin });
  }
  if (profession) {
    middleSlots.push({ kind: "scope", scope: "profession", label: profession, icon: Briefcase });
  }
  // Fallback fillers in priority order
  const fallbackOrder: FeedFilterType[] = ["post", "course"];
  let idx = 0;
  while (middleSlots.length < 2 && idx < fallbackOrder.length) {
    const v = fallbackOrder[idx++];
    middleSlots.push({ kind: "type", value: v, label: TYPE_DEFS[v as Exclude<FeedFilterType, "all">].label, icon: TYPE_DEFS[v as Exclude<FeedFilterType, "all">].icon });
  }

  const isActive = (t: Tile) =>
    t.kind === "scope"
      ? filters.scope === t.scope && filters.type === "all"
      : filters.scope === "global" && filters.type === t.value;

  const selectScope = (scope: FeedScope) => onChange({ ...filters, scope, type: "all" });
  const selectType = (type: FeedFilterType) => onChange({ ...filters, scope: "global", type });

  const renderTile = (t: Tile, onClick: () => void, key: string) => {
    const active = isActive(t);
    const Icon = t.icon;
    const count = t.kind === "type" ? counts?.[t.value] : undefined;
    return (
      <button
        key={key}
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 h-[60px] transition-all active:scale-95 min-w-0",
          active
            ? "bg-primary border-primary text-primary-foreground shadow-md"
            : "bg-card border-border/60 text-foreground hover:border-primary/40",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-primary")} />
        <span className="text-[10px] font-semibold leading-none truncate max-w-full px-0.5">
          {t.label}
          {typeof count === "number" && count > 0 && (
            <span className={cn("ml-1 opacity-70", active ? "text-primary-foreground" : "text-muted-foreground")}>
              ({count})
            </span>
          )}
        </span>
      </button>
    );
  };

  // What goes in More: all content types not currently shown in front + scope tiles not shown.
  const shownTypes = new Set(middleSlots.filter((t) => t.kind === "type").map((t) => (t as TypeTile).value));
  const moreTypes: TypeTile[] = (Object.keys(TYPE_DEFS) as Array<Exclude<FeedFilterType, "all">>)
    .filter((v) => !shownTypes.has(v))
    .map((v) => ({ kind: "type", value: v, label: TYPE_DEFS[v].label, icon: TYPE_DEFS[v].icon }));

  const shownScopes = new Set(middleSlots.filter((t) => t.kind === "scope").map((t) => (t as ScopeTile).scope));
  const moreScopes: ScopeTile[] = [];
  if (country && !shownScopes.has("country")) {
    moreScopes.push({ kind: "scope", scope: "country", label: country, icon: MapPin });
  }
  if (profession && !shownScopes.has("profession")) {
    moreScopes.push({ kind: "scope", scope: "profession", label: profession, icon: Briefcase });
  }

  const globalTile: ScopeTile = { kind: "scope", scope: "global", label: "Global", icon: Globe };

  return (
    <div className="grid grid-cols-4 gap-2">
      {renderTile(globalTile, () => selectScope("global"), "global")}
      {middleSlots.map((t, i) =>
        renderTile(
          t,
          () => (t.kind === "scope" ? selectScope(t.scope) : selectType(t.value)),
          `mid-${i}`,
        ),
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card p-2 h-[60px] transition-all active:scale-95 hover:border-primary/40"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>More filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {moreScopes.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Community
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {moreScopes.map((t) =>
                    renderTile(
                      t,
                      () => {
                        selectScope(t.scope);
                        setOpen(false);
                      },
                      `more-scope-${t.scope}`,
                    ),
                  )}
                </div>
              </div>
            )}
            {moreTypes.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Content type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {moreTypes.map((t) =>
                    renderTile(
                      t,
                      () => {
                        selectType(t.value);
                        setOpen(false);
                      },
                      `more-type-${t.value}`,
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
