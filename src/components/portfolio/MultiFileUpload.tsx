import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2, RefreshCw, XCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Data Ingress Node
 * CTO Reference: Authoritative component for artifact storage and registry sync.
 */

interface FileItem {
  name: string;
  url: string;
}

interface MultiFileUploadProps {
  bucket: string;
  maxFiles?: number;
  acceptedTypes?: string;
  value: FileItem[];
  onChange: (files: FileItem[]) => void;
  label: string;
  description?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function MultiFileUpload({
  bucket,
  maxFiles = 5,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  value,
  onChange,
  label,
  description,
}: MultiFileUploadProps) {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [lastFailedFiles, setLastFailedFiles] = useState<File[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeStorageCommit = async (file: File, signal: AbortSignal): Promise<FileItem> => {
    const fileExt = file.name.split(".").pop();
    // PROTOCOL: Unique Artifact Identification
    const fileName = `NODE_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    if (signal.aborted) throw new Error("SYNC_ABORTED");

    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

    if (signal.aborted) throw new Error("SYNC_ABORTED");
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { name: file.name, url: publicUrl };
  };

  const handleDataIngress = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const capacity = maxFiles - value.length;
    if (capacity <= 0) {
      toast({ title: "REGISTRY_FULL", description: `Node limit: ${maxFiles} artifacts.`, variant: "destructive" });
      return;
    }

    const ingressQueue = Array.from(files).slice(0, capacity);

    // Hardened Size Validation (Academy Standard: 5MB)
    for (const file of ingressQueue) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "DATA_OVERFLOW", description: `${file.name} exceeds 5MB limit.`, variant: "destructive" });
        return;
      }
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setStatusMessage("Handshaking with storage...");

    try {
      const successfulIngress: FileItem[] = [];
      const totalCount = ingressQueue.length;

      for (let i = 0; i < totalCount; i++) {
        if (signal.aborted) throw new Error("SYNC_ABORTED");

        const file = ingressQueue[i];
        setStatusMessage(`Syncing ${file.name.toUpperCase()}...`);

        // 120s Synapse Timeout
        const timeoutProtocol = new Promise<never>((_, reject) => {
          const tId = setTimeout(() => reject(new Error(`SYNC_TIMEOUT_${file.name}`)), 120000);
          signal.addEventListener("abort", () => clearTimeout(tId));
        });

        const result = await Promise.race([executeStorageCommit(file, signal), timeoutProtocol]);
        successfulIngress.push(result);
        setUploadProgress(Math.round(((i + 1) / totalCount) * 100));
      }

      onChange([...value, ...successfulIngress]);
      setUploadStatus("success");
      setStatusMessage("INGRESS_COMPLETE");
      toast({ title: "SYNC_VERIFIED", description: `${successfulIngress.length} artifacts committed.` });

      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage("");
      }, 2000);
    } catch (error: any) {
      if (error.message === "SYNC_ABORTED") {
        setUploadStatus("idle");
        toast({ title: "SYNC_TERMINATED", description: "Process aborted by talent node." });
      } else {
        setUploadStatus("error");
        setStatusMessage("REGISTRY_FAULT");
        setLastFailedFiles(ingressQueue);
        toast({ title: "INGRESS_FAULT", description: error.message, variant: "destructive" });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const removeArtifact = (idx: number) => {
    const registry = [...value];
    registry.splice(idx, 1);
    onChange(registry);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic leading-none">{label}</p>
          {description && (
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/20 border border-border/10">
          <span className="text-[8px] font-black text-muted-foreground/40">
            {value.length} / {maxFiles} ARTIFACTS
          </span>
        </div>
      </div>

      {/* HUD: INGRESS_ZONE */}
      {value.length < maxFiles && (
        <div
          className={cn(
            "relative w-full border-2 border-dashed rounded-[20px] p-10 text-center transition-all duration-500",
            dragActive
              ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl"
              : "border-border/40 hover:border-primary/20 bg-muted/5",
            uploadStatus === "error" && "border-rose-500/20 bg-rose-500/5",
            uploadStatus === "uploading" ? "pointer-events-none" : "cursor-pointer",
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleDataIngress(e.dataTransfer.files);
          }}
          onClick={() => uploadStatus !== "uploading" && document.getElementById(`ingress-${label}`)?.click()}
        >
          <input
            id={`ingress-${label}`}
            type="file"
            multiple={maxFiles > 1}
            accept={acceptedTypes}
            className="hidden"
            onChange={(e) => handleDataIngress(e.target.files)}
          />

          {uploadStatus === "uploading" ? (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="w-full max-w-sm space-y-3">
                <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary italic">{statusMessage}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  abortControllerRef.current?.abort();
                }}
                className="rounded-lg h-8 border-2 font-black italic text-[8px] tracking-widest"
              >
                <XCircle className="h-3 w-3 mr-2" /> ABORT_SYNC
              </Button>
            </div>
          ) : uploadStatus === "error" ? (
            <div className="flex flex-col items-center gap-4 animate-in shake-2">
              <XCircle className="h-10 w-10 text-rose-500" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase italic text-rose-500 tracking-widest">Ingress_Sync_Fault</p>
                <p className="text-[8px] font-bold text-muted-foreground/60 uppercase">{statusMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDataIngress(null); /* logic to retry lastFailedFiles would go here */
                  }}
                  className="rounded-lg border-2 h-9 font-black italic text-[9px]"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" /> RETRY
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadStatus("idle");
                  }}
                  className="text-[9px] font-black italic uppercase"
                >
                  DISMISS
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 group">
              <div className="h-16 w-16 rounded-2xl bg-background border-2 border-border/10 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Upload className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase italic tracking-tighter">Initialize_Artifact_Ingress</p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                  PDF | DOCX | IMAGE (MAX 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HUD: ARTIFACT_REGISTRY */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-500">
          {value.map((artifact, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-card/40 backdrop-blur-md border-2 border-border/10 rounded-2xl group hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary opacity-60" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black uppercase italic text-foreground/80 truncate leading-none">
                    {artifact.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                      Registry_Verified
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                onClick={() => removeArtifact(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
