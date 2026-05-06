import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useItemAnalytics(moduleId: string | null, days = 30) {
  const [data, setData] = useState<ItemAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("instructor-item-analytics", {
        body: { module_id: moduleId, days },
      });
      if (error) throw error;
      setData(data as ItemAnalytics);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [moduleId, days]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}
