import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Spaced Repetition Core Engine (V5.6.0)
 * CTO Reference: Authoritative adaptive feedback pipeline pulling memory retention matrices.
 * Architecture: Unified TanStack v5 cache node - removes reference dependency loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

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

interface UseReviewQueueOptions {
  limit?: number;
  itemsPerTopic?: number;
  moduleId?: string;
  includeUpcoming?: boolean;
}

/**
 * Orchestrates localized flashcard queues based on algorithmicspaced-repetition intervals.
 */
export function useReviewQueue(opts?: UseReviewQueueOptions) {
  // Extract configuration fields to primitive structural values to bypass reference change loops
  const limit = opts?.limit ?? 10;
  const itemsPerTopic = opts?.itemsPerTopic ?? 4;
  const moduleId = opts?.moduleId ?? null;
  const includeUpcoming = opts?.includeUpcoming ?? false;

  const queryKey = ["learner-review-queue", limit, itemsPerTopic, moduleId, includeUpcoming];

  const queryResult = useQuery({
    queryKey,
    // Performance Baseline: 30-second stability window protecting edge infrastructure costs
    staleTime: 30 * 1000,
    queryFn: async (): Promise<ReviewQueueResponse> => {
      // HUD: INVOKING_LEARNER_REVIEW_QUEUE_EDGE_ORCHESTRATOR
      const { data, error } = await supabase.functions.invoke("learner-review-queue", {
        body: {
          limit,
          items_per_topic: itemsPerTopic,
          module_id: moduleId,
          include_upcoming: includeUpcoming,
        },
      });

      if (error) {
        // Digital Workforce Anomaly Trigger: Essential for monitoring background engine latency
        console.error("[Digital Workforce] ANOMALY: learner-review-queue execution dropped.", {
          limit,
          moduleId,
          message: error.message,
        });
        throw error;
      }

      interface EdgeResponseWrapper {
        error?: string;
        message?: string;
        topics?: any[];
        total_due?: number;
        now?: string;
      }

      const validatedData = data as EdgeResponseWrapper | null;
      if (validatedData?.error) {
        throw new Error(validatedData.message || validatedData.error);
      }

      return {
        topics: (validatedData?.topics || []) as ReviewTopic[],
        total_due: Number(validatedData?.total_due ?? 0),
        now: validatedData?.now,
      };
    },
  });

  return {
    data: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error instanceof Error ? queryResult.error.message : null,
    reload: queryResult.refetch,
  };
}
