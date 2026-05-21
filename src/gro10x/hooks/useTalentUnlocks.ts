import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTalentContactUnlockCost, getCompanyUnlockedTalents } from "@/domains/talent/repo/talentRepo";
import { unlockTalentContact } from "@/domains/talent/api/talentApi";

export function useUnlockCost() {
  return useQuery({
    queryKey: ["talent-unlock-cost"],
    queryFn: () => getTalentContactUnlockCost(),
    staleTime: 5 * 60_000,
  });
}

export function useCompanyUnlocks(companyId: string | null) {
  return useQuery({
    queryKey: ["company-unlocks", companyId],
    enabled: !!companyId,
    queryFn: () => getCompanyUnlockedTalents(companyId!),
  });
}

export interface UnlockedContact {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}

export function useUnlockTalent(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (talentId: string) => {
      if (!companyId) throw new Error("No active company");
      const payload = await unlockTalentContact({ company_id: companyId, talent_id: talentId }) as { ok: boolean; error?: string; contact?: UnlockedContact; credits_spent?: number; reused?: boolean };
      if (!payload?.ok) throw new Error(payload?.error || "Unlock failed");
      return payload;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-unlocks", companyId] });
      qc.invalidateQueries({ queryKey: ["company-credits"] });
    },
  });
}
