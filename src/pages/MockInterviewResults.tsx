import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMockInterviewById } from "@/domains/marketing/repo/marketingRepo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Share2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { MockInterviewPDFTemplate } from "@/components/mock-interview/MockInterviewPDFTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { RetryErrorCard } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  category: string;
  expected_points: string[];
}
interface Answer {
  question_id: string;
  answer: string;
  time_taken_seconds: number;
}
interface QuestionFeedback {
  question_id: string;
  score: number;
  feedback: string;
  missed_points: string[];
  improvement_tips: string;
}
interface AIFeedback {
  overall_feedback: string;
  question_feedback: QuestionFeedback[];
  interview_tips: string;
}

interface Interview {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  job_title: string | null;
  company_name: string | null;
  job_description: string;
  questions: Question[];
  answers: Answer[];
  ai_feedback: AIFeedback | null;
  selection_percentage: number | null;
  performance_level: string | null;
  strengths: string[] | null;
  improvement_areas: string[] | null;
  difficulty: string;
  question_count: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const performanceLevelMap: Record<string, { color: string; label: string }> = {
  needs_work: { color: "text-rose-500 bg-rose-500/10", label: "Baseline" },
  developing: { color: "text-orange-500 bg-orange-500/10", label: "Progressing" },
  competent: { color: "text-blue-500 bg-blue-500/10", label: "Qualified" },
  strong: { color: "text-emerald-500 bg-emerald-500/10", label: "Advanced" },
  excellent: { color: "text-green-500 bg-green-500/10", label: "Exceptional" },
};

export default function MockInterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      const data = await getMockInterviewById(id!);
      if (data.status !== "completed") {
        navigate("/mock-interview");
        return;
      }

      setInterview({
        ...data,
        questions: (data.questions as any) || [],
        answers: (data.answers as any) || [],
        ai_feedback: data.ai_feedback as any,
      });

      if (data.profession_category_id) loadRecommendedCourses(data.profession_category_id);
    } catch (err: any) {
      setLoadError("Intel fetch failure. Node unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedCourses = async (pId: string) => {
    setLoadingCourses(true);
    const { data } = await supabase
      .from("content")
      .select("id, title, slug, estimated_hours, thumbnail_url")
      .eq("profession_line_id", pId)
      .limit(3);
    if (data) setRecommendedCourses(data);
    setLoadingCourses(false);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("mock-interview-pdf-content");
      if (!element) throw new Error("Template Not Found");
      element.style.display = "block";
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.display = "none";
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Performance-Audit-${interview?.full_name?.split(" ")[0]}.pdf`);
      toast.success("Intelligence Report Exported");
    } catch (e) {
      toast.error("PDF Serialization Failed");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Decoding Performance Data
        </p>
      </div>
    );

  if (loadError || !interview)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <RetryErrorCard type="server" description={loadError || "Record missing"} onRetry={() => loadInterview()} />
      </div>
    );

  const perf = performanceLevelMap[interview.performance_level || "needs_work"];
  const score = interview.selection_percentage || 0;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 container max-w-5xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest px-3 py-1"
              >
                Session Complete
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {new Date(interview.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Performance Audit</h1>
            <p className="text-sm font-medium text-muted-foreground">
              {interview.job_title} at {interview.company_name || "Nexus Partner"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-border/40"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}{" "}
              Export PDF
            </Button>
            <Button
              className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
              onClick={() => navigate("/mock-interview/setup")}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> New Simulation
            </Button>
          </div>
        </header>

        <Card className="rounded-[40px] border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <CardContent className="p-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="relative w-48 h-48 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * score) / 100}
                  className={cn("transition-all duration-1000", perf.color.split(" ")[0])}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tracking-tighter">{score}%</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Match Index
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <Badge
                  className={cn("border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest", perf.color)}
                >
                  {perf.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground font-bold uppercase text-[9px] px-3"
                >
                  {interview.difficulty} Difficulty
                </Badge>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 justify-center lg:justify-start">
                  <Sparkles className="h-4 w-4" /> AI Strategic Assessment
                </h3>
                <p className="text-base font-medium leading-relaxed text-foreground/80 italic">
                  "{interview.ai_feedback?.overall_feedback}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytical Breakdown - FIX: Corrected Tag Closure */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="rounded-[32px] border-emerald-500/10 bg-emerald-500/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Competitive Edge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interview.strengths?.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm font-medium p-3 bg-background/50 rounded-2xl border border-emerald-500/5"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {s}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-rose-500/10 bg-rose-500/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Logic Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interview.improvement_areas?.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-sm font-medium p-3 bg-background/50 rounded-2xl border border-rose-500/5"
                >
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" /> {s}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">
            Neural Node Breakdown
          </h2>
          <div className="space-y-4">
            {interview.ai_feedback?.question_feedback.map((f, i) => {
              const q = interview.questions.find((x) => x.id === f.question_id);
              const a = interview.answers.find((x) => x.question_id === f.question_id);
              return (
                <Card key={i} className="rounded-[32px] border-border/40 overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase mb-2">
                          Module 0{i + 1}
                        </Badge>
                        <h4 className="text-lg font-black tracking-tight">{q?.question}</h4>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex flex-col items-center justify-center shrink-0 border border-border/40">
                        <span className="text-lg font-black">{f.score}</span>
                        <span className="text-[8px] font-black uppercase opacity-40">Score</span>
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          Input Artifact
                        </p>
                        <p className="text-xs font-medium leading-relaxed bg-muted/30 p-4 rounded-2xl italic">
                          "{a?.answer || "Incomplete."}"
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">Logic Audit</p>
                        <p className="text-xs font-medium leading-relaxed">{f.feedback}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="rounded-[40px] border-primary/20 bg-primary/5 overflow-hidden shadow-2xl">
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tighter">Skill Deficit Detected?</h3>
              <p className="text-sm font-medium text-muted-foreground">
                Bridge your performance gap with curated masterclasses.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {recommendedCourses.map((c) => (
                <Button
                  key={c.id}
                  variant="secondary"
                  className="h-14 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest"
                  onClick={() => navigate(`/courses/${c.slug}`)}
                >
                  {c.title.split(" ")[0]} Masterclass <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <div id="mock-interview-pdf-content" className="hidden">
        <MockInterviewPDFTemplate interview={interview} />
      </div>
    </div>
  );
}
