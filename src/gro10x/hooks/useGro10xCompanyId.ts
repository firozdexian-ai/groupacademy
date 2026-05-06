import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Resolve the active company workspace for the current user (gro10x). */
export function useGro10xCompanyId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gro10x-company-id", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return (data?.company_id ?? null) as string | null;
    },
  });
}
