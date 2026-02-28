import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { Copy, Check, ExternalLink, Upload, ImagePlus, Sparkles, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface ExternalApplicationPrepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  applicationUrl: string;
  jobTitle: string;
  companyName: string;
}

interface QAResult {
  question: string;
  answer: string;
}

const SCRAPE_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Connecting to application page..." },
  { progress: 15, message: "Scraping application page..." },
  { progress: 30, message: "Detecting form questions..." },
  { progress: 45, message: "Analyzing your profile..." },
  { progress: 60, message: "Generating personalized answers..." },
  { progress: 80, message: "Writing tailored responses..." },
  { progress: 92, message: "Preparing your prep sheet..." },
];

const SCREENSHOT_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Analyzing screenshots..." },
  { progress: 30, message: "Extracting questions..." },
  { progress: 55, message: "Matching with your profile..." },
  { progress: 80, message: "Generating personalized answers..." },
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
  const [answers, setAnswers] = useState<QAResult[]>([]);
  const [generalSummary, setGeneralSummary] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(generalSummary);
    setSummaryCopied(true);
    toast.success("Summary copied!");
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const callEdgeFunction = useCallback(async (payload: Record<string, unknown>) => {
    console.log("[ApplyAI] callEdgeFunction called with:", JSON.stringify(payload).slice(0, 200));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in to continue.");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      console.log("[ApplyAI] Fetching edge function...");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prepare-external-application`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("[ApplyAI] Response status:", response.status);

      if (!response.ok) {
        let errBody: any = {};
        try { errBody = await response.json(); } catch {}
        clearTimeout(timeoutId);
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      console.log("[ApplyAI] Parsed response data keys:", data ? Object.keys(data) : "null");
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Request timed out. The application page may be too complex. Try uploading screenshots instead.");
      }
      throw err;
    }
  }, []);

  const startScrape = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setIsScreenshotMode(false);

    try {
      console.log("[ApplyAI] Starting scrape for job:", jobId);
      const data = await callEdgeFunction({
        job_id: jobId,
        application_url: applicationUrl,
        mode: "scrape",
      });

      console.log("[ApplyAI] Scrape result - scrape_failed:", data?.scrape_failed, "answers:", data?.answers?.length);

      if (data?.scrape_failed) {
        setGeneralSummary(data.general_summary || "");
        setPhase("scrape_failed");
      } else {
        setAnswers(data?.answers || []);
        setGeneralSummary(data?.general_summary || "");
        setPhase("results");
      }
    } catch (err: any) {
      console.error("[ApplyAI] Scrape error:", err);
      if (err.message?.includes("Insufficient credits")) {
        setError("You don't have enough credits. You need 50 credits for this service.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
      setPhase("scrape_failed");
    }
  }, [jobId, applicationUrl, callEdgeFunction]);

  const submitScreenshots = async () => {
    if (screenshots.length === 0) {
      toast.error("Please upload at least one screenshot");
      return;
    }

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
      console.error("[ApplyAI] Screenshot error:", err);
      setError(err.message || "Something went wrong");
      setPhase("scrape_failed");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + screenshots.length > 5) {
      toast.error("Maximum 5 screenshots allowed");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshots((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger scrape when dialog opens via useEffect (onOpenChange doesn't fire on programmatic open)
  useEffect(() => {
    if (open) {
      setAnswers([]);
      setGeneralSummary("");
      setScreenshots([]);
      setError(null);
      setPhase("loading");
      startScrape();
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Apply with AI
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {jobTitle} at {companyName}
          </p>
        </DialogHeader>

        {/* Loading state */}
        {phase === "loading" && !error && (
          <ProcessingCard
            title={isScreenshotMode ? "Analyzing Screenshots" : "Preparing Application"}
            stages={isScreenshotMode ? SCREENSHOT_STAGES : SCRAPE_STAGES}
            duration={isScreenshotMode ? 45000 : 60000}
            className="border-0 shadow-none"
          />
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={startScrape}>
              Try Again
            </Button>
          </div>
        )}

        {/* Scrape failed - screenshot fallback */}
        {phase === "scrape_failed" && !error && (
          <div className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm font-medium text-warning-foreground mb-1">
                We couldn't read this application page
              </p>
              <p className="text-xs text-muted-foreground">
                This page may require login or use a format we can't scrape. Upload screenshots of the application questions instead.
              </p>
            </div>

            {/* General summary if available */}
            {generalSummary && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Your Application Summary</h3>
                    <Button variant="ghost" size="sm" onClick={handleCopySummary} className="h-7 px-2">
                      {summaryCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                    <ReactMarkdown>{generalSummary}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Screenshot upload */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Upload screenshots of the questions</p>

              <div className="grid grid-cols-3 gap-2">
                {screenshots.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {screenshots.length < 5 && (
                  <label className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={submitScreenshots} disabled={screenshots.length === 0} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Screenshots ({screenshots.length}/5)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(applicationUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase === "results" && !error && (
          <div className="space-y-4">
            {/* Q&A pairs */}
            {answers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{answers.length}</Badge>
                  Detected Questions
                </h3>
                {answers.map((qa, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="pt-3 pb-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">{qa.question}</p>
                      <Textarea
                        value={qa.answer}
                        onChange={(e) => {
                          const updated = [...answers];
                          updated[i] = { ...updated[i], answer: e.target.value };
                          setAnswers(updated);
                        }}
                        className="text-xs min-h-[80px] resize-y"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => handleCopy(qa.answer, i)}
                      >
                        {copiedIndex === i ? (
                          <><Check className="w-3.5 h-3.5 mr-1.5" /> Copied!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Answer</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* General Summary */}
            {generalSummary && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Application Summary</h3>
                    <Button variant="ghost" size="sm" onClick={handleCopySummary} className="h-7 px-2">
                      {summaryCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                    <ReactMarkdown>{generalSummary}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Open Application button */}
            <Button
              className="w-full"
              onClick={() => window.open(applicationUrl, "_blank")}
            >
              Open Application <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
