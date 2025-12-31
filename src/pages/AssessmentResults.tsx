import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Twitter
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ScorecardPDFTemplate } from "@/components/assessment/ScorecardPDFTemplate";
import { generateScorecardPDF } from "@/lib/assessmentPdfGenerator";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";

interface Assessment {
  id: string;
  full_name: string;
  email: string;
  percentage: number;
  readiness_level: string;
  total_score: number;
  max_score: number;
  created_at: string;
  ai_analysis: any;
  improvement_areas: string[];
  profession_category_id: string;
  profession_categories?: {
    name: string;
  };
}

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  estimated_hours: number | null;
  thumbnail_url: string | null;
}

const readinessColors: Record<string, string> = {
  beginner: "bg-destructive/10 text-destructive",
  developing: "bg-warning/10 text-warning",
  competent: "bg-primary/10 text-primary",
  proficient: "bg-secondary/10 text-secondary",
  expert: "bg-accent/10 text-accent",
};

const readinessDescriptions: Record<string, string> = {
  beginner: "Starting your career journey - focus on building foundational skills",
  developing: "Making progress - continue developing your professional capabilities",
  competent: "Solid foundation - ready for growth opportunities",
  proficient: "Strong performer - well-positioned for advancement",
  expert: "Exceptional readiness - ready for leadership roles",
};

