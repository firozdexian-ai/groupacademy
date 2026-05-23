import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Camera, Loader2, Trash2, ImagePlus, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  currentUrl?: string | null;
  onImageChange: (url: string | null) => void;
}

/**
 * GroUp Academy: Visual Portfolio Cover Artifact Ingress Node (CoverImageUpload)
 * An authoritative operational sandbox managing image validation metrics and remote object storage chunk commits.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CoverImageUpload({ currentUrl, onImageChange }: CoverImageUploadProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize component lifecycles to discard dangling async execution blocks
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("cover_image_uploader_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update internal preview state if underlying backend profile props change
  useEffect(() => {
    if (currentUrl !== undefined) {
      setPreviewUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleHandshakeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFileItem = e.target.files?.[0];
    if (!targetFileItem) return;

    // PROTOCOL LOCK: Quantitative Ingress Format Validation Check
    if (!targetFileItem.type.startsWith("image/")) {
      toast.error("Format Rejected: Ingress pipeline requires a valid image binary node asset.");
      trackEvent("cover_image_invalid_type_intercepted", { fileType: targetFileItem.type });
      return;
    }

    // PROTOCOL LOCK: Quantitative Volume Payload Verification Check (Ceiling Standard: 5MB)
    const MAX_BINARY_BYTE_SIZE_CEILING = 5 * 1024 * 1024;
    if (targetFileItem.size > MAX_BINARY_BYTE_SIZE_CEILING) {
      toast.error("Payload Exceeded: Image binary node configuration must remain < 5MB.");
      trackEvent("cover_image_size_overflow_intercepted", { fileSize: targetFileItem.size });
      return;
    }

    setIsUploading(true);
    trackEvent("cover_image_upload_initiated", { fileType: targetFileItem.type });
    const dynamicToastTrackerId = toast.loading("Synchronizing image binary asset with storage registry index...");

    try {
      const fileExtensionString = targetFileItem.name.split(".").pop();
      const nonCollidingUniqueFileNameStr = `${crypto.randomUUID()}.${fileExtensionString}`;
      const fullTargetObjectStoragePathStr = `cover-images/${nonCollidingUniqueFileNameStr}`;

      // STORAGE TRANSACT EXECUTION: Push binary object to bucket allocation
      const { publicUrl } = await uploadPortfolioFile(fullTargetObjectStoragePathStr, targetFileItem, {
        upsert: false,
      });

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        setPreviewUrl(publicUrl);
        onImageChange(publicUrl);

        toast.success("Visual cover asset successfully synchronized down ledger.", { id: dynamicToastTrackerId });
        trackEvent("cover_image_upload_success");
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "CoverImageUpload",
        action: "commit_cover_image_storage_ingress_api",
      });

      toast.error(`Ecosystem validation error: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleTermination = async () => {
    trackEvent("cover_image_purge_requested");
    const dynamicToastTrackerId = toast.loading("Purging asset coefficients from registry indices...");

    try {
      // Invalidate dashboard queries to reflect changes in real time
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        setPreviewUrl(null);
        onImageChange(null);
        toast.success("Portfolio cover path successfully expunged.", { id: dynamicToastTrackerId });
      }
    } catch (err) {
      trackError(err, { component: "CoverImageUpload", action: "execute_cover_purge_callback" });
      toast.error("Ecosystem sync exception: Failed to flush indices.", { id: dynamicToastTrackerId });
    }
  };

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: DRAG CAPTURE INTERACTIVE PREVIEW PANEL EDGE */}
      <div
        role="button"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative w-full h-40 rounded-xl overflow-hidden border border-dashed transition-all duration-300 group/cover outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-sm flex items-center justify-center select-none",
          previewUrl
            ? "border-border/40 bg-muted/10"
            : "border-border/40 bg-card/20 hover:bg-card/40 hover:border-border/80 cursor-pointer",
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile cover"
            className="w-full h-full object-cover transition-transform duration-500 ease-out transform group-hover/cover:scale-101 pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 w-full">
            <div className="p-2.5 rounded-xl bg-background border border-border/40 group-hover/cover:scale-102 group-hover/cover:rotate-1 transition-transform duration-300 shrink-0 shadow-xs">
              <ImagePlus className="h-5 w-5 text-primary stroke-[2.2]" />
            </div>
            <div className="text-center space-y-1 leading-none">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/80 leading-none">
                Initialize Cover Node Ingress
              </p>
              <p className="text-[9px] font-mono font-extrabold text-muted-foreground/40 uppercase tracking-widest block leading-none pt-0.5">
                Awaiting structural asset configuration properties
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING LOADER STATE BLUR OVERLAY */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-20 animate-in fade-in duration-200">
            <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mt-2 animate-pulse leading-none">
              Syncing Synapse Ledger…
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden select-none sr-only pointer-events-none"
        aria-hidden="true"
        disabled={isUploading}
        onChange={handleHandshakeSelect}
      />

      {/* HUD LEVEL 2: MANAGEMENT COMMAND ACTIONS ROW STRIP */}
      <div className="flex items-center justify-between gap-4 select-none font-bold text-xs w-full shrink-0 leading-none">
        <div className="flex items-center gap-2 font-bold text-xs">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors gap-1.5 flex items-center justify-center"
          >
            <Camera className="h-4 w-4 stroke-[2.2]" />
            <span>{previewUrl ? "Change cover" : "Upload cover"}</span>
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={isUploading}
              onClick={handleTermination}
              className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wide text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0 transition-colors gap-1.5 flex items-center justify-center border-none shadow-none"
            >
              <Trash2 className="h-4 w-4 stroke-[2.2]" />
              <span>Flush Node</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 h-5 rounded bg-muted/40 border border-border/10 text-[9px] font-mono font-extrabold uppercase text-muted-foreground/70 tracking-wide select-none shadow-inner leading-none shrink-0">
          <Zap className="h-3 w-3 text-amber-500 fill-amber-500/10 stroke-[2.2]" />
          <span>Optimum Baseline: 1200x400 JPG/PNG index dimensions</span>
        </div>
      </div>
    </div>
  );
}
