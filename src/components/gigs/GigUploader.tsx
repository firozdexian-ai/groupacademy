import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileIcon, ImageIcon, Video, Music, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GigUploader — universal in-app file uploader for gig submissions.
 * Uploads to the private `gig-submissions` bucket under the user's own folder.
 * Returns the storage path (not a public URL) — admins generate signed URLs at review time.
 */

const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB

const ACCEPT_DEFAULT =
  "image/*,video/*,audio/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.md,.csv";

export interface UploadedFile {
  /** storage path inside `gig-submissions` bucket */
  path: string;
  /** original filename */
  name: string;
  /** size in bytes */
  size: number;
  /** mime type */
  mime: string;
}

interface GigUploaderProps {
  /** files already attached (for controlled use) */
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  /** sub-folder under the user's folder (e.g. gig category or gig id) */
  folder?: string;
  maxFiles?: number;
  /** override accept attribute */
  accept?: string;
  /** label shown in the drop zone */
  label?: string;
  /** small helper line */
  helper?: string;
}

function fileIconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Video;
  if (mime.startsWith("audio/")) return Music;
  if (mime.includes("pdf") || mime.startsWith("text/")) return FileText;
  return FileIcon;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function GigUploader({
  value = [],
  onChange,
  folder = "general",
  maxFiles = 5,
  accept = ACCEPT_DEFAULT,
  label = "Drop files or tap to upload",
  helper = "Images, video, audio, PDF, slides, docs, ZIP — up to 200 MB each",
}: GigUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (!files.length) return;

      if (value.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
      if (tooBig) {
        toast.error(`${tooBig.name} is larger than 200 MB.`);
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        toast.error("Please sign in to upload.");
        return;
      }

      setUploading(true);
      setProgress(0);

      const uploaded: UploadedFile[] = [];
      try {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${uid}/${folder}/${Date.now()}-${i}-${safeName}`;

          const { error } = await supabase.storage
            .from("gig-submissions")
            .upload(path, f, {
              cacheControl: "3600",
              upsert: false,
              contentType: f.type || "application/octet-stream",
            });

          if (error) {
            toast.error(`Upload failed: ${f.name}`);
            console.error("[GigUploader] upload error", error);
            continue;
          }

          uploaded.push({
            path,
            name: f.name,
            size: f.size,
            mime: f.type || "application/octet-stream",
          });
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        if (uploaded.length) {
          onChange([...value, ...uploaded]);
          toast.success(
            uploaded.length === 1
              ? "File uploaded."
              : `${uploaded.length} files uploaded.`,
          );
        }
      } finally {
        setUploading(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [value, onChange, folder, maxFiles],
  );

  const removeFile = async (path: string) => {
    onChange(value.filter((f) => f.path !== path));
    // Best-effort delete; ignore errors (admin can still access via service role)
    void supabase.storage.from("gig-submissions").remove([path]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all",
          "bg-muted/20 hover:bg-muted/40 hover:border-primary/40",
          dragOver && "border-primary bg-primary/5",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">Uploading…</p>
            <Progress value={progress} className="h-1.5" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold">{label}</p>
            <p className="text-[11px] text-muted-foreground">{helper}</p>
            <p className="text-[10px] text-muted-foreground/70 font-semibold">
              {value.length}/{maxFiles} files
            </p>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f) => {
            const Icon = fileIconFor(f.mime);
            return (
              <li
                key={f.path}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.path);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default GigUploader;
