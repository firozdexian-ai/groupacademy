/**
 * Resolves the currently-active Gro10x company for the signed-in user.
 * Returns the first active membership (owner / admin / member).
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getActiveCompanyMembership } from "@/domains/companies/repo/companiesRepo";

export function useActiveCompany() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["gro10x-active-company", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => getActiveCompanyMembership(user!.id),
  });
  return {
    companyId: q.data?.company_id ?? null,
    role: q.data?.role ?? null,
    isLoading: q.isLoading,
  };
}
