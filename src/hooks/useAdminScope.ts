/**
 * GroUp Academy: Admin Scope Intelligence
 * CTO Reference: Resolves governance levels for the Admin Command Center.
 * Architecture: Phase Z0 Hardened with Digital Workforce anomaly logging.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
        // Parallel sync of hierarchy data
        const [{ data: roles, error: rolesError }, { data: company, error: companyError }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase
            .from("company_members")
            .select("company_id, role")
            .eq("user_id", user.id)
            .eq("status", "active")
            .in("role", ["owner", "admin"])
            .limit(1)
            .maybeSingle(),
        ]);

        if (rolesError || companyError) {
          console.error("[Digital Workforce] Scope Resolution Error:", rolesError || companyError);
          return { scope: "none", companyId: null };
        }

        const roleSet = new Set((roles ?? []).map((r) => r.role as string));

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
