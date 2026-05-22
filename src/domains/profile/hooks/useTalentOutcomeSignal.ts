import { useQuery } from "@tanstack/react-query";
import { getTalentOutcomeSignal } from "@/domains/profile/repo/profileRepo";

/**
 * GroUp Academy: B2B Procurement Outcome Engine (V5.6.0)
 * CTO Reference: Authoritative telemetry sensor aggregating candidate hiring parameters.
 * Architecture: Optimized via TanStack Query v5 to completely protect database computing capacity.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface VerifiedSkillSignal {
  id: string;
  topic_tag: string;
  level: "foundational" | "proficient" | "expert";
  mastery_at_issue: number;
  verify_code: string;
  issued_at: string;
}

export interface TrackCompletedSignal {
  assignment_id: string;
  track_id: string;
  track_title: string;
  track_slug: string;
  sponsor_company_id: string | null;
  sponsor_company_name: string | null;
  sponsor_company_logo: string | null;
  completed_at: string | null;
  certificate_code: string | null;
}

export interface TalentOutcomeSignal {
  verified_skills: VerifiedSkillSignal[];
  tracks_completed: TrackCompletedSignal[];
  mastery_summary: {
    tracked_topics: number;
    avg_mastery: number;
    strong_topics: Array<{ topic_tag: string; mastery: number }>;
    weak_topic_count: number;
  } | null;
  learning_recency_score: number;
  last_activity_at: string | null;
}

/**
 * Orchestrates the retrieval of deep candidate outcome signals and hiring verification profiles.
 * RPC: get_talent_outcome_signal
 */
export function useTalentOutcomeSignal(talentId?: string | null) {
  const queryResult = useQuery({
    queryKey: ["talent-outcome-signal", talentId],
    enabled: !!talentId,
    // Performance Baseline: 60-second stability caching for recruiter evaluation feeds
    staleTime: 60 * 1000,
    queryFn: async (): Promise<TalentOutcomeSignal> => {
      // HUD: INVOKING_TALENT_OUTCOME_SIGNAL_RPC_INGRESS
      let data: any;
      try {
        data = await getTalentOutcomeSignal<any>(talentId!);
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_talent_outcome_signal RPC lookup failed.", {
          talentId,
          message: error?.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      const raw = (data as any) || {};

      // Defensive Parsing: Map and normalize verified skill badges array
      const normalizedSkills: VerifiedSkillSignal[] = Array.isArray(raw.verified_skills)
        ? raw.verified_skills.map((s: any) => ({
            id: String(s?.id ?? ""),
            topic_tag: String(s?.topic_tag ?? "General Skill"),
            level: s?.level === "expert" || s?.level === "proficient" ? s.level : "foundational",
            mastery_at_issue: Number(s?.mastery_at_issue ?? 0),
            verify_code: String(s?.verify_code ?? ""),
            issued_at: String(s?.issued_at ?? new Date().toISOString()),
          }))
        : [];

      // Defensive Parsing: Map and normalize completed tracks array
      const normalizedTracks: TrackCompletedSignal[] = Array.isArray(raw.tracks_completed)
        ? raw.tracks_completed.map((t: any) => ({
            assignment_id: String(t?.assignment_id ?? ""),
            track_id: String(t?.track_id ?? ""),
            track_title: String(t?.track_title ?? "Curriculum Track"),
            track_slug: String(t?.track_slug ?? ""),
            sponsor_company_id: t?.sponsor_company_id ? String(t.sponsor_company_id) : null,
            sponsor_company_name: t?.sponsor_company_name ? String(t.sponsor_company_name) : null,
            sponsor_company_logo: t?.sponsor_company_logo ? String(t.sponsor_company_logo) : null,
            completed_at: t?.completed_at ? String(t.completed_at) : null,
            certificate_code: t?.certificate_code ? String(t.certificate_code) : null,
          }))
        : [];

      // Defensive Parsing: Structure summary metric calculations maps safely
      const normalizedSummary = raw.mastery_summary
        ? {
            tracked_topics: Number(raw.mastery_summary.tracked_topics ?? 0),
            avg_mastery: Number(raw.mastery_summary.avg_mastery ?? 0),
            strong_topics: Array.isArray(raw.mastery_summary.strong_topics)
              ? raw.mastery_summary.strong_topics.map((st: any) => ({
                  topic_tag: String(st?.topic_tag ?? "General Tag"),
                  mastery: Number(st?.mastery ?? 0),
                }))
              : [],
            weak_topic_count: Number(raw.mastery_summary.weak_topic_count ?? 0),
          }
        : null;

      // HUD: DATA_NORMALIZATION_VALIDATION_COMPLETED
      return {
        verified_skills: normalizedSkills,
        tracks_completed: normalizedTracks,
        mastery_summary: normalizedSummary,
        learning_recency_score: Number(raw.learning_recency_score ?? 0),
        last_activity_at: raw.last_activity_at ? String(raw.last_activity_at) : null,
      };
    },
  });

  return {
    signal: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error instanceof Error ? queryResult.error.message : null,
    refresh: queryResult.refetch,
  };
}
