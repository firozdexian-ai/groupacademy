import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Mic, DollarSign, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { formatDistanceToNow } from 'date-fns';

interface ServiceHistoryItem {
  id: string;
  type: 'career_assessment' | 'mock_interview' | 'salary_analysis';
  title: string;
  date: string;
  status: string;
  score?: number;
  href: string;
}

const SERVICE_CONFIG = {
  career_assessment: {
    icon: ClipboardCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Career Assessment',
  },
  mock_interview: {
    icon: Mic,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    label: 'Mock Interview',
  },
  salary_analysis: {
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Salary Analysis',
  },
};

export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (talent?.id) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [talent?.id]);

  const fetchHistory = async () => {
    if (!talent?.id) return;

    try {
      const [assessments, interviews, salaryAnalyses] = await Promise.all([
        supabase
          .from('career_assessments')
          .select('id, created_at, percentage, readiness_level')
          .eq('talent_id', talent.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('mock_interviews')
          .select('id, created_at, status, selection_percentage, job_title')
          .eq('talent_id', talent.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('salary_analyses')
          .select('id, created_at, status, job_title')
          .eq('talent_id', talent.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3),
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

      // Sort by date and take top 3
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items.slice(0, 3));
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return null; // Don't show if no history
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Your Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((item) => {
          const config = SERVICE_CONFIG[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => navigate(item.href)}
            >
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </p>
              </div>
              {item.score !== undefined && (
                <Badge variant="secondary">{item.score}%</Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
