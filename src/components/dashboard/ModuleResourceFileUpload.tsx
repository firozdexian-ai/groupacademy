import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Direct file upload for module resources.
 * Uploads to the public `course-content` bucket and returns the public URL.
 * Falls back to manual URL entry — admins can still paste YouTube/Drive links.
 */
interface Props {
  value: string | null;
  onChange: (url: string) => void;
  accept?: string;
  resourceId?: string;
  className?: string;
}

const BUCKET = "course-content";
const MAX_MB = 50;

export function ModuleResourceFileUpload({ value, onChange, accept, resourceId, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_MB}MB).`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `module-resources/${resourceId || "new"}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("File uploaded.");
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const fileName = value ? value.split("/").pop()?.split("?")[0] : null;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl h-9 font-bold uppercase text-[10px] tracking-widest"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-2" />
          )}
          {value ? "Replace File" : "Upload File"}
        </Button>
        {value && (
          <>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-[260px]"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{fileName || "Open file"}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
              onClick={() => onChange("")}
              title="Clear file"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Direct upload (PDF, image, audio, video, slides…) up to {MAX_MB}MB. Or paste an external URL below.
      </p>
    </div>
  );
}

export default ModuleResourceFileUpload;
