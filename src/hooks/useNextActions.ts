import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useNextActions() {
  const [data, setData] = useState<NextActionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("learner-next-actions", { body: {} });
      if (error) throw error;
      setData(data as NextActionsResponse);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load next actions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
