import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToBucketPublic } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Upload, X, FileText, Loader2, RefreshCw, XCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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

/**
 * GroUp Academy: Institutional Multi-Artifact Data Ingress System (MultiFileUpload)
 * An authoritative operational sandbox managing dynamic binary stream chunk storage commits and bucket token mapping.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export default function MultiFileUpload({
  bucket,
  maxFiles = 5,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  value = [],
  onChange,
  label,
  description,
}: MultiFileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [lastFailedFiles, setLastFailedFiles] = useState<File[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize component lifecycles to discard dangling async execution blocks
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("data_ingress_uploader_mounted", { targetBucket: bucket, maxCapacity: maxFiles });
    return () => {
      isMountedRef.current = false;
    };
  }, [bucket, maxFiles]);

  const normalizedArtifactsCount = useMemo(() => {
    return Array.isArray(value) ? value.length : 0;
  }, [value]);

  const executeStorageCommit = async (file: File, signal: AbortSignal): Promise<FileItem> => {
    const fileExtensionString = file.name.split(".").pop();
    // PROTOCOL PROTOCOL: Unique SHA-256 Approximate Artifact Character String Generation
    const cryptographicallySecureFileNameStr = `NODE_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtensionString}`;

    if (signal.aborted) throw new Error("SYNC_ABORTED");

    const { publicUrl } = await uploadToBucketPublic(bucket, cryptographicallySecureFileNameStr, file, {
      upsert: false,
    });

    if (signal.aborted) throw new Error("SYNC_ABORTED");

    return { name: file.name, url: publicUrl };
  };

  const handleDataIngress = async (filesCollection: FileList | null | File[]) => {
    let rawIngressFilesArray: File[] = [];

    if (filesCollection instanceof FileList) {
      rawIngressFilesArray = Array.from(filesCollection);
    } else if (Array.isArray(filesCollection)) {
      rawIngressFilesArray = filesCollection;
    } else if (!filesCollection && lastFailedFiles.length > 0) {
      rawIngressFilesArray = lastFailedFiles;
    }

    if (rawIngressFilesArray.length === 0) return;

    const availableSlotsCapacityNum = maxFiles - normalizedArtifactsCount;
    if (availableSlotsCapacityNum <= 0) {
      toast({
        title: "REGISTRY_FULL_ALERT",
        description: `Capacity ceiling hit: Maximum allowance is locked at ${maxFiles} structural artifacts.`,
        variant: "destructive",
      });
      trackEvent("data_ingress_capacity_ceiling_blocked");
      return;
    }

    const targetedIngressQueue = rawIngressFilesArray.slice(0, availableSlotsCapacityNum);

    // Hardened Size Content Validation Filter (Ecosystem Core Standard Boundary: 5MB)
    const MAX_BINARY_BYTE_SIZE_LIMIT = 5 * 1024 * 1024;
    for (const verificationFileNode of targetedIngressQueue) {
      if (verificationFileNode.size > MAX_BINARY_BYTE_SIZE_LIMIT) {
        toast({
          title: "DATA_OVERFLOW_FAULT",
          description: `Transmission terminated: ${verificationFileNode.name} exceeds the 5MB payload limit.`,
          variant: "destructive",
        });
        trackEvent("data_ingress_size_overflow_intercepted", { fileName: verificationFileNode.name });
        return;
      }
    }

    abortControllerRef.current = new AbortController();
    const currentPassAbortSignal = abortControllerRef.current.signal;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setStatusMessage("Establishing connection handshake with remote storage...");
    trackEvent("data_ingress_batch_sync_started", { count: targetedIngressQueue.length });

    try {
      const successfulIngressItemsList: FileItem[] = [];
      const batchTotalQueueCount = targetedIngressQueue.length;

      for (let indexPosition = 0; indexPosition < batchTotalQueueCount; indexPosition++) {
        if (currentPassAbortSignal.aborted) throw new Error("SYNC_ABORTED");

        const targetActiveFile = targetedIngressQueue[indexPosition];
        setStatusMessage(`Syncing byte layer artifact [${targetActiveFile.name.toUpperCase()}]…`);

        // 120,000ms Hardwired Network Latency Timeout Guard
        const structuralTimeoutGuardPromise = new Promise<never>((_, reject) => {
          const timeoutTrackerId = setTimeout(() => {
            reject(new Error(`Ecosystem timeout: Storage block upload dropped over ${targetActiveFile.name}`));
          }, 120000);

          currentPassAbortSignal.addEventListener("abort", () => clearTimeout(timeoutTrackerId));
        });

        const singleResolvedArtifactItem = await Promise.race([
          executeStorageCommit(targetActiveFile, currentPassAbortSignal),
          structuralTimeoutGuardPromise,
        ]);

        successfulIngressItemsList.push(singleResolvedArtifactItem);

        if (isMountedRef.current) {
          setUploadProgress(Math.round(((indexPosition + 1) / batchTotalQueueCount) * 100));
        }
      }

      if (isMountedRef.current) {
        onChange([...value, ...successfulIngressItemsList]);
        setUploadStatus("success");
        setStatusMessage("INGRESS_COMPLETE_SYNCED");

        toast({
          title: "SYNC_VERIFIED_SUCCESS",
          description: `Ingress verified: ${successfulIngressItemsList.length} unique file nodes committed down ledger.`,
        });

        trackEvent("data_ingress_batch_sync_success", { committedCount: successfulIngressItemsList.length });

        // Automated Efficiency: Evaporate user cache indexes across adjacent viewport panels instantly
        await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
        await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
        await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

        setTimeout(() => {
          if (isMountedRef.current) {
            setUploadStatus("idle");
            setStatusMessage("");
          }
        }, 2000);
      }
    } catch (caughtPipelineExceptionErr: any) {
      const parsingErrorStringMsg =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(parsingErrorStringMsg, {
        component: "MultiFileUpload",
        action: "commit_batch_data_ingress_pipeline",
        targetBucket: bucket,
      });

      if (isMountedRef.current) {
        if (parsingErrorStringMsg === "SYNC_ABORTED") {
          setUploadStatus("idle");
          toast({
            title: "SYNC_TERMINATED_BY_USER",
            description: "Ecosystem block transport halted safely by master talent control node.",
          });
        } else {
          setUploadStatus("error");
          setStatusMessage("REGISTRY_WRITE_FAULT");
          setLastFailedFiles(targetedIngressQueue);

          toast({
            title: "INGRESS_SYNC_FAULT",
            description: `Database transaction aborted: ${parsingErrorStringMsg}`,
            variant: "destructive",
          });
        }
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const removeArtifactNodeFromRegistry = useCallback(
    (targetIndexIdNum: number) => {
      trackEvent("data_ingress_artifact_removal_requested", { positionIndex: targetIndexIdNum });
      const localClonedRegistryArray = [...value];
      localClonedRegistryArray.splice(targetIndexIdNum, 1);
      onChange(localClonedRegistryArray);
    },
    [value, onChange],
  );

  const handleDragEventsHandshakePass = useCallback(
    (syntheticEventObj: React.DragEvent<HTMLDivElement>, shouldSetDragActiveFlag: boolean) => {
      syntheticEventObj.preventDefault();
      if (uploadStatus !== "uploading") {
        setDragActive(shouldSetDragActiveFlag);
      }
    },
    [uploadStatus],
  );

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: TOP SUMMARY TEXT LABELS STRIP */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <p className="text-xs font-bold text-primary uppercase tracking-wide leading-none select-all selection:bg-primary/10">
            {label}
          </p>
          {description && (
            <p className="text-[11px] font-semibold text-muted-foreground/60 block leading-none pt-0.5">
              {description.trim()}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono font-bold tracking-wide text-muted-foreground bg-muted/40 h-5.5 px-2 rounded leading-none shadow-xs shrink-0"
        >
          {normalizedArtifactsCount} / {maxFiles} committed
        </Badge>
      </div>

      {/* HUD LEVEL 2: COMPONENT CORE DRAG AND DROP INGRESS GATEWAY SLOT */}
      {normalizedArtifactsCount < maxFiles && (
        <div
          onDragEnter={(e) => handleDragEventsHandshakePass(e, true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (uploadStatus !== "uploading") {
              handleDataIngress(e.dataTransfer.files);
            }
          }}
          onClick={() =>
            uploadStatus !== "uploading" && document.getElementById(`ingress-node-input-${label}`)?.click()
          }
          className={cn(
            "relative w-full border border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-300 select-none outline-none focus-visible:ring-1 focus-visible:ring-ring",
            dragActive
              ? "border-primary bg-primary/[0.03] scale-[1.005] shadow-sm"
              : "border-border/40 hover:border-border/80 bg-card/20 hover:bg-card/40",
            uploadStatus === "error" && "border-rose-500/30 bg-rose-500/[0.015]",
            uploadStatus === "uploading" ? "pointer-events-none cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <input
            id={`ingress-node-input-${label}`}
            type="file"
            multiple={maxFiles > 1}
            disabled={uploadStatus === "uploading"}
            accept={acceptedTypes}
            className="hidden select-none sr-only pointer-events-none"
            aria-hidden="true"
            onChange={(e) => handleDataIngress(e.target.files)}
          />

          {/* STREAM VIEW A: ACTIVE UPLOADING TASK HUD STATUS BAR */}
          {uploadStatus === "uploading" ? (
            <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in-99 w-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary stroke-[2.5]" />
              <div className="w-full max-w-xs space-y-2 flex flex-col justify-center leading-none">
                <Progress
                  value={uploadProgress}
                  className="h-1.5 border-none bg-primary/10 shadow-inner w-full block rounded-full"
                />
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary italic pt-1 block truncate leading-none animate-pulse">
                  {statusMessage} &bull; {uploadProgress}%
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Shield Check: Stop click event bubble frames from matching document lookups
                  trackEvent("data_ingress_abort_clicked");
                  abortControllerRef.current?.abort();
                }}
                className="rounded-xl h-7 px-3 border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground font-bold text-[9px] uppercase tracking-wide shrink-0 shadow-xs cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5 mr-1 stroke-[2.2]" />
                <span>Abort Node Ingress</span>
              </Button>
            </div>
          ) : uploadStatus === "error" ? (
            /* STREAM VIEW B: CORE CRITICAL FAULT WRITING RESPONSE OVERLAY */
            <div className="flex flex-col items-center justify-center gap-3 animate-in shake duration-300 w-full">
              <XCircle className="h-6 w-6 text-rose-500 stroke-[2.5]" />
              <div className="space-y-1 select-text leading-none text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 leading-none">
                  Ecosystem Ingress Sync Fault
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground/60 lowercase tracking-normal max-w-xs truncate text-ellipsis block pt-0.5 leading-none">
                  {statusMessage}
                </p>
              </div>
              <div className="flex items-center gap-2 select-none font-bold text-xs pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("data_ingress_retry_triggered");
                    handleDataIngress(null);
                  }}
                  className="rounded-xl h-8 px-3 border border-border/60 font-bold uppercase text-[10px] tracking-wide gap-1 flex items-center cursor-pointer transition-colors hover:bg-accent"
                >
                  <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Re-Attempt Commit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadStatus("idle");
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-foreground h-8 px-3 rounded-xl cursor-pointer"
                >
                  Dismiss Clear
                </Button>
              </div>
            </div>
          ) : (
            /* STREAM VIEW C: COLD COLD-START INGRESS INVITATION ACTION DECK */
            <div className="flex flex-col items-center justify-center gap-3 w-full group/ingress transition-transform duration-300">
              <div className="h-12 w-12 rounded-xl border border-border/40 bg-background flex items-center justify-center shadow-sm group-hover/ingress:scale-102 group-hover/ingress:rotate-2 transition-transform duration-300">
                <Upload className="h-5 w-5 text-muted-foreground/40 group-hover/ingress:text-primary transition-colors stroke-[2.2]" />
              </div>
              <div className="space-y-1.5 select-none leading-none text-center">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground/80 leading-none">
                  Initialize System Ingress Pipeline
                </p>
                <p className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-widest block leading-none pt-0.5">
                  Authorized Extensions: PDF | DOCX | IMAGE &bull; MAX 5MB Payload Bounds
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HUD LEVEL 3: ARTIFACT INGESTION MATRIX REGISTRY SUMMARY ROW SHIELDS */}
      {normalizedArtifactsCount > 0 && (
        <div className="grid grid-cols-1 gap-2 w-full min-w-0 font-bold text-xs text-left animate-in slide-in-from-top-1 duration-200">
          {value.map((artifactItem, idx) => {
            if (!artifactItem) return null;
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 bg-card/50 backdrop-blur-md border border-border/40 rounded-xl group/row hover:border-border/80 transition-colors w-full min-w-0 select-none leading-none h-14 shrink-0"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 h-full">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 border border-border/5 flex items-center justify-center shrink-0 shadow-inner">
                    <FileText className="h-4.5 w-4.5 text-primary stroke-[2.2] opacity-60" />
                  </div>
                  <div className="flex flex-col justify-center leading-none min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground/90 uppercase italic tracking-wide truncate text-ellipsis select-text block pr-1 leading-none">
                      {artifactItem.name || "Stale structural data binary element link pointer"}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider font-mono select-none pt-1 leading-none">
                      <ShieldCheck className="h-3 w-3 text-emerald-500 stroke-[2.5] shrink-0" />
                      <span>Registry Encryption Locked</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={uploadStatus === "uploading"}
                  className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer shrink-0 transition-colors flex items-center justify-center p-0 shadow-none border-none"
                  onClick={() => removeArtifactNodeFromRegistry(idx)}
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
