/**
 * Resolves the currently-active Gro10x company for the signed-in user.
 * Returns the first active membership (owner / admin / member).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useActiveCompany() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["gro10x-active-company", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
  return {
    companyId: q.data?.company_id ?? null,
    role: q.data?.role ?? null,
    isLoading: q.isLoading,
  };
}
