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
import { analyzeJobAssessment } from "@/domains/jobs/api/jobsApi";

/**
 * Job assessment results — AI-scored summary with per-skill breakdown.
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
 const [analysisStage, setAnalysisStage] = useState("Getting things ready…");

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
 const assessment = data as AssessmentResult;
 setResult(assessment);
 return assessment.status === "completed" && assessment.ai_score !== null;
 } catch (error) {
 console.error("Failed to load assessment results:", error);
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
 if (progress < 30) setAnalysisStage("Reading your answers…");
 else if (progress < 60) setAnalysisStage("Scoring your responses…");
 else if (progress < 85) setAnalysisStage("Mapping skills…");
 else setAnalysisStage("Finalizing your report…");
 }, [progress]);

 useEffect(() => {
 const triggerAnalysis = async () => {
 if (!assessmentId || triggerAttempted.current) return;
 if (result?.status === "completed" && result?.ai_score === null) {
 triggerAttempted.current = true;
 try {
 await analyzeJobAssessment({ assessmentId });
 } catch (err) {
 console.error("Couldn't kick off AI analysis:", err);
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
 const done = await fetchResults(true);
 if (done) {
 setPolling(false);
 setProgress(100);
 clearInterval(intervalId);
 clearTimeout(timeoutId);
 toast.success("Your results are ready");
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
 <Skeleton className="h-[400px] w-full rounded-2xl bg-muted/40" />
 </div>
 );

 if (!result)
 return (
 <div className="max-w-2xl mx-auto py-32 text-center">
 <AlertTriangle className="h-16 w-16 text-destructive/30 mx-auto mb-6" />
 <h2 className="text-2xl font-bold">Assessment not found</h2>
 <Button
 variant="outline"
 onClick={() => navigate("/app/applications")}
 className="mt-8 rounded-xl px-10 h-12"
 >
 Back to applications
 </Button>
 </div>
 );

 if ((result.status === "completed" && result.ai_score === null) || polling)
 return (
 <div className="max-w-3xl mx-auto px-6 py-20">
 <Card className="rounded-[48px] border-2 border-primary/20 bg-card shadow-sm overflow-hidden py-24 text-center">
 <CardContent className="space-y-12">
 <div className="relative">
 <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
 <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary relative z-10" />
 </div>
 <div className="space-y-6 max-w-md mx-auto relative z-10">
 <div className="space-y-2">
 <h2 className="text-2xl font-bold tracking-tight">{analysisStage}</h2>
 <p className="text-xs font-semibold tracking-wide text-primary animate-pulse">
 AI is reviewing your assessment
 </p>
 </div>
 <div className="space-y-4">
 <Progress value={progress} className="h-1.5 rounded-full border border-primary/10 bg-primary/5" />
 <div className="flex justify-between text-[10px] font-semibold tracking-wide text-muted-foreground/60">
 <span>Reading</span>
 <span>Scoring</span>
 <span>Finalizing</span>
 </div>
 </div>
 </div>
 {timedOut && (
 <div className="bg-amber-500/5 p-6 rounded-xl border border-amber-500/20 max-w-sm mx-auto">
 <p className="text-xs font-semibold text-amber-600 leading-relaxed mb-4">
 This is taking longer than usual. Your results will appear here once they're ready.
 </p>
 <div className="flex gap-3 justify-center">
 <Button
 onClick={() => window.location.reload()}
 variant="outline"
 size="sm"
 className="rounded-xl h-10 px-6 text-xs"
 >
 <RefreshCw className="w-3 h-3 mr-2" /> Refresh
 </Button>
 <Button
 onClick={() => navigate("/app/applications")}
 variant="ghost"
 size="sm"
 className="rounded-xl h-10 px-6 text-xs"
 >
 Check later
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
 <header className="flex items-center justify-between">
 <div className="flex items-center gap-5">
 <Button
 variant="ghost"
 size="icon"
 className="rounded-xl h-11 w-11 hover:bg-primary/5"
 onClick={() => navigate("/app/applications")}
 aria-label="Back to applications"
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div className="space-y-1">
 <h1 className="text-2xl font-bold tracking-tight">Your assessment results</h1>
 <p className="text-xs font-semibold tracking-wide text-muted-foreground/60">
 For: {result.jobs?.title}
 </p>
 </div>
 </div>
 <Badge variant="outline" className="rounded-lg border-primary/20 text-primary text-[10px] px-3 py-1">
 AI scored
 </Badge>
 </header>

 <Card className="rounded-2xl border-2 border-primary/10 bg-card shadow-sm overflow-hidden relative group">
 <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
 <Trophy className="h-48 w-48" />
 </div>
 <CardContent className="p-10">
 <div className="flex flex-col md:flex-row items-center justify-between gap-12">
 <div className="text-center md:text-left space-y-4">
 <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground/60">
 Your match score
 </p>
 <div className="flex items-baseline gap-3">
 <span className={cn("text-7xl font-black tracking-tight leading-none", getScoreColor(score))}>
 {score}
 </span>
 <span className="text-2xl font-bold text-muted-foreground/30 tracking-tight">/100</span>
 </div>
 <Badge
 className={cn(
 "h-8 px-6 rounded-xl font-bold text-[11px] tracking-wide shadow-md border-none",
 score >= 60 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
 )}
 >
 {score >= 80 ? "Strong match" : score >= 60 ? "Good match" : "Needs more practice"}
 </Badge>
 </div>

 <div className="relative">
 <div
 className={cn(
 "h-40 w-40 rounded-full border-[12px] flex items-center justify-center shadow-inner bg-background/50 ",
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

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <Card className="rounded-2xl border-border/40 shadow-xl overflow-hidden">
 <CardHeader className="bg-muted/20 px-8 py-5 border-b">
 <CardTitle className="text-[11px] font-bold uppercase tracking-tight text-primary flex items-center gap-3">
 <Target className="h-4 w-4" /> Skill breakdown
 </CardTitle>
 </CardHeader>
 <CardContent className="p-8 space-y-8">
 {[
 { label: "Technical", val: analysis.score_breakdown?.technical },
 { label: "Communication", val: analysis.score_breakdown?.communication },
 { label: "Problem solving", val: analysis.score_breakdown?.problem_solving },
 ].map(
 (stat, i) =>
 stat.val !== undefined && (
 <div key={i} className="space-y-3">
 <div className="flex justify-between items-end">
 <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
 {stat.label}
 </span>
 <span className="text-sm font-bold tabular-nums">{stat.val}%</span>
 </div>
 <Progress value={stat.val} className="h-1.5 rounded-full bg-primary/5" />
 </div>
 ),
 )}
 </CardContent>
 </Card>

 <Card className="rounded-2xl border-border/40 shadow-xl overflow-hidden">
 <CardHeader className="bg-muted/20 px-8 py-5 border-b">
 <CardTitle className="text-[11px] font-bold uppercase tracking-tight text-primary flex items-center gap-3">
 <ShieldCheck className="h-4 w-4" /> AI feedback
 </CardTitle>
 </CardHeader>
 <CardContent className="p-8">
 <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 relative">
 <Zap className="absolute top-4 right-4 h-4 w-4 text-primary/20 fill-primary/20" />
 <p className="text-sm leading-relaxed text-foreground/80">
 {analysis.overall_assessment}
 </p>
 </div>
 </CardContent>
 </Card>
 </div>

 <div className="grid md:grid-cols-2 gap-8">
 {[
 {
 title: "What you did well",
 items: analysis.strengths,
 color: "text-emerald-500",
 bg: "bg-emerald-500/5",
 icon: Star,
 },
 {
 title: "Where to improve",
 items: analysis.areas_for_improvement,
 color: "text-amber-500",
 bg: "bg-amber-500/5",
 icon: TrendingUp,
 },
 ].map(
 (block, i) =>
 block.items &&
 block.items.length > 0 && (
 <Card key={i} className="rounded-2xl border-border/40 shadow-lg overflow-hidden">
 <CardHeader className="bg-muted/20 px-8 py-5 border-b">
 <CardTitle
 className={cn(
 "text-[11px] font-bold uppercase tracking-tight flex items-center gap-3",
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
 className={cn("p-4 rounded-xl text-sm flex gap-4 items-start", block.bg)}
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

 {(analysis.recommendation || analysis.hiring_recommendation) && (
 <Card className="rounded-2xl border-2 border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
 <CardHeader className="bg-primary/10 px-10 py-6 border-b border-primary/20">
 <CardTitle className="text-[11px] font-bold uppercase tracking-tight text-primary flex items-center gap-4">
 <Briefcase className="h-5 w-5" /> What to do next
 </CardTitle>
 </CardHeader>
 <CardContent className="p-10">
 <p className="text-base font-medium text-foreground leading-relaxed">
 {analysis.recommendation || analysis.hiring_recommendation}
 </p>
 </CardContent>
 </Card>
 )}

 <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 border-t border-border/10 z-20">
 <div className="max-w-3xl mx-auto flex gap-4">
 <Button
 className="flex-1 h-12 rounded-xl font-bold text-sm shadow-lg"
 onClick={() => navigate("/app/applications")}
 >
 My applications
 </Button>
 <Button
 variant="outline"
 className="flex-1 h-12 rounded-xl font-bold text-sm"
 onClick={() => navigate("/app/jobs")}
 >
 Browse more jobs <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </div>
 </div>
 );
}
