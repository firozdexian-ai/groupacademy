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
  Brain,
  RefreshCw,
  ShieldCheck,
  Zap,
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
      console.error("Diagnostic Failure:", error);
      toast.error("Handshake Failed: Registry inaccessible.");
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
      toast.error("Protocol Error: Microphone node denied.");
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
      toast.success("Voice Artifact Ingested.");
    } catch (error) {
      toast.error("Transmission Error: Audio node failure.");
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

      toast.success("Synthesis Request Sent. Initializing AI Analysis.");
      await supabase.functions.invoke("analyze-job-assessment", { body: { assessmentId: assessment.id } });
      navigate(`/app/job-assessment/${assessment.id}/results`);
    } catch (error) {
      toast.error("Handshake Failed: Submission protocol aborted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto p-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6 opacity-20" />
        <Skeleton className="h-80 w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  if (!assessment)
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in fade-in zoom-in-95">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive/40 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Node Not Found</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic mt-2">
          Invalid registry handle.
        </p>
      </div>
    );

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const hasCurrentAnswer = !!answers[currentQuestion?.id];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-svh space-y-10 animate-in fade-in duration-700">
      {/* Simulation Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-11 w-11 hover:bg-primary/5 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Job assessment</h1>
            <p className="text-xs text-muted-foreground">{assessment.jobs?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="h-8 rounded-lg border-2 font-black uppercase text-[10px] tracking-tighter"
          >
            {currentQuestionIndex + 1} / {assessment.questions.length}
          </Badge>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary italic leading-none">
            Transmission Progress
          </span>
          <span className="text-[10px] font-mono font-black text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full border border-primary/10 bg-primary/5" />
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
          <Brain className="h-40 w-40" />
        </div>
        <CardHeader className="p-10 border-b border-border/10 bg-muted/20">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-black text-[9px] uppercase tracking-widest">
              {currentQuestion.type} Node
            </Badge>
            {currentQuestion.type === "voice" && (
              <div className="flex items-center gap-1.5 animate-pulse text-destructive font-black text-[9px] uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" /> Live Capture
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-black tracking-tight leading-[1.1] selection:bg-primary/20">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-10">
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
                    "flex items-center space-x-4 p-5 rounded-[24px] border-2 transition-all cursor-pointer group/opt",
                    answers[currentQuestion.id] === opt
                      ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                      : "bg-background/50 border-border/40 hover:border-primary/40",
                  )}
                  onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                >
                  <RadioGroupItem value={opt} id={`opt-${i}`} className="h-5 w-5" />
                  <Label
                    htmlFor={`opt-${i}`}
                    className="flex-1 cursor-pointer font-bold text-base tracking-tight leading-tight group-hover/opt:text-primary transition-colors"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "voice" && (
            <div className="flex flex-col items-center gap-8 py-10 px-6 bg-primary/[0.02] border-2 border-dashed border-primary/10 rounded-[32px] animate-in zoom-in-95">
              {isRecording ? (
                <div className="space-y-8 text-center w-full">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-destructive flex items-center justify-center shadow-2xl shadow-destructive/40">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-black font-mono tracking-tighter">
                      {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive italic">
                      Audio Protocol: Capturing...
                    </p>
                  </div>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-destructive/20"
                  >
                    Terminate & Ingest
                  </Button>
                </div>
              ) : uploading ? (
                <div className="space-y-6 text-center py-10">
                  <Loader2 className="animate-spin h-14 w-14 text-primary mx-auto stroke-[1.5px]" />
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest">Encrypting Artifact</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
                      Syncing with Secure Storage Registry
                    </p>
                  </div>
                </div>
              ) : hasCurrentAnswer ? (
                <div className="space-y-8 text-center w-full animate-in fade-in zoom-in-95">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20 rotate-3">
                    <CheckCircle className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black uppercase tracking-tight italic">Response Node Verified</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                      Encrypted WebM Payload Ready
                    </p>
                  </div>
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    className="rounded-xl h-12 px-10 font-black uppercase text-[9px] tracking-widest border-2 gap-3 group"
                  >
                    <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" /> Redo
                    Calibration
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 text-center w-full">
                  <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-primary/20">
                    <Mic className="h-10 w-10 text-primary/30" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tight">Voice Synthesis</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 max-w-xs mx-auto uppercase tracking-widest italic leading-relaxed">
                      Execute a verbal articulation of your logic. 120s max duration.
                    </p>
                  </div>
                  <Button
                    onClick={startRecording}
                    className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 group"
                  >
                    <Zap className="mr-3 h-4 w-4 fill-current group-hover:scale-125 transition-transform" /> Initialize
                    Audio Capture
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === "text" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
              <Textarea
                placeholder="Initialize logic sequence here..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="min-h-[280px] resize-none rounded-[28px] bg-muted/10 border-2 border-border/40 focus-visible:ring-primary/10 p-8 leading-relaxed italic text-sm font-medium"
              />
              <div className="flex justify-between items-center px-4">
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Secure Narrative Node
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {answers[currentQuestion.id]?.length || 0} Chars
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logic Control HUD */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-700">
        <div className="max-w-3xl mx-auto flex gap-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((p) => p - 1)}
            disabled={currentQuestionIndex === 0}
            className="rounded-[24px] h-16 px-8 border-2 font-black uppercase text-[11px] tracking-widest flex-shrink-0"
          >
            Revert
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !hasCurrentAnswer}
              className="flex-1 h-16 rounded-[24px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {submitting ? "Analyzing Synthesis..." : "Finalize Simulation"}
                {!submitting && <ShieldCheck className="ml-3 h-5 w-5" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!hasCurrentAnswer}
              className="flex-1 h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Next Phase <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
