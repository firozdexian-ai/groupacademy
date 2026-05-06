import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobCardData } from "@/components/jobs/JobCard";

export function useTrendingJobs(limit = 10) {
  return useQuery({
    queryKey: ["trending-jobs", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_jobs", { limit_n: limit });
      if (error) throw error;
      return (data || []) as JobCardData[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
