import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listServiceHistoryByTalent } from "@/domains/marketing/repo/marketingRepo";

/**
 * GroUp Academy: Service Trajectory Aggregator (V5.6.0)
 * CTO Reference: Authoritative polymorphic history tracking manager parsing service metrics.
 * Architecture: Optimized via TanStack Data Node bundling with defensive schema boundaries.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface ServiceHistoryItem {
  id: string;
  type: "career_assessment" | "mock_interview" | "salary_analysis" | "portfolio";
  title: string;
  date: string;
  status: string;
  score?: number;
  href: string;
}

interface UseServiceHistoryReturn {
  history: ServiceHistoryItem[];
  isLoading: boolean;
  refresh: () => void;
  getUsageCount: (serviceType: string) => number;
}

/**
 * Aggregates multi-table service footprints into a unified chronological user timeline feed.
 */
export function useServiceHistory(talentId?: string | null): UseServiceHistoryReturn {
  const queryKey = ["service-history", talentId];

  // --- SENSOR: PARALLEL_REGISTRY_INGRESS ---
  const {
    data: history = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 60 * 1000, // 1-minute structural cache baseline to defend database thresholds
    queryFn: async (): Promise<ServiceHistoryItem[]> => {
      let assessments: any[] = [], interviews: any[] = [], salary: any[] = [], portfolio: any[] = [];
      try {
        const bundle = await listServiceHistoryByTalent(talentId!);
        assessments = bundle.assessments;
        interviews = bundle.interviews;
        salary = bundle.salary;
        portfolio = bundle.portfolio;
      } catch (error) {
        console.error("[Digital Workforce] FAULT: service history channel dropped.", error);
        throw error;
      }

      const aggregatedItems: ServiceHistoryItem[] = [];

      // MAPPING: Assessment_Artifacts
      (assessments).forEach((a) => {
        aggregatedItems.push({
          id: String(a.id),
          type: "career_assessment",
          title: `${a.percentage ?? 0}% - ${a.readiness_level || "Evaluated"}`,
          date: String(a.created_at),
          status: "completed",
          score: a.percentage ? Number(a.percentage) : undefined,
          href: `/assessment-results/${a.id}`,
        });
      });

      // MAPPING: Interview_Artifacts
      (interviews).forEach((i) => {
        aggregatedItems.push({
          id: String(i.id),
          type: "mock_interview",
          title: String(i.job_title || "Mock Interview Workspace"),
          date: String(i.created_at),
          status: String(i.status || "pending"),
          score: i.selection_percentage ? Number(i.selection_percentage) : undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      // MAPPING: Salary_Artifacts
      (salary).forEach((s) => {
        aggregatedItems.push({
          id: String(s.id),
          type: "salary_analysis",
          title: String(s.job_title || "Market Salary Analysis"),
          date: String(s.created_at),
          status: String(s.status || "completed"),
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      // MAPPING: Portfolio_Artifacts
      (portfolio).forEach((p) => {
        aggregatedItems.push({
          id: String(p.id),
          type: "portfolio",
          title: "Institutional Portfolio Matrix",
          date: String(p.created_at),
          status: String(p.status || "pending"),
          href: `/portfolio-status`,
        });
      });

      // HUD: CHRONOLOGICAL_TEMPORAL_REORDERING
      return aggregatedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  // --- HUD: SERVICE_TELEMETRY_CALCULATION ---
  const getUsageCount = useCallback(
    (serviceType: string): number => {
      const typeMap: Record<string, ServiceHistoryItem["type"]> = {
        CAREER_ASSESSMENT: "career_assessment",
        MOCK_INTERVIEW: "mock_interview",
        SALARY_ANALYSIS: "salary_analysis",
        PORTFOLIO: "portfolio",
      };
      const targetType = typeMap[serviceType];
      return targetType ? history.filter((item) => item.type === targetType).length : 0;
    },
    [history],
  );

  return {
    history,
    isLoading,
    refresh: refetch,
    getUsageCount,
  };
}
