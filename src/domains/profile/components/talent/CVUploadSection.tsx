import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { downloadFile } from "@/lib/downloadFile";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCv } from "@/domains/jobs/api/jobsApi";

interface ParsedCVData {
  fullName?: string;
  phone?: string;
  email?: string;
  education?: any[];
  experience?: any[];
  skills?: any[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  achievements?: any[];
  profileType?: string;
  currentStatus?: string;
  institution?: string;
  fieldOfStudy?: string;
  customProfession?: string;
  professionCategoryId?: string;
}

const PARSING_STAGES = [
  { progress: 0, message: "Uploading document..." },
  { progress: 20, message: "Reading file..." },
  { progress: 40, message: "Extracting details..." },
  { progress: 60, message: "Analyzing skills..." },
  { progress: 80, message: "Mapping experience..." },
  { progress: 95, message: "Updating profile..." },
];

/**
 * GroUp Academy: Psychometric CV Artifact Ingress Terminal (CVUploadSection)
 * An authoritative operational sandbox managing dynamic PDF/Word storage commits and automated AI parsing steps.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CVUploadSection() {
  const queryClient = useQueryClient();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Synchronize component lifecycles to safely drop dangling background updates
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("cv_ingress_node_mounted");
    return () => {
      isMountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const hasCV = useMemo(() => !!talent?.cvUrl, [talent?.cvUrl]);

  const clearSyncInterval = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  const simulateHandshake = () => {
    clearSyncInterval();
    let currentStageIndex = 0;

    syncIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearSyncInterval();
        return;
      }

      if (currentStageIndex < PARSING_STAGES.length - 1) {
        currentStageIndex++;
        setCurrentStage(currentStageIndex);
        setUploadProgress(PARSING_STAGES[currentStageIndex].progress);
      } else {
        clearSyncInterval();
      }
    }, 1800);
  };

  const handleArtifactIngestion = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFileNode = event.target.files?.[0];
    if (!selectedFileNode) return;

    // PROTOCOL LOCK: Quantitative Ingress Format Validation Check
    const allowedMimeTypesCollection = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedMimeTypesCollection.includes(selectedFileNode.type)) {
      toast.error("Invalid format. Please upload PDF or Word documents (.doc, .docx) only.");
      trackEvent("cv_ingress_invalid_format_intercepted", { fileType: selectedFileNode.type });
      return;
    }

    // PROTOCOL LOCK: Quantitative Volume Payload Verification Check (Ceiling Standard: 5MB)
    const MAX_CV_BYTE_SIZE_CEILING = 5 * 1024 * 1024;
    if (selectedFileNode.size > MAX_CV_BYTE_SIZE_CEILING) {
      toast.error("File too large. Maximum size is 5MB.");
      trackEvent("cv_ingress_size_overflow_intercepted", { fileSize: selectedFileNode.size });
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setCurrentStage(0);

    trackEvent("cv_ingress_upload_initiated", { size: selectedFileNode.size });
    simulateHandshake();

    try {
      // STORAGE PIPELINE TRANSACT EXECUTION
      const fileExtensionString = selectedFileNode.name.split(".").pop();
      const nonCollidingUniqueFileNameStr = `${talent?.id || "node"}-${Date.now()}.${fileExtensionString}`;
      const fullTargetStoragePathStr = `cvs/${nonCollidingUniqueFileNameStr}`;

      const { publicUrl: generatedPublicCvUrlStr } = await uploadPortfolioFile(
        fullTargetStoragePathStr,
        selectedFileNode,
        { upsert: true },
      ).catch((e: any) => {
        throw new Error(`Upload failed: ${e.message}`);
      });

      if (!generatedPublicCvUrlStr) {
        throw new Error("Upload failed: Could not retrieve file URL.");
      }

      // Execute AI Parser
      if (isMountedRef.current) {
        setCurrentStage(2);
        setUploadProgress(40);
      }

      let edgeFunctionResponsePayload: any;
      try {
        edgeFunctionResponsePayload = await parseCv({ cvUrl: generatedPublicCvUrlStr });
      } catch (parseEdgeFunctionRpcError) {
        throw parseEdgeFunctionRpcError;
      }

      clearSyncInterval();

      if (isMountedRef.current) {
        setCurrentStage(5);
        setUploadProgress(95);
      }

      // PROFILE HYDRATION LAYER: Commit parsed matrices down configuration rows
      if (edgeFunctionResponsePayload?.success && edgeFunctionResponsePayload?.parsedData) {
        const parsedNodePayload: ParsedCVData = edgeFunctionResponsePayload.parsedData;
        const compiledSyncPayloadBlock: Record<string, any> = {
          cvUrl: generatedPublicCvUrlStr,
          cvParsedAt: new Date().toISOString(),
        };

        if (parsedNodePayload.fullName) compiledSyncPayloadBlock.fullName = parsedNodePayload.fullName.trim();
        if (parsedNodePayload.phone) compiledSyncPayloadBlock.phone = parsedNodePayload.phone.trim();
        if (Array.isArray(parsedNodePayload.education) && parsedNodePayload.education.length)
          compiledSyncPayloadBlock.education = parsedNodePayload.education;
        if (Array.isArray(parsedNodePayload.experience) && parsedNodePayload.experience.length)
          compiledSyncPayloadBlock.experience = parsedNodePayload.experience;
        if (Array.isArray(parsedNodePayload.skills) && parsedNodePayload.skills.length)
          compiledSyncPayloadBlock.skills = parsedNodePayload.skills;
        if (parsedNodePayload.linkedinUrl) compiledSyncPayloadBlock.linkedinUrl = parsedNodePayload.linkedinUrl.trim();
        if (parsedNodePayload.customProfession)
          compiledSyncPayloadBlock.customProfession = parsedNodePayload.customProfession.trim();
        if (parsedNodePayload.professionCategoryId)
          compiledSyncPayloadBlock.professionCategoryId = parsedNodePayload.professionCategoryId;

        await updateTalent(compiledSyncPayloadBlock);
        trackEvent("cv_ingress_profile_hydrated_completely");
      } else {
        // Fallback pass: Commit raw document parameters to secure active file links cleanly
        await updateTalent({ cvUrl: generatedPublicCvUrlStr, cvParsedAt: new Date().toISOString() });
        trackEvent("cv_ingress_file_saved_without_hydration");
      }

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      await refreshTalent();

      if (isMountedRef.current) {
        setUploadProgress(100);
        toast.success("CV uploaded. Your profile has been updated.");
      }
    } catch (caughtPipelineExceptionErr: any) {
      clearSyncInterval();
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "CVUploadSection",
        action: "commit_cv_artifact_ingress_pipeline",
      });

      if (isMountedRef.current) {
        setError(formattedExceptionMsgStr);
        toast.error("CV upload failed. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden transition-colors hover:border-border/60">
      {/* HUD LEVEL 1: TOP SUMMARY TEXT LABELS ROW HEADER */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full leading-none">
          <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 flex-1 text-left">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
              <Zap className="h-4 w-4 text-primary fill-primary/10 stroke-[2.2] shrink-0 animate-pulse" />
              <span>Upload your CV</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
              We'll auto-fill your profile from your CV using AI.
            </CardDescription>
          </div>
          {hasCV && (
            <Badge
              variant="outline"
              className="rounded px-2 h-5.5 text-[9px] font-extrabold tracking-wider uppercase border border-transparent bg-success/10 text-success dark:text-success gap-1 flex items-center leading-none shadow-xs shrink-0 select-none"
            >
              <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>CV on file</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 w-full min-w-0 flex flex-col justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          disabled={isUploading}
          className="hidden select-none sr-only pointer-events-none"
          aria-hidden="true"
          onChange={handleArtifactIngestion}
        />

        {/* LOADING PROCESSING OVERLAY TIMELINE VIEW */}
        {isUploading ? (
          <div className="space-y-3 py-2 animate-in fade-in duration-200 select-none w-full leading-none">
            <div className="flex items-center justify-between gap-4 font-bold text-xs uppercase tracking-wider font-mono w-full text-muted-foreground/60">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5] shrink-0" />
                <span className="truncate text-ellipsis animate-pulse italic block">
                  {PARSING_STAGES[currentStage]?.message || "PROCESSING..."}
                </span>
              </div>
              <span className="text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/5 shadow-xs tabular-nums">
                {uploadProgress}%
              </span>
            </div>
            <Progress
              value={uploadProgress}
              className="h-2 rounded-full border-none bg-primary/10 shadow-inner w-full block"
            />
            <p className="text-[9px] text-primary/40 uppercase font-bold text-center tracking-widest leading-none pt-1 animate-pulse select-none">
              Extracting your details…
            </p>
          </div>
        ) : error ? (
          /* CORE CRITICAL PROCESSSING FAULT DISPLAY ROW */
          <div className="space-y-4 animate-in slide-in-from-top-1 duration-200 w-full font-bold text-xs tracking-tight">
            <div className="flex gap-3 items-start p-4 rounded-xl border border-destructive/15 bg-destructive/[0.015] leading-normal text-left w-full min-w-0">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 stroke-[2.5] mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-destructive dark:text-destructive select-none leading-none">
                  CV upload failed
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground/60 max-w-full break-words select-text pt-0.5">
                  {error}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1.5 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Try again</span>
            </Button>
          </div>
        ) : hasCV ? (
          /* COGNITIVE ACTIVE FILE CONFIRMED TILES */
          <div className="space-y-4 animate-in zoom-in-99 duration-200 w-full font-bold text-xs tracking-tight">
            <div className="flex gap-3.5 items-center p-4 rounded-xl border border-success/15 bg-success/[0.015] select-none leading-none w-full min-w-0">
              <div className="h-9 w-9 rounded-xl bg-success/10 border border-success/5 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="h-4.5 w-4.5 text-success dark:text-success stroke-[2.5]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wide text-success dark:text-success leading-none">
                  CV uploaded
                </p>
                <p className="text-[10px] font-extrabold text-muted-foreground/50 uppercase tracking-wider block pt-1.5 leading-none">
                  Your profile was auto-filled from your CV.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full shrink-0 select-none font-bold text-xs">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-10 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shadow-sm hover:bg-accent gap-1.5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Upload new CV</span>
              </Button>
              {talent?.cvUrl && (
                <Button
                  type="button"
                  onClick={() => {
                    trackEvent("cv_ingress_download_triggered");
                    downloadFile(talent.cvUrl!, `${talent.fullName || "CV_ARTIFACT"}.pdf`);
                  }}
                  className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95 flex items-center justify-center p-0"
                  title="Download CV"
                >
                  <Download className="h-4 w-4 stroke-[2.5]" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* COLD COLD-START COLD INVITATION INITIAL ENGAGEMENT BOARD */
          <div
            role="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative border border-dashed border-border/40 rounded-xl p-8 sm:p-12 text-center select-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all bg-card/20 hover:bg-card/40 hover:border-border/80 group/cvbox shadow-sm w-full flex flex-col justify-center items-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] via-transparent to-transparent pointer-events-none select-none transition-opacity duration-300" />
            <div className="relative z-10 space-y-4 w-full flex flex-col items-center justify-center">
              <div className="h-14 w-14 bg-background border border-border/40 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 ease-out transform group-hover/cvbox:scale-102 group-hover/cvbox:rotate-2 shadow-sm shrink-0">
                <Upload className="h-5 w-5 text-primary stroke-[2.2]" />
              </div>
              <div className="space-y-1.5 leading-none text-center font-bold text-xs tracking-tight">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground/80 leading-none">
                  Upload your CV
                </p>
                <p className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-widest block leading-none pt-0.5">
                  Supported formats: PDF, DOC, DOCX &bull; Max size: 5MB
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-5 rounded-xl font-bold uppercase text-[9px] tracking-wider shadow-sm shrink-0 pointer-events-none bg-muted text-muted-foreground"
              >
                Select file
              </Button>
            </div>
          </div>
        )}

        {/* BOTTOM METRIC RIBBON OVERLAY LABEL */}
        <div className="mt-6 flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full">
          <Zap className="h-3.5 w-3.5 text-warning fill-warning/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Profile auto-fill powered by AI</span>
        </div>
      </CardContent>
    </Card>
  );
}
