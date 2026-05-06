import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useMasterySummary(opts?: {
  moduleId?: string;
  contentId?: string;
  days?: number;
}) {
  const [data, setData] = useState<MasterySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.functions.invoke(
      "learner-mastery-summary",
      {
        body: {
          module_id: opts?.moduleId,
          content_id: opts?.contentId,
          days: opts?.days ?? 7,
        },
      },
    );
    setLoading(false);
    if (err || (res as any)?.error) {
      setError((res as any)?.error || err?.message || "Failed to load summary");
      return;
    }
    setData(res as MasterySummary);
  }, [opts?.moduleId, opts?.contentId, opts?.days]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
