import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { listAgentPitchLog, subscribeToAgentPitchLog } from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Outbound Engagement Tracker Engine
 * Real-time reactive pitch logger tracking employer interactions.
 */

export interface TalentPitch {
  id: string;
  company_id: string;
  message: string;
  phone: string | null;
  dispatched: boolean;
  created_at: string;
  company_name: string | null;
  company_logo: string | null;
}

export function useTalentPitches(limit = 20) {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["talent-pitches", talentId, limit], [talentId, limit]);

  const {
    data: pitches = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 15 * 1000,
    queryFn: async (): Promise<TalentPitch[]> => {
      const rows = await listAgentPitchLog(talentId!, limit);
      return rows.map((row: any) => ({
        id: String(row.id),
        company_id: String(row.company_id),
        message: String(row.message ?? ""),
        phone: row.phone ?? null,
        dispatched: Boolean(row.dispatched),
        created_at: String(row.created_at),
        company_name: row.companies?.name ? String(row.companies.name) : null,
        company_logo: row.companies?.logo_url ? String(row.companies.logo_url) : null,
      }));
    },
  });

  useEffect(() => {
    if (!talentId) return;
    return subscribeToAgentPitchLog(talentId, () => {
      void qc.invalidateQueries({ queryKey });
    });
  }, [talentId, qc, queryKey]);

  return {
    pitches,
    isLoading,
    refresh: refetch,
  };
}

