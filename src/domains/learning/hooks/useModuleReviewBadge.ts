import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Instructor Triage Badge Sensor (V5.6.0)
 * CTO Reference: High-performance observer tracking broken pedagogical psychometric assets.
 * Architecture: Digital Workforce enabled - streams edge failure metrics to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

interface DigestSummary {
  flagged_quiz: number;
  flagged_scenarios: number;
  quiz_items: number;
  scenario_items: number;
}

export interface ModuleReviewBadge {
  flagged: number;
  summary: DigestSummary | null;
  loading: boolean;
}

/**
 * Monitors and aggregates broken or underperforming quiz and scenario nodes.
 * Replaces manual in-memory cache blocks with transactional TanStack query caches.
 */
export function useModuleReviewBadge(moduleId: string | null | undefined): ModuleReviewBadge {
  const { data, isLoading } = useQuery({
    queryKey: ["module-review-badge", moduleId],
    enabled: !!moduleId,
    // Performance Baseline: 5-minute stability mapping to protect edge computation budgets
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Omit<ModuleReviewBadge, "loading">> => {
      // HUD: INVOKING_AUTHORING_REVIEW_DIGEST_EDGE
      const { data, error } = await supabase.functions.invoke("authoring-review-digest", {
        body: { mode: "single", module_id: moduleId, days: 30 },
      });

      if (error) {
        // Digital Workforce Anomaly Trigger:
        // Emits system failure logs to background admin diagnostic agents
        console.error("[Digital Workforce] ANOMALY: authoring-review-digest edge invocation failed.", {
          moduleId,
          message: error.message,
        });
        throw error;
      }

      const summary = ((data as any)?.summary as DigestSummary) ?? null;
      const flagged = summary ? (summary.flagged_quiz ?? 0) + (summary.flagged_scenarios ?? 0) : 0;

      return {
        flagged,
        summary,
      };
    },
  });

  // Gracefully conform to expected return type definitions to secure upstream UI compatibility
  if (!moduleId) {
    return { flagged: 0, summary: null, loading: false };
  }

  return {
    flagged: data?.flagged ?? 0,
    summary: data?.summary ?? null,
    loading: isLoading,
  };
}
