import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Intelligent CV Ingress Node
 * CTO Reference: Authoritative interface for CV artifact parsing and profile synchronization.
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

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const hasRegistryCV = !!talent?.cvUrl;

  const executeTelemetrySimulation = () => {
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setProgress(PARSING_STAGES[stageIndex].progress);
        setMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
    return interval;
  };

  const processDataIngress = async (file: File) => {
    if (!talent?.id) return toast.error("AUTH_SYNC_REQUIRED");

    // Academy Standard: PDF/DOCX only
    const validMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validMime.includes(file.type)) return toast.error("INVALID_FORMAT: PDF or Word required");
    if (file.size > 5 * 1024 * 1024) return toast.error("DATA_OVERFLOW: Max 5MB limit");

    setIsProcessing(true);
    setError(null);
    setUploadSuccess(false);
    setProgress(0);
    setMessage("INITIALIZING_INGRESS...");

    const telemetryInterval = executeTelemetrySimulation();

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/NODE_CV_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      // Invoke Neural Parsing Logic
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      clearInterval(telemetryInterval);

      if (parseError || !parseResult?.success) {
        // Fallback: Registry Sync only (skip parsing)
        await updateTalent({ cvUrl: publicUrl });
        toast.success("ARTIFACT_SYNCED_WITHOUT_PARSING");
      } else {
        const parsed = parseResult.parsed as ParsedCVData;
        const updatePayload: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        // Intelligent Merge Protocol: Prioritize existing high-fidelity talent data
        if (parsed.full_name && (!talent.fullName || talent.fullName.includes("@")))
          updatePayload.fullName = parsed.full_name;
        if (parsed.phone && !talent.phone) updatePayload.phone = parsed.phone;
        if (parsed.skills?.length && !talent.skills?.length) updatePayload.skills = parsed.skills;

        if (parsed.experience?.length && (!talent.experience || (talent.experience as any[]).length === 0)) {
          updatePayload.experience = parsed.experience.map((exp) => ({
            company: exp.company || "UNNAMED_ENTITY",
            position: exp.title || "POSITION_NODE",
            description: exp.description || "",
          }));
        }

        await updateTalent(updatePayload);
        toast.success("NEURAL_PROFILE_SYNC_COMPLETE");
      }

      await refreshTalent();
      setProgress(100);
      setMessage("SYNC_VERIFIED");
      setUploadSuccess(true);
      onUploadComplete?.();
    } catch (err: any) {
      clearInterval(telemetryInterval);
      setError(err.message || "SYNC_FAULT");
      toast.error("INGRESS_FAULT_DETECTED");
    } finally {
      setIsProcessing(false);
    }
  };

  // VIEW: SYNC_VERIFIED_STATE
  if ((hasRegistryCV || uploadSuccess) && !isProcessing && !error) {
    return (
      <div className="flex items-center justify-between p-4 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl animate-in zoom-in-95 duration-500">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-black uppercase italic text-emerald-700 leading-none">
              Registry_Artifact_Verified
            </p>
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 italic">
              Ready for trajectory deployment
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg font-black uppercase text-[10px] tracking-widest text-emerald-700 hover:bg-emerald-500/10"
          onClick={() => fileInputRef.current?.click()}
        >
          REPLACE_NODE
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

  // VIEW: PROCESSING_STATE
  if (isProcessing) {
    return (
      <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-[28px] space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-background border-2 border-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase italic text-primary tracking-widest leading-none">
                {message}
              </span>
              <span className="text-[10px] font-mono text-primary/40 leading-none">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-primary/10" />
          </div>
        </div>
        <p className="text-[9px] font-medium text-muted-foreground/40 text-center italic uppercase tracking-widest">
          Neural layer parsing artifact... Time index: ~25s
        </p>
      </div>
    );
  }

  // VIEW: FAULT_STATE
  if (error) {
    return (
      <div className="p-4 bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl flex items-center justify-between animate-in shake-2">
        <div className="flex items-center gap-4">
          <AlertCircle className="h-6 w-6 text-rose-500" />
          <div className="text-left">
            <p className="text-[11px] font-black uppercase italic text-rose-500 leading-none">Ingress_Sync_Fault</p>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 truncate max-w-[150px]">
              {error}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-xl border-2 font-black uppercase italic text-[10px] gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <RefreshCw className="h-3.5 w-3.5" /> RETRY_SYNC
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

  // VIEW: INITIAL_INGRESS_PROMPT
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
        e.dataTransfer.files[0] && processDataIngress(e.dataTransfer.files[0]);
      }}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "group relative border-2 border-dashed rounded-[28px] p-10 text-center cursor-pointer transition-all duration-500",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02] shadow-2xl"
          : "border-border/40 hover:border-primary/40 hover:bg-muted/5 shadow-inner",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-[22px] bg-background border-2 border-border/10 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <Upload className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-black uppercase italic tracking-tighter">Initialize_Artifact_Ingress</p>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] italic">
            PDF | WORD • MAX 5MB • NEURAL_PARSING_ACTIVE
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 rounded-xl px-6 font-black uppercase italic text-[10px] tracking-widest mt-2 border-2 border-transparent hover:border-primary/20 transition-all"
        >
          SELECT_DATA_NODE
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
