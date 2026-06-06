import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Camera, Loader2, Trash2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  fullName?: string;
  onPhotoChange: (url: string | null) => void;
}

/**
 * GroUp Academy: Identity Avatar Resource Ingress Node (ProfilePhotoUpload)
 * An authoritative operational sandbox layer parsing image formats and updating master account asset states.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ProfilePhotoUpload({ currentPhotoUrl, fullName, onPhotoChange }: ProfilePhotoUploadProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize component lifecycles to safely discard dangling background updates
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("profile_photo_uploader_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync internal preview state if underlying backend profile context mutations occur
  useEffect(() => {
    if (currentPhotoUrl !== undefined) {
      setPreviewUrl(currentPhotoUrl);
    }
  }, [currentPhotoUrl]);

  // PROTOCOL LOCK: Deterministic Initials Generation Map
  const initialsFallbackStr = useMemo(() => {
    const fallbackString = "??";
    if (!fullName || typeof fullName !== "string") return fallbackString;

    const parsedInitials = fullName
      .split(" ")
      .filter(Boolean)
      .map((nameBlock) => nameBlock[0]);

    if (parsedInitials.length === 0) return fallbackString;
    return parsedInitials.join("").toUpperCase().slice(0, 2);
  }, [fullName]);

  const handleArtifactIngestion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetedFileItem = e.target.files?.[0];
    if (!targetedFileItem) return;

    // VALIDATION PROTOCOL: Image MIME Type Check
    if (!targetedFileItem.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      trackEvent("profile_photo_invalid_type_intercepted", { fileType: targetedFileItem.type });
      return;
    }

    // VALIDATION PROTOCOL: Quantitative Volume Payload Verification Check (Max 5MB)
    const MAX_AVATAR_BYTE_SIZE_CEILING = 5 * 1024 * 1024;
    if (targetedFileItem.size > MAX_AVATAR_BYTE_SIZE_CEILING) {
      toast.error("Image must be smaller than 5MB.");
      trackEvent("profile_photo_size_overflow_intercepted", { fileSize: targetedFileItem.size });
      return;
    }

    setIsUploading(true);
    trackEvent("profile_photo_upload_initiated");
    const dynamicToastTrackerId = toast.loading("Uploading photo…");

    try {
      const fileExtensionString = targetedFileItem.name.split(".").pop();
      const nonCollidingUniqueFileNameStr = `${crypto.randomUUID()}.${fileExtensionString}`;
      const fullTargetObjectStoragePathStr = `profile-photos/${nonCollidingUniqueFileNameStr}`;

      // STORAGE TRANSACT EXECUTION: Push binary object to bucket allocation
      let publicUrl: string;
      try {
        const uploadResult = await uploadPortfolioFile(fullTargetObjectStoragePathStr, targetedFileItem, {
          upsert: false,
        });
        publicUrl = uploadResult.publicUrl;
      } catch (storageUploadRegistryError) {
        throw storageUploadRegistryError;
      }

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        setPreviewUrl(publicUrl);
        onPhotoChange(publicUrl);
        toast.success("Profile photo updated.", { id: dynamicToastTrackerId });
        trackEvent("profile_photo_upload_success");
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "ProfilePhotoUpload",
        action: "commit_profile_photo_storage_ingress_api",
      });

      toast.error(`Upload failed: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
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
    trackEvent("profile_photo_purge_requested");
    const dynamicToastTrackerId = toast.loading("Removing photo…");

    try {
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        setPreviewUrl(null);
        onPhotoChange(null);
        toast.success("Profile photo removed.", { id: dynamicToastTrackerId });
      }
    } catch (err) {
      trackError(err, { component: "ProfilePhotoUpload", action: "execute_photo_purge_callback" });
      toast.error("Failed to remove photo. Please try again.", { id: dynamicToastTrackerId });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full select-none transform-gpu antialiased">
      <div className="relative group/avatar shrink-0 select-none">
        {/* IDENTITY MAP DISPLAY GAUGE LAYER */}
        <div className="relative transform-gpu transition-transform duration-300 group-hover/avatar:scale-[1.01]">
          <Avatar className="w-28 h-28 border border-border/40 shadow-md transition-all duration-300 group-hover/avatar:ring-4 group-hover/avatar:ring-primary/10">
            <AvatarImage
              src={previewUrl || undefined}
              alt={fullName || "Identity avatar profile image layer holder pointer"}
              className="object-cover"
            />
            <AvatarFallback className="text-xl font-black italic bg-primary/5 text-primary border border-primary/10 backdrop-blur-md uppercase tracking-wider select-text selection:bg-primary/20">
              {initialsFallbackStr}
            </AvatarFallback>
          </Avatar>

          {/* DYNAMIC ROW SYNCHRONIZATION SHIELD BADGE MARKS */}
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-sm select-none pointer-events-none z-10">
            <div
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center border transition-colors duration-300",
                previewUrl
                  ? "bg-success border-success/10 text-primary-foreground"
                  : "bg-muted border-border/40 text-muted-foreground/30",
              )}
            >
              <ShieldCheck
                className={cn("h-3.5 w-3.5 stroke-[2.5]", previewUrl ? "text-primary-foreground" : "text-muted-foreground/40")}
              />
            </div>
          </div>
        </div>

        {/* PROCESSING LOADER OVERLAY DECK TRANSITION */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md rounded-full z-20 animate-in fade-in duration-200 border border-primary/20">
            <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-primary mt-1.5 animate-pulse leading-none">
              Syncing…
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={isUploading}
        className="hidden select-none sr-only pointer-events-none"
        aria-hidden="true"
        onChange={handleArtifactIngestion}
      />

      {/* ACTION MANAGEMENT DISPATCH MODAL ROW */}
      <div className="flex items-center gap-2 font-bold text-xs select-none">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-9 px-4 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer transition-colors gap-1.5 flex items-center justify-center"
        >
          <Camera className="h-4 w-4 stroke-[2.2]" />
          <span>{previewUrl ? "Change photo" : "Upload photo"}</span>
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            disabled={isUploading}
            onClick={handleTermination}
            className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0 transition-colors flex items-center justify-center p-0 border-none shadow-none"
            title="Remove photo"
          >
            <Trash2 className="h-4 w-4 stroke-[2.2]" />
          </Button>
        )}
      </div>

      {/* METRIC INFORMATION FOOTER COMPONENT */}
      <div className="flex items-center gap-1.5 px-3.5 h-6 rounded-full bg-muted/40 border border-border/10 text-[9px] font-mono font-extrabold uppercase text-muted-foreground/70 tracking-wide select-none shadow-inner leading-none shrink-0 pointer-events-none">
        <Zap className="h-3 w-3 text-warning fill-warning/10 stroke-[2.2] shrink-0 animate-pulse" />
        <span>Supported formats: JPG, PNG, GIF &bull; Max size: 5MB</span>
      </div>
    </div>
  );
}
