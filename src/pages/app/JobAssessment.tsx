import * as React from "react";
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
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
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
 * GroUp Academy: Neural Interview Assessment Viewport (JobAssessment)
 * Hardened responsive assessment runner managing hardware stream capture safety and shielding transmission pipelines.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function JobAssessment() {
  const { assessmentId: unverifiedAssessmentIdStr } = useParams<{ assessmentId: string }>();
  const navigateHook = useNavigate();
  const { talent: talentProfileRecord } = useTalent();

  const assessmentRecordState = React.useRef<JobAssessmentRecord | null>(null);
  const [assessmentData, setAssessmentData] = React.useState<JobAssessmentRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSubmissionPending, setIsSubmissionPending] = React.useState<boolean>(false);
  const [isStorageUploading, setIsStorageUploading] = React.useState<boolean>(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState<number>(0);
  const [answersBufferMap, setAnswersBufferMap] = React.useState<Record<string, any>>({});

  const [isRecordingEngineActive, setIsRecordingEngineActive] = React.useState<boolean>(false);
  const [recordingIntervalTime, setRecordingIntervalTime] = React.useState<number>(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioStreamReference = React.useRef<MediaStream | null>(null);
  const timerReference = React.useRef<NodeJS.Timeout | null>(null);

  // =========================================================================
  // LIFECYCLE SECTOR: HARDENED HARDWARE CLEANUP GATES
  // =========================================================================
  React.useEffect(() => {
    return () => {
      if (timerReference.current) clearInterval(timerReference.current);
      if (audioStreamReference.current) {
        audioStreamReference.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const fetchAssessmentHandshake = React.useCallback(async () => {
    if (!unverifiedAssessmentIdStr) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("job_assessments")
        .select("*, jobs (title, company_name)")
        .eq("id", unverifiedAssessmentIdStr)
        .maybeSingle();

      if (error || !data) throw new Error("Assessment registry lookup failed.");

      // Normalize dynamic question JSON structures securely
      const rawQuestions = (data.questions as any) || {};
      const normalizedQuestions: QuestionNode[] = [
        ...(rawQuestions.mcq_questions || []).map((q: any) => ({ ...q, type: "mcq" })),
        ...(rawQuestions.voice_questions || []).map((q: any) => ({ ...q, type: "voice", timeLimit: 120 })),
        ...(rawQuestions.text_questions || []).map((q: any) => ({ ...q, type: "text" })),
      ];

      const finalizedAssessmentData: JobAssessmentRecord = {
        ...data,
        questions: normalizedQuestions,
        answers: data.answers as Record<string, any> | null,
      };

      setAssessmentData(finalizedAssessmentData);
      assessmentRecordState.current = finalizedAssessmentData;
      if (data.answers) setAnswersBufferMap(data.answers as Record<string, any>);

      if (data.status === "pending") {
        await supabase
          .from("job_assessments")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", unverifiedAssessmentIdStr);
      }
    } catch (e) {
      toast.error("Failed to load assessment specification registry.");
    } finally {
      setIsLoading(false);
    }
  }, [unverifiedAssessmentIdStr]);

  React.useEffect(() => {
    void fetchAssessmentHandshake();
  }, [fetchAssessmentHandshake]);

  // =========================================================================
  // HARDWARE PIPELINE: STREAM MANAGEMENT & STORAGE UPLOADS
  // =========================================================================
  const handleStartHardwareRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamReference.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const finalizedBlob = new Blob(audioChunks, { type: "audio/webm" });
        uploadAudioAnswerPayload(finalizedBlob);
      };

      mediaRecorder.start();
      setIsRecordingEngineActive(true);
      setRecordingIntervalTime(0);
      timerReference.current = setInterval(() => {
        setRecordingIntervalTime((prev) => {
          if (prev >= 120) {
            stopHardwareRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      toast.error("Microphone hardware channel access refused by security container.");
    }
  };

  const stopHardwareRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && isRecordingEngineActive) {
      mediaRecorderRef.current.stop();
      setIsRecordingEngineActive(false);
      if (timerReference.current) clearInterval(timerReference.current);
    }
  }, [isRecordingEngineActive]);

  const uploadAudioAnswerPayload = async (blob: Blob) => {
    if (!assessmentRecordState.current || !talentProfileRecord) return;
    setIsStorageUploading(true);
    const assessment = assessmentRecordState.current;
    const questionId = assessment.questions[currentQuestionIndex].id;
    const storageTargetFilePath = `${assessment.id}/${talentProfileRecord.id}_${questionId}_${Date.now()}.webm`;

    try {
      const { data, error } = await supabase.storage
        .from("assessment-audio")
        .upload(storageTargetFilePath, blob, { contentType: "audio/webm", upsert: true });

      if (error) throw error;

      const updatedAnswers = { ...answersBufferMap, [questionId]: { type: "voice", storagePath: data.path } };
      setAnswersBufferMap(updatedAnswers);
      await supabase.from("job_assessments").update({ answers: updatedAnswers }).eq("id", assessment.id);
      toast.success("Voice response artifact secured.");
    } catch (e) {
      toast.error("Failed to transmit audio asset to repository pipeline.");
    } finally {
      setIsStorageUploading(false);
    }
  };

  // =========================================================================
  // TRANSACTION MUTATION: PROGRESSION AND SUBMISSION PIPELINES
  // =========================================================================
  const handleCommitAssessmentSubmission = async () => {
    if (!assessmentRecordState.current) return;
    setIsSubmissionPending(true);
    try {
      await supabase
        .from("job_assessments")
        .update({
          answers: answersBufferMap,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessmentRecordState.current.id);

      await supabase.functions.invoke("analyze-job-assessment", {
        body: { assessmentId: assessmentRecordState.current.id },
      });
      navigateHook(`/app/job-assessment/${assessmentRecordState.current.id}/results`);
    } catch (e) {
      toast.error("Submission transmission handshake failed.");
    } finally {
      setIsSubmissionPending(false);
    }
  };

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  if (!assessmentData) return <div className="text-center py-20 text-muted-foreground">Assessment missing.</div>;

  const currentQuestionNode = assessmentData.questions[currentQuestionIndex];
  const completionProgressNum = ((currentQuestionIndex + 1) / assessmentData.questions.length) * 100;
  const isFinalStepFlag = currentQuestionIndex === assessmentData.questions.length - 1;
  const hasUserRespondedFlag = !!answersBufferMap[currentQuestionNode.id];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5 antialiased block transform-gpu w-full">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigateHook(-1)} className="rounded-lg h-9 text-xs">
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit Assessment
        </Button>
        <Badge variant="outline" className="font-mono text-[10px] uppercase h-6 tracking-wide">
          TASK {currentQuestionIndex + 1} OF {assessmentData.questions.length}
        </Badge>
      </header>

      <div className="space-y-1.5 w-full block">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
          <span>Execution Vector</span>
          <span className="font-mono text-primary">{Math.round(completionProgressNum).toString()}%</span>
        </div>
        <Progress value={completionProgressNum} className="h-1.5 rounded-full" />
      </div>

      <Card className="rounded-lg border border-border/60 shadow-none overflow-hidden block w-full">
        <CardHeader className="p-4 border-b border-border/5 bg-muted/20">
          <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wide w-fit mb-2">
            {currentQuestionNode.type}
          </Badge>
          <CardTitle className="text-sm sm:text-base font-bold leading-relaxed">
            {currentQuestionNode.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {currentQuestionNode.type === "mcq" ? (
            <RadioGroup
              value={answersBufferMap[currentQuestionNode.id] || ""}
              onValueChange={(val) => setAnswersBufferMap((prev) => ({ ...prev, [currentQuestionNode.id]: val }))}
              className="grid gap-2"
            >
              {currentQuestionNode.options?.map((option, idx) => (
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
          ) : currentQuestionNode.type === "voice" ? (
            <div className="border border-dashed border-border/60 rounded-lg p-6 text-center space-y-4">
              {isRecordingEngineActive ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto animate-pulse">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="font-mono text-xl font-bold">
                    {Math.floor(recordingIntervalTime / 60)}:{String(recordingIntervalTime % 60).padStart(2, "0")}
                  </div>
                  <Button onClick={stopHardwareRecording} variant="destructive" className="w-full rounded-lg">
                    Stop Pipeline
                  </Button>
                </>
              ) : isStorageUploading ? (
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              ) : hasUserRespondedFlag ? (
                <>
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                  <Button onClick={handleStartHardwareRecording} variant="outline" className="rounded-lg">
                    Re-record Channel
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartHardwareRecording} className="w-full rounded-lg">
                  <Mic className="mr-2 h-4 w-4" /> Initialize Audio Capture
                </Button>
              )}
            </div>
          ) : (
            <Textarea
              value={answersBufferMap[currentQuestionNode.id] || ""}
              onChange={(e) => setAnswersBufferMap((prev) => ({ ...prev, [currentQuestionNode.id]: e.target.value }))}
              placeholder="Input your evaluation response parameter string block..."
              className="min-h-[160px] rounded-lg text-sm bg-background/50 border-border/60"
            />
          )}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur border-t border-border/40">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((p) => p - 1)}
            disabled={currentQuestionIndex === 0}
            className="rounded-lg h-10 w-full"
          >
            Back
          </Button>
          <Button
            onClick={isFinalStepFlag ? handleCommitAssessmentSubmission : () => setCurrentQuestionIndex((p) => p + 1)}
            disabled={isSubmissionPending || !hasUserRespondedFlag}
            className="flex-1 rounded-lg h-10"
          >
            {isFinalStepFlag ? "Submit Assessment Artifacts" : "Next Segment"}
            {!isFinalStepFlag && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
