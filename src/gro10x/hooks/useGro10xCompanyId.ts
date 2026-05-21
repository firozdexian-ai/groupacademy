import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getActiveCompanyIdForUser } from "@/domains/companies/repo/companiesRepo";

/** Resolve the active company workspace for the current user (gro10x). */
export function useGro10xCompanyId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gro10x-company-id", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => getActiveCompanyIdForUser(user!.id),
  });
}
