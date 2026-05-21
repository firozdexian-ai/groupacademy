/**
 * GroUp Academy: Post-Auth Routing Intelligence
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getActiveCompanyMembership } from "@/domains/companies/repo/companiesRepo";
import { listUserRolesSafe } from "@/domains/profile/repo/profileRepo";
import type { AccountType } from "@/lib/postAuthRoute";

const ADMIN_ROLES = ["admin", "super_admin", "staff", "talent_exec", "content_lead"];

export function useAccountType() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["account-type", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<AccountType> => {
      if (!user?.id) return "unknown";

      try {
        // Fast path: Check user_metadata first for immediate UI responsiveness
        const metaType = (user.user_metadata as any)?.account_type;

        // If metadata says company, verify active membership status
        if (metaType === "company") {
          const company = await getActiveCompanyMembership(user.id);
          if (company?.company_id) return "company";
          console.warn(
            "[Digital Workforce] Account Type Drift: User metadata 'company' but no active membership found.",
          );
        }

        // If metadata says admin, verify against user_roles
        if (metaType === "admin") {
          const roles = await listUserRolesSafe(user.id);
          if (roles.some((r) => ADMIN_ROLES.includes(r.role))) {
            return "admin";
          }
        }

        // Fallback Strategy
        const companyCheck = await getActiveCompanyMembership(user.id);
        if (companyCheck?.company_id) return "company";

        const rolesCheck = await listUserRolesSafe(user.id);
        if (rolesCheck.some((r) => ADMIN_ROLES.includes(r.role))) {
          return "admin";
        }

        return "talent";
      } catch (err) {
        // Log critical technical errors for Admin Chat oversight
        console.error("[Digital Workforce] useAccountType technical anomaly:", err);
        return "talent";
      }
    },
  });

  // CRITICAL: isLoading must account for auth state + the type verification query
  // Prevents 'hydration flicker' and wrong-shell redirects during initial mount.
  return {
    accountType: (query.data ?? "unknown") as AccountType,
    isLoading: authLoading || (!!user?.id && (query.isLoading || query.isFetching)),
    error: query.error,
  };
}
