import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, FileText, Link, AlertCircle, CheckCircle, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface SimpleFileUploadProps {
  onFileUploaded: (url: string) => void;
  onUrlProvided: (url: string) => void;
  currentValue?: string;
  accept?: string;
  maxSizeMB?: number;
}

type UploadMode = "choose" | "uploading" | "url-input" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * GroUp Academy: Lightweight Single-Artifact Data Ingress System (SimpleFileUpload)
 * An authoritative singleton sandbox managing custom profile CV deployments and URL registration layers.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileUploaded,
  onUrlProvided,
  currentValue,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 10,
}) => {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [mode, setMode] = useState<UploadMode>(currentValue ? "success" : "choose");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(currentValue || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Synchronize component lifecycles to discard dangling async execution blocks
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("singleton_ingress_uploader_mounted", { maxSizeLimit: maxSizeMB });
    return () => {
      isMountedRef.current = false;
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, [maxSizeMB]);

  // Synchronize internal layout parameters if the context baseline value mutates downstream
  useEffect(() => {
    if (currentValue) {
      setUploadedUrl(currentValue);
      setMode("success");
    }
  }, [currentValue]);

  const executeDataIngress = async (file: File) => {
    if (!file) return;

    // PROTOCOL LOCK: Quantitative Volume Payload Verification Checks
    const maxByteLimitCalculated = maxSizeMB * 1024 * 1024;
    if (file.size > maxByteLimitCalculated) {
      setMode("error");
      const sizeOverflowErrorString = `DATA_OVERFLOW_FAULT: Transmission ceiling limit clamped at ${maxSizeMB}MB.`;
      setErrorMessage(sizeOverflowErrorString);
      trackEvent("singleton_ingress_size_overflow_intercepted", { fileSize: file.size });
      return;
    }

    setMode("uploading");
    setProgress(0);
    setStatusMessage("Initializing secure registry handshake…");
    trackEvent("singleton_ingress_network_stream_started", { fileName: file.name });

    // PROTOCOL LOCK: Deterministic Non-Colliding Index Identifier Mapping
    const cryptographicallySecureSanitizedNameStr = `NODE_CV_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const targetedStorageBucketEndpointUrl = `${SUPABASE_URL}/storage/v1/object/portfolio-uploads/${cryptographicallySecureSanitizedNameStr}`;

    const xhrInstance = new XMLHttpRequest();
    xhrRef.current = xhrInstance;

    xhrInstance.upload.onprogress = (progressEventObj) => {
      if (progressEventObj.lengthComputable && isMountedRef.current) {
        const structuralPercentValue = Math.max(
          0,
          Math.min(100, Math.round((progressEventObj.loaded / progressEventObj.total) * 100)),
        );
        setProgress(structuralPercentValue);
        setStatusMessage(`Ingress Stream Sync: ${structuralPercentValue}%`);
      }
    };

    xhrInstance.onload = async () => {
      if (!isMountedRef.current) return;

      if (xhrInstance.status >= 200 && xhrInstance.status < 300) {
        const publicConstructedArtifactUrlStr = `${SUPABASE_URL}/storage/v1/object/public/portfolio-uploads/${cryptographicallySecureSanitizedNameStr}`;

        setUploadedUrl(publicConstructedArtifactUrlStr);
        setMode("success");
        setStatusMessage("REGISTRY_SYNC_VERIFIED");
        trackEvent("singleton_ingress_upload_success");

        try {
          // Automated Efficiency: Invalidate tracker states immediately across adjacent workspace viewports
          await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
          await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
          await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
        } catch (cacheErr) {
          trackError(cacheErr, { component: "SimpleFileUpload", action: "cache_invalidation_onload" });
        }

        onFileUploaded(publicConstructedArtifactUrlStr);
      } else {
        const errorResponseStatusCodeStr = `INGRESS_HTTP_FAULT_CODE: ${xhrInstance.status}`;
        setMode("error");
        setErrorMessage(errorResponseStatusCodeStr);
        trackError(errorResponseStatusCodeStr, { component: "SimpleFileUpload", action: "xhr_onload_status_failure" });
      }
    };

    xhrInstance.onerror = () => {
      if (!isMountedRef.current) return;
      const networkUplinkDroppedErrorStr =
        "UPLINK_TERMINATED_EXCEPTION: Check environment parameters or proxy interference blocks.";
      setMode("error");
      setErrorMessage(networkUplinkDroppedErrorStr);
      trackError(networkUplinkDroppedErrorStr, { component: "SimpleFileUpload", action: "xhr_onerror_callback" });
    };

    xhrInstance.timeout = 120000; // 120s Spaced Synapse Timeout Guard
    xhrInstance.ontimeout = () => {
      if (!isMountedRef.current) return;
      const requestTimeoutErrorStr =
        "SYNC_TIMEOUT_EXCEEDED: High network latency detected. Recommend fallback link-mapping bounds.";
      setMode("error");
      setErrorMessage(requestTimeoutErrorStr);
      trackError(requestTimeoutErrorStr, { component: "SimpleFileUpload", action: "xhr_ontimeout_callback" });
    };

    xhrInstance.open("POST", targetedStorageBucketEndpointUrl);
    xhrInstance.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhrInstance.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhrInstance.send(file);
  };

  const executeUrlSync = async () => {
    const rawCleanUrlString = urlInput.trim();
    if (!rawCleanUrlString) {
      setErrorMessage("SYNC_REGISTRY_IDENTIFIER_REQUIRED");
      return;
    }

    trackEvent("singleton_ingress_url_sync_requested");

    try {
      // Robust structural protocol validation checks
      new URL(rawCleanUrlString);
      setUploadedUrl(rawCleanUrlString);
      setMode("success");
      trackEvent("singleton_ingress_url_sync_success");

      // Automated Efficiency: Evaporate stale components queries across metrics arrays instantly
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      onUrlProvided(rawCleanUrlString);
    } catch (urlExceptionErr) {
      trackError(urlExceptionErr, { component: "SimpleFileUpload", action: "execute_url_sync_validation" });
      setErrorMessage("MALFORMED_URL_SCHEMA: Active secure index structure required (https://…).");
    }
  };

  // =========================================================================
  // CORE MATRIX INTERFACE STREAM VIEW 1: COLD COLD-START CHOOSE SECTOR
  // =========================================================================
  if (mode === "choose") {
    return (
      <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFileItemNode = e.dataTransfer.files?.[0];
            if (droppedFileItemNode) executeDataIngress(droppedFileItemNode);
          }}
          className={cn(
            "relative w-full border border-dashed border-border/40 rounded-xl p-8 sm:p-10 text-center select-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all bg-card/20 hover:bg-card/40 hover:border-border/80 group/dropzone shadow-sm",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden select-none sr-only pointer-events-none"
            aria-hidden="true"
            onChange={(e) => e.target.files?.[0] && executeDataIngress(e.target.files[0])}
          />
          <div className="h-14 w-14 bg-background border border-border/40 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover/dropzone:scale-102 group-hover/dropzone:rotate-1 transition-transform duration-300">
            <Upload className="h-5 w-5 text-muted-foreground/40 group-hover/dropzone:text-primary transition-colors stroke-[2.2]" />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground/80 leading-none">
            Initialize Binary Ingress Pipeline
          </p>
          <p className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-widest mt-1.5 leading-none">
            Extensions Mapped: PDF | DOCX &bull; Maximum Allowed Volume: {maxSizeMB}MB
          </p>
        </div>

        <div className="flex items-center gap-3 px-1 select-none pointer-events-none">
          <div className="flex-1 h-[1px] bg-border/10" />
          <span className="text-[9px] font-extrabold text-muted-foreground/30 uppercase tracking-widest font-mono leading-none">
            Alternative Dynamic Route
          </span>
          <div className="flex-1 h-[1px] bg-border/10" />
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={() => {
            trackEvent("singleton_ingress_url_mode_toggled");
            setMode("url-input");
          }}
          className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors"
        >
          <Link className="h-4 w-4 mr-1 stroke-[2.2]" />
          <span>Map External Public Storage Document URL</span>
        </Button>
      </div>
    );
  }

  // =========================================================================
  // CORE MATRIX INTERFACE STREAM VIEW 2: ACTIVE TRANSFER PROGRESS INTERFACE
  // =========================================================================
  if (mode === "uploading") {
    return (
      <div className="border border-primary/20 bg-primary/[0.015] rounded-xl p-5 space-y-4 text-left select-none w-full animate-in zoom-in-99 duration-200">
        <div className="flex items-center gap-3.5 w-full min-w-0 font-bold text-xs leading-none">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5] shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-center leading-none">
            <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wider font-mono leading-none w-full text-muted-foreground/60">
              <span className="truncate pr-1 animate-pulse italic block">{statusMessage}</span>
              <span className="text-primary font-black bg-primary/5 px-1 rounded shadow-xs">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 border-none bg-primary/10 shadow-inner w-full block rounded-full"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            trackEvent("singleton_ingress_upload_aborted");
            xhrRef.current?.abort();
            setMode("choose");
          }}
          className="w-full h-8 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-rose-500 transition-colors cursor-pointer rounded-xl"
        >
          <X className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
          <span>Abort Transport Action Stream</span>
        </Button>
      </div>
    );
  }

  // =========================================================================
  // CORE MATRIX INTERFACE STREAM VIEW 3: URL REPOSITORY DIRECTORY INDEXING
  // =========================================================================
  if (mode === "url-input") {
    return (
      <div className="space-y-3.5 text-left max-w-full w-full transform-gpu antialiased animate-in slide-in-from-bottom-1 duration-200 font-bold text-xs">
        <div className="space-y-1.5 text-left w-full leading-none">
          <Label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block pl-0.5 leading-none select-none">
            Registry Storage Link Mapping Identification
          </Label>
          <div className="flex gap-2 w-full font-semibold text-sm">
            <Input
              type="url"
              placeholder="Inject secure target asset address link (e.g. https://drive.google.com/…)…"
              value={urlInput}
              className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner flex-1 min-w-0"
              onChange={(e) => {
                setUrlInput(e.target.value);
                setErrorMessage("");
              }}
            />
            <Button
              type="button"
              onClick={executeUrlSync}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </div>

        {errorMessage && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide pl-0.5 animate-in shake duration-200 select-text">
            {errorMessage}
          </p>
        )}

        <p className="text-[11px] font-semibold text-muted-foreground/40 leading-normal select-none italic pl-0.5 pt-0.5">
          Supported remote hosting nodes include: Google Drive, Dropbox, and OneDrive index lines. Targets must retain
          public reading accessibility variables.
        </p>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setMode("choose")}
          className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 hover:text-primary transition-colors h-7 rounded-xl px-2 select-none cursor-pointer"
        >
          &larr; Revert Back to Local Binary Processing
        </Button>
      </div>
    );
  }

  // =========================================================================
  // CORE MATRIX INTERFACE STREAM VIEW 4: TRANSACTION FAILURE SHIELDS
  // =========================================================================
  if (mode === "error") {
    return (
      <div className="space-y-3.5 text-left max-w-full w-full transform-gpu antialiased animate-in shake duration-300">
        <div className="border border-rose-500/15 bg-rose-500/[0.02] rounded-xl p-4 select-text leading-tight w-full min-w-0">
          <div className="flex gap-3 items-start leading-none font-bold text-xs">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 stroke-[2.5] mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 select-none leading-none">
                Ingress Validation Fault
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 italic leading-relaxed break-words pr-1">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 font-bold text-xs select-none w-full shrink-0">
          <Button
            variant="outline"
            type="button"
            className="flex-1 h-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors"
            onClick={() => setMode("choose")}
          >
            Re-Initialize Ingress
          </Button>
          <Button
            type="button"
            className="flex-1 h-10 rounded-xl font-bold uppercase text-[10px] tracking-wide gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-md cursor-pointer transition-transform active:scale-[0.985]"
            onClick={() => setMode("url-input")}
          >
            <Link className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Use Mapped Link</span>
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CORE MATRIX INTERFACE STREAM VIEW 5: ENCRYPTION CONFIRMED PASS SHIELD
  // =========================================================================
  if (mode === "success") {
    return (
      <div className="border border-emerald-500/15 bg-emerald-500/[0.01] rounded-xl p-4 w-full text-left font-bold text-xs tracking-tight animate-in zoom-in-99 duration-300 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-4 w-full h-10 leading-none select-none">
          <div className="flex items-center gap-3.5 min-w-0 h-full flex-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col justify-center leading-none min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase italic tracking-wide leading-none select-all">
                Artifact Ingress Mapped
              </p>
              <p className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-wider truncate text-ellipsis block pt-1.5 leading-none select-text">
                {uploadedUrl.includes("storage") ? "Ledger Binary Storage Matrix" : "External Mapped Address URL Node"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {
              trackEvent("singleton_ingress_deletion_requested");
              setMode("choose");
              setUploadedUrl("");
              onFileUploaded("");
            }}
            className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0 flex items-center justify-center shadow-none p-0 border-none"
            title="Purge active verification file entry parameters from current identity frame"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
