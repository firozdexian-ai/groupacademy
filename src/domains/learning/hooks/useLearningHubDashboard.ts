import { useQuery } from "@tanstack/react-query";
import { getLearningHubDashboard } from "@/domains/learning/repo/learningRepo";

/**
 * GroUp Academy: Pedagogical Command Center (V5.6.0)
 * CTO Reference: Authoritative single-trip dashboard sensor for student engagement.
 * Architecture: Digital Workforce enabled - logs learning pipeline faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export interface LearningHubDashboard {
  authenticated: boolean;
  talent_id: string | null;
  active_enrollments: Array<{
    id: string;
    content_id: string;
    progress: number;
    last_accessed_at: string | null;
    current_module_id: string | null;
    status: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    thumbnail_url: string | null;
    content_type: string;
  }>;
  upcoming_sessions: Array<{
    id: string;
    title: string;
    starts_at: string;
    meeting_url: string | null;
    cohort_id: string;
  }>;
  recent_certificates: Array<{
    id: string;
    code: string;
    kind: string;
    issued_at: string;
    content_id: string | null;
  }>;
  stats: { active_count: number; completed_count: number; due_reviews: number };
  generated_at: string;
}

/**
 * Fetches the consolidated student learning state.
 * RPC: get_learning_hub_dashboard
 */
export function useLearningHubDashboard() {
  return useQuery({
    queryKey: ["learning-hub-dashboard"],
    // Performance Baseline: 1-minute stability window for active student sessions
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<LearningHubDashboard> => {
      // HUD: EXECUTING_LEARNING_HUB_AGGREGATION_SYNC
      let data: any;
      try {
        data = await getLearningHubDashboard();
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: get_learning_hub_dashboard RPC failure.", {
          error: error?.message,
          code: error?.code,
        });
        throw error;
      }


      // Hardened Data Normalization:
      // Ensures UI consistency even if specific arrays are null on backend.
      const d = (data as any) || {};

      return {
        authenticated: !!d.authenticated,
        talent_id: d.talent_id ?? null,
        active_enrollments: d.active_enrollments ?? [],
        upcoming_sessions: d.upcoming_sessions ?? [],
        recent_certificates: d.recent_certificates ?? [],
        stats: d.stats ?? { active_count: 0, completed_count: 0, due_reviews: 0 },
        generated_at: d.generated_at ?? new Date().toISOString(),
      };
    },
  });
}
