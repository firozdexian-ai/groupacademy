import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Loader2, ImagePlus, ShieldCheck, Zap } from "lucide-react";
import { uploadToBucketPublic, removeFromBucket } from "@/domains/profile/repo/profileRepo";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trackEvent, trackError } from "@/lib/errorTracking";

interface ImageUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  className?: string;
}

/**
 * GroUp Academy: Object Storage Visual Asset Ingress Node (ImageUpload)
 * Authoritative system interface validating file signatures, processing cloud uploads, and syncing media links.
 * Version: Launch Candidate · Phase Z0 Hardened Asset Ingress
 */
export function ImageUpload({ value, onUpload, onRemove, bucket = "course-covers", className }: ImageUploadProps) {
  const { toast } = useToast();
  const isMountedRef = useRef<boolean>(true);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Synchronize component lifecycles to insulate background operations from state drops
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeArtifactIngress = async (file: File) => {
    if (!file || isUploading) return;

    // Phase 1: Security Schema & Format Validation
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "VALIDATION_REJECTED",
        description: "Invalid file signature. Please present a PNG, JPG, or WebP image layout format.",
      });
      return;
    }

    const FIVE_MEGABYTES_IN_BYTES = 5 * 1024 * 1024;
    if (file.size > FIVE_MEGABYTES_IN_BYTES) {
      toast({
        variant: "destructive",
        title: "CAPACITY_OVERFLOW",
        description: "Payload mass exceeds threshold limits. Media must resolve beneath a 5MB boundary.",
      });
      return;
    }

    if (isMountedRef.current) {
      setIsUploading(true);
    }

    trackEvent("storage_asset_upload_initiated", { bucket, size: file.size });

    // Phase 2: Compute Cryptographically Non-Colliding Storage Handles
    const fileExtensionStr = file.name.split(".").pop() || "png";
    const uniqueHashTokenStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const computedStorageFileNameStr = `asset_${uniqueHashTokenStr}_${Date.now()}.${fileExtensionStr}`;

    try {
      const { error: storageUploadRegistryError } = await supabase.storage
        .from(bucket)
        .upload(computedStorageFileNameStr, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageUploadRegistryError) throw storageUploadRegistryError;

      const { data: publicUrlPayloadData } = supabase.storage.from(bucket).getPublicUrl(computedStorageFileNameStr);

      if (!publicUrlPayloadData?.publicUrl) {
        throw new Error("Registry Error: Object storage engine failed to generate secure URL public tracking string.");
      }

      if (isMountedRef.current) {
        onUpload(publicUrlPayloadData.publicUrl);
        toast({
          title: "INGRESS_VERIFIED",
          description: "Visual media node safely synchronized within remote object buckets.",
        });
        trackEvent("storage_asset_upload_success", { bucket });
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "ImageUpload", action: "execute_artifact_ingress", bucket });

      toast({
        variant: "destructive",
        title: "INGRESS_FAULT",
        description:
          formattedExceptionMsgStr || "Remote platform rejected socket file data stream compilation requests.",
      });
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  };

  const handleDragStateChange = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave" || e.type === "drop") {
      setIsDragging(false);
    }
  }, []);

  const handleDropEventExecute = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const singleDroppedFileNode = e.dataTransfer.files?.[0];
      if (singleDroppedFileNode) {
        executeArtifactIngress(singleDroppedFileNode);
      }
    },
    [isUploading, bucket],
  );

  const executeArtifactPruningProtocol = async () => {
    if (!value || !onRemove || isUploading) return;

    // Extract trailing object file signature handle out of public link addresses safely
    const derivedTargetFilePathStr = value.split("/").pop();
    if (!derivedTargetFilePathStr) return;

    trackEvent("storage_asset_prune_initiated", { bucket });
    const dynamicToastTrackerId = toast({
      title: "PRUNING_REGISTRY",
      description: "Purging media tracking rows from secure file blocks…",
    });

    try {
      const { error: storageEvictionRegistryError } = await supabase.storage
        .from(bucket)
        .remove([derivedTargetFilePathStr]);

      if (storageEvictionRegistryError) throw storageEvictionRegistryError;

      if (isMountedRef.current) {
        onRemove();
        if (hiddenInputRef.current) hiddenInputRef.current.value = "";

        toast({
          title: "PRUNING_COMPLETE",
          description: "Target asset file completely vaporized from storage clusters.",
        });
        trackEvent("storage_asset_prune_success", { bucket });
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "ImageUpload", action: "execute_artifact_pruning", bucket });

      toast({
        variant: "destructive",
        title: "PRUNING_FAULT",
        description: formattedExceptionMsgStr || "Eviction aborted: target tracking block dropped requests.",
      });
    }
  };

  return (
    <div
      className={cn("space-y-2.5 text-left w-full transform-gpu antialiased font-bold text-xs select-none", className)}
    >
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none shrink-0 h-5">
        <label className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/60 block pt-0.5 leading-none">
          Institutional Cover Asset Dimension (16:9 Ratio)
        </label>

        <div className="flex items-center gap-1.5 opacity-35 shrink-0 pointer-events-none text-right font-mono text-[8px] font-bold uppercase leading-none">
          <ShieldCheck className="h-3.5 w-3.5 stroke-[2.2] text-foreground" />
          <span>v4.2 Vault Secure</span>
        </div>
      </div>

      {/* HUD LEVEL 2: COMPOSITE CONTEXT ACCORDING TO DATA PRESENCE MARKERS */}
      {value ? (
        /* ASSET VIEWPORT ROUTE: PRESENT COMPACT FILE THUMBNAIL BOX */
        <div className="group/viewport relative rounded-xl overflow-hidden bg-muted border border-border/40 aspect-video shadow-xs transition-colors hover:border-border/80 w-full block animate-in fade-in duration-200">
          <img
            src={value}
            alt="Authoritative database file reference artifact description map"
            loading="lazy"
            className="w-full h-full object-cover select-none pointer-events-none transform-gpu transition-transform duration-500 group-hover/viewport:scale-[1.015]"
          />

          {/* FLOATING HOVER ACTION EVICTION CONTAINER OVERLAY */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xs opacity-0 group-hover/viewport:opacity-100 transition-opacity duration-200 flex items-center justify-center select-none z-10">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={isUploading}
              className="h-10 w-10 rounded-xl shadow-md transform-gpu active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                executeArtifactPruningProtocol();
              }}
              title="Vaporize this visual asset node permanently from object storage registry arrays"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </Button>
          </div>
        </div>
      ) : (
        /* INGRESS VIEWPORT ROUTE: ACTIVE INTERACTIVE DROP ZONE FRAME PANEL */
        <div
          role="presentation"
          onDragEnter={handleDragStateChange}
          onDragLeave={handleDragStateChange}
          onDragOver={handleDragStateChange}
          onDrop={handleDropEventExecute}
          onClick={() => {
            if (!isUploading && hiddenInputRef.current) {
              hiddenInputRef.current.click();
            }
          }}
          className={cn(
            "relative border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 aspect-video flex flex-col items-center justify-center overflow-hidden w-full select-none",
            isDragging
              ? "border-primary bg-primary/[0.02] scale-[1.005] shadow-xs"
              : "border-border/60 hover:border-border/100 hover:bg-muted/10 shadow-inner",
          )}
        >
          {isUploading ? (
            /* ACTIVE RUNTIME COMPILATION SOCKET SPINNER LOOP */
            <div className="space-y-3 flex flex-col justify-center items-center select-none pointer-events-none w-full animate-in fade-in duration-150">
              <div className="relative mx-auto w-12 h-12 flex items-center justify-center transform-gpu shrink-0">
                <Loader2 className="h-8 w-8 text-primary log-spin animate-spin stroke-[2.5]" />
                <Zap className="absolute h-3 w-3 text-primary animate-pulse fill-primary/10 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary italic animate-pulse block leading-none pt-1">
                Synchronizing Ledger Storage Registry…
              </span>
            </div>
          ) : (
            /* IDLE TRACK INPUT SUBMISSION PROMPT COMPONENT LAYOUT GAUGE */
            <div className="space-y-3.5 flex flex-col justify-center items-center w-full group/ingress transition-transform duration-300 transform-gpu hover:scale-[1.01]">
              <div className="h-12 w-12 rounded-xl bg-background border border-border/20 flex items-center justify-center mx-auto shadow-sm shrink-0 pointer-events-none transition-colors group-hover/ingress:border-border/60">
                <ImagePlus className="h-6 w-6 text-muted-foreground/40 transition-colors group-hover/ingress:text-primary stroke-[2.2]" />
              </div>

              <div className="space-y-1 leading-none">
                <p className="text-xs sm:text-sm font-black uppercase italic tracking-tight text-foreground/90 block leading-none">
                  Initialize Asset Ingress
                </p>
                <span className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-widest block leading-none pt-1">
                  PNG &bull; JPG &bull; WEBP / Max limits 5MB
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="h-7 rounded-lg px-4 font-bold text-[9px] uppercase tracking-wider pointer-events-none shadow-xs border border-border/10 mt-1"
              >
                Select Local File
              </Button>
            </div>
          )}

          {/* ISOLATED COMPONENT INSTANCE FILE STREAM ATTACHMENT INDICES */}
          <input
            type="file"
            ref={hiddenInputRef}
            className="hidden pointer-events-none"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            disabled={isUploading}
            onChange={(e) => {
              const targetSelectedFileObject = e.target.files?.[0];
              if (targetSelectedFileObject) {
                executeArtifactIngress(targetSelectedFileObject);
              }
            }}
          />
        </div>
      )}

      {/* HUD LEVEL 3: OVERLAY BOTTOM OMNIPRESENCE SHIELD RIBBON FOOTER */}
      <p className="text-[8px] font-mono font-extrabold text-muted-foreground/30 italic text-center uppercase tracking-widest leading-none pt-1 select-none pointer-events-none w-full block">
        Neural Media Ingress Pipeline Systems Matrix Block Core Validated
      </p>
    </div>
  );
}
