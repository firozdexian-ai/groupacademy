/**
 * Determines whether the signed-in user is a company member, an admin/staff,
 * or a regular talent. Single source of truth for post-auth routing.
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
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AccountType> => {
      if (!user?.id) return "unknown";

      // Fast path: user_metadata.account_type set at signup-company time.
      const metaType = (user.user_metadata as any)?.account_type;
      if (metaType === "company" || metaType === "admin" || metaType === "talent") {
        // Still verify company membership exists; otherwise fall through.
        if (metaType === "company") {
          const { data: company } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
          if (company?.company_id) return "company";
        } else {
          return metaType as AccountType;
        }
      }

      // Check company membership (cheapest, single row)
      const { data: company } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (company?.company_id) return "company";

      // Then admin/staff role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (roles?.some((r) => ADMIN_ROLES.includes(r.role as string))) {
        return "admin";
      }

      return "talent";
    },
  });

  // CRITICAL: While loading, return "unknown" so callers gate properly
  // instead of defaulting to "talent" and triggering wrong redirects.
  return {
    accountType: (query.data ?? "unknown") as AccountType,
    isLoading: authLoading || (!!user?.id && (query.isLoading || query.isFetching)),
  };
}
