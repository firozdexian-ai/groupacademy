import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  CheckCircle,
  SkipForward,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - questionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [questionStartTime]);

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase
        .from("mock_interviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data.status === "completed") {
        navigate(`/mock-interview/results/${id}`);
        return;
      }

      const questions = (data.questions as unknown as Question[]) || [];
      const existingAnswers = (data.answers as unknown as Answer[]) || [];
      
      setInterview({
        id: data.id,
        email: data.email,
        job_title: data.job_title,
        company_name: data.company_name,
        questions,
        answers: existingAnswers,
        status: data.status || "in_progress"
      });
      setAnswers(existingAnswers);
      
      // Resume from where user left off
      if (existingAnswers.length > 0 && existingAnswers.length < questions.length) {
        setCurrentIndex(existingAnswers.length);
      }
      
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error loading interview:", error);
      toast.error("Failed to load interview");
      navigate("/mock-interview");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveProgress = useCallback(async (newAnswers: Answer[]) => {
    if (!id) return;
    try {
      await supabase
        .from("mock_interviews")
        .update({ answers: newAnswers as any })
        .eq("id", id);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [id]);

  const handleNext = async (skip = false) => {
    if (!interview) return;

    const currentQuestion = interview.questions[currentIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    const newAnswer: Answer = {
      question_id: currentQuestion.id,
      answer: skip ? "" : currentAnswer.trim(),
      time_taken_seconds: timeTaken
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    await saveProgress(updatedAnswers);

    if (currentIndex < interview.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer("");
      setQuestionStartTime(Date.now());
      setElapsedTime(0);
    } else {
      // All questions answered, navigate to lead capture
      navigate(`/mock-interview/capture/${id}`);
    }
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const confirmSkip = () => {
    setShowSkipDialog(false);
    handleNext(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && answers.length > currentIndex - 1) {
      // Remove last answer and go back
      const previousAnswer = answers[currentIndex - 1];
      setCurrentAnswer(previousAnswer?.answer || "");
      setAnswers(answers.slice(0, -1));
      setCurrentIndex(currentIndex - 1);
      setQuestionStartTime(Date.now());
      setElapsedTime(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading interview...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!interview || !interview.questions?.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Interview Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This interview doesn't exist or has no questions.
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

  const currentQuestion = interview.questions[currentIndex];
  const progress = ((currentIndex) / interview.questions.length) * 100;
  const isLastQuestion = currentIndex === interview.questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        {/* Header with progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {interview.job_title && (
                <Badge variant="outline" className="font-normal">
                  {interview.job_title}
                </Badge>
              )}
              {interview.company_name && (
                <span className="text-sm text-muted-foreground">
                  at {interview.company_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} / {interview.questions.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-3 capitalize">
                  {currentQuestion.category.replace('_', ' ')}
                </Badge>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <span className="text-sm font-medium">Q{currentIndex + 1}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Your Answer
                </label>
                <Textarea
                  placeholder="Type your answer here... Be thorough and provide specific examples where possible."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[200px] resize-none text-base leading-relaxed"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-right">
                  {currentAnswer.length} characters
                </p>
              </div>

              {/* Tips */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> Use the STAR method (Situation, Task, Action, Result) 
                  for behavioral questions to structure your response effectively.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>
            <Button
              onClick={() => handleNext(false)}
              disabled={!currentAnswer.trim()}
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish Interview
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {interview.questions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx < currentIndex
                  ? "bg-primary"
                  : idx === currentIndex
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </main>

      <Footer />

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip this question?</AlertDialogTitle>
            <AlertDialogDescription>
              Skipping questions may negatively impact your overall score. 
              Are you sure you want to skip this question?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Answering</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkip}>
              Skip Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
