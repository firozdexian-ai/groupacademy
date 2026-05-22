import { useQuery } from "@tanstack/react-query";
import { learnerMasterySummary } from "@/domains/learning/api/learningApi";

/**
 * GroUp Academy: Learner Cognitive Mastery Sensor (V5.6.0)
 * CTO Reference: Authoritative sensor for topic retention, SR decay, and sparkline trends.
 * Architecture: Digital Workforce enabled - logs mastery calculation gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface MasteryWeakItem {
  module_id: string | null;
  module_title: string | null;
  topic_tag: string;
  mastery: number;
  due_at: string | null;
}

export interface MasterySparkPoint {
  date: string;
  quiz: number;
  scenario: number;
}

export interface MasterySummary {
  totals: {
    tracked_topics: number;
    avg_mastery: number;
    due_now: number;
    next_due_at: string | null;
  };
  weakest: MasteryWeakItem[];
  strongest: MasteryWeakItem[];
  signal_split_30d: { quiz: number; scenario: number };
  sparkline: MasterySparkPoint[];
  now?: string;
}

/**
 * Orchestrates the retrieval of a learner's personalized mastery trajectory.
 * Wraps the 'learner-mastery-summary' edge function.
 */
export function useMasterySummary(opts?: { moduleId?: string; contentId?: string; days?: number }) {
  return useQuery({
    queryKey: ["mastery-summary", opts?.moduleId, opts?.contentId, opts?.days],
    // Performance Baseline: 5-minute stability for cognitive metrics
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MasterySummary> => {
      // HUD: INVOKING_COGNITIVE_ANALYTICS_ENGINE
      const res = await learnerMasterySummary({
        module_id: opts?.moduleId,
        content_id: opts?.contentId,
        days: opts?.days ?? 7,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      return res as unknown as MasterySummary;
    },
  });
}
