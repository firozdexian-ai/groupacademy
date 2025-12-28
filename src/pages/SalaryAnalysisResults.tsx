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
  TrendingUp, Target, Lightbulb, CheckCircle, AlertTriangle, 
  ArrowRight, Download, Share2, Briefcase, FileText, Loader2, RefreshCw
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

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
    setLoadError(null);

    try {
      const result = await withTimeout(
        (async () => {
          const { data, error } = await supabase
            .from("salary_analyses")
            .select("*, profession_categories(name)")
            .eq("id", id)
            .single();
          return { data, error };
        })(),
        TIMEOUTS.DEFAULT,
        "Loading results timed out"
      );

      const { data, error } = result;

      if (error) throw error;
      setAnalysis(data);

      // Load recommended courses based on profession
      if (data.profession_category_id) {
        loadRecommendedCourses(data.profession_category_id);
      }
    } catch (error: any) {
      console.error("Error fetching analysis:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to load results.";
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendedCourses = async (professionCategoryId: string) => {
    setLoadingCourses(true);
    try {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, slug, description, estimated_hours, thumbnail_url')
        .eq('profession_line_id', professionCategoryId)
        .eq('is_published', true)
        .limit(3);

      if (!error && data) {
        setRecommendedCourses(data);
      }
    } catch (error) {
      console.error('Error loading recommended courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-BD').format(amount);
  };

  const getPositionBadge = (positioning: string) => {
    switch (positioning) {
      case "above_market":
        return <Badge className="bg-green-500">Above Market</Badge>;
      case "below_market":
        return <Badge variant="destructive">Below Market</Badge>;
      default:
        return <Badge variant="secondary">At Market Rate</Badge>;
    }
  };

  const getDemandBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge className="bg-green-500">High Demand</Badge>;
      case "low":
        return <Badge variant="destructive">Low Demand</Badge>;
      default:
        return <Badge variant="secondary">Medium Demand</Badge>;
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const filename = `salary-analysis-${analysis.full_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      const success = await generateSalaryAnalysisPDF("salary-analysis-pdf-content", filename);
      if (success) {
        toast({ title: "PDF downloaded successfully!" });
      } else {
        toast({ title: "Failed to generate PDF", variant: "destructive" });
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your results...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Results</h2>
              <p className="text-muted-foreground mb-4">{loadError}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => { setIsLoading(true); fetchAnalysis(); }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/salary-analysis">Back</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!analysis || !analysis.ai_analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-muted-foreground mb-8">This analysis may still be processing or doesn't exist.</p>
          <Button asChild>
            <Link to="/salary-analysis">Back to Salary Analysis</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const ai = analysis.ai_analysis;
  const salaryRange = ai.market_salary_range;
  const skills = ai.skills_analysis;
  const tips = ai.negotiation_tips;
  const insights = ai.market_insights;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Salary Analysis Results</h1>
          <p className="text-muted-foreground">
            {analysis.job_title ? `For: ${analysis.job_title}` : "Job Analysis"} 
            {analysis.company_name && ` at ${analysis.company_name}`}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {getPositionBadge(ai.salary_positioning)}
            {getDemandBadge(insights?.demand_level)}
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <p className="text-lg text-center">{ai.summary}</p>
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Overall Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={ai.overall_readiness_score} className="h-4" />
              </div>
              <span className="text-3xl font-bold text-primary">{ai.overall_readiness_score}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Salary Range */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Market Salary Range
            </CardTitle>
            <CardDescription>{salaryRange?.market_context}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Minimum</p>
                <p className="text-2xl font-bold">৳{formatSalary(salaryRange?.min_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm text-muted-foreground">Median</p>
                <p className="text-2xl font-bold text-primary">৳{formatSalary(salaryRange?.median_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Maximum</p>
                <p className="text-2xl font-bold">৳{formatSalary(salaryRange?.max_monthly)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Experience Level: <Badge variant="outline">{salaryRange?.experience_level}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* Skills Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Skills Gap Analysis
            </CardTitle>
            <CardDescription>
              Skills Gap Score: {skills?.skills_gap_score}% match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Matching Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills?.matching_skills?.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  ))}
                  {(!skills?.matching_skills || skills.matching_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No matching skills identified</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills?.missing_skills?.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-amber-500 text-amber-700">
                      {skill}
                    </Badge>
                  ))}
                  {(!skills?.missing_skills || skills.missing_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skill gaps identified</p>
                  )}
                </div>
              </div>
            </div>
            {skills?.recommendations && skills.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {skills.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Negotiation Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Negotiation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tips?.map((tip: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <p className="font-medium">{tip.tip}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tip.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Plan */}
        {ai.action_plan && ai.action_plan.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Action Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {ai.action_plan.map((action: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Market Insights */}
        {insights && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="outline">
                  Growth: {insights.growth_trajectory}
                </Badge>
              </div>
              {insights.industry_trends && insights.industry_trends.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Industry Trends:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {insights.industry_trends.map((trend: string, idx: number) => (
                      <li key={idx}>• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* CTAs */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Ready to Apply?</h3>
                  <p className="text-sm text-muted-foreground">Browse job openings now</p>
                </div>
                <Button asChild>
                  <Link to="/jobs">View Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Build Your Portfolio</h3>
                  <p className="text-sm text-muted-foreground">Stand out from other candidates</p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/portfolio-request">Get Portfolio</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Courses */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Recommended Courses for You</h3>
              <p className="text-sm text-muted-foreground">
                Develop the skills employers are looking for
              </p>
            </div>
            
            {loadingCourses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recommendedCourses.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                {recommendedCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.slug}`}
                    className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                  >
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-24 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">{course.title}</h4>
                    {course.estimated_hours && (
                      <p className="text-xs text-muted-foreground">{course.estimated_hours}h estimated</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : null}
            
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link to="/courses">
                Explore All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Share/Download */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const text = `I just completed my AI Salary Analysis on GroUp Academy! My readiness score: ${ai.overall_readiness_score}%. Check out your market value too!`;
              const url = window.location.href;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const text = `I just completed my AI Salary Analysis on @GroUpAcademy! My readiness score: ${ai.overall_readiness_score}%. Discover your market value 👉`;
              const url = window.location.href;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter/X
          </Button>
        </div>

        {/* Hidden PDF Template */}
        <div style={{ display: "none" }}>
          <SalaryAnalysisPDFTemplate analysis={analysis} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SalaryAnalysisResults;
