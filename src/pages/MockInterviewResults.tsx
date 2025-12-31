import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Share2, 
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Briefcase,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { MockInterviewPDFTemplate } from "@/components/mock-interview/MockInterviewPDFTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";

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

const performanceLevelColors: Record<string, string> = {
  needs_work: "bg-red-500",
  developing: "bg-orange-500",
  competent: "bg-yellow-500",
  strong: "bg-emerald-500",
  excellent: "bg-green-500"
};

const performanceLevelLabels: Record<string, string> = {
  needs_work: "Needs Work",
  developing: "Developing",
  competent: "Competent",
  strong: "Strong",
  excellent: "Excellent"
};

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  estimated_hours: number | null;
  thumbnail_url: string | null;
}

export default function MockInterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  const loadInterview = async () => {
    setLoadError(null);
    try {
      const result = await withTimeout(
        (async () => {
          const { data, error } = await supabase
            .from("mock_interviews")
            .select("*")
            .eq("id", id)
            .single();
          return { data, error };
        })(),
        TIMEOUTS.DEFAULT,
        "Loading results timed out"
      );

      const { data, error } = result;

      if (error) throw error;
      
      if (data.status !== "completed") {
        toast.error("This interview is not yet completed");
        navigate("/mock-interview");
        return;
      }

      setInterview({
        ...data,
        questions: (data.questions as unknown as Question[]) || [],
        answers: (data.answers as unknown as Answer[]) || [],
        ai_feedback: data.ai_feedback as unknown as AIFeedback | null,
        strengths: data.strengths || [],
        improvement_areas: data.improvement_areas || []
      });

      // Load recommended courses based on profession
      if (data.profession_category_id) {
        loadRecommendedCourses(data.profession_category_id);
      }
    } catch (error: any) {
      console.error("Error loading interview:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to load interview results.";
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("mock-interview-pdf-content");
      if (!element) throw new Error("PDF template not found");

      element.style.display = "block";
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `mock-interview-${interview?.full_name?.replace(/\s+/g, "-").toLowerCase() || "results"}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async (platform: string) => {
    const shareText = `I just completed an AI Mock Interview and scored ${interview?.selection_percentage}%! Check out GroUp Academy's Mock Interview tool.`;
    const shareUrl = window.location.href;

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    };

    window.open(urls[platform], "_blank");
  };

  const getQuestionById = (questionId: string) => {
    return interview?.questions.find(q => q.id === questionId);
  };

  const getAnswerById = (questionId: string) => {
    return interview?.answers.find(a => a.question_id === questionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <RetryErrorCard
              type={getErrorType({ message: loadError })}
              description={loadError}
              onRetry={() => { setLoading(true); loadInterview(); }}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This interview doesn't exist or results are not available.
              </p>
              <Button onClick={() => navigate("/mock-interview")}>
                Start New Interview
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const selectionPercentage = interview.selection_percentage || 0;
  const performanceLevel = interview.performance_level || "needs_work";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
          {interview.job_title && (
            <p className="text-muted-foreground">
              {interview.job_title}
              {interview.company_name && ` at ${interview.company_name}`}
            </p>
          )}
        </div>

        {/* Selection Percentage Card */}
        <Card className="mb-6 overflow-hidden">
          <div className={`h-2 ${performanceLevelColors[performanceLevel]}`} />
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Score Gauge */}
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-muted"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={`${selectionPercentage * 2.83} 283`}
                      className={performanceLevelColors[performanceLevel].replace("bg-", "text-")}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{selectionPercentage}%</span>
                    <span className="text-sm text-muted-foreground">Selection Score</span>
                  </div>
                </div>
              </div>

              {/* Performance Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`${performanceLevelColors[performanceLevel]} text-white px-4 py-1`}>
                    {performanceLevelLabels[performanceLevel]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {interview.difficulty} difficulty • {interview.question_count} questions
                  </span>
                </div>
                
                {interview.ai_feedback?.overall_feedback && (
                  <p className="text-muted-foreground">
                    {interview.ai_feedback.overall_feedback}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interview.strengths && interview.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {interview.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No strengths identified</p>
              )}
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interview.improvement_areas && interview.improvement_areas.length > 0 ? (
                <ul className="space-y-2">
                  {interview.improvement_areas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No improvement areas identified</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interview Tips */}
        {interview.ai_feedback?.interview_tips && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Interview Tips for This Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{interview.ai_feedback.interview_tips}</p>
            </CardContent>
          </Card>
        )}

        {/* Question-by-Question Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Question-by-Question Feedback
            </CardTitle>
            <CardDescription>
              Detailed analysis of each of your responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {interview.ai_feedback?.question_feedback?.map((feedback, idx) => {
              const question = getQuestionById(feedback.question_id);
              const answer = getAnswerById(feedback.question_id);
              
              return (
                <div key={feedback.question_id} className="space-y-3">
                  {idx > 0 && <Separator />}
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Q{idx + 1}</Badge>
                        {question && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {question.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mb-2">{question?.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        feedback.score >= 8 ? "bg-green-500" :
                        feedback.score >= 6 ? "bg-yellow-500" :
                        feedback.score >= 4 ? "bg-orange-500" :
                        "bg-red-500"
                      }`}>
                        {feedback.score}
                      </div>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>

                  {/* User's Answer */}
                  {answer && answer.answer && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                      <p className="text-sm">{answer.answer}</p>
                      {answer.time_taken_seconds > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Time taken: {Math.floor(answer.time_taken_seconds / 60)}m {answer.time_taken_seconds % 60}s
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Feedback */}
                  <div className="pl-4 border-l-2 border-primary/30">
                    <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                    
                    {feedback.missed_points && feedback.missed_points.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Points you could have mentioned:</p>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          {feedback.missed_points.map((point, i) => (
                            <li key={i}>• {point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.improvement_tips && (
                      <p className="text-xs text-primary mt-2">
                        <strong>Tip:</strong> {feedback.improvement_tips}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Share:</span>
            <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")}>
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("linkedin")}>
              LinkedIn
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>
              Twitter
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
            <Button onClick={() => navigate("/mock-interview/setup")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New Interview
            </Button>
          </div>
        </div>

        {/* Next Steps - Apply for Jobs */}
        <Card className="border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10 mb-4">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Ready to Apply? Browse Job Openings</h3>
                  <p className="text-sm text-muted-foreground">
                    You've practiced - now put your skills to the test! Explore curated job opportunities from our partner companies.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/jobs")} className="shrink-0">
                Browse Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Build Portfolio CTA */}
        <Card className="border-primary/20 bg-primary/5 mb-4">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Stand Out with a Digital Portfolio</h3>
                  <p className="text-sm text-muted-foreground">
                    Complement your interview skills with a professional portfolio that showcases your achievements.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/portfolio-request")} className="shrink-0">
                Get Your Portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Courses */}
        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="py-6">
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Recommended Courses for You</h3>
              <p className="text-sm text-muted-foreground">
                Boost your interview skills with these personalized recommendations.
              </p>
            </div>
            
            {loadingCourses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recommendedCourses.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                {recommendedCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.slug}`)}
                    className="cursor-pointer rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
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
                  </div>
                ))}
              </div>
            ) : null}
            
            <Button variant="secondary" onClick={() => navigate("/courses")} className="w-full sm:w-auto">
              Explore All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Hidden PDF Template */}
      <div style={{ display: "none" }}>
        <MockInterviewPDFTemplate interview={interview} />
      </div>
    </div>
  );
}
