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
}

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

  return (
    <div className={cn("flex flex-wrap items-center gap-3 p-1", className)}>
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
            Global View
          </SelectItem>
          <SelectItem value="no_modules" className="font-bold uppercase text-[9px] text-destructive">
            Logic Gap (No Modules)
          </SelectItem>
          <SelectItem value="has_modules" className="font-bold uppercase text-[9px]">
            Active Nodes (Modules)
          </SelectItem>
          <SelectItem value="has_descriptions" className="font-bold uppercase text-[9px]">
            Spec Defined (Descr)
          </SelectItem>
          <SelectItem value="has_videos" className="font-bold uppercase text-[9px]">
            Visual Sync'd (Videos)
          </SelectItem>
          <SelectItem value="complete" className="font-bold uppercase text-[9px] text-emerald-500">
            Verified Complete
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
            Temporal: Newest
          </SelectItem>
          <SelectItem value="oldest" className="font-bold uppercase text-[9px]">
            Temporal: Oldest
          </SelectItem>
          <SelectItem value="title_asc" className="font-bold uppercase text-[9px]">
            Alpha: A-Z
          </SelectItem>
          <SelectItem value="title_desc" className="font-bold uppercase text-[9px]">
            Alpha: Z-A
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ContentFilters;
