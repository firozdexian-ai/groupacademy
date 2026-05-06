import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApplicationBuckets {
  active: number;
  action_needed: number;
  closed: number;
}

export function useApplicationBuckets() {
  return useQuery({
    queryKey: ["application-buckets"],
    queryFn: async (): Promise<ApplicationBuckets> => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return { active: 0, action_needed: 0, closed: 0 };
      const { data, error } = await supabase.rpc("get_application_buckets" as any, {
        p_user_id: userRes.user.id,
      });
      if (error) {
        console.warn("get_application_buckets failed", error);
        return { active: 0, action_needed: 0, closed: 0 };
      }
      return (data as ApplicationBuckets) || { active: 0, action_needed: 0, closed: 0 };
    },
    staleTime: 60_000,
  });
}
