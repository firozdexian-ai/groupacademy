import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { instructorItemAnalytics } from "@/domains/learning/api/learningApi";

/**
 * GroUp Academy: Pedagogical Psychometric Sensor (V5.6.0)
 * CTO Reference: Authoritative sensor for item difficulty, rubric performance, and mastery drift.
 * Architecture: Digital Workforce enabled - logs pedagogical data gaps to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export interface QuizItemStat {
  id: string;
  question: string;
  topic_tags: string[];
  difficulty: string | null;
  quality_score: number;
  serves_lifetime: number;
  correct_lifetime: number;
  p_value: number | null;
  serves_window: number;
  p_value_window: number | null;
  needs_review: string[];
}

export interface ScenarioItemStat {
  id: string;
  title: string;
  topic_tags: string[];
  difficulty: string | null;
  runs_lifetime: number;
  runs_window: number;
  avg_overall: number | null;
  avg_per_rubric: Record<string, number>;
  needs_review: string[];
}

export interface TopicStat {
  topic_tag: string;
  items: number;
  avg_p_value: number | null;
  avg_scenario_score: number | null;
  learner_mastery_mean: number | null;
}

export interface ItemAnalytics {
  module: { id: string; title: string; content_id: string };
  summary: {
    quiz_items: number;
    scenario_items: number;
    avg_p_value: number | null;
    avg_scenario_score: number | null;
    items_needing_review: number;
    window_days: number;
  };
  quiz_items: QuizItemStat[];
  scenario_items: ScenarioItemStat[];
  topics: TopicStat[];
}

/**
 * Fetches deep psychometric analytics for a specific course module.
 * Wraps the 'instructor-item-analytics' edge function.
 */
export function useItemAnalytics(moduleId: string | null, days = 30) {
  return useQuery({
    queryKey: ["item-analytics", moduleId, days],
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5-minute psychometric stability baseline
    queryFn: async (): Promise<ItemAnalytics> => {
      // HUD: INVOKING_EDGE_ANALYTICS_ENGINE
      const data = await instructorItemAnalytics({ module_id: moduleId, days });
      return data as unknown as ItemAnalytics;
    },
  });
}
