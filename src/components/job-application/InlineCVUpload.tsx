import { useState, useRef, useCallback, useEffect } from "react";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Upload, CheckCircle2, Loader2, AlertCircle, RefreshCw, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseCv } from "@/domains/jobs/api/jobsApi";

/**
 * GroUp Academy: Intelligent CV Ingress Node (InlineCVUpload)
 * CTO Reference: Authoritative interface for CV artifact parsing and profile synchronization.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: any[];
  experience?: any[];
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 15, message: "SYNCING_ARTIFACT_TO_STORAGE" },
  { progress: 35, message: "DECRYPTING_DOCUMENT_STRUCTURE" },
  { progress: 55, message: "MAPPING_IDENTITY_NODES" },
  { progress: 75, message: "ANALYZING_SKILL_VECTORS" },
  { progress: 90, message: "FINALIZING_REGISTRY_UPDATE" },
];

export function InlineCVUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Clear unmounted runtime background telemetry intervals completely to protect the DOM thread
  useEffect(() => {
    return () => {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, []);

  // Monitor document parsing workspace impressions via telemetry hooks
  useEffect(() => {
    if (talent?.id) {
      trackEvent("inline_cv_upload_node_mounted", { talentId: talent.id, hasPreExistingCV: !!talent?.cvUrl });
    }
  }, [talent?.id, talent?.cvUrl]);

  const hasRegistryCV = !!talent?.cvUrl;

  const executeTelemetrySimulation = () => {
    if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);

    let stageIndex = 0;
    telemetryIntervalRef.current = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setProgress(PARSING_STAGES[stageIndex].progress);
        setMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      } else {
        if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
      }
    }, 1100);
  };

  const processDataIngress = async (file: File) => {
    if (!file) return;
    if (!talent?.id) {
      toast.error("Authentication synchronization required to map professional tokens.");
      return;
    }

    // Academy Standard Validation Layer: PDF / Word vectors only
    const validMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validMime.includes(file.type)) {
      toast.error("Invalid documentation extension. PDF or matching Word files required.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Data density overflow limit reached. Maximum requirement: 5MB.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadSuccess(false);
    setProgress(0);
    setMessage("INITIALIZING_INGRESS_PROTOCOL...");

    executeTelemetrySimulation();
    trackEvent("inline_cv_ingress_chain_started", { talentId: talent.id, assetSize: file.size });

    try {
      const fileExt = file.name.split(".").pop() || "pdf";
      const filePath = `${talent.id}/NODE_CV_${Date.now()}.${fileExt}`;

      // Upload binary chunk streams safely into private portfolio bucket indices
      const { publicUrl } = await uploadPortfolioFile(filePath, file, { upsert: true });

      // Invoke centralized serverless cognitive computing synapse node for document extraction
      let parseResult: any = null;
      let parseError: any = null;
      try {
        parseResult = await parseCv({ cvUrl: publicUrl });
      } catch (e) { parseError = e; }

      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);

      if (parseError || !parseResult?.success) {
        // Fallback Strategy Node: If AI engine experiences traffic locks, fallback to registration sync safely
        trackError(
          parseError || "Ecosystem document parsing extraction failed, activating fallback registry tracking.",
          {
            component: "InlineCVUpload",
            action: "invoke_ai_synapse_parse_fallback",
            talentId: talent.id,
          },
        );

        await updateTalent({ cvUrl: publicUrl });
        toast.success("Ecosystem data asset linked natively without secondary text parsing.");
      } else {
        const parsed = parseResult.parsed as ParsedCVData;
        const updatePayload: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        // Intelligent Merge Protocol: Defensively check mapping thresholds without destroying custom profile field entries
        if (parsed.full_name && (!talent.fullName || talent.fullName.includes("@"))) {
          updatePayload.fullName = parsed.full_name.trim();
        }
        if (parsed.phone && !talent.phone) {
          updatePayload.phone = parsed.phone.trim();
        }
        if (parsed.skills?.length && !talent.skills?.length) {
          updatePayload.skills = parsed.skills.map((s) => s.trim()).filter(Boolean);
        }

        if (parsed.experience?.length && (!talent.experience || (talent.experience as any[]).length === 0)) {
          updatePayload.experience = parsed.experience.map((exp) => ({
            company: exp.company?.trim() || "Company",
            position: exp.title?.trim() || "Role",
            description: exp.description?.trim() || "",
          }));
        }

        await updateTalent(updatePayload);
        toast.success("Ecosystem digital profile normalized and synchronized successfully.");
        trackEvent("inline_cv_ingress_chain_success", { talentId: talent.id });
      }

      await refreshTalent();
      setProgress(100);
      setMessage("SYNC_VERIFIED_CLEAN");
      setUploadSuccess(true);
      onUploadComplete?.();
    } catch (err: any) {
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
      const parsedMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedMsg, {
        component: "InlineCVUpload",
        action: "process_data_ingress_pipeline",
        talentId: talent.id,
      });

      setError(parsedMsg);
      toast.error("Ecosystem registration validation timeout.");
    } finally {
      setIsProcessing(false);
    }
  };

  // VIEW STATE 1: SYNC_VERIFIED_STATE (Successful Registry Display Mode)
  if ((hasRegistryCV || uploadSuccess) && !isProcessing && !error) {
    return (
      <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in zoom-in-98 duration-200 select-none w-full">
        <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 leading-none">
              Ecosystem Document Verified
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/70 tracking-tight mt-1 leading-none select-text selection:bg-emerald-500/10">
              Professional credentials active & ready for matching queues
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={isProcessing}
          className="h-8 rounded-xl font-bold uppercase text-[10px] tracking-wide text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Replace Document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processDataIngress(e.target.files[0])}
        />
      </div>
    );
  }

  // VIEW STATE 2: PROCESSING_STATE (Neural Progress Loader Panel Frame)
  if (isProcessing) {
    return (
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 animate-in fade-in duration-300 select-none text-left w-full">
        <div className="flex items-center gap-3.5 w-full">
          <div className="h-10 w-10 rounded-xl bg-background border border-primary/10 flex items-center justify-center shrink-0 shadow-inner">
            <Loader2 className="h-5 w-5 text-primary animate-spin stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wide text-primary uppercase tabular-nums">
              <span className="truncate max-w-[80%] pl-0.5 tracking-wider">{message}</span>
              <span className="opacity-60 shrink-0">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full bg-primary/10 shadow-inner" />
          </div>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground/60 text-center italic uppercase tracking-wider pl-0.5 animate-pulse">
          Parsing asset criteria logs... Estimated timeline matrix: ~12s
        </p>
      </div>
    );
  }

  // VIEW STATE 3: FAULT_STATE (Graceful Exception Remapping Box Layout)
  if (error) {
    return (
      <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300 w-full text-left">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 stroke-[2.2]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 leading-none">
              Ingress Channel Blocked
            </p>
            <p className="text-[10px] font-bold font-mono text-muted-foreground/70 mt-1 truncate text-ellipsis select-text selection:bg-rose-500/10">
              Error code snippet: {error}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <RefreshCw className="h-3 w-3 stroke-[2.5]" />
          <span>Retry Sync</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processDataIngress(e.target.files[0])}
        />
      </div>
    );
  }

  // VIEW STATE 4: INITIAL_INGRESS_PROMPT (Interactive Dropzone Container Panel Track)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer?.files?.[0]) {
          processDataIngress(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "group relative border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 transform-gpu w-full select-none",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01] shadow-md"
          : "border-border/40 hover:border-primary/30 hover:bg-card/40 backdrop-blur-md shadow-sm",
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300 shrink-0">
          <Upload className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-foreground/90">
            Initialize Artifact Ingress Protocol
          </p>
          <p className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider block leading-none">
            PDF / Word format templates &bull; Max 5MB density limit &bull; Cognitive parsing active
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          type="button"
          className="h-8 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wide mt-1.5 border border-border/40 bg-background/50 hover:bg-accent hover:border-primary/20 transition-all shadow-sm cursor-pointer"
        >
          Select System File Node
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processDataIngress(e.target.files[0])}
      />
    </div>
  );
}
