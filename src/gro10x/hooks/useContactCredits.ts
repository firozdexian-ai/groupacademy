/**
 * Returns the talent-side credit pools relevant to a Gro10x contact:
 * personal free `balance`, withdrawable `earned_balance`, and Gro10x
 * `contact_bonus_balance`. Spend resolution order (handled server-side):
 *   contact_bonus → balance → earned_balance.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useContactCredits() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["talent-credits-pools", user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data: t } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!t?.id) return { balance: 0, earned: 0, bonus: 0 };
      const { data } = await supabase
        .from("talent_credits")
        .select("balance, earned_balance, contact_bonus_balance")
        .eq("talent_id", t.id)
        .maybeSingle();
      return {
        balance: Number(data?.balance ?? 0),
        earned: Number(data?.earned_balance ?? 0),
        bonus: Number((data as any)?.contact_bonus_balance ?? 0),
      };
    },
  });

  const pools = query.data ?? { balance: 0, earned: 0, bonus: 0 };
  return {
    ...pools,
    total: pools.balance + pools.earned + pools.bonus,
    isLoading: query.isLoading,
  };
}
