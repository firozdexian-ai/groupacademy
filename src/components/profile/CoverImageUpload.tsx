import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CoverImageUploadProps {
  currentUrl?: string | null;
  onImageChange: (url: string | null) => void;
}

export function CoverImageUpload({ currentUrl, onImageChange }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `cover-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolio-uploads")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onImageChange(publicUrl);
      toast.success("Cover image uploaded");
    } catch (error: any) {
      console.error("Error uploading cover image:", error);
      toast.error(error.message || "Failed to upload cover image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageChange(null);
    toast.success("Cover image removed");
  };

  return (
    <div className="space-y-3">
      <div
        className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <div className="text-center text-primary-foreground/70">
              <Camera className="h-6 w-6 mx-auto mb-1" />
              <p className="text-xs font-medium">Click to upload cover image</p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {previewUrl ? "Change" : "Upload"}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Recommended: 1200×400px. JPG or PNG, max 5MB.
      </p>
    </div>
  );
}
