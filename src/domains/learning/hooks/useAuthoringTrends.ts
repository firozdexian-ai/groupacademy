import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Authoring Trends Intelligence (V2.1.0)
 * CTO Reference: Authoritative sensor for instructor analytics and content health.
 * Architecture: Phase Z0 Hardened. TanStack Query integration for high-performance SaaS UI.
 * Protocol: Automated Efficiency - cached data nodes for low-latency dashboards.
 */

export type AuthoringTrends = {
  totals: {
    courses: number;
    modules: number;
    items: number;
    flag_items: number;
    translated_items: number;
  };
  flag_breakdown: Record<string, number>;
  ai_assist: {
    rewrites_applied: number;
    translations_applied: number;
  };
  hotspots: Array<{ course_id: string; course_title: string; flagged_count: number }>;
  wins: Array<{ course_id: string; course_title: string; resolved_count: number }>;
  window_days: number;
};

export function useAuthoringTrends(instructorId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["authoring-trends", instructorId, days],
    enabled: !!instructorId,
    // Performance: 5-minute staleTime for analytics to ensure executive focus without rapid DB polling
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AuthoringTrends> => {
      if (!instructorId) throw new Error("ID_HYDRATION_FAULT: Instructor ID required.");

      // HUD: EXECUTING_NEURAL_ANALYTICS_SYNC
      const { data, error } = await supabase.rpc("get_authoring_trends", {
        _instructor_id: instructorId,
        _days: days,
      });

      if (error) {
        // Digital Workforce Anomaly reporting:
        // Reported to Admin Chat for infrastructure auditing.
        console.error("[Digital Workforce] FAULT: get_authoring_trends sync failed.", {
          instructorId,
          error: error.message,
          code: error.code,
        });
        throw error;
      }

      // HUD: REGISTRY_HYDRATION_SUCCESS
      return data as AuthoringTrends;
    },
  });
}
