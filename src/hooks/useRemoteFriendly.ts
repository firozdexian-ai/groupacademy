import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RemoteFriendlySummary {
  active_jobs: number;
  jobs_last_14d: number;
  top_companies: { name: string; logo_url: string | null }[];
}

export function useRemoteFriendly() {
  return useQuery({
    queryKey: ["remote-friendly-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_remote_friendly_summary");
      if (error) throw error;
      return (data ?? { active_jobs: 0, jobs_last_14d: 0, top_companies: [] }) as RemoteFriendlySummary;
    },
    staleTime: 5 * 60 * 1000,
  });
}
