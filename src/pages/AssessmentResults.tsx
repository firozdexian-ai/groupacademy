import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCareerAssessmentWithCategory } from "@/domains/marketing/repo/marketingRepo";
import { listRecommendedCoursesForProfession } from "@/domains/learning/repo/learningRepo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Loader2,
  MessageCircle,
  Linkedin,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import { ScorecardPDFTemplate } from "@/components/assessment/ScorecardPDFTemplate";
import { generateScorecardPDF } from "@/lib/assessmentPdfGenerator";
import { RetryErrorCard } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";
import { analyzeCareerAssessment } from "@/domains/talent/api/talentApi";

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

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  estimated_hours: number;
  thumbnail_url: string;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  // 1. Fetch Assessment Data
  const {
    data: assessment,
    isLoading: isAssessmentLoading,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ["career_assessment", id],
    queryFn: async () => {
      if (!id) throw new Error("Assessment ID is required.");
      const data = await getCareerAssessmentWithCategory(id);
      if (!data) throw new Error("Record not found.");
      return data as unknown as Assessment;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!id,
  });

  // 2. Fetch Recommended Courses
  const { data: recommendedCourses = [] } = useQuery({
    queryKey: ["recommended_courses", assessment?.profession_category_id],
    queryFn: async () => {
      const data = await listRecommendedCoursesForProfession(
        assessment!.profession_category_id,
        3,
        true,
      );
      return data as Course[];
    },
    enabled: !!assessment?.profession_category_id,
    staleTime: 5 * 60 * 1000,
  });

  // 3. AI Analysis Mutation
  const analyzeMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const data = await analyzeCareerAssessment({ assessmentId });
      return (data as any)?.analysis as AIAnalysis;
    },
    onSuccess: (newAnalysis) => {
      if (newAnalysis) {
        queryClient.setQueryData(["career_assessment", id], (old: Assessment | undefined) =>
          old ? { ...old, ai_analysis: newAnalysis } : old,
        );
      }
    },
    onError: (err) => {
      console.error("AI Analysis Failed:", err);
      toast.error("Failed to generate AI insights. We will try again later.");
    },
  });

  // Destructure for cleaner useEffect dependencies
  const { mutate, isPending: isAnalyzing, isSuccess: hasAnalyzed } = analyzeMutation;

  useEffect(() => {
    // Check if we have an assessment, it lacks AI analysis, and we aren't currently analyzing or haven't already succeeded
    if (assessment && !assessment.ai_analysis && !isAnalyzing && !hasAnalyzed) {
      mutate(assessment.id);
    }
  }, [assessment, isAnalyzing, hasAnalyzed, mutate]);

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
      toast.error("Export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isAssessmentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-[10px] font-bold uppercase tracking-widest mt-4 text-slate-500">Compiling Report</p>
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-8 items-center justify-center">
        <RetryErrorCard
          title="Sync Failed"
          description={loadError?.message || "Record missing"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const level = readinessConfig[assessment.readiness_level?.toLowerCase()] || readinessConfig.beginner;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="container max-w-5xl py-16 px-4 space-y-12 animate-in fade-in duration-700">
        <section className="grid lg:grid-cols-[1fr,350px] gap-8">
          <div className="space-y-8">
            <header className="space-y-3">
              <Badge className="bg-blue-50 text-blue-500 border-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full">
                Growth Audit
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-slate-900">
                Career Readiness Report
              </h1>
              <p className="text-lg text-slate-500 font-medium">
                {assessment.profession_categories?.name || "Professional"} Pipeline
              </p>
            </header>

            <Card className="rounded-[32px] border-none bg-white shadow-sm relative overflow-hidden">
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
                      className="text-slate-100"
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
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black tracking-tighter text-slate-900">
                      {assessment.percentage}%
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Index</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <Badge
                      className={cn(
                        "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase border-none tracking-widest",
                        level.color,
                      )}
                    >
                      {level.label}
                    </Badge>
                    <p className="text-lg font-medium text-slate-600 leading-relaxed">{level.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Score</p>
                      <p className="text-2xl font-black text-slate-900">
                        {assessment.total_score}{" "}
                        <span className="text-slate-400 text-lg">/ {assessment.max_score}</span>
                      </p>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Status</p>
                      <p className="text-2xl font-black text-emerald-600">Verified</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-[32px] border-none bg-white shadow-sm sticky top-24">
              <CardContent className="p-8 space-y-4">
                <Button
                  className="w-full h-14 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm"
                  onClick={handleDownloadPDF}
                  disabled={downloading || isAnalyzing}
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
                  className="w-full h-14 rounded-full bg-white border-slate-200 hover:bg-slate-50 text-slate-900 font-bold uppercase tracking-widest text-[10px] shadow-sm"
                  onClick={() => navigate("/career-assessment")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
                </Button>
                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-12 w-12 hover:bg-blue-50 text-blue-600"
                    onClick={handleLinkedInShare}
                  >
                    <Linkedin className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-12 w-12 hover:bg-sky-50 text-sky-500"
                    onClick={handleTwitterShare}
                  >
                    <Twitter className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-12 w-12 hover:bg-emerald-50 text-emerald-600"
                    onClick={handleWhatsAppShare}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-[32px] border-none bg-white shadow-sm">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Competitive Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {isAnalyzing ? (
                <Skeleton className="h-24 w-full rounded-2xl bg-slate-100" />
              ) : (
                assessment.ai_analysis?.strengths.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{s}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-none bg-white shadow-sm">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-500" /> Improvement Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {isAnalyzing ? (
                <Skeleton className="h-24 w-full rounded-2xl bg-slate-100" />
              ) : (
                (assessment.ai_analysis?.improvement_areas || assessment.improvement_areas)?.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{s}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-500 fill-blue-500" />
            <h2 className="text-2xl font-black tracking-tighter text-slate-900">Strategic Recommendations</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {isAnalyzing ? (
              <>
                <Skeleton className="h-40 w-full rounded-[32px] bg-slate-100" />
                <Skeleton className="h-40 w-full rounded-[32px] bg-slate-100" />
                <Skeleton className="h-40 w-full rounded-[32px] bg-slate-100" />
              </>
            ) : (
              assessment.ai_analysis?.recommendations.map((rec, i) => (
                <Card key={i} className="rounded-[32px] border-none bg-white shadow-sm">
                  <CardContent className="p-8 space-y-5">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm font-black">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{rec}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-slate-900">Remediation Path</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                Recommended training for your readiness level
              </p>
            </div>
            <Button
              onClick={() => navigate("/app/learning")}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] h-14 px-10 shadow-sm"
            >
              Academy Hub
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {recommendedCourses.map((course) => (
              <Card
                key={course.id}
                className="rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:-translate-y-1 transition-all cursor-pointer bg-white group"
                onClick={() => navigate(`/app/learning/courses/${course.slug}`)}
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-base text-slate-900 line-clamp-1">{course.title}</h4>
                  <p className="text-[10px] font-bold uppercase text-blue-500 tracking-widest mt-3">
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
