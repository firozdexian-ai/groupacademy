import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Mic,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Interview Viewport
 * High-fidelity orchestrator for multi-modal talent assessments.
 * 2026 Standard: Executive Logic geometry with reinforced audio ingestion guards.
 */

interface Question {
  id: string;
  type: "mcq" | "voice" | "text";
  question: string;
  options?: string[];
  timeLimit?: number;
}

interface Assessment {
  id: string;
  job_id: string;
  talent_id: string;
  questions: Question[];
  answers: Record<string, any> | null;
  status: string;
  expires_at: string | null;
  jobs?: {
    title: string;
    company_name: string;
  };
}

export default function JobAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (assessmentId) fetchAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from("job_assessments")
        .select(`*, jobs (title, company_name)`)
        .eq("id", assessmentId)
        .single();

      if (error) throw error;

      let questionsData: Question[] = [];
      if (data.questions) {
        const rawQuestions = data.questions as any;
        if (Array.isArray(rawQuestions)) {
          questionsData = rawQuestions as Question[];
        } else {
          if (rawQuestions.mcq_questions) {
            questionsData = [...questionsData, ...rawQuestions.mcq_questions.map((q: any) => ({ ...q, type: "mcq" }))];
          }
          if (rawQuestions.voice_questions) {
            questionsData = [
              ...questionsData,
              ...rawQuestions.voice_questions.map((q: any) => ({ ...q, type: "voice", timeLimit: 120 })),
            ];
          }
          if (rawQuestions.text_questions) {
            questionsData = [
              ...questionsData,
              ...rawQuestions.text_questions.map((q: any) => ({ ...q, type: "text" })),
            ];
          }
        }
      }

      setAssessment({ ...data, questions: questionsData, answers: data.answers as Record<string, any> | null });
      if (data.answers) setAnswers(data.answers as Record<string, any>);

      if (data.status === "pending") {
        await supabase
          .from("job_assessments")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", assessmentId);
      }
    } catch (error) {
      console.error("Failed to load assessment:", error);
      toast.error("Could not load assessment.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        uploadVoiceAnswer(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadVoiceAnswer = async (blob: Blob) => {
    if (!assessment || !talent) return;
    setUploading(true);
    const questionId = assessment.questions[currentQuestionIndex].id;
    const fileName = `${assessment.id}/${talent.id}_${questionId}_${Date.now()}.webm`;

    try {
      const { data, error } = await supabase.storage
        .from("assessment-audio")
        .upload(fileName, blob, { contentType: "audio/webm", upsert: true });

      if (error) throw error;

      const updatedAnswers = {
        ...answers,
        [questionId]: { type: "voice", storagePath: data.path },
      };
      setAnswers(updatedAnswers);

      await supabase.from("job_assessments").update({ answers: updatedAnswers }).eq("id", assessment.id);
      toast.success("Voice answer saved.");
    } catch (error) {
      toast.error("Could not upload audio.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const saveProgress = async () => {
    if (!assessment) return;
    await supabase.from("job_assessments").update({ answers }).eq("id", assessment.id);
  };

  const handleNext = async () => {
    await saveProgress();
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);
    try {
      await supabase
        .from("job_assessments")
        .update({
          answers,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessment.id);

      toast.success("Submitted. Analyzing your answers...");
      await supabase.functions.invoke("analyze-job-assessment", { body: { assessmentId: assessment.id } });
      navigate(`/app/job-assessment/${assessment.id}/results`);
    } catch (error) {
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );

  if (!assessment)
    return (
      <div className="max-w-2xl mx-auto px-3 py-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive/40 mb-3" />
        <h2 className="text-lg font-bold">Assessment not found</h2>
        <p className="text-xs text-muted-foreground mt-1">This link may be invalid or expired.</p>
      </div>
    );

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const hasCurrentAnswer = !!answers[currentQuestion?.id];

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 pb-32 space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-9 w-9"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">Job assessment</h1>
            <p className="text-[11px] text-muted-foreground truncate">{assessment.jobs?.title}</p>
          </div>
        </div>
        <Badge variant="outline" className="h-6 text-[11px] font-semibold shrink-0">
          {currentQuestionIndex + 1} / {assessment.questions.length}
        </Badge>
      </header>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-mono font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      <Card className="rounded-2xl border border-border/40 overflow-hidden">
        <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[10px] h-5 capitalize">
              {currentQuestion.type}
            </Badge>
            {currentQuestion.type === "voice" && (
              <div className="flex items-center gap-1 text-[10px] text-destructive">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> Audio question
              </div>
            )}
          </div>
          <CardTitle className="text-base font-semibold leading-snug">{currentQuestion.question}</CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          {currentQuestion.type === "mcq" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
              className="grid grid-cols-1 gap-4"
            >
              {currentQuestion.options?.map((opt, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                    answers[currentQuestion.id] === opt
                      ? "bg-primary/5 border-primary"
                      : "bg-background border-border/40 hover:border-primary/40",
                  )}
                  onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                >
                  <RadioGroupItem value={opt} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-sm leading-snug">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "voice" && (
            <div className="flex flex-col items-center gap-4 py-6 px-4 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
              {isRecording ? (
                <>
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" />
                    <div className="relative w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                      <Mic className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-mono font-semibold">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                  </p>
                  <p className="text-[11px] text-destructive">Recording...</p>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="w-full h-11 rounded-xl text-sm"
                  >
                    Stop & save
                  </Button>
                </>
              ) : uploading ? (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold">Uploading...</p>
                </div>
              ) : hasCurrentAnswer ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold">Answer saved</p>
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    className="rounded-xl h-10 px-6 text-sm gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Re-record
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border border-dashed border-primary/30">
                    <Mic className="h-7 w-7 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold">Record your answer</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Up to 120 seconds</p>
                  </div>
                  <Button onClick={startRecording} className="w-full h-11 rounded-xl text-sm">
                    <Mic className="mr-2 h-4 w-4" /> Start recording
                  </Button>
                </>
              )}
            </div>
          )}

          {currentQuestion.type === "text" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[200px] resize-none rounded-xl text-sm"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Saved automatically
                </span>
                <span className="font-mono">{answers[currentQuestion.id]?.length || 0} chars</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border/40 z-30"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((p) => p - 1)}
            disabled={currentQuestionIndex === 0}
            className="rounded-xl h-11 px-4 text-sm"
          >
            Back
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !hasCurrentAnswer}
              className="flex-1 h-11 rounded-xl text-sm"
            >
              {submitting ? "Submitting..." : "Submit"}
              {!submitting && <ShieldCheck className="ml-2 h-4 w-4" />}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!hasCurrentAnswer}
              className="flex-1 h-11 rounded-xl text-sm"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
