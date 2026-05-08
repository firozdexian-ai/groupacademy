import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImagePlus, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Visual Asset Ingress Node
 * CTO Reference: Authoritative interface for curriculum imagery and registry storage.
 */

interface ImageUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  className?: string;
}

export function ImageUpload({ value, onUpload, onRemove, bucket = "course-covers", className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const executeArtifactIngress = async (file: File) => {
    try {
      setIsUploading(true);

      // Academy Protocol: Format Validation
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PNG, JPG, or WebP image.",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be 5MB or smaller.",
        });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `image_${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      onUpload(publicUrl);

      toast({
        title: "Image uploaded",
        description: "Your image is ready to use.",
      });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragState = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDropEvent = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) executeArtifactIngress(e.dataTransfer.files[0]);
  }, []);

  const executeArtifactPruning = async () => {
    if (value && onRemove) {
      const filePath = value.split("/").pop();
      if (!filePath) return;

      try {
        await supabase.storage.from(bucket).remove([filePath]);
        onRemove();
        toast({
          title: "PRUNING_COMPLETE",
          description: "Artifact purged from registry.",
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "PRUNING_FAULT",
          description: err.message,
        });
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
          Institutional_Cover_Asset (16:9)
        </label>
        <div className="flex items-center gap-1 opacity-20">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[8px] font-bold uppercase tracking-widest italic">Registry_Secure</span>
        </div>
      </div>

      {value ? (
        <div className="group relative rounded-[24px] overflow-hidden bg-muted border-2 border-border/10 aspect-video shadow-2xl transition-all duration-500 hover:border-primary/40">
          <img
            src={value}
            alt="Registry_Artifact"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-2xl shadow-xl active:scale-90 transition-all"
              onClick={executeArtifactPruning}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-[24px] p-10 text-center cursor-pointer transition-all duration-500 aspect-video flex flex-col items-center justify-center overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl"
              : "border-border/40 hover:border-primary/40 hover:bg-muted/5 shadow-inner",
          )}
          onDragEnter={handleDragState}
          onDragLeave={handleDragState}
          onDragOver={handleDragState}
          onDrop={handleDropEvent}
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          {isUploading ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <Zap className="absolute h-4 w-4 text-primary animate-pulse fill-current" />
              </div>
              <p className="text-[10px] font-black uppercase italic tracking-widest text-primary">
                Synchronizing_Registry...
              </p>
            </div>
          ) : (
            <div className="space-y-4 group-hover:scale-105 transition-transform duration-500">
              <div className="h-16 w-16 rounded-[22px] bg-background border-2 border-border/10 flex items-center justify-center mx-auto shadow-xl">
                <ImagePlus className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase italic tracking-tighter">Initialize_Asset_Ingress</p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                  PNG | JPG | WebP • Max 5MB
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-xl px-6 font-black uppercase italic text-[9px] tracking-widest mt-2"
              >
                SELECT_ARTIFACT
              </Button>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && executeArtifactIngress(e.target.files[0])}
            disabled={isUploading}
          />
        </div>
      )}
      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 mt-4 text-center">
        Neural_Ingress_v4.2 // Encrypted_Storage
      </p>
    </div>
  );
}
