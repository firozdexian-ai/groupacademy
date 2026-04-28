import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Service Trajectory Aggregator
 * CTO Reference: Authoritative controller for cross-registry service engagement tracking.
 * Logic: Implements parallel ingress and artifact normalization.
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
  refresh: () => Promise<void>;
  getUsageCount: (serviceType: string) => number;
}

export function useServiceHistory(): UseServiceHistoryReturn {
  const { talent } = useTalent();
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PHASE: Parallel_Registry_Ingress
  const fetchInstitutionalHistory = useCallback(async () => {
    if (!talent?.id) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      // HUD: Synchronized multi-node query
      const [assessments, interviews, salaryAnalyses, portfolios] = await Promise.all([
        supabase
          .from("career_assessments")
          .select("*")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("mock_interviews")
          .select("*")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("salary_analyses")
          .select("*")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("portfolio_requests")
          .select("*")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false }),
      ]);

      const items: ServiceHistoryItem[] = [];

      // MAPPING: Assessment_Artifacts
      assessments.data?.forEach((a) => {
        items.push({
          id: a.id,
          type: "career_assessment",
          title: `${a.percentage}% - ${a.readiness_level}`,
          date: a.created_at,
          status: "completed",
          score: a.percentage,
          href: `/assessment-results/${a.id}`,
        });
      });

      // MAPPING: Interview_Artifacts
      interviews.data?.forEach((i) => {
        items.push({
          id: i.id,
          type: "mock_interview",
          title: i.job_title || "Mock Interview",
          date: i.created_at,
          status: i.status,
          score: i.selection_percentage || undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      // MAPPING: Salary_Artifacts
      salaryAnalyses.data?.forEach((s) => {
        items.push({
          id: s.id,
          type: "salary_analysis",
          title: s.job_title || "Salary Analysis",
          date: s.created_at,
          status: s.status,
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      // MAPPING: Portfolio_Artifacts
      portfolios.data?.forEach((p) => {
        items.push({
          id: p.id,
          type: "portfolio",
          title: "Institutional Portfolio",
          date: p.created_at,
          status: p.status,
          href: `/portfolio-status`,
        });
      });

      // HUD: Temporal_Reordering
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items);
    } catch (err) {
      console.error("SERVICE_HISTORY_INGRESS_FAULT:", err);
    } finally {
      setIsLoading(false);
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchInstitutionalHistory();
  }, [fetchInstitutionalHistory]);

  // PHASE: Telemetry_Calculation
  const getUsageCount = useCallback(
    (serviceType: string): number => {
      const typeMap: Record<string, ServiceHistoryItem["type"]> = {
        CAREER_ASSESSMENT: "career_assessment",
        MOCK_INTERVIEW: "mock_interview",
        SALARY_ANALYSIS: "salary_analysis",
        PORTFOLIO: "portfolio",
      };
      const mappedType = typeMap[serviceType];
      return mappedType ? history.filter((h) => h.type === mappedType).length : 0;
    },
    [history],
  );

  return {
    history,
    isLoading,
    refresh: fetchInstitutionalHistory,
    getUsageCount,
  };
}
