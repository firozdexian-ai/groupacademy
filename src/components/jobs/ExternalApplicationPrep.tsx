import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { Copy, Check, ExternalLink, Upload, ImagePlus, Sparkles, X, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Autonomous Application Deployment Node
 * CTO Reference: Authoritative interface for external form decryption and response synthesis.
 */

interface ExternalApplicationPrepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  applicationUrl: string;
  jobTitle: string;
  companyName: string;
}

const SCRAPE_STAGES: ProcessingStage[] = [
  { progress: 0, message: "INITIALIZING_REMOTE_SYNC" },
  { progress: 15, message: "DECRYPTING_FORM_STRUCTURE" },
  { progress: 30, message: "MAPPING_QUESTION_NODES" },
  { progress: 45, message: "INJECTING_PROFILE_ARTIFACTS" },
  { progress: 60, message: "SYNTHESIZING_PERSONALIZED_DATA" },
  { progress: 80, message: "FINALIZING_RESPONSE_BLUEPRINTS" },
];

const SCREENSHOT_STAGES: ProcessingStage[] = [
  { progress: 0, message: "ANALYZING_VISION_SYNC" },
  { progress: 30, message: "EXTRACTING_TEXT_CLUSTER" },
  { progress: 55, message: "MAPPING_TRAJECTORY_FIT" },
  { progress: 80, message: "SYNTHESIZING_DATA" },
];

type Phase = "loading" | "scrape_failed" | "results";

