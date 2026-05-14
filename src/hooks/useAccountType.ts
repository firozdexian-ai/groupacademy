/**
 * GroUp Academy: Post-Auth Routing Intelligence
 * CTO Reference: Traffic controller for dual-shell (Talent/Employer) architecture.
 * Phase: Z0 Hardened.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
          const { data: company, error } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          if (company?.company_id) return "company";

          // Digital Workforce Sensor: Detect metadata/DB drift
          console.warn(
            "[Digital Workforce] Account Type Drift: User metadata 'company' but no active membership found.",
          );
        }

        // If metadata says admin, verify against user_roles (Single Source of Truth)
        if (metaType === "admin") {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

          if (roles?.some((r) => ADMIN_ROLES.includes(r.role as string))) {
            return "admin";
          }
        }

        // Fallback Strategy: Exhaustive search if fast-path fails or is missing
        // 1. Check for active company membership
        const { data: companyCheck } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (companyCheck?.company_id) return "company";

        // 2. Check for administrative roles
        const { data: rolesCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

        if (rolesCheck?.some((r) => ADMIN_ROLES.includes(r.role as string))) {
          return "admin";
        }

        // Default to talent shell
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
