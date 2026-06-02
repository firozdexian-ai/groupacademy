import { useState, useEffect } from "react";
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
import { trackEvent, trackWarning } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import type { FeedFilters as FeedFiltersType, FeedFilterType, FeedScope } from "@/domains/feed/hooks/useFeedRecommendations";

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

/**
 * FeedFilters — A clean horizontal action row providing community discovery channels 
 * and localized scoping segments for the feed.
 */
export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const [open, setOpen] = useState(false);
  const { talent } = useTalent();

  const country = talent?.country;
  const profession = (talent as any)?.customProfession || (talent as any)?.custom_profession;

  // Validate profile demographics and log non-canonical layouts cleanly in the background
  useEffect(() => {
    if (talent?.id) {
      if (country && (country.toLowerCase() === "bd" || country.length <= 2)) {
        trackWarning(`Non-canonical country code layout profile exposed on Feed onboarding path`, {
          component: "FeedFilters",
          action: "validate_demographics",
          talentId: talent.id,
          detectedValue: country,
        });
      }

      trackEvent("feed_filters_rendered", {
        talentId: talent.id,
        currentScope: filters.scope,
        currentType: filters.type,
      });
    }
  }, [talent, country, filters]);

  // Build dynamic navigation items based on profile data configurations
  const middleSlots: Tile[] = [];
  if (country) {
    middleSlots.push({ kind: "scope", scope: "country", label: country, icon: MapPin });
  }
  if (profession) {
    middleSlots.push({ kind: "scope", scope: "profession", label: profession, icon: Briefcase });
  }

  // Populate layout fallbacks systematically if profile vectors are empty
  const fallbackOrder: FeedFilterType[] = ["post", "course"];
  let idx = 0;
  while (middleSlots.length < 2 && idx < fallbackOrder.length) {
    const v = fallbackOrder[idx++];
    middleSlots.push({
      kind: "type",
      value: v,
      label: TYPE_DEFS[v as Exclude<FeedFilterType, "all">].label,
      icon: TYPE_DEFS[v as Exclude<FeedFilterType, "all">].icon,
    });
  }

  const isActive = (t: Tile) =>
    t.kind === "scope"
      ? filters.scope === t.scope && filters.type === "all"
      : filters.scope === "global" && filters.type === t.value;

  const selectScope = (scope: FeedScope) => {
    trackEvent("feed_scope_selected", { targetScope: scope });
    onChange({ ...filters, scope, type: "all" });
  };

  const selectType = (type: FeedFilterType) => {
    trackEvent("feed_type_selected", { targetType: type });
    onChange({ ...filters, scope: "global", type });
  };

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
          "flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 h-[60px] transition-all select-none cursor-pointer active:scale-[0.97] duration-200 min-w-0 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-primary border-primary text-primary-foreground shadow-sm font-bold"
            : "bg-card border-border/40 text-foreground hover:border-primary/30 hover:bg-accent/40",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            active ? "text-primary-foreground" : "text-primary",
          )}
        />
        <span className="text-[10px] font-semibold leading-none truncate max-w-full px-0.5 tracking-tight">
          {t.label}
          {typeof count === "number" && count > 0 && (
            <span className={cn("ml-1 opacity-75 tabular-nums font-medium")}>({count})</span>
          )}
        </span>
      </button>
    );
  };

  // Extract non-rendered filter components to populate the overflow menu panel
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
    <div className={cn("grid grid-cols-4 gap-2 w-full touch-manipulation")}>
      {renderTile(globalTile, () => selectScope("global"), "global")}
      {middleSlots.map((t, i) =>
        renderTile(t, () => (t.kind === "scope" ? selectScope(t.scope) : selectType(t.value)), `mid-${i}`),
      )}

      {/* Overflow filter options sheet */}
      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) trackEvent("feed_more_filters_drawer_opened");
        }}
      >
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/40 bg-card p-2 h-[60px] transition-all select-none cursor-pointer active:scale-[0.97] hover:border-primary/30 hover:bg-accent/40"
            aria-label="Open advanced discovery filters"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
            <span className="text-[10px] font-semibold text-muted-foreground tracking-tight">More</span>
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl pt-safe-top pb-safe-bottom"
        >
          <SheetHeader className="pb-2 border-b border-border/20">
            <SheetTitle className="text-sm font-bold tracking-tight text-foreground text-center">
              Discovery Filters
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
            {moreScopes.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-[10px] font-bold text-muted-foreground/80 mb-2 uppercase tracking-wider pl-1">
                  Community Segments
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
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                <p className="text-[10px] font-bold text-muted-foreground/80 mb-2 uppercase tracking-wider pl-1">
                  Content Types
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