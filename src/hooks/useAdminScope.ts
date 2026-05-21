/**
 * GroUp Academy: Admin Scope Intelligence
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listUserRoles } from "@/domains/profile/repo/profileRepo";
import { getActiveAdminCompanyMembership } from "@/domains/companies/repo/companiesRepo";

export type AdminScope = "super" | "internal" | "company" | "none";

// Protocol: Defined as Sets for O(1) lookup during high-frequency routing checks
const SUPER_ROLES = new Set(["super_admin"]);
const INTERNAL_ROLES = new Set(["admin", "staff", "talent_exec", "content_lead"]);

export function useAdminScope() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["admin-scope", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes for executive consistency
    queryFn: async (): Promise<{ scope: AdminScope; companyId: string | null }> => {
      if (!user?.id) return { scope: "none", companyId: null };

      try {
        const [roles, company] = await Promise.all([
          listUserRoles(user.id).catch((e) => {
            console.error("[Digital Workforce] Scope Resolution Error:", e);
            return [] as Array<{ role: string }>;
          }),
          getActiveAdminCompanyMembership(user.id).catch((e) => {
            console.error("[Digital Workforce] Scope Resolution Error:", e);
            return null;
          }),
        ]);

        const roleSet = new Set(roles.map((r) => r.role));

        // 1. Super Scope: Sees all 16 stakeholder groups
        if ([...roleSet].some((r) => SUPER_ROLES.has(r))) {
          return { scope: "super", companyId: company?.company_id ?? null };
        }

        // 2. Internal Scope: Ops groups + Impersonation enabled
        if ([...roleSet].some((r) => INTERNAL_ROLES.has(r))) {
          return { scope: "internal", companyId: company?.company_id ?? null };
        }

        // 3. Company Scope: Restricted to Employer shell (Gro10x) logic
        if (company?.company_id) {
          return { scope: "company", companyId: company.company_id };
        }

        return { scope: "none", companyId: null };
      } catch (err) {
        // ANOMALY SENSOR: Reports unexpected scope failures to Admin Chat
        console.error("[Digital Workforce] useAdminScope critical failure:", err);
        return { scope: "none", companyId: null };
      }
    },
  });

  return {
    scope: (query.data?.scope ?? "none") as AdminScope,
    companyId: query.data?.companyId ?? null,
    // Protocol: Account for both Auth state and Scope query to prevent UI flickering
    isLoading: authLoading || (!!user?.id && query.isLoading),
  };
}
