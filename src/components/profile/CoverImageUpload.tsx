import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2, ImagePlus, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Visual Artifact Provisioner
 * CTO Reference: Authoritative node for profile cover asset ingestion.
 */

interface CoverImageUploadProps {
  currentUrl?: string | null;
  onImageChange: (url: string | null) => void;
}

export function CoverImageUpload({ currentUrl, onImageChange }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHandshakeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PROTOCOL: Payload Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Format Rejected: Node requires image artifact.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Payload Exceeded: Artifact must be < 5MB.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Synchronizing artifact with registry...");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `cover-images/${fileName}`;

      // STORAGE EXECUTION
      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onImageChange(publicUrl);
      toast.success("Artifact Deployed: Sync complete.", { id: toastId });
    } catch (error: any) {
      console.error("[Registry Error]:", error);
      toast.error(error.message || "Transmission Fault: Sync failed.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTermination = () => {
    setPreviewUrl(null);
    onImageChange(null);
    toast.success("Artifact Purged: Node reset.");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div
        className={cn(
          "relative w-full h-40 rounded-[24px] overflow-hidden border-2 border-dashed transition-all duration-300 group shadow-xl",
          previewUrl
            ? "border-primary/20 bg-muted/20"
            : "border-border/40 bg-muted/5 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Cover Artifact"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-background border-2 border-border/10 group-hover:rotate-6 transition-transform">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                Initialize_Cover_Node
              </p>
              <p className="text-[8px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest">
                Awaiting Artifact Ingestion
              </p>
            </div>
          </div>
        )}

        {/* LOADING OVERLAY */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-4 italic">
              Syncing_Ledger...
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleHandshakeSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 px-5 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4" />
            {previewUrl ? "Protocol_Update" : "Ingest_Asset"}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleTermination}
              disabled={isUploading}
              className="h-10 px-5 rounded-xl font-black uppercase italic text-[10px] tracking-widest text-destructive hover:bg-destructive/10 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Terminate
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 rounded-lg border border-border/10">
          <Zap className="h-3 w-3 text-amber-500 fill-current" />
          <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Optimum: 1200x400 JPG/PNG
          </span>
        </div>
      </div>
    </div>
  );
}
