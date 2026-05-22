import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { uploadAssessmentAudio } from "@/domains/learning/repo/learningRepo";
import { updateJobAssessment } from "@/domains/jobs/repo/jobsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { analyzeJobAssessment } from "@/domains/jobs/api/jobsApi";

interface QuestionNode {
  id: string;
  type: "mcq" | "voice" | "text";
  question: string;
  options?: string[];
  timeLimit?: number;
}

interface JobAssessmentRecord {
  id: string;
  job_id: string;
  talent_id: string;
  questions: QuestionNode[];
  answers: Record<string, any> | null;
  status: string;
  jobs?: {
    title: string;
    company_name: string;
  } | null;
}

/**
 * Job AI assessment runner — MCQ + voice + text questions, autosaves each answer.
 */
export default function JobAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const assessmentRef = React.useRef<JobAssessmentRecord | null>(null);
  const [assessment, setAssessment] = React.useState<JobAssessmentRecord | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [uploading, setUploading] = React.useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [answers, setAnswers] = React.useState<Record<string, any>>({});

  const [recording, setRecording] = React.useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = React.useState<number>(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioStreamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const loadAssessment = React.useCallback(async () => {
    if (!assessmentId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_assessments")
        .select("*, jobs (title, company_name)")
        .eq("id", assessmentId)
        .maybeSingle();

      if (error || !data) throw new Error("Couldn't load this assessment.");

      const raw = (data.questions as any) || {};
      const questions: QuestionNode[] = [
        ...(raw.mcq_questions || []).map((q: any) => ({ ...q, type: "mcq" })),
        ...(raw.voice_questions || []).map((q: any) => ({ ...q, type: "voice", timeLimit: 120 })),
        ...(raw.text_questions || []).map((q: any) => ({ ...q, type: "text" })),
      ];

      const finalized: JobAssessmentRecord = {
        ...data,
        questions,
        answers: data.answers as Record<string, any> | null,
      };

      setAssessment(finalized);
      assessmentRef.current = finalized;
      if (data.answers) setAnswers(data.answers as Record<string, any>);

      if (data.status === "pending") {
        await supabase
          .from("job_assessments")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", assessmentId);
      }
    } catch (e) {
      toast.error("Couldn't load this assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  React.useEffect(() => {
    void loadAssessment();
  }, [loadAssessment]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        uploadAudioAnswer(blob);
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [recording]);

  const uploadAudioAnswer = async (blob: Blob) => {
    if (!assessmentRef.current || !talent) return;
    setUploading(true);
    const a = assessmentRef.current;
    const questionId = a.questions[currentIndex].id;
    const path = `${a.id}/${talent.id}_${questionId}_${Date.now()}.webm`;

    try {
      const { path: storedPath } = await uploadAssessmentAudio(path, blob, {
        contentType: "audio/webm",
        upsert: true,
      });

      const updated = { ...answers, [questionId]: { type: "voice", storagePath: storedPath } };
      setAnswers(updated);
      await updateJobAssessment(a.id, { answers: updated });
      toast.success("Voice answer saved.");
    } catch (e) {
      toast.error("Couldn't upload your voice answer. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const submitAssessment = async () => {
    if (!assessmentRef.current) return;
    setSubmitting(true);
    try {
      await updateJobAssessment(assessmentRef.current.id, {
        answers,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      await analyzeJobAssessment({ assessmentId: assessmentRef.current.id });
      navigate(`/app/job-assessment/${assessmentRef.current.id}/results`);
    } catch (e) {
      toast.error("Couldn't submit your assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  if (!assessment) return <div className="text-center py-20 text-muted-foreground">Assessment not found.</div>;

  const current = assessment.questions[currentIndex];
  const progress = ((currentIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentIndex === assessment.questions.length - 1;
  const hasAnswered = !!answers[current.id];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5 w-full">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-lg h-9 text-xs">
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit
        </Button>
        <Badge variant="outline" className="text-[10px] uppercase h-6 tracking-wide">
          Question {currentIndex + 1} of {assessment.questions.length}
        </Badge>
      </header>

      <div className="space-y-1.5 w-full">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
          <span>Progress</span>
          <span className="text-primary tabular-nums">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      <Card className="rounded-lg border border-border/60 shadow-none overflow-hidden w-full">
        <CardHeader className="p-4 border-b border-border/5 bg-muted/20">
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wide w-fit mb-2">
            {current.type === "mcq" ? "Multiple choice" : current.type === "voice" ? "Voice" : "Written"}
          </Badge>
          <CardTitle className="text-sm sm:text-base font-bold leading-relaxed">{current.question}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {current.type === "mcq" ? (
            <RadioGroup
              value={answers[current.id] || ""}
              onValueChange={(val) => setAnswers((prev) => ({ ...prev, [current.id]: val }))}
              className="grid gap-2"
            >
              {current.options?.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/50 cursor-pointer"
                >
                  <RadioGroupItem value={option} id={`opt-${idx}`} />
                  <Label htmlFor={`opt-${idx}`} className="text-xs sm:text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : current.type === "voice" ? (
            <div className="border border-dashed border-border/60 rounded-lg p-6 text-center space-y-4">
              {recording ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto animate-pulse">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums">
                    {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
                  </div>
                  <Button onClick={stopRecording} variant="destructive" className="w-full rounded-lg">
                    Stop recording
                  </Button>
                </>
              ) : uploading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              ) : hasAnswered ? (
                <>
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                  <Button onClick={startRecording} variant="outline" className="rounded-lg">
                    Re-record
                  </Button>
                </>
              ) : (
                <Button onClick={startRecording} className="w-full rounded-lg">
                  <Mic className="mr-2 h-4 w-4" /> Start recording
                </Button>
              )}
            </div>
          ) : (
            <Textarea
              value={answers[current.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
              placeholder="Type your answer here…"
              className="min-h-[160px] rounded-lg text-sm bg-background/50 border-border/60"
            />
          )}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur border-t border-border/40">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((p) => p - 1)}
            disabled={currentIndex === 0}
            className="rounded-lg h-10 w-full"
          >
            Back
          </Button>
          <Button
            onClick={isLastQuestion ? submitAssessment : () => setCurrentIndex((p) => p + 1)}
            disabled={submitting || !hasAnswered}
            className="flex-1 rounded-lg h-10"
          >
            {isLastQuestion ? "Submit assessment" : "Next"}
            {!isLastQuestion && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
