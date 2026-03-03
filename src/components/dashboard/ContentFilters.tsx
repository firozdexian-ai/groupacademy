import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

const ContentFilters = ({ values, onChange }: ContentFiltersProps) => {
  const [programs, setPrograms] = useState<FilterOption[]>([]);
  const [levels, setLevels] = useState<FilterOption[]>([]);

  useEffect(() => {
    const load = async () => {
      const [progRes, lvlRes] = await Promise.all([
        supabase.from("profession_categories").select("id, name").order("name"),
        supabase.from("profession_levels").select("id, name").order("display_order"),
      ]);
      if (progRes.data) setPrograms(progRes.data);
      if (lvlRes.data) setLevels(lvlRes.data);
    };
    load();
  }, []);

  const set = (key: keyof ContentFilterValues, val: string) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={values.programId} onValueChange={(v) => set("programId", v)}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.levelId} onValueChange={(v) => set("levelId", v)}>
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.readiness} onValueChange={(v) => set("readiness", v)}>
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="All Readiness" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Readiness</SelectItem>
          <SelectItem value="no_modules">No Modules</SelectItem>
          <SelectItem value="has_modules">Has Modules</SelectItem>
          <SelectItem value="has_descriptions">Has Descriptions</SelectItem>
          <SelectItem value="has_videos">Has Videos</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
        </SelectContent>
      </Select>

      <Select value={values.sortBy} onValueChange={(v) => set("sortBy", v)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="title_asc">Title A-Z</SelectItem>
          <SelectItem value="title_desc">Title Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ContentFilters;
