import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useDataFetch";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  display_order: number;
}

export default function Quiz() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [slug]);

  const loadQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        TIMEOUTS.AUTH,
        "Authentication timed out"
      );
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get student profile
      const { data: student } = await withTimeout(
        Promise.resolve(
          supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading profile timed out"
      );

      if (!student) {
        toast.error("Student profile not found");
        navigate("/my-learning");
        return;
      }

      setStudentId(student.id);

      // Get course details
      const { data: courseData, error: courseError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("content")
            .select("*")
            .eq("slug", slug)
            .single()
        ),
        TIMEOUTS.DEFAULT,
        "Loading course timed out"
      );

      if (courseError || !courseData) {
        toast.error("Course not found");
        navigate("/courses");
        return;
      }

      if (!courseData.quiz_enabled) {
        toast.error("Quiz is not available for this course");
        navigate(`/learn/${slug}`);
        return;
      }

      // Check enrollment
      const { data: enrollment } = await withTimeout(
        Promise.resolve(
          supabase
            .from("enrollments")
            .select("id, status")
            .eq("student_id", student.id)
            .eq("content_id", courseData.id)
            .single()
        ),
        TIMEOUTS.DEFAULT,
        "Checking enrollment timed out"
      );

      if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
        toast.error("You must be enrolled to take this quiz");
        navigate(`/courses/${slug}`);
        return;
      }

      setEnrollmentId(enrollment.id);
      setCourse(courseData);

      // Load questions
      const { data: questionsData, error: questionsError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("quiz_questions")
            .select("*")
            .eq("content_id", courseData.id)
            .order("display_order")
        ),
        TIMEOUTS.DEFAULT,
        "Loading questions timed out"
      );

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        toast.error("No questions available for this quiz");
        navigate(`/learn/${slug}`);
        return;
      }

      setQuestions(questionsData);
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      const errorMessage = error.message || "Failed to load quiz";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      // Calculate score
      let correctCount = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      const totalQuestions = questions.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const passThreshold = course.pass_threshold || 70;
      const isPassed = percentage >= passThreshold;

      setScore(correctCount);
      setPassed(isPassed);
      setShowResults(true);

      // Save quiz attempt
      const { error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          enrollment_id: enrollmentId,
          student_id: studentId,
          content_id: course.id,
          score: correctCount,
          total_questions: totalQuestions,
          passed: isPassed,
          answers: answers,
        });

      if (attemptError) throw attemptError;

      // Update enrollment status to completed if passed
      if (isPassed) {
        const { error: updateError } = await supabase
          .from("enrollments")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", enrollmentId);

        if (updateError) throw updateError;
      }

      toast.success(isPassed ? "Congratulations! You passed!" : "Quiz submitted successfully");
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
              <div className="flex justify-between pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorState
          type="generic"
          title="Failed to Load Quiz"
          description={loadError}
          onRetry={loadQuiz}
        />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Show coming soon message if no questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Quiz Coming Soon</CardTitle>
              <CardDescription>
                The quiz for this course is being prepared. Check back soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Our team is creating engaging quiz questions to test your learning.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/learn/${slug}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/my-learning")}
                >
                  My Learning Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {passed ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-destructive" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {passed ? "Congratulations!" : "Keep Learning"}
              </CardTitle>
              <CardDescription>
                {passed 
                  ? "You have successfully completed the assessment"
                  : "You need more practice to pass this assessment"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold">{score}/{questions.length}</p>
                <p className="text-xl text-muted-foreground">{percentage}%</p>
                <p className="text-sm text-muted-foreground">
                  Pass threshold: {course.pass_threshold || 70}%
                </p>
              </div>

              <div className="space-y-3">
                {passed && (
                  <Button className="w-full" onClick={() => navigate(`/report-card/${enrollmentId}`)}>
                    View Report Card
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/learn/${slug}`)}
                >
                  Back to Course
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/my-learning")}
                >
                  My Learning Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${slug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {["A", "B", "C", "D"].map((option) => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question];
                return (
                  <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} />
                    <Label htmlFor={`${currentQuestion.id}-${option}`} className="flex-1 cursor-pointer">
                      <span className="font-semibold mr-2">{option}.</span>
                      {optionText as string}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button onClick={() => setCurrentIndex(prev => prev + 1)}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
