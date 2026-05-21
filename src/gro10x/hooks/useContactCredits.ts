/**
 * Returns the talent-side credit pools relevant to a Gro10x contact:
 * personal free `balance`, withdrawable `earned_balance`, and Gro10x
 * `contact_bonus_balance`. Spend resolution order (handled server-side):
 *   contact_bonus → balance → earned_balance.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getTalentCreditPoolsByUserId } from "@/domains/talent/repo/talentRepo";

export function useContactCredits() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["talent-credits-pools", user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => getTalentCreditPoolsByUserId(user!.id),
  });

  const pools = query.data ?? { balance: 0, earned: 0, bonus: 0 };
  return {
    ...pools,
    total: pools.balance + pools.earned + pools.bonus,
    isLoading: query.isLoading,
  };
}
