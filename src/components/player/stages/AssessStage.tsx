import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, ClipboardCheck, XCircle, AlertCircle, Trophy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

interface AssessStageProps {
  contentId: string;
  moduleId: string;
  studentId: string | undefined;
  enrollmentId: string | undefined;
  passThreshold: number;
  onComplete: (passed: boolean, score: number) => void;
  isCompleted: boolean;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}

export function AssessStage({ 
  contentId,
  moduleId,
  studentId,
  enrollmentId,
  passThreshold,
  onComplete, 
  isCompleted 
}: AssessStageProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);

  // Fetch quiz questions for this module (or fallback to content-level questions)
  const { data: questions = [], isLoading, error: loadError, refetch } = useQueryWithTimeout({
    queryKey: ["quiz-questions", moduleId, contentId],
    queryFn: async () => {
      // First try to get module-specific questions
      let { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("module_id", moduleId)
        .order("display_order");
      
      // If no module-specific questions, fall back to content-level questions
      if (!error && (!data || data.length === 0)) {
        const fallbackResult = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("content_id", contentId)
          .is("module_id", null)
          .order("display_order");
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!moduleId && !!contentId,
    timeout: TIMEOUTS.DEFAULT,
  });

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= passThreshold;

  const handleSubmit = async () => {
    if (!allAnswered) return;

    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    // Save quiz attempt with timeout
    if (studentId && enrollmentId) {
      const attemptPassed = Math.round((correctCount / totalQuestions) * 100) >= passThreshold;
      
      try {
        await withTimeout(
          Promise.resolve(supabase.from("quiz_attempts").insert({
            student_id: studentId,
            content_id: contentId,
            enrollment_id: enrollmentId,
            answers,
            score: correctCount,
            total_questions: totalQuestions,
            passed: attemptPassed,
          })),
          TIMEOUTS.DEFAULT,
          "Saving quiz timed out"
        );
      } catch (error) {
        console.error("Error saving quiz attempt:", error);
      }

      onComplete(attemptPassed, correctCount);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setShowExplanations(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading quiz questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground mb-4">Failed to load quiz questions</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Stage 5: Assess
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Test your understanding with a short quiz (Pass: {passThreshold}%)
          </p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No quiz questions available for this module yet.</p>
            <Button onClick={() => onComplete(true, 0)} className="mt-4">
              Skip to Next Stage
            </Button>
          </CardContent>
        </Card>
      ) : submitted ? (
        /* Results View */
        <div className="space-y-6">
          <Card className={cn(
            "border-2",
            passed ? "border-green-500 bg-green-500/5" : "border-orange-500 bg-orange-500/5"
          )}>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {passed ? (
                  <Trophy className="h-16 w-16 text-green-500" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-orange-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {passed ? "Congratulations!" : "Keep Learning!"}
              </h3>
              <p className="text-4xl font-bold mb-2">
                {score}/{totalQuestions}
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                {percentage}% correct
              </p>
              <p className="text-sm text-muted-foreground">
                {passed 
                  ? "You passed! You can proceed to the next stage."
                  : `You need ${passThreshold}% to pass. Review the material and try again.`
                }
              </p>
            </CardContent>
          </Card>

          <Button 
            variant="outline" 
            onClick={() => setShowExplanations(!showExplanations)}
            className="w-full"
          >
            {showExplanations ? "Hide" : "Show"} Answer Explanations
          </Button>

          {showExplanations && (
            <div className="space-y-4">
              {questions.map((q, index) => {
                const isCorrect = answers[q.id] === q.correct_answer;
                return (
                  <Card key={q.id} className={cn(
                    "border-l-4",
                    isCorrect ? "border-l-green-500" : "border-l-red-500"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">Q{index + 1}: {q.question_text}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answer: {answers[q.id]} | Correct: {q.correct_answer}
                          </p>
                          {q.explanation && (
                            <p className="text-sm mt-2 bg-muted p-2 rounded">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!passed && (
            <Button onClick={handleRetry} className="w-full">
              Try Again
            </Button>
          )}
        </div>
      ) : (
        /* Quiz View */
        <div className="space-y-6">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm">
                Answered: {answeredCount}/{totalQuestions} questions
              </p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Question {index + 1} of {totalQuestions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{q.question_text}</p>
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                >
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof QuizQuestion;
                    return (
                      <div key={option} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                        <Label htmlFor={`${q.id}-${option}`} className="cursor-pointer flex-1">
                          <span className="font-medium">{option}.</span> {q[optionKey] as string}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Button 
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full"
            size="lg"
          >
            {allAnswered ? "Submit Quiz" : `Answer all questions (${answeredCount}/${totalQuestions})`}
          </Button>
        </div>
      )}
    </div>
  );
}
