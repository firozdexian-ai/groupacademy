import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  getStudentIdByUserIdStrict,
  getContentBySlugMaybe,
  getEnrollmentForStudentAndContent,
  listQuizQuestionsByContentOrdered,
  insertQuizAttempt,
  updateEnrollmentRow,
} from "@/domains/learning/repo/learningRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

// Type definition for single quiz question
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
    if (slug) loadQuiz();
  }, [slug]);

  const loadQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate("/auth");

      // 1. Fetch Student Context
      let student: { id: string } | null = null;
      try {
        student = { id: await getStudentIdByUserIdStrict(user.id) };
      } catch {
        throw new Error("Academic Identity Not Found");
      }
      setStudentId(student.id);

      // 2. Fetch Course Context
      let courseData: any;
      try {
        courseData = await getContentBySlugMaybe(slug!);
      } catch {
        throw new Error("Blueprint Missing");
      }
      if (!courseData) throw new Error("Blueprint Missing");
      if (!courseData.quiz_enabled) return navigate(`/learn/${slug}`);

      // 3. Verify Enrollment Integrity
      let enrollment: { id: string; status: string } | null = null;
      try {
        enrollment = await getEnrollmentForStudentAndContent(student.id, courseData.id);
      } catch {
        return navigate(`/courses/${slug}`);
      }
      if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
        return navigate(`/courses/${slug}`);
      }

      setEnrollmentId(enrollment.id);
      setCourse(courseData);

      // 4. Fetch Logic Nodes (Questions)
      const questionsData = await listQuizQuestionsByContentOrdered(courseData.id);
      if (questionsData) setQuestions(questionsData as any);
    } catch (error: any) {
      setLoadError(error.message || "Logic Fetch Failed");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      return toast.error(`Incomplete Nodes: ${unanswered.length} items remaining.`);
    }

    setSubmitting(true);
    try {
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) correctCount++;
      });

      const percentage = Math.round((correctCount / questions.length) * 100);
      const isPassed = percentage >= (course.pass_threshold || 70);

      // CTO FIX: Explicitly typed payload to resolve TS2769 Overload Error
      const attemptData: Database["public"]["Tables"]["quiz_attempts"]["Insert"] = {
        enrollment_id: enrollmentId as string,
        student_id: studentId as string,
        content_id: course.id,
        score: correctCount,
        total_questions: questions.length,
        passed: isPassed,
        answers: answers as any, // Cast to Json-compatible type
      };

      const { error: attemptError } = await supabase.from("quiz_attempts").insert(attemptData);

      if (attemptError) throw attemptError;

      if (isPassed) {
        await supabase
          .from("enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", enrollmentId);
      }

      setScore(correctCount);
      setPassed(isPassed);
      setShowResults(true);
      toast.success(isPassed ? "Assessment Optimized: You Passed." : "Logic Sequence Finished.");
    } catch (e) {
      console.error("Submission failed:", e);
      toast.error("Handshake Error: Failed to log results.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Initializing Evaluation Module
        </p>
      </div>
    );

  if (loadError)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorState type="server" title="Access Denied" description={loadError} onRetry={loadQuiz} />
      </div>
    );

  if (questions.length === 0)
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col">
        <div className="flex-1 container max-w-xl mx-auto px-6 flex items-center justify-center">
          <Card className="rounded-[40px] border-border/40 shadow-2xl p-10 text-center space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-primary/40" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">Module Incomplete</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                The assessment nodes for this course are currently being calibrated.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              onClick={() => navigate(`/learn/${slug}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Course
            </Button>
          </Card>
        </div>
      </div>
    );

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col py-20">
        <div className="container max-w-2xl mx-auto px-6">
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
            <div className={cn("p-12 text-center space-y-6", passed ? "bg-emerald-500/[0.03]" : "bg-rose-500/[0.03]")}>
              <div className="relative mx-auto w-24 h-24">
                <div
                  className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-20",
                    passed ? "bg-emerald-500" : "bg-rose-500",
                  )}
                />
                <div
                  className={cn(
                    "relative h-24 w-24 rounded-[32px] flex items-center justify-center shadow-2xl",
                    passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white",
                  )}
                >
                  {passed ? <Trophy className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase">
                  {passed ? "Qualified" : "Iteration Required"}
                </h2>
              </div>
            </div>
            <CardContent className="p-12 space-y-10">
              <div className="flex justify-between items-center bg-muted/30 p-8 rounded-[32px] border border-border/20">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Raw Score</p>
                  <p className="text-3xl font-black tracking-tight">
                    {score} <span className="text-sm font-medium opacity-40">/ {questions.length}</span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Index</p>
                  <p
                    className={cn("text-3xl font-black tracking-tight", passed ? "text-emerald-600" : "text-rose-600")}
                  >
                    {percentage}%
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {passed && (
                  <Button
                    className="h-14 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20"
                    onClick={() => navigate(`/report-card/${enrollmentId}`)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Certificate
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  onClick={() => navigate(`/learn/${slug}`)}
                >
                  Course Hub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col py-12 selection:bg-primary/10">
      <div className="container max-w-3xl mx-auto px-6">
        <header className="mb-10 space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
              onClick={() => navigate(`/learn/${slug}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Abort Session
            </Button>
            <Badge
              variant="secondary"
              className="bg-background border-border/40 text-[10px] font-black uppercase tracking-widest px-4 py-1"
            >
              Node {currentIndex + 1} / {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5" />
        </header>

        <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-10 pb-6">
            <CardTitle className="text-2xl font-black tracking-tight leading-tight">{currentQ.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-10">
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(v) => handleAnswerChange(currentQ.id, v)}
              className="grid gap-3"
            >
              {["A", "B", "C", "D"].map((opt) => {
                const text = currentQ[`option_${opt.toLowerCase()}` as keyof Question];
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <Label
                    key={opt}
                    htmlFor={`opt-${opt}`}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                      isSelected
                        ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                        : "border-muted hover:border-primary/20 hover:bg-muted/30",
                    )}
                  >
                    <RadioGroupItem value={opt} id={`opt-${opt}`} className="sr-only" />
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl border-2 flex items-center justify-center text-[10px] font-black transition-colors",
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-muted text-muted-foreground group-hover:border-primary/40",
                      )}
                    >
                      {opt}
                    </div>
                    <span className="text-sm font-medium leading-snug">{text as string}</span>
                  </Label>
                );
              })}
            </RadioGroup>

            <footer className="flex justify-between items-center pt-6 border-t border-border/10">
              <Button
                variant="ghost"
                className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex === questions.length - 1 ? (
                <Button
                  className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Finalize Assessment"}
                </Button>
              ) : (
                <Button
                  className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  Next Node <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function handleAnswerChange(id: string, val: string) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }
}
