import { useEffect, useState, useCallback, useRef } from "react";
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
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: AI Synthesis Report
 * High-fidelity visualization of multi-modal assessment telemetry.
 * 2026 Standard: Executive Logic geometry with real-time analysis polling.
 */

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
  const triggerAttempted = useRef(false);

  const [progress, setProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("Initializing protocol...");

  const fetchResults = useCallback(
    async (isPoll = false) => {
      if (!assessmentId) return;
      if (!isPoll) setLoading(true);
      try {
        const { data, error } = await supabase
          .from("job_assessments")
          .select(`id, ai_score, ai_analysis, status, completed_at, jobs (title, company_name)`)
          .eq("id", assessmentId)
          .single();

        if (error) throw error;
        const assessmentData = data as AssessmentResult;
        setResult(assessmentData);
        return assessmentData.status === "completed" && assessmentData.ai_score !== null;
      } catch (error) {
        console.error("Diagnostic Failure:", error);
        return false;
      } finally {
        if (!isPoll) setLoading(false);
      }
    },
    [assessmentId],
  );

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (polling) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          const increment = prev < 50 ? 1.5 : prev < 80 ? 0.8 : 0.3;
          return Math.min(prev + increment, 92);
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [polling]);

  useEffect(() => {
    if (progress < 30) setAnalysisStage("Decompressing Artifacts...");
    else if (progress < 60) setAnalysisStage("Generating responses...");
    else if (progress < 85) setAnalysisStage("Loading Skill Matrix...");
    else setAnalysisStage("Finalizing Briefing...");
  }, [progress]);

  useEffect(() => {
    const triggerAnalysis = async () => {
      if (!assessmentId || triggerAttempted.current) return;
      if (result?.status === "completed" && result?.ai_score === null) {
        triggerAttempted.current = true;
        try {
          await supabase.functions.invoke("analyze-job-assessment", { body: { assessmentId } });
        } catch (err) {
          console.error("Synthesis Trigger Failed:", err);
        }
      }
    };
    if (result && !loading) triggerAnalysis();
  }, [result, loading, assessmentId]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (result && result.status === "completed" && result.ai_score === null && !timedOut) {
      setPolling(true);
      intervalId = setInterval(async () => {
        const isComplete = await fetchResults(true);
        if (isComplete) {
          setPolling(false);
          setProgress(100);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          toast.success("Saved successfully");
        }
      }, 4000);

      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setPolling(false);
        setTimedOut(true);
      }, 65000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [result?.status, result?.ai_score, fetchResults, timedOut]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto p-12 space-y-10 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
        <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  if (!result)
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in zoom-in-95">
        <AlertTriangle className="h-16 w-16 text-destructive/30 mx-auto mb-6 rotate-12" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">List Missing</h2>
        <Button
          variant="outline"
          onClick={() => navigate("/app/applications")}
          className="mt-8 rounded-xl px-10 h-12 font-black uppercase text-[10px] tracking-widest border-2"
        >
          Return to Dashboard
        </Button>
      </div>
    );

  if ((result.status === "completed" && result.ai_score === null) || polling)
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Card className="rounded-[48px] border-2 border-primary/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden py-24 text-center">
          <CardContent className="space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary relative z-10 stroke-[1.5px]" />
            </div>
            <div className="space-y-6 max-w-md mx-auto relative z-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{analysisStage}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse italic">
                  Neural Synthesis Active
                </p>
              </div>
              <div className="space-y-4">
                <Progress value={progress} className="h-1.5 rounded-full border border-primary/10 bg-primary/5" />
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  <span>Artifact Ingestion</span>
                  <span>Neural Synthesis</span>
                  <span>Report Finalization</span>
                </div>
              </div>
            </div>
            {timedOut && (
              <div className="bg-amber-500/5 p-6 rounded-[24px] border border-amber-500/20 max-w-sm mx-auto animate-in slide-in-from-bottom-4">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed mb-4 italic">
                  The synthesis is exceeding typical logic cycles. List will update in background.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-10 px-6 font-black uppercase text-[9px] border-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" /> Re-Sync
                  </Button>
                  <Button
                    onClick={() => navigate("/app/applications")}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-10 px-6 font-black uppercase text-[9px]"
                  >
                    Check Later
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );

  const analysis = result.ai_analysis || {};
  const score = result.ai_score || 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in duration-1000">
      {/* Header Connection */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-11 w-11 hover:bg-primary/5 transition-all"
            onClick={() => navigate("/app/applications")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter">Synthesis Report</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              List: {result.jobs?.title}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] px-3 py-1"
        >
          Logic v2.6.4
        </Badge>
      </header>

      {/* Hero Score Dashboard */}
      <Card className="rounded-[40px] border-2 border-primary/10 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <Trophy className="h-48 w-48" />
        </div>
        <CardContent className="p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic">
                Neural Match Reliability
              </p>
              <div className="flex items-baseline gap-3">
                <span className={cn("text-8xl font-black tracking-tighter italic leading-none", getScoreColor(score))}>
                  {score}
                </span>
                <span className="text-2xl font-black text-muted-foreground/20 italic tracking-tighter">/100</span>
              </div>
              <Badge
                className={cn(
                  "h-8 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl border-none",
                  score >= 60 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                Connection Status: {score >= 80 ? "Optimal" : score >= 60 ? "Verified" : "Sync Required"}
              </Badge>
            </div>

            <div className="relative">
              <div
                className={cn(
                  "h-40 w-40 rounded-full border-[12px] flex items-center justify-center shadow-inner bg-background/50 backdrop-blur-md",
                  score >= 80 ? "border-emerald-500/10" : "border-primary/5",
                )}
              >
                <Brain className={cn("h-16 w-16", getScoreColor(score))} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/20 px-8 py-5 border-b">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <Target className="h-4 w-4" /> Dimension Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {[
              { label: "Technical Logic", val: analysis.score_breakdown?.technical },
              { label: "Vocal Synthesis", val: analysis.score_breakdown?.communication },
              { label: "Systematic Solving", val: analysis.score_breakdown?.problem_solving },
            ].map(
              (stat, i) =>
                stat.val !== undefined && (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {stat.label}
                      </span>
                      <span className="text-sm font-black italic tracking-tighter">{stat.val}%</span>
                    </div>
                    <Progress value={stat.val} className="h-1.5 rounded-full bg-primary/5" />
                  </div>
                ),
            )}
          </CardContent>
        </Card>

        {/* AI Briefing Summary */}
        <Card className="rounded-[32px] border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/20 px-8 py-5 border-b">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" /> Neural Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10 relative">
              <Zap className="absolute top-4 right-4 h-4 w-4 text-primary/20 fill-primary/20" />
              <p className="text-sm font-medium leading-relaxed italic text-foreground/80 selection:bg-primary/20">
                "{analysis.overall_assessment}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logic Strengths & Growth Matrix */}
      <div className="grid md:grid-cols-2 gap-8">
        {[
          {
            title: "Strategic Edge",
            items: analysis.strengths,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
            icon: Star,
          },
          {
            title: "Logic Gaps",
            items: analysis.areas_for_improvement,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
            icon: TrendingUp,
          },
        ].map(
          (block, i) =>
            block.items &&
            block.items.length > 0 && (
              <Card key={i} className="rounded-[32px] border-border/40 shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/20 px-8 py-5 border-b">
                  <CardTitle
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3",
                      block.color,
                    )}
                  >
                    <block.icon className="h-4 w-4" /> {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {block.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn("p-4 rounded-xl font-medium text-sm italic flex gap-4 items-start", block.bg)}
                    >
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full mt-2 shrink-0",
                          i === 0 ? "bg-emerald-500" : "bg-amber-500",
                        )}
                      />
                      <span className="text-foreground/80 leading-snug">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ),
        )}
      </div>

      {/* Tactical Directives */}
      {(analysis.recommendation || analysis.hiring_recommendation) && (
        <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
          <CardHeader className="bg-primary/10 px-10 py-6 border-b border-primary/20">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-4">
              <Briefcase className="h-5 w-5" /> Operational Protocol: Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <p className="text-lg font-black italic text-foreground leading-relaxed tracking-tight selection:bg-primary/20">
              {analysis.recommendation || analysis.hiring_recommendation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Global Command Node */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex gap-6">
          <Button
            className="flex-1 h-16 rounded-[24px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
            onClick={() => navigate("/app/applications")}
          >
            <span className="relative z-10">Manage Applications</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-16 rounded-[24px] font-black uppercase text-[11px] tracking-widest border-2"
            onClick={() => navigate("/app/jobs")}
          >
            Market Discover <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
