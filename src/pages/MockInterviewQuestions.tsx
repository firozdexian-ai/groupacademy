import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProcessingCard } from "@/components/ui/processing-card";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  SkipForward,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const INTERVIEW_ANALYSIS_STAGES = [
  { progress: 10, message: "Synthesizing vocal patterns..." },
  { progress: 35, message: "Evaluating technical logic..." },
  { progress: 60, message: "Benchmarking against industry standards..." },
  { progress: 85, message: "Gemini AI: Compiling strategic feedback..." },
  { progress: 95, message: "Finalizing performance score..." },
];

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

interface Interview {
  id: string;
  email: string;
  job_title: string | null;
  company_name: string | null;
  questions: Question[];
  answers: Answer[] | null;
  status: string;
  talent_id: string | null;
}

export default function MockInterviewQuestions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [questionStartTime]);

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase.from("mock_interviews").select("*").eq("id", id).single();
      if (error) throw error;
      if (data.status === "completed") {
        navigate(`/mock-interview/results/${id}`, { replace: true });
        return;
      }

      const questions = (data.questions as any) || [];
      const existingAnswers = (data.answers as any) || [];

      setInterview({ ...data, questions, answers: existingAnswers });
      setAnswers(existingAnswers);
      if (existingAnswers.length > 0 && existingAnswers.length < questions.length) {
        setCurrentIndex(existingAnswers.length);
      }
      setQuestionStartTime(Date.now());
    } catch (err: any) {
      setLoadError("Handshake failed. The session may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = useCallback(
    async (newAnswers: Answer[]) => {
      if (!id) return;
      await supabase
        .from("mock_interviews")
        .update({ answers: newAnswers as any })
        .eq("id", id);
    },
    [id],
  );

  const handleNext = async (skip = false) => {
    if (!interview) return;
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const newAnswer: Answer = {
      question_id: interview.questions[currentIndex].id,
      answer: skip ? "" : currentAnswer.trim(),
      time_taken_seconds: timeTaken,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    await saveProgress(updatedAnswers);

    if (currentIndex < interview.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentAnswer("");
      setQuestionStartTime(Date.now());
      setElapsedTime(0);
    } else {
      if (interview.talent_id) {
        setIsAnalyzing(true);
        try {
          const { error } = await supabase.functions.invoke("analyze-mock-interview", { body: { interviewId: id } });
          if (error) throw error;
          navigate(`/mock-interview/results/${id}`);
        } catch (err: any) {
          setAnalysisError("AI linkage failure. Retrying session...");
          setIsAnalyzing(false);
        }
      } else {
        navigate(`/mock-interview/capture/${id}`);
      }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Terminal</p>
      </div>
    );

  if (isAnalyzing)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <ProcessingCard
            title="Synthesizing Interview Performance"
            stages={INTERVIEW_ANALYSIS_STAGES}
            duration={45000}
            error={analysisError}
            onRetry={() => handleNext(false)}
          />
        </main>
        <Footer />
      </div>
    );

  if (loadError)
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState type="server" title="Sync Failed" description={loadError} onRetry={loadInterview} />
      </div>
    );

  const currentQuestion = interview!.questions[currentIndex];
  const progress = (currentIndex / interview!.questions.length) * 100;
  const isLastQuestion = currentIndex === interview!.questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        {/* Session Header */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest"
                >
                  {interview?.job_title || "Standardized Role"}
                </Badge>
                <div className="h-1 w-1 rounded-full bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Active Session
                </span>
              </div>
              <h2 className="text-sm font-bold text-muted-foreground italic">
                Simulation at {interview?.company_name || "Academy Partner"}
              </h2>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 rounded-2xl border border-border/40">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-black tabular-nums text-sm">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Curriculum Coverage</span>
              <span>
                {currentIndex + 1} / {interview?.questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-1.5 bg-primary/10" />
          </div>
        </header>

        {/* Neural Question Card */}
        <Card className="rounded-[40px] border-border/40 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="p-8 md:p-12 pb-4">
            <Badge className="w-fit mb-4 bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
              {currentQuestion.category.replace("_", " ")}
            </Badge>
            <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter leading-tight text-foreground/90">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 md:p-12 pt-0 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Your Professional Narrative
              </Label>
              <Textarea
                placeholder="Structure your answer using specific metrics and results..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="min-h-[250px] rounded-3xl border-border/40 bg-background/50 focus-visible:ring-primary/20 text-lg p-6 resize-none leading-relaxed"
                autoFocus
              />
              <div className="flex justify-between px-2 pt-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Minimum 50 characters recommended for AI depth
                </p>
                <p
                  className={cn(
                    "text-[10px] font-black tabular-nums",
                    currentAnswer.length > 50 ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {currentAnswer.length} CHARS
                </p>
              </div>
            </div>

            <div className="p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl flex gap-4 items-start">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                <span className="font-black uppercase tracking-tighter text-primary mr-1 not-italic">Neural Tip:</span>
                Implement the <strong>STAR</strong> framework (Situation, Task, Action, Result) to maximize your
                communication and logic scores.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Controls */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="rounded-xl h-12 font-black uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous Module
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowSkipDialog(true)}
              className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-border/40"
            >
              <SkipForward className="mr-2 h-4 w-4 text-muted-foreground" /> Skip Sequence
            </Button>
            <Button
              onClick={() => handleNext(false)}
              disabled={!currentAnswer.trim() || currentAnswer.length < 5}
              className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Finalize Simulation
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" /> Commit Answer
                </>
              )}
            </Button>
          </div>
        </footer>

        {/* Global Progress Track */}
        <div className="flex justify-center gap-3 pt-8">
          {interview.questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                idx < currentIndex
                  ? "w-8 bg-emerald-500"
                  : idx === currentIndex
                    ? "w-12 bg-primary shadow-lg shadow-primary/40"
                    : "w-4 bg-muted",
              )}
            />
          ))}
        </div>
      </main>

      <Footer />

      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent className="rounded-[32px] border-border/40 p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase">
              Skip logic branch?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Neutralizing this question will leave a data gap in your final performance report. Your selection
              percentage may be capped at 80%. Proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-2xl font-black uppercase text-[10px] tracking-widest">
              Resume Logic
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSkipDialog(false);
                handleNext(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Confirm Skip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
