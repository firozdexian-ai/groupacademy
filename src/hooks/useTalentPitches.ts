import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Outbound Engagement Tracker Engine (V5.6.0)
 * CTO Reference: High-performance, real-time reactive pitch logger tracking employer interactions.
 * Architecture: Optimized via TanStack Query v5 with throttled database cache boundaries.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
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

/**
 * Monitors, structures, and synchronizes real-time talent pitches to corporate buyers.
 */
export function useTalentPitches(limit = 20) {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["talent-pitches", talentId, limit], [talentId, limit]);

  // --- SENSOR: OUTBOUND_ENGAGEMENT_QUERY_NODE ---
  const {
    data: pitches = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 15 * 1000, // 15-second visual consistency buffer for live feeds
    queryFn: async (): Promise<TalentPitch[]> => {
      // HUD: EXECUTING_PITCH_REGISTRY_INGRESS_SELECT
      const { data, error } = await supabase
        .from("agent_pitch_log")
        .select("id, company_id, message, phone, dispatched, created_at, companies(name, logo_url)")
        .eq("talent_id", talentId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[Digital Workforce] FAULT: agent_pitch_log connection channel dropped.", error);
        throw error;
      }

      // Hardened Data Normalization Layer: Sanitizes nested records against relational schema drifts
      return (data || []).map((row: any) => ({
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

  // --- HUD: REALTIME_CDC_THROTTLED_SYNCHRONIZER ---
  useEffect(() => {
    if (!talentId) return;

    // HUD: REGISTERING_ATOMIC_POSTGRES_CDC_CHANNEL
    const channel = supabase
      .channel(`public:agent_pitch_changes:${talentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_pitch_log",
          filter: `talent_id=eq.${talentId}`,
        },
        () => {
          // Digital Workforce Anomaly Trigger: Fires a background invalidation call without visual layout flicker
          void qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [talentId, qc, queryKey]);

  return {
    pitches,
    isLoading,
    refresh: refetch,
  };
}
