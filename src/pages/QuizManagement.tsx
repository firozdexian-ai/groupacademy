import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getContentById,
  listCourseModulesLite,
  listQuizQuestionsByModuleOrdered,
  updateContentQuizSettings,
  deleteQuizQuestionsForModule,
  insertQuizQuestions,
} from "@/domains/learning/repo/learningRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Save,
  GraduationCap,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { parseAIQuiz, validateParsedQuestions, type ParsedQuestion } from "@/lib/quizParser";
import { cn } from "@/lib/utils";

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

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [aiQuizText, setAiQuizText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  useEffect(() => {
    loadQuizData();
  }, [contentId]);
  useEffect(() => {
    if (selectedModuleId) loadModuleQuestions(selectedModuleId);
  }, [selectedModuleId]);

  const loadQuizData = async () => {
    setLoading(true);
    try {
      const c = await getContentById(contentId!);
      if (!c) throw new Error("Blueprint Missing");
      setCourse(c);
      setPassThreshold(c.pass_threshold || 70);

      const mods = await listCourseModulesLite(contentId!);
      if (mods && mods.length > 0) {
        setModules(mods);
        setSelectedModuleId(mods[0].id);
      }
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadModuleQuestions = async (moduleId: string) => {
    const data = await listQuizQuestionsByModuleOrdered(moduleId);
    if (data && data.length > 0) setQuestions(data as any);
    else
      setQuestions([
        {
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: "A",
          explanation: "",
          display_order: 0,
        },
      ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleParseAIQuiz = () => {
    const parsed = parseAIQuiz(aiQuizText);
    const validation = validateParsedQuestions(parsed);
    setParsedPreview(parsed);
    setParseErrors(validation.errors);
  };

  const handleImportParsed = () => {
    const newQs: Question[] = parsedPreview.map((q, i) => ({
      ...q,
      explanation: q.explanation || "",
      display_order: questions.length + i,
    }));
    setQuestions([...questions, ...newQs]);
    setImportDialogOpen(false);
    setAiQuizText("");
    toast.success(`Synthetic Logic Imported: ${newQs.length} Nodes added.`);
  };

  const handleSave = async () => {
    if (!selectedModuleId) return;
    setSaving(true);
    try {
      // Logic Transactional Cycle
      await updateContentQuizSettings(contentId!, passThreshold, true);
      await deleteQuizQuestionsForModule(selectedModuleId);

      const payload = questions.map((q, i) => ({
        content_id: contentId,
        module_id: selectedModuleId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        display_order: i,
      }));

      await insertQuizQuestions(payload);
      toast.success("Logic Nodes Synchronized.");
    } catch (err) {
      toast.error("Database Committal Failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center animate-pulse space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Initializing Assessment Terminal
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/content/${contentId}/edit`)}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Curriculum Blueprint
          </Button>
          <Badge
            variant="outline"
            className="font-black uppercase text-[10px] border-primary/20 text-primary bg-primary/5"
          >
            Verification Protocol Active
          </Badge>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        <div className="grid md:grid-cols-[1fr,300px] gap-8">
          <div className="space-y-6">
            <Card className="rounded-[32px] border-border/40 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Global Logic Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Active Target Module
                  </Label>
                  <Select value={selectedModuleId || ""} onValueChange={setSelectedModuleId}>
                    <SelectTrigger className="h-12 rounded-xl border-border/40 font-bold bg-background/50">
                      <SelectValue placeholder="Select Module Node" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {modules.map((m, i) => (
                        <SelectItem key={m.id} value={m.id} className="text-[10px] font-bold uppercase">
                          Node 0{i + 1}: {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Pass Index Threshold (%)
                  </Label>
                  <Input
                    type="number"
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            {selectedModuleId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Logic Nodes</h3>
                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest bg-primary/5"
                      >
                        <Wand2 className="h-3 w-3 mr-1.5" /> Synthetic Import
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[32px] max-w-2xl border-border/40 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
                          AI Ingestion
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium uppercase tracking-wider">
                          Paste raw AI-generated assessment artifacts for neural parsing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <Textarea
                          value={aiQuizText}
                          onChange={(e) => setAiQuizText(e.target.value)}
                          placeholder="1. Logic Query... Correct: A..."
                          className="min-h-[300px] rounded-2xl font-mono text-xs bg-muted/20"
                        />
                        <Button
                          onClick={handleParseAIQuiz}
                          className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                        >
                          Execute Parsing
                        </Button>
                        {parseErrors.length > 0 && (
                          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-600 uppercase">
                            Errors Detected in String. Check Syntax.
                          </div>
                        )}
                        {parsedPreview.length > 0 && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 uppercase">
                            {parsedPreview.length} Logic Nodes Deciphered. Ready for Ingestion.
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setImportDialogOpen(false)}
                          className="rounded-xl font-black uppercase text-[10px]"
                        >
                          Abort
                        </Button>
                        <Button
                          onClick={handleImportParsed}
                          disabled={parsedPreview.length === 0}
                          className="rounded-xl font-black uppercase text-[10px]"
                        >
                          Commit Ingestion
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {questions.map((q, i) => (
                  <Card key={i} className="rounded-[32px] border-border/40 shadow-xl overflow-hidden group">
                    <CardHeader className="bg-muted/30 border-b border-border/20 py-4 px-8 flex flex-row items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">
                        Module Assessment Node <span className="text-primary">0{i + 1}</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Logic Query (Question)
                        </Label>
                        <Textarea
                          value={q.question_text}
                          onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                          className="rounded-2xl border-border/40 resize-none font-medium text-sm h-24"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {["a", "b", "c", "d"].map((opt) => (
                          <div key={opt} className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                              Option {opt.toUpperCase()}
                            </Label>
                            <Input
                              value={(q as any)[`option_${opt}`]}
                              onChange={(e) => updateQuestion(i, `option_${opt}` as any, e.target.value)}
                              className="h-10 rounded-xl bg-muted/20"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/20">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">
                            Correct Identity
                          </Label>
                          <Select
                            value={q.correct_answer}
                            onValueChange={(v) => updateQuestion(i, "correct_answer", v)}
                          >
                            <SelectTrigger className="h-10 rounded-xl font-black uppercase text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {["A", "B", "C", "D"].map((v) => (
                                <SelectItem key={v} value={v} className="font-black">
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Logic Rationale (Explanation)
                          </Label>
                          <Input
                            value={q.explanation}
                            onChange={(e) => updateQuestion(i, "explanation", e.target.value)}
                            className="h-10 rounded-xl italic text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setQuestions([
                        ...questions,
                        {
                          question_text: "",
                          option_a: "",
                          option_b: "",
                          option_c: "",
                          option_d: "",
                          correct_answer: "A",
                          explanation: "",
                          display_order: questions.length,
                        },
                      ])
                    }
                    className="h-14 rounded-2xl border-dashed border-2 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Logic Node
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 rounded-2xl shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-[10px]"
                  >
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}{" "}
                    Synchronize Nodes
                  </Button>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6 hidden lg:block">
            <Card className="rounded-3xl border-primary/10 bg-primary/[0.02] p-6 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black uppercase text-[9px] tracking-widest">
                  <Sparkles className="h-3 w-3" /> System Guidelines
                </div>
                <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                  "Ensure assessment queries challenge candidate logical reasoning. Use synthetic import for rapid
                  expansion."
                </p>
                <div className="h-px bg-primary/10 w-full" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-foreground uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-Enable Active
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-foreground uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Module Isolation Active
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
