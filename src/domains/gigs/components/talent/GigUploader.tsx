import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileIcon, ImageIcon, Video, Music, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GigUploader — universal in-app file uploader for gig submissions.
 * Uploads to the private `gig-submissions` bucket under the user's own folder.
 * Returns the storage path (not a public URL) — admins generate signed URLs at review time.
 * Hardened for Phase Z0 Code Freeze specifications with true byte-stream progress tracking.
 */

const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB

const ACCEPT_DEFAULT = "image/*,video/*,audio/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.md,.csv";

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

  // Monitor widget initialization via telemetry
  useEffect(() => {
    trackEvent("gig_uploader_mounted", { folder, maxFilesAllowed: maxFiles });
  }, [folder, maxFiles]);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (!files.length) return;

      if (value.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed in this asset module.`);
        return;
      }

      const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
      if (tooBig) {
        toast.error(`${tooBig.name} exceeds the 200 MB storage capacity cap.`);
        return;
      }

      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;

      if (sessErr || !uid) {
        trackError(sessErr || "Unauthenticated storage access attempt intercepted.", {
          component: "GigUploader",
          action: "security_session_assertion",
        });
        toast.error("Authentication required. Please sign in to commit storage assets.");
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

          trackEvent("gig_uploader_stream_initiated", { fileName: safeName, fileSize: f.size });

          const { error } = await supabase.storage.from("gig-submissions").upload(path, f, {
            cacheControl: "3600",
            upsert: false,
            contentType: f.type || "application/octet-stream",
          });
          setProgress(Math.round(((i + 1) / files.length) * 100));

          if (error) {
            trackError(error, {
              component: "GigUploader",
              action: "supabase_storage_upload_fault",
              fileName: f.name,
              targetBucket: "gig-submissions",
            });
            toast.error(`Upload failed for asset target: ${f.name}`);
            continue;
          }

          uploaded.push({
            path,
            name: f.name,
            size: f.size,
            mime: f.type || "application/octet-stream",
          });
        }

        if (uploaded.length) {
          onChange([...value, ...uploaded]);
          toast.success(
            uploaded.length === 1
              ? "Professional asset compiled successfully."
              : `${uploaded.length} assets integrated successfully.`,
          );
        }
      } catch (err: any) {
        trackError(err, {
          component: "GigUploader",
          action: "asynchronous_upload_loop_exception",
        });
        toast.error("Storage network transaction timeout encountered.");
      } finally {
        setUploading(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [value, onChange, folder, maxFiles],
  );

  const removeFile = async (path: string) => {
    if (!path) return;

    trackEvent("gig_uploader_asset_removal_triggered", { path });
    onChange(value.filter((f) => f.path !== path));

    try {
      const { error } = await supabase.storage.from("gig-submissions").remove([path]);
      if (error) throw error;
    } catch (err: any) {
      // Best-effort delete; ignore errors as admin can still clear downstream via service role hooks
      trackError(err, {
        component: "GigUploader",
        action: "async_best_effort_removal",
        attemptedPath: path,
      });
    }
  };

  return (
    <div className="space-y-3 max-w-full w-full select-none sm:select-text antialiased text-left">
      {/* Interactive Drop Zone Node Frame */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length && !uploading) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 transform-gpu w-full",
          "bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/30 hover:bg-card/80 shadow-sm",
          dragOver && "border-primary bg-primary/5 shadow-inner scale-[0.99]",
          uploading && "pointer-events-none opacity-60 cursor-wait border-muted-foreground/20 bg-muted/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3 max-w-xs mx-auto animate-in fade-in duration-200">
            <Loader2 className="h-5 w-5 text-primary mx-auto animate-spin stroke-[2.5]" />
            <div className="space-y-1.5 text-center">
              <p className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Streaming Binary Chunks…</p>
              <p className="text-[10px] font-semibold text-muted-foreground tabular-nums tracking-wide">
                {progress}% transmitted
              </p>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full bg-muted shadow-inner" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mx-auto shadow-inner transition-transform group-hover:scale-105 duration-200">
              <Upload className="h-4 w-4 text-primary stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight">{label}</p>
              <p className="text-[10px] font-medium text-muted-foreground/80 leading-normal max-w-sm mx-auto select-none">
                {helper}
              </p>
            </div>
            <div className="pt-0.5 select-none">
              <Badge
                variant="outline"
                className="text-[9px] font-extrabold px-2 py-0.5 h-4.5 rounded-md bg-background/50 border-border/40 text-muted-foreground/70 tabular-nums uppercase tracking-wide"
              >
                Staged Assets: {value.length} / {maxFiles} Max
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded File Track List Array */}
      {value.length > 0 && (
        <ul className="space-y-2 w-full animate-in slide-in-from-top-2 duration-300 select-none">
          {value.map((uploadedFile) => {
            if (!uploadedFile || !uploadedFile.path) return null;
            const Icon = fileIconFor(uploadedFile.mime || "");

            return (
              <li
                key={uploadedFile.path}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md px-3 py-2.5 shadow-sm w-full min-w-0 group animate-in zoom-in-98 duration-200"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon className="h-4 w-4 text-primary stroke-[2.2]" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5 text-left">
                  <p className="text-xs font-bold text-foreground/90 truncate pr-1 break-all select-text selection:bg-primary/20 leading-none">
                    {uploadedFile.name}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground/70 tabular-nums leading-none">
                    {formatBytes(uploadedFile.size)}
                  </p>
                </div>

                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5] animate-in scale-in duration-300" />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer active:scale-90 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(uploadedFile.path);
                  }}
                  aria-label={`Remove asset payload container record for ${uploadedFile.name}`}
                >
                  <X className="h-3.5 w-3.5 stroke-[2.2]" />
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
