import * as React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { aiIeltsEvaluate } from "@/domains/abroad/api/abroadApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Square, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface EvaluationResponse {
  attempt_id: string;
  band: number;
  was_free: boolean;
  credits_spent: number;
  error?: string;
}

/**
 * GroUp Academy: IELTS Mock Examination Runner (IELTSMockRunner)
 * Hardened responsive assessment workspace securing micro-recording hardware stream channels and stabilizing async evaluation transmissions.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function IELTSMockRunner() {
  const { section: unverifiedSectionStr } = useParams<{ section: string }>();
  const [searchParams] = useSearchParams();
  const navigateHook = useNavigate();

  const promptId = searchParams.get("prompt") ?? null;
  const isAudioSectionFlag = unverifiedSectionStr === "speaking";

  const [responseTextInputStr, setResponseTextInputStr] = React.useState<string>("");
  const [isSubmissionPending, setIsSubmissionPending] = React.useState<boolean>(false);
  const [isMicrophoneRecording, setIsMicrophoneRecording] = React.useState<boolean>(false);

  const [activeAudioBlob, setActiveAudioBlob] = React.useState<Blob | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  // Cleanup hardware stream on component teardown defensively
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecordingSequence = async () => {
    try {
      const hardwareStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderInstance = new MediaRecorder(hardwareStream);
      const audioDataChunks: Blob[] = [];

      recorderInstance.ondataavailable = (event) => audioDataChunks.push(event.data);
      recorderInstance.onstop = () => {
        setActiveAudioBlob(new Blob(audioDataChunks, { type: "audio/webm" }));
        hardwareStream.getTracks().forEach((trackNode) => trackNode.stop());
      };

      recorderInstance.start();
      mediaRecorderRef.current = recorderInstance;
      setIsMicrophoneRecording(true);
    } catch (hardwareException) {
      toast.error("Microphone hardware access denied by security container.");
    }
  };

  const handleStopRecordingSequence = () => {
    mediaRecorderRef.current?.stop();
    setIsMicrophoneRecording(false);
  };

  const handleCommitSubmissionSequence = async () => {
    if (isAudioSectionFlag && !activeAudioBlob) {
      toast.error("You must finalize your vocal response track before auditing.");
      return;
    }
    if (!isAudioSectionFlag && !responseTextInputStr.trim()) {
      toast.error("Input text parameters are required for writing-based section evaluation.");
      return;
    }

    setIsSubmissionPending(true);
    try {
      let remoteAudioStoragePath: string | null = null;

      if (isAudioSectionFlag && activeAudioBlob) {
        const { data: authUserResponse } = await supabase.auth.getUser();
        if (!authUserResponse.user) throw new Error("Authentication credential session expired.");

        const generatedPath = `${authUserResponse.user.id}/${Date.now().toString()}.webm`;
        await uploadIeltsAudio(generatedPath, activeAudioBlob);
        remoteAudioStoragePath = generatedPath;
      }

      const evaluationResponsePayload = await aiIeltsEvaluate({
        section: unverifiedSectionStr ?? "",
        prompt_id: promptId,
        response_text: responseTextInputStr,
        audio_path: remoteAudioStoragePath,
      });

      if (evaluationResponsePayload?.error) throw new Error(evaluationResponsePayload.error);

      toast.success(
        `Analysis Finalized: Band ${evaluationResponsePayload.band?.toString()} (${evaluationResponsePayload.was_free ? "Free Entry" : (evaluationResponsePayload.credits_spent ?? 0).toString() + " Credits Deducted"})`,
      );
      navigateHook(`/app/abroad/ielts/results/${evaluationResponsePayload.attempt_id}`);
    } catch (mutationException: any) {
      toast.error(mutationException.message || "Pipeline evaluation channel interrupted.");
    } finally {
      setIsSubmissionPending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 antialiased block transform-gpu w-full">
      <header className="space-y-1 block leading-none">
        <h1 className="text-xl font-black uppercase tracking-tight text-foreground">
          {unverifiedSectionStr?.toUpperCase()} MOCK EXAMINATION
        </h1>
        <p className="font-mono text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pt-1">
          {isAudioSectionFlag ? "Vocal Response Window (60-120 Seconds)" : "Text-based Response Window (Min 250 words)"}
        </p>
      </header>

      <Card className="rounded-xl border border-primary/20 bg-muted/20 p-4 shadow-none">
        <div className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-primary mb-2 select-none pointer-events-none">
          Examination Prompt
        </div>
        <div className="text-sm font-medium text-foreground/80 leading-relaxed italic block">
          {unverifiedSectionStr === "writing" &&
            "Some believe technology simplifies existence, whereas others claim it induces lethargy. Debate these perspectives and formulate your independent stance."}
          {unverifiedSectionStr === "speaking" &&
            "Detail a location you desire to travel. Articulate the geography, travel infrastructure, activities planned, and justification for this travel itinerary."}
          {(unverifiedSectionStr === "reading" || unverifiedSectionStr === "listening") &&
            "Access the examination resource manifest and process the comprehension data matrix."}
          {unverifiedSectionStr === "full" &&
            "Execute a full-cycle mock examination across all four modules. System grading for each module will follow."}
        </div>
      </Card>

      {isAudioSectionFlag ? (
        <Card className="rounded-xl border border-border/60 bg-card/40 p-8 text-center shadow-none">
          {isMicrophoneRecording ? (
            <Button
              onClick={handleStopRecordingSequence}
              variant="destructive"
              className="rounded-lg h-12 w-full font-bold uppercase tracking-widest shadow-2xs"
            >
              <Square className="h-4 w-4 mr-2" /> Finalize Recording
            </Button>
          ) : (
            <Button
              onClick={handleStartRecordingSequence}
              className="rounded-lg h-12 w-full font-bold uppercase tracking-widest shadow-2xs"
            >
              <Mic className="h-4 w-4 mr-2" />{" "}
              {activeAudioBlob ? "Re-Initiate Recording" : "Initialize Recording Channel"}
            </Button>
          )}
          {activeAudioBlob && (
            <p className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-4">
              ✓ Hardware Capture Verified ({(activeAudioBlob.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </Card>
      ) : (
        <Textarea
          rows={12}
          value={responseTextInputStr}
          onChange={(e) => setResponseTextInputStr(e.target.value)}
          placeholder="Input your evaluation response parameter block string here..."
          className="min-h-[240px] rounded-lg bg-background border border-border/60 p-4 text-sm font-medium leading-relaxed resize-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      )}

      <Button
        onClick={handleCommitSubmissionSequence}
        disabled={isSubmissionPending}
        className="w-full h-12 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
      >
        {isSubmissionPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> <span>Transmitting Evaluation Matrix...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> <span>Commit Response for AI Band Grading</span>
          </div>
        )}
      </Button>
    </div>
  );
}
