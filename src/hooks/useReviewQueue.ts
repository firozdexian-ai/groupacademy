import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewItem {
  id: string;
  question: string;
  options: unknown;
  correct_index: number;
  explanation: string | null;
  difficulty: string | null;
  topic_tags: string[] | null;
}

export interface ReviewTopic {
  module_id: string;
  content_id: string;
  topic_tag: string;
  mastery: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_reviewed_at: string | null;
  module_title: string | null;
  content_title: string | null;
  source: "quiz" | "scenario";
  items: ReviewItem[];
}

export interface ReviewQueueResponse {
  topics: ReviewTopic[];
  total_due: number;
  now?: string;
}

export function useReviewQueue(opts?: {
  limit?: number;
  itemsPerTopic?: number;
  moduleId?: string;
  includeUpcoming?: boolean;
}) {
  const [data, setData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.functions.invoke(
      "learner-review-queue",
      {
        body: {
          limit: opts?.limit ?? 10,
          items_per_topic: opts?.itemsPerTopic ?? 4,
          module_id: opts?.moduleId,
          include_upcoming: opts?.includeUpcoming ?? false,
        },
      },
    );
    setLoading(false);
    if (err || (res as any)?.error) {
      setError((res as any)?.error || err?.message || "Failed to load review queue");
      return;
    }
    setData(res as ReviewQueueResponse);
  }, [opts?.limit, opts?.itemsPerTopic, opts?.moduleId, opts?.includeUpcoming]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
