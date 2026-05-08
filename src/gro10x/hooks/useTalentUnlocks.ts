import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnlockCost() {
  return useQuery({
    queryKey: ["talent-unlock-cost"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_talent_contact_unlock_cost" as any);
      if (error) throw error;
      return Number(data ?? 10);
    },
    staleTime: 5 * 60_000,
  });
}

export function useCompanyUnlocks(companyId: string | null) {
  return useQuery({
    queryKey: ["company-unlocks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_company_unlocked_talents" as any, { p_company_id: companyId });
      if (error) throw error;
      return new Set(((data as any[]) ?? []).map((r) => (typeof r === "string" ? r : r.get_company_unlocked_talents)));
    },
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
      const { data, error } = await supabase.functions.invoke("unlock-talent-contact", {
        body: { company_id: companyId, talent_id: talentId },
      });
      if (error) throw error;
      const payload = data as { ok: boolean; error?: string; contact?: UnlockedContact; credits_spent?: number; reused?: boolean };
      if (!payload?.ok) throw new Error(payload?.error || "Unlock failed");
      return payload;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-unlocks", companyId] });
      qc.invalidateQueries({ queryKey: ["company-credits"] });
    },
  });
}
