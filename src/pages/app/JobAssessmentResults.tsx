import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Trophy, Target, TrendingUp, CheckCircle, 
  AlertTriangle, Brain, Briefcase, Star, ArrowRight
} from 'lucide-react';

interface AssessmentResult {
  id: string;
  ai_score: number | null;
  ai_analysis: {
    overall_assessment?: string;
    strengths?: string[];
    areas_for_improvement?: string[];
    score_breakdown?: {
      technical?: number;
      communication?: number;
      problem_solving?: number;
    };
    recommendation?: string;
    hiring_recommendation?: string;
  } | null;
  status: string;
  completed_at: string | null;
  jobs?: {
    title: string;
    company_name: string;
  };
}

export default function JobAssessmentResults() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) fetchResults();
  }, [assessmentId]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('job_assessments')
        .select(`
          id, ai_score, ai_analysis, status, completed_at,
          jobs (title, company_name)
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      setResult(data as AssessmentResult);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Results not found</p>
            <Button variant="outline" onClick={() => navigate('/app/applications')} className="mt-4">
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status !== 'completed' || result.ai_score === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Analyzing Your Responses</h2>
            <p className="text-muted-foreground mb-6">
              Our AI is reviewing your assessment. This usually takes a few moments.
            </p>
            <Button onClick={() => fetchResults()}>
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = result.ai_analysis || {};
  const score = result.ai_score || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/applications')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Assessment Results</h1>
          <p className="text-sm text-muted-foreground">
            {result.jobs?.title} at {result.jobs?.company_name}
          </p>
        </div>
      </div>

      {/* Score Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <Badge className="mt-2" variant={score >= 60 ? 'default' : 'secondary'}>
                {getScoreLabel(score)}
              </Badge>
            </div>
            <div className="h-24 w-24 rounded-full bg-background flex items-center justify-center border-4 border-primary/20">
              <Trophy className={`h-12 w-12 ${getScoreColor(score)}`} />
            </div>
          </div>
        </div>
      </Card>

      {/* Score Breakdown */}
      {analysis.score_breakdown && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.score_breakdown.technical !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Technical Skills</span>
                  <span className="font-medium">{analysis.score_breakdown.technical}%</span>
                </div>
                <Progress value={analysis.score_breakdown.technical} className="h-2" />
              </div>
            )}
            {analysis.score_breakdown.communication !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Communication</span>
                  <span className="font-medium">{analysis.score_breakdown.communication}%</span>
                </div>
                <Progress value={analysis.score_breakdown.communication} className="h-2" />
              </div>
            )}
            {analysis.score_breakdown.problem_solving !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Problem Solving</span>
                  <span className="font-medium">{analysis.score_breakdown.problem_solving}%</span>
                </div>
                <Progress value={analysis.score_breakdown.problem_solving} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Assessment */}
      {analysis.overall_assessment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.overall_assessment}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Star className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {analysis.areas_for_improvement && analysis.areas_for_improvement.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-4 w-4" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.areas_for_improvement.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {(analysis.recommendation || analysis.hiring_recommendation) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {analysis.recommendation || analysis.hiring_recommendation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => navigate('/app/applications')}>
          View My Applications
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate('/app/jobs')}>
          Browse More Jobs
        </Button>
      </div>
    </div>
  );
}
