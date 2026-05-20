import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadModuleResourceFile, MAX_RESOURCE_MB } from "@/lib/moduleResourceUpload";

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

const MAX_MB = MAX_RESOURCE_MB;

export function ModuleResourceFileUpload({ value, onChange, accept, resourceId, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadModuleResourceFile(file, resourceId || "new");
      onChange(url);
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
