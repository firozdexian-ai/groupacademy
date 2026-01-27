import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Wand2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { parseAIQuiz, validateParsedQuestions, type ParsedQuestion } from "@/lib/quizParser";

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

interface CourseModule {
  id: string;
  title: string;
  display_order: number | null;
}

export default function QuizManagement() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passThreshold, setPassThreshold] = useState(70);
  
  // AI Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [aiQuizText, setAiQuizText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  useEffect(() => {
    loadQuizData();
  }, [contentId]);

  useEffect(() => {
    if (selectedModuleId) {
      loadModuleQuestions(selectedModuleId);
    }
  }, [selectedModuleId]);

  const loadQuizData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Get course details
      const courseResult = await withTimeout(
        Promise.resolve(supabase.from("content").select("*").eq("id", contentId).single()),
        TIMEOUTS.DEFAULT,
        "Loading course timed out"
      );
      if (courseResult.error || !courseResult.data) {
        toast.error("Course not found");
        navigate("/dashboard");
        return;
      }
      setCourse(courseResult.data);
      setPassThreshold(courseResult.data.pass_threshold || 70);

      // Get course modules
      const modulesResult = await withTimeout(
        Promise.resolve(supabase.from("course_modules").select("id, title, display_order").eq("content_id", contentId).order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading modules timed out"
      );
      
      if (modulesResult.data && modulesResult.data.length > 0) {
        setModules(modulesResult.data);
        setSelectedModuleId(modulesResult.data[0].id);
      }
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      setLoadError(error.message || "Failed to load quiz data");
      toast.error("Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  };

  const loadModuleQuestions = async (moduleId: string) => {
    try {
      const questionsResult = await withTimeout(
        Promise.resolve(supabase.from("quiz_questions").select("*").eq("module_id", moduleId).order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading questions timed out"
      );
      if (questionsResult.data && questionsResult.data.length > 0) {
        setQuestions(questionsResult.data);
      } else {
        setQuestions([]);
        addQuestion();
      }
    } catch (error) {
      console.error("Error loading module questions:", error);
      setQuestions([]);
      addQuestion();
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

  // AI Quiz Import handlers
  const handleParseAIQuiz = () => {
    const parsed = parseAIQuiz(aiQuizText);
    const validation = validateParsedQuestions(parsed);
    
    setParsedPreview(parsed);
    setParseErrors(validation.errors);
  };

  const handleImportParsed = () => {
    if (parsedPreview.length === 0) return;
    
    const newQuestions: Question[] = parsedPreview.map((q, index) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      display_order: questions.length + index,
    }));
    
    setQuestions([...questions, ...newQuestions]);
    setImportDialogOpen(false);
    setAiQuizText("");
    setParsedPreview([]);
    setParseErrors([]);
    toast.success(`Imported ${newQuestions.length} questions`);
  };

  const handleSave = async () => {
    if (!selectedModuleId) {
      toast.error("Please select a module first");
      return;
    }
    
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
      const { error: updateError } = await withTimeout(
        Promise.resolve(supabase
          .from("content")
          .update({ 
            pass_threshold: passThreshold,
            quiz_enabled: true
          })
          .eq("id", contentId)),
        TIMEOUTS.DEFAULT,
        "Updating quiz settings timed out"
      );

      if (updateError) throw updateError;

      // Delete existing questions for this module
      await withTimeout(
        Promise.resolve(supabase
          .from("quiz_questions")
          .delete()
          .eq("module_id", selectedModuleId)),
        TIMEOUTS.DEFAULT,
        "Deleting existing questions timed out"
      );

      // Insert new questions with module_id
      const questionsToInsert = questions.map((q, index) => ({
        content_id: contentId,
        module_id: selectedModuleId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        display_order: index,
      }));

      const { error: insertError } = await withTimeout(
        Promise.resolve(supabase
          .from("quiz_questions")
          .insert(questionsToInsert)),
        TIMEOUTS.DEFAULT,
        "Saving quiz questions timed out"
      );

      if (insertError) throw insertError;

      toast.success("Quiz saved successfully!");
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorState
          type="server"
          title="Failed to load quiz"
          description={loadError}
          onRetry={loadQuizData}
        />
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
            <CardContent className="space-y-4">
              {/* Module Selector */}
              <div className="space-y-2">
                <Label>Select Module</Label>
                <Select value={selectedModuleId || ""} onValueChange={setSelectedModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module, index) => (
                      <SelectItem key={module.id} value={module.id}>
                        Module {index + 1}: {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Each module has its own quiz. Select a module to manage its questions.
                </p>
              </div>

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

          {/* AI Import Button */}
          {selectedModuleId && (
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Wand2 className="h-4 w-4" />
                  Import from AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Quiz from AI</DialogTitle>
                  <DialogDescription>
                    Paste AI-generated quiz questions in numbered format or JSON
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paste AI-generated quiz</Label>
                    <Textarea
                      value={aiQuizText}
                      onChange={(e) => setAiQuizText(e.target.value)}
                      placeholder={`Example format:\n\n1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nD) Madrid\nCorrect: B\nExplanation: Paris is the capital city of France.\n\n2. Which planet is closest to the Sun?\n...`}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button onClick={handleParseAIQuiz} variant="secondary" className="w-full">
                    Parse Quiz
                  </Button>
                  
                  {parseErrors.length > 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Parsing Issues</span>
                      </div>
                      <ul className="text-sm text-destructive space-y-1">
                        {parseErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {parsedPreview.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Parsed {parsedPreview.length} questions</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {parsedPreview.map((q, i) => (
                          <div key={i} className="p-2 bg-muted rounded text-sm">
                            <p className="font-medium truncate">Q{i + 1}: {q.question_text}</p>
                            <p className="text-muted-foreground text-xs">
                              Correct: {q.correct_answer} • Options: {[q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean).length}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImportParsed} 
                    disabled={parsedPreview.length === 0}
                  >
                    Import {parsedPreview.length} Questions
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {selectedModuleId && questions.map((question, index) => (
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

          {selectedModuleId && (
            <div className="flex gap-3">
              {questions.length < 10 && (
                <Button variant="outline" onClick={addQuestion} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question ({questions.length}/10)
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || !selectedModuleId} className="flex-1">
                {saving ? "Saving..." : "Save Quiz"}
              </Button>
            </div>
          )}

          {!selectedModuleId && modules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No modules found. Create modules first before adding quizzes.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
