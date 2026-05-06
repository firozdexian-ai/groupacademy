import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TalentSearchFilters {
  keyword?: string;
  country?: string;
  skills?: string[];
}

export interface TalentSearchRow {
  id: string;
  public_handle: string | null;
  full_name: string;
  profile_photo_url: string | null;
  custom_profession: string | null;
  country: string | null;
  public_bio: string | null;
  skills: any;
  avg_mastery: number;
  verified_skills: number;
  updated_at: string;
}

export function useTalentSearch(filters: TalentSearchFilters, page = 0, pageSize = 24) {
  return useQuery({
    queryKey: ["talent-search", filters, page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_public_talents", {
        p_filters: filters as any,
        p_limit: pageSize,
        p_offset: page * pageSize,
      });
      if (error) throw error;
      const obj = (data as any) ?? {};
      return {
        total: (obj.total as number) ?? 0,
        rows: (obj.rows as TalentSearchRow[]) ?? [],
      };
    },
  });
}
