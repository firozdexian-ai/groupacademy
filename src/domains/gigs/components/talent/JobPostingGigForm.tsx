import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadJobAsset } from "@/domains/jobs/repo/jobsRepo";
import { insertGigSubmission } from "@/domains/gigs/repo/gigsRepo";
import { parseJobPost } from "@/domains/jobs/api/jobsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import {
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  ImagePlus,
  RotateCcw,
  AlertCircle,
  Camera,
  Type,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobPostingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

/**
 * GroUp Academy: Job Intelligence Acquisition Node
 * CTO Reference: Authoritative interface for structured job data extraction and curation.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function JobPostingGigForm({ gig, talentId, onSubmitted }: JobPostingGigFormProps) {
  const queryClient = useQueryClient();
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [jobText, setJobText] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState("");

  const [parsedRaw, setParsedRaw] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState("");

  const MIN_INGRESS_CHARS = 20;
  const hasParsedSync = !!parsedRaw;
  const canFinalize = editTitle.trim() && editCompany.trim() && !isSubmitting;

  // Track initial curation view initialization parameters
  useEffect(() => {
    if (gig?.id) {
      trackEvent("job_posting_form_mounted", { gigId: gig.id, talentId });
    }
  }, [gig, talentId]);

  if (!gig || !gig.id || !talentId) {
    trackError("JobPostingGigForm mounted without explicit property mappings.", {
      component: "JobPostingGigForm",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleVisionIngress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);

    trackEvent("job_posting_vision_file_staged", { fileName: file.name, fileSize: file.size });

    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const executeIntelligenceSync = async () => {
    setIsParsing(true);
    setParseError(null);
    const toastId = toast.loading("Processing raw data through AI mapping syntax...");

    trackEvent("job_posting_intelligence_sync_started", { inputMode, talentId });

    try {
      let payload: any = {};

      if (inputMode === "image" && screenshotFile) {
        toast.info("VISION_SYNC: Streaming raw visual telemetry to asset grid...", { id: toastId });
        const fileName = `gig-job-screenshots/${talentId}/${Date.now()}-${screenshotFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

        const { publicUrl } = await uploadJobAsset(fileName, screenshotFile, { upsert: false });

        setSourceImageUrl(publicUrl);
        payload = { imageUrl: publicUrl };
      } else {
        if (jobText.trim().length < MIN_INGRESS_CHARS) {
          throw new Error(
            `Ingress content density boundary check failed. Minimum requirement: ${MIN_INGRESS_CHARS} chars.`,
          );
        }
        payload = { rawText: jobText.trim() };
      }

      // INGRESS: Invoke edge engine function for automated entity extraction parameters
      const data: any = await parseJobPost(payload as any);

      const parsed = data.parsed || data;
      if (!parsed) throw new Error("AI engine generated empty payload parsing tokens.");

      setParsedRaw(parsed);
      setEditTitle(parsed.title || "");
      setEditCompany(parsed.company_name || "");
      setEditLocation(parsed.location || "");
      setEditJobType(parsed.job_type || "");

      toast.success("AI data normalization completed successfully", { id: toastId });
      trackEvent("job_posting_intelligence_sync_success", { gigId: gig.id });
    } catch (err: any) {
      const exceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(exceptionMsg, {
        component: "JobPostingGigForm",
        action: "execute_intelligence_sync",
        inputMode,
        gigId: gig.id,
      });

      setParseError(exceptionMsg);
      toast.error("Data tracking connection failed. Verify asset inputs.", { id: toastId });
    } finally {
      setIsParsing(false);
    }
  };

  const finalizeArtifactSubmission = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Registering submission tokens into global ledger...");

    try {
      const inserted = await insertGigSubmission({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          input_method: inputMode,
          source: inputMode === "text" ? jobText : sourceImageUrl,
          curated_data: {
            title: editTitle.trim(),
            company: editCompany.trim(),
            location: editLocation.trim(),
            type: editJobType.trim(),
          },
          ai_meta: parsedRaw,
        },
      });

      // Load auto-review routines dynamically within a clean sandbox boundary container
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      await triggerAutoReview(inserted.id);

      // Automated Efficiency: Broadcast explicit cache updates across shared pools instantly
      queryClient.invalidateQueries({ queryKey: ["gig-submission-counts", talentId] });
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions", talentId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Asset logged elegantly for automated validation checks", { id: toastId });
      onSubmitted();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);

      trackError(msg, {
        component: "JobPostingGigForm",
        action: "finalize_artifact_submission",
        gigId: gig.id,
        talentId,
      });

      toast.error("Ledger connection layout validation timeout.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none sm:select-text antialiased max-w-full w-full">
      {!hasParsedSync ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* HUD: INPUT_PROTOCOL_TOGGLE Strip */}
          <div className="p-1.5 bg-muted/20 border border-border/40 backdrop-blur-md rounded-2xl flex gap-2 select-none">
            {(["text", "image"] as const).map((mode) => {
              const isSelectedMode = inputMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setInputMode(mode);
                    setParseError(null);
                    trackEvent("job_posting_mode_toggled", { selectedMode: mode });
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer transform-gpu outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isSelectedMode
                      ? "bg-background text-primary shadow-sm scale-102 font-extrabold"
                      : "text-muted-foreground/80 hover:text-foreground",
                  )}
                >
                  {mode === "text" ? (
                    <Type className="h-3.5 w-3.5 stroke-[2.2]" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 stroke-[2.2]" />
                  )}
                  <span>{mode === "text" ? "Paste text" : "Upload screenshot"}</span>
                </button>
              );
            })}
          </div>

          {inputMode === "text" ? (
            <div className="space-y-1.5 text-left animate-in slide-in-from-top-1 duration-200">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5 select-none">
                Job description
              </Label>
              <Textarea
                placeholder="Paste the full job description here..."
                className="rounded-2xl border border-border/40 min-h-[160px] resize-none bg-card/30 p-4 font-medium sm:text-sm text-xs leading-relaxed focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/40"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                disabled={isParsing}
              />
            </div>
          ) : (
            <div className="space-y-1.5 text-left animate-in slide-in-from-top-1 duration-200">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-0.5 select-none">
                Evidence Document Capture
              </Label>
              <div className="relative group w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleVisionIngress}
                  className="hidden"
                  id="vision-capture"
                  disabled={isParsing}
                />
                <label
                  htmlFor="vision-capture"
                  className={cn(
                    "flex flex-col items-center justify-center py-10 border border-dashed rounded-2xl cursor-pointer transition-all duration-300 w-full transform-gpu",
                    screenshotFile
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-border/40 hover:border-primary/30 bg-card/40 hover:bg-card/80 backdrop-blur-md shadow-sm",
                    isParsing && "opacity-40 pointer-events-none",
                  )}
                >
                  {screenshotPreview ? (
                    <div className="relative h-36 w-full px-6 select-none animate-in zoom-in-98 duration-200">
                      <img
                        src={screenshotPreview}
                        className="h-full w-full object-contain rounded-xl border border-border/20 shadow-md"
                        alt="Staged payload visualization preview file"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                        <Badge className="bg-primary text-[9px] font-extrabold px-2.5 py-0.5 rounded-md tracking-wider uppercase select-none shadow-md">
                          Replace Evidence File
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 select-none">
                      <div className="h-10 w-10 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-105">
                        <ImagePlus className="h-5 w-5 text-muted-foreground/80" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 pl-0.5">
                        Stage Screenshot Evidence Asset
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {parseError && (
            <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-xl flex gap-3 items-center animate-in fade-in duration-200 text-left select-text">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 stroke-[2.2]" />
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 break-words leading-tight tracking-tight flex-1">
                {parseError}
              </p>
            </div>
          )}

          <Button
            onClick={executeIntelligenceSync}
            disabled={isParsing || (inputMode === "text" ? jobText.trim().length < MIN_INGRESS_CHARS : !screenshotFile)}
            className="w-full rounded-xl h-11 font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2"
          >
            {isParsing ? (
              <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
            ) : (
              <Zap className="h-4 w-4 fill-primary-foreground/10" />
            )}
            <span>{isParsing ? "Extracting details..." : "Extract data with AI"}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500 w-full min-w-0">
          {/* CURATION_HUD: Extracted Tracking Curation Elements */}
          <div className="flex items-center justify-between px-0.5 select-none border-b border-border/10 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground/90 truncate">
                Review extracted details
              </h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="h-7 px-2.5 rounded-lg text-[10px] font-bold tracking-tight border-border/60 hover:bg-accent gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0 shadow-sm"
              onClick={() => {
                trackEvent("job_posting_reinitialize_clicked", { gigId: gig.id });
                setParsedRaw(null);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>Start over</span>
            </Button>
          </div>

          <div className="bg-card/50 border border-border/40 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden text-left w-full min-w-0">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
              <Briefcase className="h-24 w-24 rotate-12 text-primary" />
            </div>

            <div className="grid gap-4 relative z-10 w-full min-w-0">
              <div className="space-y-1 text-left w-full min-w-0">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-primary pl-0.5 select-none">
                  Job title
                </Label>
                <div className="relative w-full min-w-0">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="rounded-xl border border-border/40 bg-background/40 pl-10 h-10 font-bold text-xs sm:text-sm tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left w-full min-w-0">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-primary pl-0.5 select-none">
                  Employing Organization
                </Label>
                <div className="relative w-full min-w-0">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
                  <Input
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="E.g. Stripe Inc."
                    className="rounded-xl border border-border/40 bg-background/40 pl-10 h-10 font-bold text-xs sm:text-sm tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 w-full">
                <div className="space-y-1 text-left min-w-0">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-primary pl-0.5 select-none truncate block">
                    Deployment Location
                  </Label>
                  <div className="relative w-full min-w-0">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="E.g. Remote / London"
                      className="rounded-xl border border-border/40 bg-background/40 pl-10 h-10 font-bold text-xs sm:text-sm tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 w-full truncate"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left min-w-0">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-primary pl-0.5 select-none truncate block">
                    Contract Model
                  </Label>
                  <div className="relative w-full min-w-0">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
                    <Input
                      value={editJobType}
                      onChange={(e) => setEditJobType(e.target.value)}
                      placeholder="E.g. Full-time / Contract"
                      className="rounded-xl border border-border/40 bg-background/40 pl-10 h-10 font-bold text-[10px] sm:text-xs uppercase tracking-wide focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 w-full truncate"
                    />
                  </div>
                </div>
              </div>
            </div>

            {sourceImageUrl && (
              <div className="pt-3.5 border-t border-border/10 select-none w-full animate-in fade-in duration-200">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2 italic">
                  Source Image Context Evidence
                </p>
                <img
                  src={sourceImageUrl}
                  alt="Source visualization update"
                  className="rounded-xl h-24 w-full object-cover border border-border/30 opacity-40 hover:opacity-80 transition-all duration-300 shadow-inner"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <Button
            onClick={finalizeArtifactSubmission}
            disabled={!canFinalize}
            type="button"
            className="w-full rounded-xl h-11 font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all cursor-pointer gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>Post job gig</span>
          </Button>
        </div>
      )}
    </div>
  );
}
