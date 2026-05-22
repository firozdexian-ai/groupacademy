import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { checkCvDuplicate, uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { computeCVFingerprint } from "@/lib/onboarding/cvFingerprint";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, CheckCircle2, Sparkles, User, AlertCircle, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseCv } from "@/domains/jobs/api/jobsApi";

interface CVUploadStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  experience?: Array<{ company?: string; title?: string; description?: string }>;
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 20, message: "Uploading document matrix..." },
  { progress: 40, message: "Analyzing layout structures..." },
  { progress: 60, message: "Extracting core skill nodes..." },
  { progress: 80, message: "Synthesizing trajectory map..." },
  { progress: 95, message: "Committing telemetry parameters..." },
];

/**
 * GroUp Academy: Candidate CV Ingress & Cognitive Parsing Hub (CVUploadStep)
 * An authoritative onboarding step orchestrating resume chunk extraction, duplication fingerprint tracking, and automated profiling.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CVUploadStep({ onContinue, onSkip }: CVUploadStepProps) {
  const queryClient = useQueryClient();
  const { talent, updateTalent, refreshTalent } = useTalent();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [parseComplete, setParseComplete] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Core safety reference tracking active interval tickers to protect against memory leaks
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (talent?.cvUrl) {
      setUploadedFile(talent.cvUrl);
    }
  }, [talent?.cvUrl]);

  // Monitor CV wizard workspace step views safely via analytical tracking tools
  useEffect(() => {
    trackEvent("onboarding_cv_step_mounted", { hasExistingCV: !!talent?.cvUrl });

    // Cleanup Strategy: Ensure running intervals are cleanly purged upon container teardown
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [talent?.cvUrl]);

  const clearActiveProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressSimulation = () => {
    clearActiveProgressInterval();
    let stageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setParseProgress(PARSING_STAGES[stageIndex].progress);
        setParseMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      }
    }, 1100);
  };

  async function handleCVUpload(file: File) {
    if (!talent?.id) {
      toast.error("User context unreachable. Profile sync failed.");
      return;
    }

    const validMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validMimeTypes.includes(file.type)) {
      toast.error("Unsupported layout format. Please upload a verified PDF or DOCX file.");
      return;
    }

    setIsUploading(true);
    setIsParsing(false);
    setParseError(null);
    setParseComplete(false);

    trackEvent("onboarding_cv_upload_started", { fileSize: file.size, fileType: file.type });

    try {
      const fileExtensionStr = file.name.split(".").pop();
      const generatedBucketPath = `${talent.id}/cv_v3.${fileExtensionStr}`;

      const { publicUrl } = await uploadPortfolioFile(generatedBucketPath, file, { upsert: true });

      const absolutePublicFileUrlStr = publicUrl;

      setUploadedFile(absolutePublicFileUrlStr);
      setIsUploading(false);
      setIsParsing(true);

      startProgressSimulation();

      // Invoke remote Cognitive Extraction Edge Endpoint Node
      let parseInvokeResult: any = null;
      let invokeEdgeError: any = null;
      try {
        parseInvokeResult = await parseCv({ cvUrl: absolutePublicFileUrlStr });
      } catch (e: any) { invokeEdgeError = e; }

      clearActiveProgressInterval();

      if (invokeEdgeError || !parseInvokeResult?.success) {
        const structuralFallbackPayload = { cvUrl: absolutePublicFileUrlStr };
        await updateTalent(structuralFallbackPayload);

        trackEvent("onboarding_cv_parsing_failed_fallback_mode", { error: invokeEdgeError?.message });

        setParseError("Automated data extraction stalled. Core properties can be manually populated down the line.");
        toast.warning("File committed to storage successfully.");
        setIsParsing(false);
        setParseComplete(true);
        return;
      }

      const extractedCvSchemaNode = parseInvokeResult.parsed as ParsedCVData;
      setParsedData(extractedCvSchemaNode);
      setParseProgress(100);

      // Merge data blocks incrementally protecting custom user modifications safely
      const finalUpdatePayloadMap: Record<string, any> = {
        cvUrl: absolutePublicFileUrlStr,
        cvParsedAt: new Date().toISOString(),
      };

      const baseTalentNameString = talent.fullName ? String(talent.fullName).trim() : "";
      const automatedEmailPrefixStr = talent.email ? String(talent.email).split("@")[0].trim() : "";

      if (
        extractedCvSchemaNode.full_name &&
        (!baseTalentNameString || baseTalentNameString === automatedEmailPrefixStr)
      ) {
        finalUpdatePayloadMap.fullName = extractedCvSchemaNode.full_name.trim();
      }
      if (extractedCvSchemaNode.skills?.length && (!talent.skills || talent.skills.length === 0)) {
        finalUpdatePayloadMap.skills = extractedCvSchemaNode.skills;
      }
      if (extractedCvSchemaNode.experience?.length && (!talent.experience || talent.experience.length === 0)) {
        finalUpdatePayloadMap.experience = extractedCvSchemaNode.experience;
      }
      if (extractedCvSchemaNode.education?.length && (!talent.education || talent.education.length === 0)) {
        finalUpdatePayloadMap.education = extractedCvSchemaNode.education;
      }

      // Compute cryptographic fingerprint matching thresholds to protect unique user entries
      try {
        const computedStringFingerprint = await computeCVFingerprint(extractedCvSchemaNode);
        if (computedStringFingerprint) {
          finalUpdatePayloadMap.cvFingerprint = computedStringFingerprint;

          let rpcDuplicateCheckResult: any = null;
          let rpcError: any = null;
          try {
            rpcDuplicateCheckResult = await checkCvDuplicate({
              fingerprint: computedStringFingerprint,
              selfUserId: talent.userId,
            });
          } catch (e) {
            rpcError = e;
          }

          if (!rpcError) {
            const singularDuplicateRowNode = Array.isArray(rpcDuplicateCheckResult)
              ? rpcDuplicateCheckResult[0]
              : rpcDuplicateCheckResult;

            if (singularDuplicateRowNode?.duplicate) {
              finalUpdatePayloadMap.isSuspectedDuplicate = true;
              trackEvent("onboarding_cv_duplicate_flagged", { fingerprint: computedStringFingerprint });
            }
          }
        }
      } catch (fingerprintException) {
        trackError(fingerprintException, { component: "CVUploadStep", action: "resolve_fingerprint_check" });
      }

      await updateTalent(finalUpdatePayloadMap);

      // Dynamic Invalidation: Re-align server indices cleanly across connected components
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      await refreshTalent();

      toast.success("Document analyzed successfully. Onboarding variables pre-filled.");
      trackEvent("onboarding_cv_parsing_complete_success");

      setParseComplete(true);
      setIsParsing(false);
    } catch (globalUploadCatchError: any) {
      clearActiveProgressInterval();
      const parsedErrorString =
        globalUploadCatchError instanceof Error ? globalUploadCatchError.message : String(globalUploadCatchError);

      trackError(parsedErrorString, {
        component: "CVUploadStep",
        action: "execute_global_cv_upload_pipeline",
        talentId: talent?.id,
      });

      toast.error("Ecosystem transaction error: Core interface upload failed. Please retry.");
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const handleContinueWizardAction = () => {
    trackEvent("onboarding_cv_continue_clicked");
    onContinue();
  };

  const handleSkipWizardAction = () => {
    trackEvent("onboarding_cv_skip_clicked");
    onSkip();
  };

  const skillsCount = useMemo(() => parsedData?.skills?.length || 0, [parsedData?.skills]);
  const rolesCount = useMemo(() => parsedData?.experience?.length || 0, [parsedData?.experience]);

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-xl mx-auto text-left w-full antialiased transform-gpu">
      {/* HUD TITLE BANNER INFORMATION SECTOR */}
      <div className="mb-6 space-y-1.5 text-center select-none w-full leading-none">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
          Synchronize Professional Credentials
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-sm mx-auto">
          Commit your primary resume asset file so our cognitive layer can pre-populate alignment tracks. Configuration
          can be skipped.
        </p>
      </div>

      {/* DRAG AND DROP BOUNDARY TRACK ZONE */}
      <div
        className={cn(
          "relative w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 transform-gpu shadow-sm select-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.015] shadow-md"
            : "border-border/60 bg-background hover:border-primary/20 hover:bg-muted/10",
          (isUploading || isParsing) && "pointer-events-none opacity-50 will-change-transform animate-pulse",
          parseComplete && "border-emerald-500/20 bg-emerald-500/[0.01]",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFileTransferObj = e.dataTransfer;
          if (droppedFileTransferObj?.files?.length) {
            const rawDroppedFile = droppedFileTransferObj.files.item(0);
            if (rawDroppedFile) handleCVUpload(rawDroppedFile);
          }
        }}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 outline-none"
          disabled={isUploading || isParsing}
          onChange={(e) => {
            const htmlInputElementTarget = e.target;
            if (htmlInputElementTarget?.files?.length) {
              const rawInputFile = htmlInputElementTarget.files.item(0);
              if (rawInputFile) handleCVUpload(rawInputFile);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <Loader2 className="h-8 w-8 text-primary animate-spin stroke-[2.5]" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider animate-pulse">
              Streaming document array to secure index cloud…
            </p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center justify-center gap-5 w-full animate-in zoom-in-98 duration-200">
            <Sparkles className="h-8 w-8 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
            <div className="w-full max-w-[240px] space-y-2 mx-auto tabular-nums font-bold text-[10px] leading-none text-primary text-center">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/5 shadow-inner relative flex">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out shrink-0"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="tracking-wide animate-pulse uppercase pt-0.5">{parseMessage}</p>
            </div>
          </div>
        ) : parseComplete ? (
          <div className="flex flex-col items-center justify-center gap-2.5 animate-in fade-in duration-200">
            <div className="h-11 w-11 rounded-full bg-emerald-500/10 border border-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
              <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <p className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
              Ingress Transmission Complete
            </p>
            <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase leading-none">
              Drop secondary file structure to overwrite registry block
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3.5 group">
            <div className="h-11 w-11 rounded-xl bg-muted/40 border border-border/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/10 group-hover:text-primary shadow-sm">
              <FileText className="h-5 w-5 text-muted-foreground/60 transition-colors stroke-[2.2] group-hover:text-primary" />
            </div>
            <div className="space-y-1 text-center leading-none">
              <p className="text-sm font-bold text-foreground/80 uppercase tracking-wide leading-none">
                Commit Portfolio Assets
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Verified PDF or DOCX architectures up to 5MB allocations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PARSED DATA COGNITIVE LEDGER RESULTS DISPLAY AREA */}
      {(() => {
        if (!parsedData && !parseComplete) return null;

        if (parseError) {
          return (
            <div className="w-full mt-4 p-4 bg-rose-500/[0.02] dark:bg-rose-500/[0.002] border border-rose-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 text-left">
              <div className="flex items-center gap-2.5 mb-1.5 text-rose-600 dark:text-rose-400 select-none font-bold leading-none">
                <AlertCircle className="h-4.5 w-4.5 stroke-[2.5] shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Cognitive Ledger Advisory</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-muted-foreground pr-2 select-text">
                {parseError}
              </p>
            </div>
          );
        }

        return (
          <div className="w-full mt-4 p-4 border border-emerald-500/10 bg-emerald-500/[0.01] rounded-xl animate-in slide-in-from-bottom-2 duration-300 text-left">
            <div className="flex items-center gap-2.5 mb-3 select-none leading-none font-bold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 stroke-[2.5] shrink-0" />
              <span>Competency Variables Injected</span>
            </div>

            {parsedData?.full_name && (
              <div className="flex items-center gap-3 mb-3 p-2.5 bg-background/40 backdrop-blur-sm border border-border/20 rounded-xl text-left select-text">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/5 flex items-center justify-center shrink-0 select-none shadow-inner">
                  <User className="h-3.5 w-3.5 text-blue-600 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-foreground/90 tracking-tight truncate select-all leading-none">
                  {parsedData.full_name}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 font-bold text-xs select-none tracking-tight leading-none tabular-nums w-full">
              {skillsCount > 0 && (
                <div className="p-3 bg-background/40 border border-border/20 rounded-xl text-left flex flex-col justify-center shadow-sm">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block leading-none mb-1">
                    Extracted Skill Nodes
                  </span>
                  <p className="text-base font-black text-foreground/90 select-text leading-none pt-0.5">
                    {skillsCount} criteria metrics
                  </p>
                </div>
              )}
              {rolesCount > 0 && (
                <div className="p-3 bg-background/40 border border-border/20 rounded-xl text-left flex flex-col justify-center shadow-sm">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block leading-none mb-1">
                    Professional History
                  </span>
                  <p className="text-base font-black text-foreground/90 select-text leading-none pt-0.5">
                    {rolesCount} roles logged
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* HUD FOOTER MODULE TRANSACTION CONTROLS STRIP */}
      <div className="flex flex-col w-full gap-3 mt-6 pt-5 border-t border-border/10 select-none">
        <Button
          size="lg"
          type="button"
          onClick={handleContinueWizardAction}
          disabled={isParsing || isUploading}
          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider gap-1.5 shadow-md active:scale-[0.99] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>Commit & Continue Pathway</span>
          <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5] ml-0.5" />
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={handleSkipWizardAction}
          className="w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-foreground hover:bg-accent shrink-0 cursor-pointer shadow-none transition-transform active:scale-[0.99]"
          disabled={isParsing || isUploading}
        >
          Skip Profile Pre-fill Node
        </Button>
      </div>
    </div>
  );
}
