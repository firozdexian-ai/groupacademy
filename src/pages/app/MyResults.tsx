import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Mic, 
  DollarSign, 
  Palette,
  ChevronRight,
  Award,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface ServiceResult {
  id: string;
  type: 'assessment' | 'interview' | 'salary' | 'portfolio';
  title: string;
  date: string;
  status: string;
  score?: number;
}

export default function MyResults() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (talent?.email) {
      fetchResults();
    }
  }, [talent?.email]);

  async function fetchResults() {
    if (!talent?.email) return;
    
    setLoading(true);
    try {
      const [assessments, interviews, salaries, portfolios] = await Promise.all([
        supabase
          .from('career_assessments')
          .select('id, created_at, percentage, readiness_level')
          .ilike('email', talent.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('mock_interviews')
          .select('id, created_at, selection_percentage, status, job_title')
          .ilike('email', talent.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('salary_analyses')
          .select('id, created_at, status, job_title')
          .ilike('email', talent.email)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolio_requests')
          .select('id, created_at, status')
          .ilike('email', talent.email)
          .order('created_at', { ascending: false })
      ]);

      const allResults: ServiceResult[] = [];

      assessments.data?.forEach(a => {
        allResults.push({
          id: a.id,
          type: 'assessment',
          title: 'Career Readiness Assessment',
          date: a.created_at,
          status: a.readiness_level,
          score: a.percentage
        });
      });

      interviews.data?.forEach(i => {
        allResults.push({
          id: i.id,
          type: 'interview',
          title: i.job_title || 'Mock Interview',
          date: i.created_at,
          status: i.status || 'pending',
          score: i.selection_percentage
        });
      });

      salaries.data?.forEach(s => {
        allResults.push({
          id: s.id,
          type: 'salary',
          title: s.job_title || 'Salary Analysis',
          date: s.created_at,
          status: s.status || 'pending'
        });
      });

      portfolios.data?.forEach(p => {
        allResults.push({
          id: p.id,
          type: 'portfolio',
          title: 'Digital Portfolio',
          date: p.created_at,
          status: p.status
        });
      });

      allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setResults(allResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'assessment': return ClipboardCheck;
      case 'interview': return Mic;
      case 'salary': return DollarSign;
      case 'portfolio': return Palette;
      default: return Award;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'assessment': return 'text-primary bg-primary/10';
      case 'interview': return 'text-accent bg-accent/10';
      case 'salary': return 'text-warning bg-warning/10';
      case 'portfolio': return 'text-secondary bg-secondary/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const handleResultClick = (result: ServiceResult) => {
    switch (result.type) {
      case 'assessment':
        navigate(`/assessment-results/${result.id}`);
        break;
      case 'interview':
        if (result.status === 'completed') {
          navigate(`/mock-interview/results/${result.id}`);
        }
        break;
      case 'salary':
        if (result.status === 'completed') {
          navigate(`/salary-analysis/results/${result.id}`);
        }
        break;
      case 'portfolio':
        navigate('/portfolio-status');
        break;
    }
  };

  const filterByType = (type: string) => {
    if (type === 'all') return results;
    return results.filter(r => r.type === type);
  };

  const ResultCard = ({ result }: { result: ServiceResult }) => {
    const Icon = getIcon(result.type);
    const colorClasses = getColor(result.type);
    const isClickable = result.type === 'assessment' || 
      (result.type === 'interview' && result.status === 'completed') ||
      (result.type === 'salary' && result.status === 'completed') ||
      result.type === 'portfolio';

    return (
      <Card 
        className={`${isClickable ? 'cursor-pointer hover:shadow-md' : 'opacity-70'} transition-shadow`}
        onClick={() => isClickable && handleResultClick(result)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{result.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(result.date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result.score !== undefined && (
                <span className="font-semibold text-sm">{result.score}%</span>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {result.status.replace('_', ' ')}
              </Badge>
              {isClickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">My Results</h1>
        <p className="text-sm text-muted-foreground">View your past assessments and service results</p>
      </div>

      <Tabs defaultValue="all">
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <TabsList className="w-max">
            <TabsTrigger value="all" className="text-xs h-8">All ({results.length})</TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs h-8">Assessments</TabsTrigger>
            <TabsTrigger value="interview" className="text-xs h-8">Interviews</TabsTrigger>
            <TabsTrigger value="salary" className="text-xs h-8">Salary</TabsTrigger>
          </TabsList>
        </div>

        {['all', 'assessment', 'interview', 'salary'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filterByType(tab).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No results yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Complete services to see your results here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filterByType(tab).map(result => (
                  <ResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
