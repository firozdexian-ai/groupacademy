import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';

export interface ServiceHistoryItem {
  id: string;
  type: 'career_assessment' | 'mock_interview' | 'salary_analysis' | 'portfolio';
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

  const fetchHistory = useCallback(async () => {
    if (!talent?.id) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const [assessments, interviews, salaryAnalyses, portfolios] = await Promise.all([
        supabase
          .from('career_assessments')
          .select('id, created_at, percentage, readiness_level')
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mock_interviews')
          .select('id, created_at, status, selection_percentage, job_title')
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('salary_analyses')
          .select('id, created_at, status, job_title')
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolio_requests')
          .select('id, created_at, status')
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false }),
      ]);

      const items: ServiceHistoryItem[] = [];

      assessments.data?.forEach((a) => {
        items.push({
          id: a.id,
          type: 'career_assessment',
          title: `${a.percentage}% - ${a.readiness_level}`,
          date: a.created_at,
          status: 'completed',
          score: a.percentage,
          href: `/assessment-results/${a.id}`,
        });
      });

      interviews.data?.forEach((i) => {
        items.push({
          id: i.id,
          type: 'mock_interview',
          title: i.job_title || 'Mock Interview',
          date: i.created_at,
          status: i.status,
          score: i.selection_percentage || undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      salaryAnalyses.data?.forEach((s) => {
        items.push({
          id: s.id,
          type: 'salary_analysis',
          title: s.job_title || 'Salary Analysis',
          date: s.created_at,
          status: s.status,
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      portfolios.data?.forEach((p) => {
        items.push({
          id: p.id,
          type: 'portfolio',
          title: 'Portfolio Request',
          date: p.created_at,
          status: p.status,
          href: `/portfolio-status`,
        });
      });

      // Sort by date
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items);
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getUsageCount = useCallback(
    (serviceType: string): number => {
      const typeMap: Record<string, ServiceHistoryItem['type']> = {
        CAREER_ASSESSMENT: 'career_assessment',
        MOCK_INTERVIEW: 'mock_interview',
        SALARY_ANALYSIS: 'salary_analysis',
        PORTFOLIO: 'portfolio',
      };
      const mappedType = typeMap[serviceType];
      if (!mappedType) return 0;
      return history.filter((h) => h.type === mappedType).length;
    },
    [history]
  );

  return {
    history,
    isLoading,
    refresh: fetchHistory,
    getUsageCount,
  };
}
