import { useEffect, useState } from "react";
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
  Loader2
} from "lucide-react";
import { toast } from "sonner";

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
  profession_categories?: {
    name: string;
  };
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
  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (id) loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from("career_assessments")
        .select(`
          *,
          profession_categories (name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Assessment not found");
        navigate("/career-assessment");
        return;
      }

      setAssessment(data);

      // Trigger AI analysis if not already done
      if (!data.ai_analysis) {
        triggerAIAnalysis(data.id);
      }
    } catch (error) {
      console.error("Error loading assessment:", error);
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const triggerAIAnalysis = async (assessmentId: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-career-assessment", {
        body: { assessmentId }
      });

      if (error) {
        console.error("AI analysis error:", error);
        toast.error("Could not generate AI insights. You can refresh to try again.");
        return;
      }

      if (data?.analysis) {
        setAssessment(prev => prev ? {
          ...prev,
          ai_analysis: data.analysis,
          improvement_areas: data.analysis.improvement_areas || []
        } : null);
        toast.success("AI analysis complete!");
      }
    } catch (error) {
      console.error("Error calling AI analysis:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = async () => {
    const shareText = `I scored ${assessment?.percentage}% on the Career Readiness Scorecard! 🎯 Check your career readiness at GroUp Academy.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Career Readiness Score",
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    toast.info("PDF download coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!assessment) {
    return null;
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
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Result
            </Button>
            <Button onClick={() => navigate("/career-assessment")} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake Assessment
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
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-4">
                      Personalized recommendations are being generated...
                    </p>
                    <Button variant="outline" size="sm" onClick={() => id && triggerAIAnalysis(id)}>
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

            {/* Course Recommendations CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="py-8 text-center">
                <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Ready to Level Up?</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Explore our courses designed to help you improve your career readiness and achieve your goals.
                </p>
                <Button onClick={() => navigate("/courses")}>
                  Browse Courses
                </Button>
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
    </div>
  );
}
