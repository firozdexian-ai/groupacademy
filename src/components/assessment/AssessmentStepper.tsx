import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "scale" | "text";
  options: any;
  weight: number;
  category: string;
  display_order: number;
}

interface AssessmentStepperProps {
  categoryId: string;
  categoryName: string;
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

export function AssessmentStepper({ categoryId, categoryName, onComplete, onBack }: AssessmentStepperProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    loadQuestions();
  }, [categoryId]);

  const loadQuestions = async () => {
    try {
      // Load general questions (null profession_category_id) and category-specific questions
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("is_active", true)
        .or(`profession_category_id.is.null,profession_category_id.eq.${categoryId}`)
        .order("display_order");

      if (error) throw error;

      // Cast the data to the correct type
      const typedQuestions = (data || []).map(q => ({
        ...q,
        question_type: q.question_type as "single_choice" | "multiple_choice" | "scale" | "text"
      }));

      setQuestions(typedQuestions);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleChoice = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChoice = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, value] };
      } else {
        return { ...prev, [questionId]: current.filter((v: string) => v !== value) };
      }
    });
  };

  const handleScale = (questionId: string, value: number[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value[0] }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    if (!answers[currentQuestion.id] && currentQuestion.question_type !== "multiple_choice") {
      toast.error("Please answer the question before continuing");
      return;
    }
    
    if (currentIndex === questions.length - 1) {
      onComplete(answers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) {
      onBack();
    } else {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No questions available for this category.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">{categoryName}</span>
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Choice */}
          {currentQuestion.question_type === "single_choice" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleSingleChoice(currentQuestion.id, value)}
            >
              {options.map((option: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${idx}`} />
                  <Label
                    htmlFor={`${currentQuestion.id}-${idx}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Multiple Choice */}
          {currentQuestion.question_type === "multiple_choice" && (
            <div className="space-y-3">
              {options.map((option: any, idx: number) => {
                const isChecked = (answers[currentQuestion.id] || []).includes(option.value);
                return (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => handleMultipleChoice(currentQuestion.id, option.value, !isChecked)}
                  >
                    <Checkbox
                      id={`${currentQuestion.id}-${idx}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleMultipleChoice(currentQuestion.id, option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${idx}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            </div>
          )}

          {/* Scale */}
          {currentQuestion.question_type === "scale" && (
            <div className="space-y-6 py-4">
              <div className="px-2">
                <Slider
                  value={[answers[currentQuestion.id] || 5]}
                  onValueChange={(value) => handleScale(currentQuestion.id, value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>{options[0]?.minLabel || "1"}</span>
                <span className="text-2xl font-bold text-primary">
                  {answers[currentQuestion.id] || 5}
                </span>
                <span>{options[0]?.maxLabel || "10"}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentIndex === 0 ? "Back" : "Previous"}
            </Button>
            <Button onClick={handleNext}>
              {currentIndex === questions.length - 1 ? "Continue" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
