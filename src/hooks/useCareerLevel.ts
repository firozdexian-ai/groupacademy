import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { computeCareerLevel } from "@/lib/careerLevels";

export function useCareerLevel() {
  const { talent } = useTalent();

  const { data, isLoading } = useQuery({
    queryKey: ["talent-lifetime-credits", talent?.id],
    enabled: !!talent?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("talent_lifetime_credits")
        .select("lifetime_volume, lifetime_earned, lifetime_spent, transaction_count")
        .eq("talent_id", talent!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { lifetime_volume: 0, lifetime_earned: 0, lifetime_spent: 0, transaction_count: 0 };
    },
  });

  const volume = Number(data?.lifetime_volume ?? 0);
  return {
    isLoading,
    volume,
    earned: Number(data?.lifetime_earned ?? 0),
    spent: Number(data?.lifetime_spent ?? 0),
    info: computeCareerLevel(volume),
  };
}
