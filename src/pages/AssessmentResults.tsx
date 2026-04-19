import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // FIX: Added missing import
import {
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  BookOpen,
  Loader2,
  MessageCircle,
  Linkedin,
  Twitter,
  History,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ScorecardPDFTemplate } from "@/components/assessment/ScorecardPDFTemplate";
import { generateScorecardPDF } from "@/lib/assessmentPdfGenerator";
import { RetryErrorCard } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";

interface AIAnalysis {
  strengths: string[];
  improvement_areas: string[];
  recommendations: string[];
  career_tips: string;
}

interface Assessment {
  id: string;
  full_name: string;
  email: string;
  percentage: number;
  readiness_level: string;
  total_score: number;
  max_score: number;
  created_at: string;
  ai_analysis: AIAnalysis | null;
  improvement_areas: string[];
  profession_category_id: string;
  profession_categories?: { name: string } | null;
}

const readinessConfig: Record<string, { color: string; label: string; desc: string }> = {
  beginner: {
    color: "text-rose-500 bg-rose-50",
    label: "Foundational",
    desc: "Focus on establishing core technical principles.",
  },
  developing: {
    color: "text-amber-500 bg-amber-50",
    label: "Developing",
    desc: "You are building momentum. Time to specialize.",
  },
  competent: {
    color: "text-emerald-500 bg-emerald-50",
    label: "Professional",
    desc: "Solid performance. Optimized for growth.",
  },
  proficient: {
    color: "text-blue-500 bg-blue-50",
    label: "Proficient",
    desc: "High market readiness. Focus on leadership.",
  },
  expert: {
    color: "text-violet-500 bg-violet-50",
    label: "Industry Expert",
    desc: "Exceptional mastery. Ready for senior roles.",
  },
};

export default function AssessmentResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const hasTriggeredAnalysis = useRef(false);

  useEffect(() => {
    if (id) loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("career_assessments")
        .select(`*, profession_categories (name)`)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setLoadError("Record not found.");
        return;
      }

      const typedData = data as unknown as Assessment;
      setAssessment(typedData);

      if (typedData.profession_category_id) loadRecommendedCourses(typedData.profession_category_id);

      if (!typedData.ai_analysis && !hasTriggeredAnalysis.current) {
        hasTriggeredAnalysis.current = true;
        triggerAIAnalysis(typedData.id);
      }
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedCourses = async (categoryId: string) => {
    const { data } = await supabase
      .from("content")
      .select("id, title, slug, description, estimated_hours, thumbnail_url")
      .eq("profession_line_id", categoryId)
      .eq("is_published", true)
      .limit(3);
    setRecommendedCourses(data || []);
  };

  const triggerAIAnalysis = async (assessmentId: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-career-assessment", { body: { assessmentId } });
      if (error) throw error;
      if (data?.analysis) {
        setAssessment((prev) => (prev ? { ...prev, ai_analysis: data.analysis } : null));
      }
    } catch (err) {
      console.error("AI Analysis Failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const shareText = `I scored ${assessment?.percentage}% on the Career Readiness Scorecard! 🎯 Check yours at GroUp Academy.`;
  const shareUrl = window.location.href;

  const handleWhatsAppShare = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  const handleLinkedInShare = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  const handleTwitterShare = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    setDownloading(true);
    try {
      await generateScorecardPDF(assessment);
      toast.success("Scorecard Exported.");
    } catch (err) {
      toast.error("Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.2em] mt-4 text-muted-foreground">Compiling Report</p>
      </div>
    );

  if (loadError || !assessment)
    return (
      <div className="min-h-screen bg-background flex flex-col p-8 items-center justify-center">
        <RetryErrorCard title="Sync Failed" description={loadError || "Record missing"} onRetry={loadAssessment} />
      </div>
    );

  const level = readinessConfig[assessment.readiness_level?.toLowerCase()] || readinessConfig.beginner;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl py-12 px-4 space-y-8 animate-in fade-in duration-700">
        <section className="grid lg:grid-cols-[1fr,350px] gap-8">
          <div className="space-y-6">
            <header className="space-y-2">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest">
                Growth Audit
              </Badge>
              <h1 className="text-4xl font-black tracking-tighter leading-tight">Career Readiness Report</h1>
              <p className="text-muted-foreground font-medium">
                {assessment.profession_categories?.name || "Professional"} Pipeline
              </p>
            </header>

            <Card className="rounded-[32px] border-border/40 bg-card shadow-2xl relative overflow-hidden">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                <div className="relative h-44 w-44 flex items-center justify-center shrink-0">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="88"
                      cy="88"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-muted/10"
                    />
                    <circle
                      cx="88"
                      cy="88"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={502}
                      strokeDashoffset={502 - (502 * assessment.percentage) / 100}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tighter">{assessment.percentage}%</span>
                    <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">
                      Readiness Index
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <Badge
                      className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase border-none", level.color)}
                    >
                      {level.label}
                    </Badge>
                    <p className="text-lg font-bold leading-tight">{level.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                        Score
                      </p>
                      <p className="text-xl font-black">
                        {assessment.total_score} / {assessment.max_score}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1">Status</p>
                      <p className="text-xl font-black text-primary">Verified</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-[32px] border-primary/10 shadow-xl sticky top-24">
              <CardContent className="p-6 space-y-4">
                <Button
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export PDF Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  onClick={() => navigate("/career-assessment")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
                </Button>
                <div className="pt-4 border-t border-border/40 flex justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10 text-primary"
                    onClick={handleLinkedInShare}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-sky-100 text-sky-500"
                    onClick={handleTwitterShare}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-emerald-100 text-emerald-600"
                    onClick={handleWhatsAppShare}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Competitive Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyzing ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : (
                assessment.ai_analysis?.strengths.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                    <p className="text-sm font-medium leading-relaxed">{s}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-500" /> Improvement Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyzing ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : (
                (assessment.ai_analysis?.improvement_areas || assessment.improvement_areas).map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-1" />
                    <p className="text-sm font-medium leading-relaxed">{s}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            <h2 className="text-xl font-black tracking-tight uppercase">Strategic Recommendations</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {assessment.ai_analysis?.recommendations.map((rec, i) => (
              <Card key={i} className="rounded-3xl border-primary/10 bg-primary/[0.02] shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </div>
                  <p className="text-sm font-bold leading-tight">{rec}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-[40px] p-8 md:p-12 border border-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase">Remediation Path</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Recommended training for your readiness level
              </p>
            </div>
            <Button
              onClick={() => navigate("/app/learning")}
              className="rounded-full font-black uppercase text-[10px] h-10 px-8"
            >
              Academy Hub
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <Card
                key={course.id}
                className="rounded-[28px] border-none shadow-2xl overflow-hidden hover:-translate-y-1 transition-all cursor-pointer bg-card"
                onClick={() => navigate(`/app/learning/courses/${course.slug}`)}
              >
                <div className="aspect-video bg-muted relative">
                  {course.thumbnail_url && <img src={course.thumbnail_url} className="w-full h-full object-cover" />}
                </div>
                <CardContent className="p-5">
                  <h4 className="font-bold text-sm line-clamp-1">{course.title}</h4>
                  <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-2">
                    Recommended Course
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <div className="hidden">{assessment && <ScorecardPDFTemplate assessment={assessment} />}</div>
    </div>
  );
}
