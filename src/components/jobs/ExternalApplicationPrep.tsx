import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { Copy, Check, ExternalLink, Upload, ImagePlus, Sparkles, X, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Autonomous Application Deployment Node (ExternalApplicationPrep)
 * CTO Reference: Authoritative interface for external form decryption and response synthesis.
 * Version: Launch Candidate · Phase Z0 Hardened
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
  { progress: 15, message: "INITIALIZING_REMOTE_SYNC" },
  { progress: 35, message: "DECRYPTING_FORM_STRUCTURE" },
  { progress: 55, message: "MAPPING_QUESTION_NODES" },
  { progress: 70, message: "INJECTING_PROFILE_ARTIFACTS" },
  { progress: 85, message: "SYNTHESIZING_PERSONALIZED_DATA" },
  { progress: 95, message: "FINALIZING_RESPONSE_BLUEPRINTS" },
];

const SCREENSHOT_STAGES: ProcessingStage[] = [
  { progress: 15, message: "ANALYZING_VISION_SYNC" },
  { progress: 45, message: "EXTRACTING_TEXT_CLUSTER" },
  { progress: 75, message: "MAPPING_TRAJECTORY_FIT" },
  { progress: 95, message: "SYNTHESIZING_DATA" },
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
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<any[]>([]);
  const [generalSummary, setGeneralSummary] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  // Monitor autonomous tracking workflow impressions via telemetry hooks
  useEffect(() => {
    if (open && jobId) {
      trackEvent("external_application_prep_mounted", { jobId, companyName });
    }
  }, [open, jobId, companyName]);

  const executeCopyProtocol = async (textStr: string, index: number) => {
    if (!textStr) return;
    await navigator.clipboard.writeText(textStr.trim());
    setCopiedIndex(index);
    trackEvent("external_application_copy_executed", { index, jobId });
    toast.success("Response asset path synchronized to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const callEdgeFunction = useCallback(
    async (payload: Record<string, unknown>) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        trackError(sessionError || "Unauthenticated session token check intercepted.", {
          component: "ExternalApplicationPrep",
          action: "security_context_assertion",
        });
        throw new Error("AUTH_SYNC_REQUIRED");
      }

      const abortControllerInstance = new AbortController();
      const networkTimeoutId = setTimeout(() => abortControllerInstance.abort(), 60000);

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prepare-external-application`, {
          method: "POST",
          signal: abortControllerInstance.signal,
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
          throw new Error(errBody.error || `Edge synapse process failure status token: [${response.status}]`);
        }

        const parsedData = (await response.ok) ? await response.json() : null;
        return parsedData;
      } catch (err: any) {
        if (err.name === "AbortError") {
          trackError("Ecosystem network connection timeout triggered over external form scraping lookup.", {
            component: "ExternalApplicationPrep",
            action: "abort_controller_timeout",
            jobId,
          });
          throw new Error(
            "SYNC_TIMEOUT: Form topology structure contains complex nesting records. Switch to Vision Screen Upload mode.",
          );
        }
        throw err;
      } finally {
        // 1. Memory Leak Resolved: Ensure active connection tracking timers clear systematically
        clearTimeout(networkTimeoutId);
      }
    },
    [jobId],
  );

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

      // Automated Efficiency: Broadcast explicit cache updates across shared pools instantly
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (data?.scrape_failed) {
        setGeneralSummary(data.general_summary || "");
        setPhase("scrape_failed");
        trackEvent("external_application_scrape_fallback_triggered", { jobId });
      } else {
        setAnswers(data?.answers || []);
        setGeneralSummary(data?.general_summary || "");
        setPhase("results");
        trackEvent("external_application_scrape_success", { jobId, keysYielded: data?.answers?.length });
        toast.success("Ecosystem autonomous mapping verified successfully");
      }
    } catch (err: any) {
      const exceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(exceptionMsg, {
        component: "ExternalApplicationPrep",
        action: "start_scrape_protocol_mutation",
        jobId,
        applicationUrl,
      });

      setError(exceptionMsg);
      setPhase("scrape_failed");
    }
  }, [jobId, applicationUrl, callEdgeFunction, queryClient]);

  const executeVisionSync = async () => {
    if (screenshots.length === 0) {
      toast.error("Staging context requires at least one screenshot evidence file asset.");
      return;
    }

    setPhase("loading");
    setIsScreenshotMode(true);
    setError(null);

    trackEvent("external_application_vision_sync_started", { jobId, fileDensity: screenshots.length });

    try {
      const data = await callEdgeFunction({
        job_id: jobId,
        application_url: applicationUrl,
        mode: "screenshot",
        screenshots,
      });

      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      setAnswers(data?.answers || []);
      setGeneralSummary(data?.general_summary || "");
      setPhase("results");
      trackEvent("external_application_vision_sync_success", { jobId });
    } catch (err: any) {
      const exceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(exceptionMsg, {
        component: "ExternalApplicationPrep",
        action: "execute_vision_sync_mutation",
        jobId,
        applicationUrl,
      });

      setError(exceptionMsg);
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
    <Dialog
      open={open}
      onOpenChange={(visibleState) => {
        if (phase !== "loading") {
          onOpenChange(visibleState);
          if (!visibleState) trackEvent("external_application_prep_dismissed", { jobId });
        }
      }}
    >
      <DialogContent
        className="sm:max-w-2xl w-[94vw] sm:w-full border border-border/40 bg-background/98 backdrop-blur-xl rounded-2xl shadow-2xl p-0 max-h-[90vh] max-h-[90svh] overflow-y-auto pt-safe pb-safe-bottom transform-gpu selection:bg-primary/20"
        style={{ contentVisibility: "auto" }}
      >
        {/* HUD: MODAL CONTAINER BRANDING HEADER SECTION */}
        <div className="p-5 sm:p-6 border-b border-border/20 bg-primary/5 select-none text-left">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3.5 w-full min-w-0">
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground uppercase tracking-wide">
                  Apply Strategy Optimization
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 truncate max-w-full">
                  Deployment Profile: {jobTitle} &bull; {companyName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* MAIN CONTENT WORKSPACE SECTION */}
        <div className="p-5 sm:p-6 pt-2 space-y-5">
          {/* VIEW PROTOCOL 1: LOADING_STATE TRACK PANEL */}
          {phase === "loading" && !error && (
            <div className="py-8 animate-in scale-in duration-200 select-none w-full">
              <ProcessingCard
                title={isScreenshotMode ? "Vision Engine Core Parsing" : "Autonomous Decryption Blueprint Matrix"}
                stages={isScreenshotMode ? SCREENSHOT_STAGES : SCRAPE_STAGES}
                duration={isScreenshotMode ? 30000 : 45000}
                className="border border-primary/20 bg-primary/5 rounded-2xl"
              />
            </div>
          )}

          {/* VIEW PROTOCOL 2: EXCEPTION_ERROR_STATE MODAL CONTAINER */}
          {error && (
            <div className="text-center py-10 space-y-4 animate-in fade-in duration-300 select-none w-full">
              <div className="w-16 h-16 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <AlertCircle className="w-6 h-6 text-rose-500 stroke-[2.2]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto px-2 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
                  Synchronization Protocol Fault
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground/80 leading-normal italic select-text mt-1">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={startScrapeProtocol}
                className="h-9 px-4 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-primary fill-primary/10 stroke-[2.2]" />
                <span>Retry Channel Sync</span>
              </Button>
            </div>
          )}

          {/* VIEW PROTOCOL 3: FALLBACK_VISION_INGRESS PROMPT DRAW ZONE */}
          {phase === "scrape_failed" && !error && (
            <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300 text-left w-full">
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl shadow-inner relative overflow-hidden select-none">
                <Zap className="absolute -top-3 -right-3 h-14 w-14 text-amber-500 opacity-5 rotate-12 pointer-events-none select-none" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1 leading-none pl-0.5">
                  Remote Scrape Gate Intercepted
                </p>
                <p className="text-[11px] font-medium text-muted-foreground/90 leading-relaxed italic pl-0.5 pr-2">
                  Application form mapping interface structured behind Single-Page authorization gates. Initialize
                  Vision Core processing loops by dropping screenshot captures of required question rows below.
                </p>
              </div>

              <div className="space-y-2 w-full">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-0.5 italic select-none leading-none">
                  Vision Ingress Staging Queue
                </p>

                <div className="grid grid-cols-3 gap-3 w-full max-w-full select-none">
                  {screenshots.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-xl overflow-hidden border border-border/40 shadow-sm group transform-gpu transition-transform hover:scale-102 duration-200"
                    >
                      <img
                        src={src}
                        alt="Staged evidence context file asset template slice"
                        className="w-full h-full object-cover border-none"
                        loading="eager"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent("external_application_screenshot_purged", { index: i });
                          setScreenshots((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Remove screenshot"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}

                  {screenshots.length < 5 && (
                    <label className="aspect-video rounded-xl border border-dashed border-primary/20 bg-primary/5 hover:bg-card/40 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all duration-300 group shadow-sm">
                      <ImagePlus className="w-5 h-5 text-primary/50 group-hover:scale-105 transition-transform duration-300" />
                      <span className="text-[8px] font-bold uppercase mt-1.5 tracking-wider text-primary/60 pl-0.5">
                        Stage Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          trackEvent("external_application_screenshots_added", { batchSize: files.length });
                          files.forEach((f) => {
                            const reader = new FileReader();
                            reader.onload = () =>
                              setScreenshots((prev) => [...prev, reader.result as string].slice(0, 5));
                            reader.readAsDataURL(f);
                          });
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-2 select-none w-full">
                  <Button
                    onClick={executeVisionSync}
                    disabled={screenshots.length === 0}
                    type="button"
                    className="flex-1 h-11 rounded-xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all cursor-pointer gap-2"
                  >
                    <Upload className="w-4 h-4 text-white stroke-[2.2]" />
                    <span>Initialize Vision Processing Matrix ({screenshots.length} / 5)</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="h-11 w-11 rounded-xl border border-border/60 hover:bg-accent shrink-0 shadow-sm cursor-pointer active:scale-90 transition-transform"
                    onClick={() => {
                      trackEvent("external_portal_manual_opened", { jobId });
                      window.open(applicationUrl, "_blank", "noopener,noreferrer");
                    }}
                    aria-label="Open native form source direction layout link"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground/80 stroke-[2.2]" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW PROTOCOL 4: RESULTS_HUD NORMALIZED ALIGNMENT PROMPTS */}
          {phase === "results" && !error && (
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500 text-left w-full min-w-0">
              {answers.length > 0 && (
                <div className="space-y-3.5 w-full min-w-0">
                  <div className="flex items-center justify-between px-0.5 select-none border-b border-border/10 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/90 truncate pl-0.5">
                        Extracted Ingress Form Blocks
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-extrabold h-5 px-2 bg-primary/5 text-primary border-primary/20 rounded-md tracking-wide uppercase shadow-sm select-none tabular-nums"
                    >
                      {answers.length} parameters mapped
                    </Badge>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 w-full min-w-0">
                    {answers.map((qaItem, index) => {
                      if (!qaItem) return null;
                      return (
                        <Card
                          key={index}
                          className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-200 hover:border-border/60 w-full min-w-0 text-left"
                        >
                          <CardContent className="p-4 space-y-2.5 w-full min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/90 leading-tight select-text flex items-start gap-2 break-words w-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0 select-none" />
                              <span className="flex-1 min-w-0">Question Node: {qaItem.question}</span>
                            </p>

                            <Textarea
                              value={qaItem.answer || ""}
                              onChange={(e) => {
                                const modifiedArrayBuffer = [...answers];
                                modifiedArrayBuffer[index] = { ...modifiedArrayBuffer[index], answer: e.target.value };
                                setAnswers(modifiedArrayBuffer);
                              }}
                              className="text-xs font-semibold sm:text-sm text-foreground/90 min-h-[90px] border border-border/30 bg-muted/20 rounded-xl leading-relaxed p-3.5 resize-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40 select-text"
                            />

                            <Button
                              variant="outline"
                              type="button"
                              className="w-full h-9 rounded-xl border border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 cursor-pointer shadow-sm select-none"
                              onClick={() => executeCopyProtocol(qaItem.answer, index)}
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5] animate-in zoom-in-95 duration-200" />
                                  <span>Response Pin Synced</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground/80 stroke-[2.2]" />
                                  <span>Copy Token Alignment Response</span>
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comprehensive Executive Blueprint Document Summary */}
              {generalSummary && (
                <Card className="rounded-2xl border border-primary/10 bg-primary/[0.01] dark:bg-primary/[0.002] shadow-inner text-left w-full min-w-0 animate-in fade-in duration-300">
                  <CardContent className="p-5 space-y-3 w-full min-w-0">
                    <div className="flex items-center justify-between select-none pb-2 border-b border-border/10">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary pl-0.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/5 stroke-[2.2]" />
                        <span>Executive Strategy Overview Blueprint</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(generalSummary.trim());
                          setSummaryCopied(true);
                          trackEvent("external_application_summary_copied", { jobId });
                          toast.success("Affiliate deployment strategy profile pinned to clipboard");
                          setTimeout(() => setSummaryCopied(false), 2000);
                        }}
                        className="h-8 w-8 rounded-xl border border-border/40 bg-background/60 hover:bg-primary/5 cursor-pointer shadow-sm transition-transform active:scale-90 shrink-0"
                      >
                        {summaryCopied ? (
                          <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] animate-in zoom-in-95 duration-200" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground/80 stroke-[2.2]" />
                        )}
                      </Button>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground/90 font-medium select-text selection:bg-primary/10 max-h-40 overflow-y-auto pr-1 break-words">
                      <ReactMarkdown>{generalSummary}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Core Outbound Target Link Dispatcher Node */}
              <Button
                type="button"
                className="w-full h-11 rounded-xl font-black uppercase italic tracking-wider shadow-md active:scale-[0.99] transition-transform select-none cursor-pointer gap-2 mt-2"
                onClick={() => {
                  trackEvent("external_portal_final_redirect_launched", { jobId });
                  window.open(applicationUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <span>Launch Destination Career Portal</span>
                <ExternalLink className="h-4 w-4 text-white stroke-[2.5]" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
