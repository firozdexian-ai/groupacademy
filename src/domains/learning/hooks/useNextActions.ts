import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Learner Engagement & Next-Action Engine (V5.6.0)
 * CTO Reference: Authoritative sensor for prioritizing pedagogical tasks and SR alerts.
 * Architecture: Digital Workforce enabled - logs engagement bottlenecks to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export type NextActionType = "review_due" | "practice_weakness" | "finish_module" | "take_scenario";

export interface NextAction {
  type: NextActionType;
  score: number;
  title: string;
  reason: string;
  cta: string;
  cta_label: string;
  course_id?: string;
  module_id?: string;
  topic_tag?: string;
  count?: number;
}

export interface NextActionsResponse {
  talent_id: string;
  actions: NextAction[];
  counts: { due_now: number; tracked_topics: number; active_enrollments: number };
}

/**
 * Orchestrates the retrieval of prioritized "Next Best Actions" for the learner.
 * Leverages TanStack Query for background revalidation and global cache sync.
 */
export function useNextActions() {
  return useQuery({
    queryKey: ["learner-next-actions"],
    // Performance Baseline: 1-minute stability window for high-engagement dashboards
    staleTime: 60 * 1000,
    queryFn: async (): Promise<NextActionsResponse> => {
      // HUD: INVOKING_LEARNER_NEXT_ACTIONS_EDGE_ENGINE
      const { data, error } = await supabase.functions.invoke("learner-next-actions", {
        body: {},
      });

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Identifies recommendation engine latency or semantic processing faults.
        console.error("[Digital Workforce] ANOMALY: learner-next-actions edge failure.", {
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      return data as NextActionsResponse;
    },
  });
}
