import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Brain,
  Briefcase,
  Star,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const fetchResults = useCallback(
    async (isPoll = false) => {
      if (!assessmentId) return;

      if (!isPoll) setLoading(true);
      try {
        const { data, error } = await supabase
          .from("job_assessments")
          .select(
            `
          id, ai_score, ai_analysis, status, completed_at,
          jobs (title, company_name)
        `,
          )
          .eq("id", assessmentId)
          .single();

        if (error) throw error;

        const assessmentData = data as AssessmentResult;
        setResult(assessmentData);

        // Return true if analysis is complete so we can stop polling
        return assessmentData.status === "completed" && assessmentData.ai_score !== null;
      } catch (error) {
        console.error("Error fetching results:", error);
        return false;
      } finally {
        if (!isPoll) setLoading(false);
      }
    },
    [assessmentId],
  );

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Polling logic for pending analysis
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    // Only poll if we have a result, it's marked completed (by the client),
    // but the AI score hasn't populated yet (Edge Function still running)
    if (result && result.status === "completed" && result.ai_score === null && !timedOut) {
      setPolling(true);

      // Poll every 5 seconds
      intervalId = setInterval(async () => {
        const isComplete = await fetchResults(true);
        if (isComplete) {
          setPolling(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          toast.success("Analysis complete!");
        }
      }, 5000);

      // Stop polling after 2 minutes (120000 ms)
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setPolling(false);
        setTimedOut(true);
        toast.warning("Analysis is taking longer than expected. Please check back later.");
      }, 120000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [result?.status, result?.ai_score, fetchResults, timedOut]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
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
            <Button variant="outline" onClick={() => navigate("/app/applications")} className="mt-4">
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show analyzing state if polling or if just incomplete
  if ((result.status === "completed" && result.ai_score === null) || polling) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="py-16 text-center space-y-6">
            <div className="relative">
              <Brain className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary/50 animate-ping" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Analyzing Your Assessment</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI is reviewing your answers, voice responses, and technical skills. This usually takes about 10-20
                seconds.
              </p>
            </div>

            {timedOut ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  The analysis is taking longer than usual. You can wait here or check your "My Applications" page
                  later.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-3 h-3" /> Retry Fetching
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Insights...
                </div>
                <p className="text-xs text-muted-foreground">Please do not close this tab</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = result.ai_analysis || {};
  const score = result.ai_score || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/applications")}>
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
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1 font-medium">AI Match Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold tracking-tight ${getScoreColor(score)}`}>{score}</span>
                <span className="text-2xl text-muted-foreground font-light">/100</span>
              </div>
              <Badge className="mt-3 px-3 py-1 text-sm" variant={score >= 60 ? "default" : "secondary"}>
                {getScoreLabel(score)}
              </Badge>
            </div>
            <div className="h-28 w-28 rounded-full bg-background flex items-center justify-center border-8 border-primary/10 shadow-inner">
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
              <Target className="h-4 w-4 text-primary" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {analysis.score_breakdown.technical !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-muted-foreground">Technical Knowledge</span>
                  <span className="font-bold">{analysis.score_breakdown.technical}%</span>
                </div>
                <Progress value={analysis.score_breakdown.technical} className="h-2.5" />
              </div>
            )}
            {analysis.score_breakdown.communication !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-muted-foreground">Communication (Voice)</span>
                  <span className="font-bold">{analysis.score_breakdown.communication}%</span>
                </div>
                <Progress value={analysis.score_breakdown.communication} className="h-2.5" />
              </div>
            )}
            {analysis.score_breakdown.problem_solving !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-muted-foreground">Problem Solving</span>
                  <span className="font-bold">{analysis.score_breakdown.problem_solving}%</span>
                </div>
                <Progress value={analysis.score_breakdown.problem_solving} className="h-2.5" />
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
              <Brain className="h-4 w-4 text-primary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed text-muted-foreground italic border-l-4 border-primary/30">
              "{analysis.overall_assessment}"
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
                    <Star className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-800 dark:text-green-200">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.areas_for_improvement && analysis.areas_for_improvement.length > 0 && (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                <TrendingUp className="h-4 w-4" />
                Growth Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.areas_for_improvement.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    <ArrowRight className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-800 dark:text-amber-200">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendation */}
      {(analysis.recommendation || analysis.hiring_recommendation) && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Briefcase className="h-4 w-4" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
              {analysis.recommendation || analysis.hiring_recommendation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1 h-12 text-base shadow-lg" onClick={() => navigate("/app/applications")}>
          View My Applications
        </Button>
        <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => navigate("/app/jobs")}>
          Browse More Jobs
        </Button>
      </div>
    </div>
  );
}
