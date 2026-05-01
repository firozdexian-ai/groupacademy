import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  ImagePlus,
  RotateCcw,
  AlertCircle,
  Camera,
  Type,
  Sparkles,
  ArrowRight,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Job Intelligence Acquisition Node
 * CTO Reference: Authoritative interface for structured job data extraction and curation.
 */

interface JobPostingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function JobPostingGigForm({ gig, talentId, onSubmitted }: JobPostingGigFormProps) {
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

  const handleVisionIngress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const executeIntelligenceSync = async () => {
    setIsParsing(true);
    setParseError(null);

    try {
      let payload: any = {};

      if (inputMode === "image" && screenshotFile) {
        toast.info("VISION_SYNC: Uploading evidence...");
        const fileName = `gig-job-screenshots/${talentId}/${Date.now()}-${screenshotFile.name}`;
        const { error: uploadError } = await supabase.storage.from("job-assets").upload(fileName, screenshotFile);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("job-assets").getPublicUrl(fileName);
        setSourceImageUrl(publicUrl);
        payload = { imageUrl: publicUrl };
      } else {
        if (jobText.length < MIN_INGRESS_CHARS) throw new Error(`Requires_Min_${MIN_INGRESS_CHARS}_Chars`);
        payload = { rawText: jobText };
      }

      // INGRESS: Invoke Edge Function for AI Parsing
      const { data, error } = await supabase.functions.invoke("parse-job-post", { body: payload });
      if (error) throw error;

      const parsed = data.parsed || data;
      setParsedRaw(parsed);
      setEditTitle(parsed.title || "");
      setEditCompany(parsed.company_name || "");
      setEditLocation(parsed.location || "");
      setEditJobType(parsed.job_type || "");

      toast.success("AI_EXTRACTION_VERIFIED");
    } catch (err: any) {
      setParseError(err.message || "SYNC_FAULT");
      toast.error("PROTOCOL_SYNC_FAILED");
    } finally {
      setIsParsing(false);
    }
  };

  const finalizeArtifactSubmission = async () => {
    setIsSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("gig_submissions")
        .insert({
          gig_id: gig.id,
          talent_id: talentId,
          status: "pending",
          submission_data: {
            input_method: inputMode,
            source: inputMode === "text" ? jobText : sourceImageUrl,
            curated_data: { title: editTitle, company: editCompany, location: editLocation, type: editJobType },
            ai_meta: parsedRaw,
          },
        })
        .select("id")
        .single();

      if (error) throw error;
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      triggerAutoReview(inserted.id);
      toast.success("Submitted — auto-review in progress");
      onSubmitted();
    } catch (err: any) {
      toast.error("SUBMISSION_FAULT");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {!hasParsedSync ? (
        <div className="space-y-8">
          {/* HUD: INPUT_PROTOCOL_TOGGLE */}
          <div className="p-1.5 bg-muted/20 backdrop-blur-md rounded-[22px] flex gap-2 border-2 border-border/40">
            {(["text", "image"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-3 rounded-[16px] text-[10px] font-black uppercase italic tracking-[0.2em] transition-all duration-500",
                  inputMode === mode
                    ? "bg-background text-primary shadow-xl scale-[1.02]"
                    : "text-muted-foreground/60 hover:text-foreground",
                )}
              >
                {mode === "text" ? <Type className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {mode === "text" ? "DATA_TEXT" : "VISION_SYNC"}
              </button>
            ))}
          </div>

          {inputMode === "text" ? (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-500">
              <Label className="text-[10px] font-black uppercase italic tracking-[0.3em] text-muted-foreground ml-1">
                Ingress_Payload
              </Label>
              <Textarea
                placeholder="Initialize job data paste sequence..."
                className="rounded-[28px] border-2 border-border/60 min-h-[200px] resize-none bg-background/50 p-6 font-medium italic focus-visible:ring-primary/20"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
              <Label className="text-[10px] font-black uppercase italic tracking-[0.3em] text-muted-foreground ml-1">
                Evidence_Capture
              </Label>
              <div className="relative group">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleVisionIngress}
                  className="hidden"
                  id="vision-capture"
                />
                <label
                  htmlFor="vision-capture"
                  className={cn(
                    "flex flex-col items-center justify-center py-14 border-2 border-dashed rounded-[32px] cursor-pointer transition-all duration-500",
                    screenshotFile
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-border/40 hover:border-primary/20 bg-card/50",
                  )}
                >
                  {screenshotPreview ? (
                    <div className="relative h-40 w-full px-10">
                      <img
                        src={screenshotPreview}
                        className="h-full w-full object-contain rounded-2xl shadow-2xl"
                        alt="SYNC_PREVIEW"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                        <Badge className="bg-primary uppercase font-black italic">UPDATE_ARTIFACT</Badge>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-lg">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
                        STAGING_EVIDENCE_NODE
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {parseError && (
            <div className="bg-rose-500/10 border-2 border-rose-500/20 p-5 rounded-[24px] flex gap-4 items-center animate-in shake-2">
              <AlertCircle className="h-6 w-6 text-rose-500" />
              <p className="text-[10px] font-black text-rose-500 uppercase italic tracking-widest leading-none">
                {parseError}
              </p>
            </div>
          )}

          <Button
            onClick={executeIntelligenceSync}
            disabled={isParsing || (inputMode === "text" ? jobText.length < MIN_INGRESS_CHARS : !screenshotFile)}
            className="w-full rounded-2xl h-16 font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
          >
            {isParsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6 fill-current" />}
            {isParsing ? "SYNAPSE_PROCESSING..." : "PROCESS_INTELLIGENCE"}
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-1000">
          {/* CURATION_HUD: Extracted Artifact Verification */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground italic">
                Curation_Verification
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-[9px] font-black uppercase italic border-2 border-border/40 hover:bg-muted/10 gap-2"
              onClick={() => setParsedRaw(null)}
            >
              <RotateCcw className="h-3.5 w-3.5" /> RE_INITIALIZE
            </Button>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border-2 border-border/40 rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Briefcase className="h-32 w-32 rotate-12" />
            </div>

            <div className="grid gap-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic ml-1">
                  Target_Role_Identity
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-2xl border-2 bg-background/30 pl-12 h-12 font-black italic uppercase tracking-tighter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic ml-1">
                  Parent_Organization
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="rounded-2xl border-2 bg-background/30 pl-12 h-12 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic ml-1">
                    Deployment_Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="rounded-2xl border-2 bg-background/30 pl-12 h-12 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic ml-1">
                    Contract_Model
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                      value={editJobType}
                      onChange={(e) => setEditJobType(e.target.value)}
                      className="rounded-2xl border-2 bg-background/30 pl-12 h-12 text-[10px] font-black uppercase italic tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </div>

            {sourceImageUrl && (
              <div className="pt-4 border-t-2 border-border/10">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mb-4 italic">
                  Source_Artifact_Evidence
                </p>
                <img
                  src={sourceImageUrl}
                  className="rounded-2xl h-28 w-full object-cover border-2 border-border/20 opacity-40 hover:opacity-80 transition-opacity"
                />
              </div>
            )}
          </div>

          <Button
            onClick={finalizeArtifactSubmission}
            disabled={!canFinalize}
            className="w-full rounded-[24px] h-16 font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all gap-4"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
            COMMIT_TO_REGISTRY
          </Button>
        </div>
      )}
    </div>
  );
}