export default function AssessmentResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisRetryCount, setAnalysisRetryCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const maxRetries = 3;
  const hasTriggeredAnalysis = useRef(false);

  useEffect(() => {
    if (id) loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    setLoadError(null);
    
    console.log("[AssessmentResults] Loading assessment:", id);
    
    try {
      const result = await withTimeout(
        (async () => {
          const { data, error } = await supabase
            .from("career_assessments")
            .select(`
              *,
              profession_categories (name)
            `)
            .eq("id", id)
            .maybeSingle();
          return { data, error };
        })(),
        TIMEOUTS.DEFAULT,
        "Loading assessment timed out"
      );

      const { data, error } = result;

      if (error) {
        console.error("[AssessmentResults] Query error:", error);
        throw error;
      }
      
      if (!data) {
        console.log("[AssessmentResults] Assessment not found");
        setLoadError("Assessment not found. It may have expired or been deleted.");
        setLoading(false);
        return;
      }

      console.log("[AssessmentResults] Loaded assessment:", data.id, "AI analysis:", !!data.ai_analysis);
      setAssessment(data);

      // Load recommended courses based on profession
      if (data.profession_category_id) {
        loadRecommendedCourses(data.profession_category_id);
      }

      // Trigger AI analysis if not already done (only once)
      if (!data.ai_analysis && !hasTriggeredAnalysis.current) {
        hasTriggeredAnalysis.current = true;
        triggerAIAnalysis(data.id);
      }
    } catch (error: any) {
      console.error("[AssessmentResults] Error loading assessment:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to load assessment. Please try again.";
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedCourses = async (professionCategoryId: string) => {
    setLoadingCourses(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, description, estimated_hours, thumbnail_url")
        .eq("profession_line_id", professionCategoryId)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(3);

      if (error) {
        console.error("[AssessmentResults] Error loading courses:", error);
        return;
      }

      console.log("[AssessmentResults] Loaded recommended courses:", data?.length || 0);
      setRecommendedCourses(data || []);
    } catch (error) {
      console.error("[AssessmentResults] Error fetching courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const triggerAIAnalysis = async (assessmentId: string, isRetry = false) => {
    if (isRetry) {
      setAnalysisRetryCount(prev => prev + 1);
    }
    
    setAnalyzing(true);
    console.log("[AssessmentResults] Triggering AI analysis for:", assessmentId, "Retry:", analysisRetryCount);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-career-assessment", {
        body: { assessmentId }
      });

      if (error) {
        console.error("[AssessmentResults] AI analysis error:", error);
        
        // Auto-retry up to maxRetries
        if (analysisRetryCount < maxRetries - 1) {
          console.log("[AssessmentResults] Auto-retrying AI analysis...");
          setTimeout(() => triggerAIAnalysis(assessmentId, true), 2000);
          return;
        }
        
        toast.error("Could not generate AI insights. You can refresh to try again.");
        return;
      }

      if (data?.analysis) {
        console.log("[AssessmentResults] AI analysis received successfully");
        setAssessment(prev => prev ? {
          ...prev,
          ai_analysis: data.analysis,
          improvement_areas: data.analysis.improvement_areas || []
        } : null);
        toast.success("AI analysis complete!");
      }
    } catch (error) {
      console.error("[AssessmentResults] Error calling AI analysis:", error);
      
      // Auto-retry up to maxRetries
      if (analysisRetryCount < maxRetries - 1) {
        console.log("[AssessmentResults] Auto-retrying after error...");
        setTimeout(() => triggerAIAnalysis(assessmentId, true), 2000);
        return;
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualRetry = () => {
    if (id) {
      setAnalysisRetryCount(0);
      triggerAIAnalysis(id, false);
    }
  };

  const shareText = `I scored ${assessment?.percentage}% on the Career Readiness Scorecard! 🎯 Check your career readiness at GroUp Academy.`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast.success("Link copied to clipboard!");
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    
    setDownloading(true);
    try {
      await generateScorecardPDF(assessment);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <RetryErrorCard
              type={getErrorType({ message: loadError })}
              title="Unable to Load Results"
              description={loadError || "Assessment not found."}
              onRetry={loadAssessment}
            />
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate("/career-assessment")}>
                Start New Assessment
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const readinessLevel = assessment.readiness_level || "beginner";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Career Readiness Report</h1>
            <p className="text-muted-foreground">
              {assessment.profession_categories?.name || "General"} Assessment
            </p>
          </div>

          {/* Score Card */}
          <Card className="mb-6">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="8"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary stroke-current transition-all duration-1000"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                      r="42"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${assessment.percentage * 2.64} 264`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute">
                    <span className="text-4xl font-bold">{assessment.percentage}%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className={`text-sm px-4 py-1 ${readinessColors[readinessLevel]}`}>
                    {readinessLevel.charAt(0).toUpperCase() + readinessLevel.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {readinessDescriptions[readinessLevel]}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center border-t pt-6">
                <div>
                  <p className="text-2xl font-bold text-primary">{assessment.total_score}</p>
                  <p className="text-xs text-muted-foreground">Points Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{assessment.max_score}</p>
                  <p className="text-xs text-muted-foreground">Max Points</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Assessment Date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-4 justify-center">
            <Button onClick={handleDownloadPDF} variant="outline" disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloading ? "Generating..." : "Download PDF"}
            </Button>
            <Button onClick={() => navigate("/career-assessment")} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
          </div>

          {/* Social Sharing */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <Button onClick={handleCopyLink} variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={handleWhatsAppShare} variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handleLinkedInShare} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button onClick={handleTwitterShare} variant="ghost" size="sm" className="text-sky-500 hover:text-sky-600 hover:bg-sky-50">
              <Twitter className="h-4 w-4 mr-2" />
              Twitter/X
            </Button>
          </div>

          {/* Analysis Sections */}
          <div className="space-y-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.ai_analysis?.strengths ? (
                  <ul className="space-y-2">
                    {assessment.ai_analysis.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : analyzing ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing your responses...</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    AI analysis will be available soon. Check back later for detailed insights.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.ai_analysis?.improvement_areas || assessment.improvement_areas?.length > 0 ? (
                  <ul className="space-y-2">
                    {(assessment.ai_analysis?.improvement_areas || assessment.improvement_areas).map((area: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : analyzing ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Identifying improvement areas...</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    AI analysis will identify specific improvement areas based on your responses.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.ai_analysis?.recommendations ? (
                  <ul className="space-y-3">
                    {assessment.ai_analysis.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : analyzing ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground text-sm">
                      AI is analyzing your responses...
                    </p>
                    {analysisRetryCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Retry attempt {analysisRetryCount} of {maxRetries}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-4">
                      Personalized recommendations could not be generated automatically.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleManualRetry}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Career Tips */}
            {assessment.ai_analysis?.career_tips && (
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="py-6">
                  <p className="text-center italic text-muted-foreground">
                    "{assessment.ai_analysis.career_tips}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Course Recommendations */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Recommended Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : recommendedCourses.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                        onClick={() => navigate(`/courses/${course.slug}`)}
                      >
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{course.title}</h4>
                          {course.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {course.description}
                            </p>
                          )}
                          {course.estimated_hours && (
                            <span className="text-xs text-muted-foreground">
                              {course.estimated_hours}h estimated
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/courses")}>
                        View All Courses
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">Ready to Level Up?</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                      Explore our courses designed to help you improve your career readiness.
                    </p>
                    <Button onClick={() => navigate("/courses")}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer Info */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              Assessment ID: {assessment.id.slice(0, 8)}... • 
              Valid for 90 days from {new Date(assessment.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Hidden PDF Template */}
      {assessment && <ScorecardPDFTemplate assessment={assessment} />}
    </div>
  );
}