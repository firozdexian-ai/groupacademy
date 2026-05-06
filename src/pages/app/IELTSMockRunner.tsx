import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";

export default function IELTSMockRunner() {
  const { section } = useParams<{ section: string }>();
  const [searchParams] = useSearchParams();
  const promptId = searchParams.get("prompt") ?? null;
  const navigate = useNavigate();

  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  const isAudio = section === "speaking";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecorder(mr);
      setRecording(true);
    } catch (e: any) {
      toast.error("Mic access denied");
    }
  };

  const stopRecording = () => {
    recorder?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (isAudio && !audioBlob) return toast.error("Record your answer first");
    if (!isAudio && !response.trim()) return toast.error("Write your answer first");
    setBusy(true);
    try {
      let audio_path: string | null = null;
      if (isAudio && audioBlob) {
        const { data: { user } } = await supabase.auth.getUser();
        const path = `${user!.id}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from("ielts-audio").upload(path, audioBlob);
        if (upErr) throw upErr;
        audio_path = path;
      }
      const { data, error } = await supabase.functions.invoke("ai-ielts-evaluate", {
        body: { section, prompt_id: promptId, response_text: response, audio_path },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Band ${data.band} (${data.was_free ? "free" : data.credits_spent + " credits"})`);
      navigate(`/app/abroad/ielts/results/${data.attempt_id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold capitalize">{section} Mock</h1>
        <p className="text-sm text-muted-foreground">{isAudio ? "Speak your answer for 1-2 minutes" : "Write your answer (250+ words for writing)"}</p>
      </div>

      <Card className="p-3 bg-muted/30">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</div>
        <div className="text-sm mt-1">
          {section === "writing" && "Some people believe technology has made our lives easier; others argue it has made us lazier. Discuss both views and give your own opinion."}
          {section === "speaking" && "Describe a place you would like to visit. You should say where it is, how you would travel there, what you would do there, and explain why you want to visit."}
          {section === "reading" && "Read the passage and answer comprehension questions (sample task)."}
          {section === "listening" && "Listen to the audio and answer questions (sample task)."}
          {section === "full" && "Complete all 4 sections in order. We'll grade each."}
        </div>
      </Card>

      {isAudio ? (
        <Card className="p-6 text-center">
          {recording ? (
            <Button onClick={stopRecording} variant="destructive" size="lg"><Square className="h-5 w-5 mr-2" />Stop</Button>
          ) : (
            <Button onClick={startRecording} size="lg"><Mic className="h-5 w-5 mr-2" />{audioBlob ? "Re-record" : "Start recording"}</Button>
          )}
          {audioBlob && <div className="text-xs text-muted-foreground mt-2">Recorded ({(audioBlob.size / 1024).toFixed(0)} KB)</div>}
        </Card>
      ) : (
        <Textarea rows={12} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your answer here..." />
      )}

      <Button onClick={submit} disabled={busy} className="w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Submit for AI grading
      </Button>
    </div>
  );
}
