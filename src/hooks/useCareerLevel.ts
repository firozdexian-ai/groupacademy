import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTalentLifetimeCredits } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { computeCareerLevel } from "@/lib/careerLevels";

/**
 * GroUp Academy: Identity Level & Credit Volume Sensor
 * CTO Reference: Authoritative controller for evaluating talent lifecycle tiers.
 * Economy Model: Dynamic volume analysis for connection gates and monetization mapping.
 * Phase: Z0 Code Freeze Hardened.
 */

export interface LifetimeCreditData {
  lifetime_volume: number;
  lifetime_earned: number;
  lifetime_spent: number;
  transaction_count: number;
}

export function useCareerLevel() {
  const { talent } = useTalent();

  const { data, isLoading, error } = useQuery({
    queryKey: ["talent-lifetime-credits", talent?.id],
    enabled: !!talent?.id,
    // Performance Protocol: Balanced cache visibility for high-frequency dashboard navigation
    staleTime: 60_000,
    queryFn: async (): Promise<LifetimeCreditData> => {
      if (!talent?.id) {
        return { lifetime_volume: 0, lifetime_earned: 0, lifetime_spent: 0, transaction_count: 0 };
      }

      let data: any = null;
      try {
        data = await getTalentLifetimeCredits(talent.id);
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: talent_lifetime_credits query failed sync.", {
          talentId: talent.id,
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }

      const row = data as any;
      return {
        lifetime_volume: Number(row?.lifetime_volume ?? 0),
        lifetime_earned: Number(row?.lifetime_earned ?? 0),
        lifetime_spent: Number(row?.lifetime_spent ?? 0),
        transaction_count: Number(row?.transaction_count ?? 0),
      };
    },
  });

  const volume = data?.lifetime_volume ?? 0;

  return {
    isLoading,
    volume,
    earned: data?.lifetime_earned ?? 0,
    spent: data?.lifetime_spent ?? 0,
    transactionCount: data?.transaction_count ?? 0,
    info: computeCareerLevel(volume),
    queryError: error,
  };
}
