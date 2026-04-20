import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SalaryAnalysisPDFTemplate } from "@/components/salary-analysis/SalaryAnalysisPDFTemplate";
import { generateSalaryAnalysisPDF } from "@/lib/salaryPdfGenerator";
import {
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Share2,
  Briefcase,
  FileText,
  Loader2,
  Sparkles,
  ShieldCheck,
  Globe,
  Zap,
  RefreshCw,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  estimated_hours: number | null;
  thumbnail_url: string | null;
}

const SalaryAnalysisResults = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const fetchAnalysis = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("salary_analyses")
        .select("*, profession_categories(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnalysis(data);

      if (data.profession_category_id) {
        loadRecommendedCourses(data.profession_category_id);
      }
    } catch (err: any) {
      setLoadError("Results node currently unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedCourses = async (catId: string) => {
    setLoadingCourses(true);
    const { data } = await supabase
      .from("content")
      .select("id, title, slug, description, estimated_hours, thumbnail_url")
      .eq("profession_line_id", catId)
      .eq("is_published", true)
      .limit(3);
    if (data) setRecommendedCourses(data);
    setLoadingCourses(false);
  };

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const formatSalary = (amount: number) => new Intl.NumberFormat("en-US").format(amount);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const filename = `valuation-${analysis.full_name.split(" ")[0]}-${id?.slice(0, 5)}.pdf`;
    const success = await generateSalaryAnalysisPDF("salary-analysis-pdf-content", filename);
    if (success) toast({ title: "Intelligence Exported." });
    setIsGeneratingPDF(false);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4">
          Decrypting Market Logic
        </p>
      </div>
    );

  if (loadError || !analysis?.ai_analysis)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <RetryErrorCard type="server" description={loadError || "Analysis missing"} onRetry={fetchAnalysis} />
      </div>
    );

  const { ai_analysis: ai } = analysis;
  const salaryRange = ai.market_salary_range;
  const skills = ai.skills_analysis;
  const insights = ai.market_insights;

  return (
    <div className="min-h-screen bg-muted/20 selection:bg-primary/10">
      <Navbar />

      <main className="container max-w-5xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-700">
        {/* Executive Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-[0.2em]"
            >
              <Sparkles className="w-3 h-3 mr-2" /> Valuation Artifact Optimized
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
              Market Intelligence
            </h1>
            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground uppercase tracking-tight">
              <Briefcase className="h-4 w-4 text-primary" /> {analysis.job_title || "Professional Role"}
              <span className="opacity-20">•</span>
              <Globe className="h-4 w-4" /> Global Market Node
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-border/40"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export
              PDF
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Logic Score HUD */}
            <Card className="rounded-[40px] border-border/40 shadow-2xl bg-card overflow-hidden">
              <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="relative h-32 w-32 shrink-0">
                  <div className="absolute inset-0 rounded-full border-[8px] border-primary/10" />
                  <div
                    className="absolute inset-0 rounded-full border-[8px] border-primary border-t-transparent -rotate-45"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${ai.overall_readiness_score}%, 0 ${ai.overall_readiness_score}%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black">{ai.overall_readiness_score}%</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 text-primary">
                      Readiness
                    </span>
                  </div>
                </div>
                <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-xl font-black uppercase tracking-tight">Strategic Summary</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium italic">"{ai.summary}"</p>
                </div>
              </CardContent>
            </Card>

            {/* Salary Grid Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Minimum Node",
                  val: salaryRange?.min_monthly,
                  color: "bg-muted/30 border-border/40 text-muted-foreground",
                },
                {
                  label: "Median Target",
                  val: salaryRange?.median_monthly,
                  color: "bg-primary/5 border-primary/20 text-primary",
                },
                {
                  label: "Alpha Tier",
                  val: salaryRange?.max_monthly,
                  color: "bg-emerald-500/5 border-emerald-500/20 text-emerald-600",
                },
              ].map((node, i) => (
                <Card
                  key={i}
                  className={cn("rounded-3xl border-2 overflow-hidden transition-all hover:scale-[1.02]", node.color)}
                >
                  <CardContent className="p-6 text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{node.label}</p>
                    <p className="text-3xl font-black tracking-tighter">${formatSalary(node.val)}</p>
                    <p className="text-[10px] font-bold opacity-40">Monthly USD</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Logic Gaps (Skills) */}
            <Card className="rounded-[40px] border-border/40 shadow-xl bg-card overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-border/10 bg-muted/20">
                <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Verification Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Validated Core Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skills?.matching_skills?.map((s: string) => (
                        <Badge
                          key={s}
                          className="bg-emerald-500/10 text-emerald-700 border-none rounded-lg font-bold px-3 py-1.5"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" /> Growth Nodes Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skills?.missing_skills?.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="border-amber-500/30 text-amber-700 rounded-lg font-bold px-3 py-1.5"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {skills?.recommendations && (
                  <div className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Strategic Recommendations
                    </p>
                    <ul className="space-y-3">
                      {skills.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm font-medium leading-tight">
                          <Zap className="h-4 w-4 text-primary shrink-0" /> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Negotiation Protocol */}
            <Card className="rounded-[40px] border-border/40 shadow-xl bg-card overflow-hidden">
              <CardHeader className="p-8 pb-4 bg-amber-500/[0.03] border-b border-amber-500/10">
                <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" /> Negotiation Protocols
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {ai.negotiation_tips?.map((tip: any, i: number) => (
                  <div key={i} className="space-y-2 group">
                    <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                      {tip.tip}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border/40 pl-4">
                      {tip.rationale}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Upsell Sidebar HUD */}
          <aside className="space-y-8">
            <Card className="rounded-[32px] border-primary/20 bg-primary/5 shadow-2xl overflow-hidden sticky top-24">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                  <h4 className="font-black uppercase tracking-widest text-[10px] text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Skill Injection
                  </h4>
                  <p className="text-xs font-medium leading-relaxed">
                    Closing identified growth nodes will increase your Market Node valuation by up to 25%.
                  </p>
                </div>

                <div className="space-y-4">
                  {loadingCourses ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  ) : (
                    recommendedCourses.map((c) => (
                      <Link key={c.id} to={`/courses/${c.slug}`} className="block group">
                        <div className="p-4 rounded-2xl bg-background border border-border/40 hover:border-primary/40 transition-all shadow-sm">
                          <p className="text-[10px] font-black uppercase text-primary mb-1">Target Skill Unlocked</p>
                          <h5 className="font-bold text-sm line-clamp-1 group-hover:underline underline-offset-4">
                            {c.title}
                          </h5>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <Button
                  asChild
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                >
                  <Link to="/courses">
                    Explore Academy Hub <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-border/40 bg-card p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market Pulse</p>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none uppercase text-[8px] font-black">
                  {insights?.demand_level} Demand
                </Badge>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 border-b pb-2">
                  Industry Trends
                </p>
                {insights?.industry_trends?.map((t: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start text-[11px] font-medium leading-tight">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>

        {/* Global Action Nodes */}
        <Separator className="bg-border/40" />
        <div className="grid md:grid-cols-2 gap-4 pb-20">
          <Button
            variant="ghost"
            asChild
            className="h-16 rounded-[24px] bg-muted/30 border border-border/40 font-black uppercase text-[10px] tracking-widest"
          >
            <Link to="/app/feed">
              <RefreshCw className="h-4 w-4 mr-2" /> Return to Sequence Feed
            </Link>
          </Button>
          <Button
            variant="ghost"
            asChild
            className="h-16 rounded-[24px] bg-primary/5 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest"
          >
            <Link to="/portfolio-request">
              <FileText className="h-4 w-4 mr-2" /> Engineering Artifact (Portfolio)
            </Link>
          </Button>
        </div>
      </main>

      <Footer />

      {/* Serialization Engine */}
      <div className="hidden">
        <SalaryAnalysisPDFTemplate analysis={analysis} />
      </div>
    </div>
  );
};

export default SalaryAnalysisResults;
