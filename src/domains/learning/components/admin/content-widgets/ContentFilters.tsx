import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Layers, Zap, ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Registry Query HUD (Content Filters)
 * High-fidelity control node for interrogating the academic content registry.
 * 2026 Standard: Executive Logic geometry with reinforced state handshakes.
 */

interface FilterOption {
  id: string;
  name: string;
}

export interface ContentFilterValues {
  programId: string;
  levelId: string;
  readiness: string;
  sortBy: string;
  typeSegment?: "all" | "recorded" | "live" | "offline" | "free";
  dateWindow?: "all" | "upcoming" | "this_week" | "past" | "undated";
}

const TYPE_SEGMENTS: { value: NonNullable<ContentFilterValues["typeSegment"]>; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recorded", label: "Recorded" },
  { value: "live", label: "Live & Webinars" },
  { value: "offline", label: "Offline" },
  { value: "free", label: "Free" },
];

const DATE_WINDOWS: { value: NonNullable<ContentFilterValues["dateWindow"]>; label: string }[] = [
  { value: "all", label: "Any date" },
  { value: "upcoming", label: "Upcoming" },
  { value: "this_week", label: "This week" },
  { value: "past", label: "Past" },
  { value: "undated", label: "Undated" },
];

interface ContentFiltersProps {
  values: ContentFilterValues;
  onChange: (values: ContentFilterValues) => void;
  className?: string;
}

const ContentFilters = ({ values, onChange, className }: ContentFiltersProps) => {
  const [programs, setPrograms] = useState<FilterOption[]>([]);
  const [levels, setLevels] = useState<FilterOption[]>([]);

  useEffect(() => {
    const loadRegistryOptions = async () => {
      const [progRes, lvlRes] = await Promise.all([
        supabase.from("profession_categories").select("id, name").order("name"),
        supabase.from("profession_levels").select("id, name").order("display_order"),
      ]);
      if (progRes.data) setPrograms(progRes.data);
      if (lvlRes.data) setLevels(lvlRes.data);
    };
    loadRegistryOptions();
  }, []);

  const updateLogic = (key: keyof ContentFilterValues, val: string) => {
    onChange({ ...values, [key]: val });
  };

  const segment = values.typeSegment || "all";
  const dateWindow = values.dateWindow || "all";
  const showDateWindow = segment === "live" || segment === "offline";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick type segments */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
        {TYPE_SEGMENTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => updateLogic("typeSegment", s.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
              segment === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {showDateWindow && (
        <div className="flex flex-wrap gap-1.5">
          {DATE_WINDOWS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => updateLogic("dateWindow", d.value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-colors",
                dateWindow === d.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 p-1">
      {/* Program Identifier */}
      <div className="relative group">
        <Select value={values.programId} onValueChange={(v) => updateLogic("programId", v)}>
          <SelectTrigger className="w-[200px] h-11 rounded-xl border-2 bg-card/50 font-black uppercase text-[10px] tracking-widest transition-all hover:border-primary/40 focus:ring-0">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary/60" />
              <SelectValue placeholder="Protocol: All" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-2xl">
            <SelectItem value="all" className="font-bold uppercase text-[9px]">
              Global Protocol
            </SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id} className="font-bold">
                {p.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tier Level Selector */}
      <Select value={values.levelId} onValueChange={(v) => updateLogic("levelId", v)}>
        <SelectTrigger className="w-[160px] h-11 rounded-xl border-2 bg-card/50 font-black uppercase text-[10px] tracking-widest transition-all hover:border-primary/40 focus:ring-0">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500/60" />
            <SelectValue placeholder="Tier: Global" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-2 shadow-2xl">
          <SelectItem value="all" className="font-bold uppercase text-[9px]">
            All Logic Tiers
          </SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id} className="font-bold">
              {l.name.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Readiness Telemetry */}
      <Select value={values.readiness} onValueChange={(v) => updateLogic("readiness", v)}>
        <SelectTrigger className="w-[180px] h-11 rounded-xl border-2 bg-card/50 font-black uppercase text-[10px] tracking-widest transition-all hover:border-primary/40 focus:ring-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-primary/60" />
            <SelectValue placeholder="Status: Telemetry" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-2 shadow-2xl">
          <SelectItem value="all" className="font-bold uppercase text-[9px]">
            All Statuses
          </SelectItem>
          <SelectItem value="inactive_only" className="font-bold uppercase text-[9px] text-destructive">
            Inactive Only (Not Ready)
          </SelectItem>
          <SelectItem value="ready_only" className="font-bold uppercase text-[9px] text-emerald-500">
            Ready Only
          </SelectItem>
          <SelectItem value="published" className="font-bold uppercase text-[9px]">
            Published
          </SelectItem>
          <SelectItem value="draft" className="font-bold uppercase text-[9px]">
            Draft
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Sorting Sequence */}
      <Select value={values.sortBy} onValueChange={(v) => updateLogic("sortBy", v)}>
        <SelectTrigger className="w-[150px] h-11 rounded-xl border-2 bg-card/50 font-black uppercase text-[10px] tracking-widest transition-all hover:border-primary/40 focus:ring-0">
          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="w-3.5 h-3.5 text-primary/60" />
            <SelectValue placeholder="Sequence" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-2 shadow-2xl">
          <SelectItem value="newest" className="font-bold uppercase text-[9px]">
            Newest
          </SelectItem>
          <SelectItem value="oldest" className="font-bold uppercase text-[9px]">
            Oldest
          </SelectItem>
          <SelectItem value="title_asc" className="font-bold uppercase text-[9px]">
            Title A-Z
          </SelectItem>
          <SelectItem value="title_desc" className="font-bold uppercase text-[9px]">
            Title Z-A
          </SelectItem>
          <SelectItem value="enrollment_desc" className="font-bold uppercase text-[9px]">
            Top Enrolled
          </SelectItem>
        </SelectContent>
      </Select>
      </div>
    </div>
  );
};

export default ContentFilters;
