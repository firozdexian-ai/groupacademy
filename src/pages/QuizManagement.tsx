import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  display_order: number;
}

export default function QuizManagement() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passThreshold, setPassThreshold] = useState(70);

  useEffect(() => {
    loadQuizData();
  }, [contentId]);

  const loadQuizData = async () => {
    try {
      // Get course details
      const { data: courseData, error: courseError } = await supabase
        .from("content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (courseError || !courseData) {
        toast.error("Course not found");
        navigate("/dashboard");
        return;
      }

      setCourse(courseData);
      setPassThreshold(courseData.pass_threshold || 70);

      // Load existing questions
      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("content_id", contentId)
        .order("display_order");

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData);
      } else {
        // Initialize with empty question if none exist
        addQuestion();
      }
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast.error("Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      explanation: "",
      display_order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSave = async () => {
    // Validate questions
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    const incomplete = questions.some(q => 
      !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d
    );

    if (incomplete) {
      toast.error("Please complete all question fields");
      return;
    }

    setSaving(true);
    try {
      // Update pass threshold and enable quiz
      const { error: updateError } = await supabase
        .from("content")
        .update({ 
          pass_threshold: passThreshold,
          quiz_enabled: true
        })
        .eq("id", contentId);

      if (updateError) throw updateError;

      // Delete existing questions
      await supabase
        .from("quiz_questions")
        .delete()
        .eq("content_id", contentId);

      // Insert new questions
      const questionsToInsert = questions.map((q, index) => ({
        content_id: contentId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      toast.success("Quiz saved successfully!");
      navigate(`/content/${contentId}/edit`);
    } catch (error: any) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/content/${contentId}/edit`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure quiz for {course?.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="threshold">Pass Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Students must score at least {passThreshold}% to pass
                </p>
              </div>
            </CardContent>
          </Card>

          {questions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                    placeholder="Enter your question"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["A", "B", "C", "D"].map((option) => (
                    <div key={option} className="space-y-2">
                      <Label>Option {option}</Label>
                      <Input
                        value={question[`option_${option.toLowerCase()}` as keyof Question] as string}
                        onChange={(e) => updateQuestion(index, `option_${option.toLowerCase()}` as keyof Question, e.target.value)}
                        placeholder={`Enter option ${option}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={question.correct_answer}
                    onValueChange={(value) => updateQuestion(index, "correct_answer", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((option) => (
                        <SelectItem key={option} value={option}>
                          Option {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            {questions.length < 10 && (
              <Button variant="outline" onClick={addQuestion} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Question ({questions.length}/10)
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