export function ExternalApplicationPrep({
  open,
  onOpenChange,
  jobId,
  applicationUrl,
  jobTitle,
  companyName,
}: ExternalApplicationPrepProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<any[]>([]);
  const [generalSummary, setGeneralSummary] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const executeCopyProtocol = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("ARTIFACT_SYNCED_TO_CLIPBOARD");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const callEdgeFunction = useCallback(async (payload: Record<string, unknown>) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("AUTH_SYNC_REQUIRED");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prepare-external-application`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errBody: any = {};
        try {
          errBody = await response.json();
        } catch {}
        throw new Error(errBody.error || `SYNC_FAULT (${response.status})`);
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError")
        throw new Error("SYNC_TIMEOUT: Application structure complex. Switch to VISION_SYNC.");
      throw err;
    }
  }, []);

  const startScrapeProtocol = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setIsScreenshotMode(false);

    try {
      const data = await callEdgeFunction({
        job_id: jobId,
        application_url: applicationUrl,
        mode: "scrape",
      });

      if (data?.scrape_failed) {
        setGeneralSummary(data.general_summary || "");
        setPhase("scrape_failed");
      } else {
        setAnswers(data?.answers || []);
        setGeneralSummary(data?.general_summary || "");
        setPhase("results");
        toast.success("APPLICATION_MAPPING_VERIFIED");
      }
    } catch (err: any) {
      setError(err.message || "NEURAL_SYNC_FAULT");
      setPhase("scrape_failed");
    }
  }, [jobId, applicationUrl, callEdgeFunction]);

  const executeVisionSync = async () => {
    if (screenshots.length === 0) return toast.error("MIN_1_SCREENSHOT_REQUIRED");
    setPhase("loading");
    setIsScreenshotMode(true);
    setError(null);

    try {
      const data = await callEdgeFunction({
        job_id: jobId,
        application_url: applicationUrl,
        mode: "screenshot",
        screenshots,
      });
      setAnswers(data?.answers || []);
      setGeneralSummary(data?.general_summary || "");
      setPhase("results");
    } catch (err: any) {
      setError(err.message || "VISION_SYNC_FAULT");
      setPhase("scrape_failed");
    }
  };

  useEffect(() => {
    if (open) {
      setAnswers([]);
      setGeneralSummary("");
      setScreenshots([]);
      setError(null);
      startScrapeProtocol();
    }
  }, [open, startScrapeProtocol]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[40px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl p-0 no-scrollbar">
        {/* HUD: HEADER */}
        <div className="p-8 border-b-2 border-border/10 bg-primary/5">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-primary fill-current animate-pulse" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Apply_with_AI
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  Autonomous_Deploy: {jobTitle} @ {companyName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          {/* LOADING_STATE */}
          {phase === "loading" && !error && (
            <div className="py-12 animate-in zoom-in-95 duration-500">
              <ProcessingCard
                title={isScreenshotMode ? "VISION_SYNC_ACTIVE" : "NEURAL_FORM_DECRYPTION"}
                stages={isScreenshotMode ? SCREENSHOT_STAGES : SCRAPE_STAGES}
                duration={isScreenshotMode ? 30000 : 45000}
                className="border-2 border-primary/20 bg-primary/5 rounded-[32px]"
              />
            </div>
          )}

          {/* ERROR_STATE */}
          {error && (
            <div className="text-center py-16 space-y-6 animate-in shake-2">
              <div className="w-20 h-20 bg-rose-500/10 rounded-[28px] border-2 border-rose-500/20 flex items-center justify-center mx-auto shadow-2xl">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase italic text-rose-500">Sync_Protocol_Fault</p>
                <p className="text-[11px] font-medium text-muted-foreground italic px-12">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={startScrapeProtocol}
                className="h-12 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2"
              >
                <Zap className="h-4 w-4" /> RETRY_SYNC
              </Button>
            </div>
          )}

          {/* FALLBACK_INGRESS: Screenshot Mode */}
          {phase === "scrape_failed" && !error && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="p-6 bg-warning/5 border-2 border-warning/20 rounded-[28px] shadow-inner relative overflow-hidden">
                <Zap className="absolute -top-2 -right-2 h-16 w-16 text-warning opacity-10 rotate-12" />
                <p className="text-[11px] font-black uppercase tracking-widest text-warning-foreground mb-2 italic">
                  Remote_Scrape_Failed
                </p>
                <p className="text-[10px] font-medium text-muted-foreground italic leading-relaxed">
                  Application architecture detected as non-scrappable (SPA/Auth Gate). Initialize VISION_SYNC by
                  uploading screenshots of required fields.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 italic">
                  Vision_Ingress_Queue
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {screenshots.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-2xl overflow-hidden border-2 border-border shadow-xl group"
                    >
                      <img
                        src={src}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      <button
                        onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {screenshots.length < 5 && (
                    <label className="aspect-video rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all group">
                      <ImagePlus className="w-6 h-6 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                      <span className="text-[8px] font-black uppercase mt-2 italic text-primary/40">ADD_ARTIFACT</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((f) => {
                            const r = new FileReader();
                            r.onload = () => setScreenshots((prev) => [...prev, r.result as string].slice(0, 5));
                            r.readAsDataURL(f);
                          });
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={executeVisionSync}
                    disabled={screenshots.length === 0}
                    className="flex-1 h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 gap-3"
                  >
                    <Upload className="w-5 h-5" /> INITIALIZE_VISION_SYNC ({screenshots.length}/5)
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 w-14 rounded-2xl border-2"
                    onClick={() => window.open(applicationUrl, "_blank")}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RESULTS_HUD: Tailored Artifacts */}
          {phase === "results" && !error && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-1000 text-left">
              {answers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground italic">
                        Detected_Form_Nodes
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-6 rounded-lg bg-primary/5 border-primary/20 text-primary font-black italic"
                    >
                      {answers.length}_KEYS
                    </Badge>
                  </div>
                  {answers.map((qa, i) => (
                    <Card
                      key={i}
                      className="rounded-[28px] border-2 border-border/40 bg-background/40 backdrop-blur-sm overflow-hidden shadow-xl transition-all hover:border-primary/20"
                    >
                      <CardContent className="p-6 space-y-4">
                        <p className="text-[11px] font-black uppercase italic text-muted-foreground/60 tracking-widest leading-none flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Q: {qa.question}
                        </p>
                        <Textarea
                          value={qa.answer}
                          onChange={(e) => {
                            const updated = [...answers];
                            updated[i] = { ...updated[i], answer: e.target.value };
                            setAnswers(updated);
                          }}
                          className="text-xs font-medium min-h-[100px] border-2 bg-muted/20 rounded-2xl italic leading-relaxed p-4"
                        />
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all active:scale-95"
                          onClick={() => executeCopyProtocol(qa.answer, i)}
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-4 h-4" /> ARTIFACT_SYNCED
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" /> COPY_RESPONSE
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {generalSummary && (
                <Card className="rounded-[32px] border-2 border-primary/10 bg-primary/5 overflow-hidden shadow-inner">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic">
                        Executive_Deploy_Summary
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await navigator.clipboard.writeText(generalSummary);
                          setSummaryCopied(true);
                          toast.success("SUMMARY_SYNCED");
                          setTimeout(() => setSummaryCopied(false), 2000);
                        }}
                        className="h-10 w-10 rounded-xl hover:bg-primary/10"
                      >
                        {summaryCopied ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-primary" />
                        )}
                      </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-[11px] leading-relaxed italic text-muted-foreground/80 font-medium">
                      <ReactMarkdown>{generalSummary}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-primary/40 transition-all active:scale-95 gap-4"
                onClick={() => window.open(applicationUrl, "_blank")}
              >
                OPEN_EXTERNAL_PORTAL <ExternalLink className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
