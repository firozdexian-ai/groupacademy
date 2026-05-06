import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useJobTypeCounts(country?: string | null) {
  return useQuery({
    queryKey: ["job-type-counts", country || "all"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_jobs_by_type", { _country: country || null });
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        map[r.job_type] = Number(r.cnt);
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}
