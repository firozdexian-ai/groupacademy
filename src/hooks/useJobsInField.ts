import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobCardData } from "@/components/jobs/JobCard";

export function useJobsInField(talentId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ["jobs-in-field", talentId, limit],
    queryFn: async () => {
      if (!talentId) return [];
      const { data, error } = await supabase.rpc("get_jobs_in_field", { _talent_id: talentId, _limit: limit });
      if (error) throw error;
      return (data || []) as JobCardData[];
    },
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000,
  });
}
