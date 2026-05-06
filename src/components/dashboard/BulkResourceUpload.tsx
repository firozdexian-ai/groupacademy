import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, RefreshCw, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadModuleResourceFile,
  detectResourceType,
  titleFromFilename,
  MAX_RESOURCE_MB,
} from "@/lib/moduleResourceUpload";
import type { Database } from "@/integrations/supabase/types";

type ResourceType = Database["public"]["Enums"]["resource_type"];

interface BulkResourceUploadProps {
  moduleId: string;
  stageNumber: number;
  currentMaxOrder: number;
  onComplete: () => void;
}

interface QueueItem {
  id: string;
  file: File;
  title: string;
  resource_type: ResourceType;
  status: "queued" | "uploading" | "uploaded" | "error";
  error?: string;
  uploadedUrl?: string;
}

const CONCURRENCY = 3;

export function BulkResourceUpload({
  moduleId,
  stageNumber,
  currentMaxOrder,
  onComplete,
}: BulkResourceUploadProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Warn before unload while uploads are in flight.
  useEffect(() => {
    const hasActive = queue.some((q) => q.status === "uploading");
    if (!hasActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [queue]);

  const enqueue = (files: FileList | File[]) => {
    const list = Array.from(files);
    const items: QueueItem[] = [];
    for (const f of list) {
      if (f.size > MAX_RESOURCE_MB * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${MAX_RESOURCE_MB}MB — skipped.`);
        continue;
      }
      items.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        title: titleFromFilename(f.name),
        resource_type: detectResourceType(f),
        status: "queued",
      });
    }
    if (!items.length) return;
    setQueue((prev) => [...prev, ...items]);
    // Kick off upload pipeline.
    setTimeout(() => runQueue(), 0);
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const uploadOne = async (item: QueueItem) => {
    updateItem(item.id, { status: "uploading", error: undefined });
    try {
      const { url } = await uploadModuleResourceFile(item.file, moduleId);
      updateItem(item.id, { status: "uploaded", uploadedUrl: url });
    } catch (e: any) {
      updateItem(item.id, { status: "error", error: e.message || "Upload failed" });
    }
  };

  const runQueue = async () => {
    // Snapshot fresh state and process queued items respecting concurrency.
    let snap: QueueItem[] = [];
    setQueue((prev) => {
      snap = prev;
      return prev;
    });
    // Loop until no queued items remain.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const pending = snap.filter((q) => q.status === "queued");
      if (!pending.length) return;
      const active = snap.filter((q) => q.status === "uploading").length;
      const slots = Math.max(0, CONCURRENCY - active);
      if (slots === 0) {
        await new Promise((r) => setTimeout(r, 200));
      } else {
        const batch = pending.slice(0, slots);
        await Promise.all(batch.map(uploadOne));
      }
      // Refresh snapshot.
      await new Promise((r) => setTimeout(r, 0));
      setQueue((prev) => {
        snap = prev;
        return prev;
      });
    }
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const retryItem = (id: string) => {
    updateItem(id, { status: "queued", error: undefined });
    setTimeout(runQueue, 0);
  };

  const saveAll = async () => {
    const ready = queue.filter((q) => q.status === "uploaded");
    if (!ready.length) {
      toast.error("Nothing to save — wait for uploads to finish.");
      return;
    }
    setSaving(true);
    try {
      const rows = ready.map((q, i) => ({
        module_id: moduleId,
        title: q.title || titleFromFilename(q.file.name),
        description: null,
        resource_type: q.resource_type,
        resource_url: q.uploadedUrl!,
        resource_data: {},
        stage_number: stageNumber,
        display_order: currentMaxOrder + i + 1,
        is_required: false,
      }));
      const { error } = await supabase.from("module_resources").insert(rows);
      if (error) throw error;
      toast.success(`Added ${rows.length} resource${rows.length === 1 ? "" : "s"}.`);
      // Drop saved items, keep failures for retry.
      setQueue((prev) => prev.filter((q) => q.status !== "uploaded"));
      onComplete();
    } catch (e: any) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadedCount = queue.filter((q) => q.status === "uploaded").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;
  const errorCount = queue.filter((q) => q.status === "error").length;

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.02]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileUp className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            Bulk Upload to Stage {stageNumber}
          </span>
        </div>
        {queue.length > 0 && (
          <div className="flex items-center gap-1.5">
            {uploadedCount > 0 && (
              <Badge variant="outline" className="h-5 text-[9px] border-emerald-500/30 text-emerald-600">
                {uploadedCount} ready
              </Badge>
            )}
            {uploadingCount > 0 && (
              <Badge variant="outline" className="h-5 text-[9px] border-blue-500/30 text-blue-600">
                {uploadingCount} uploading
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="h-5 text-[9px] border-rose-500/30 text-rose-600">
                {errorCount} failed
              </Badge>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) enqueue(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) enqueue(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed py-6 px-4 text-center cursor-pointer transition-colors",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border/40 bg-background hover:bg-muted/30",
        )}
      >
        <Upload className="h-5 w-5 mx-auto mb-1.5 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-widest">
          Drop files or click to upload
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          PDF · MP4 · DOCX · PPTX · images · ≤ {MAX_RESOURCE_MB}MB · multi-file
        </p>
      </div>

      {queue.length > 0 && (
        <div className="space-y-1.5">
          {queue.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-background px-2.5 py-2"
            >
              <div className="shrink-0 h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center">
                {q.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                {q.status === "queued" && <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                {q.status === "uploaded" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                {q.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-rose-600" />}
              </div>
              <Input
                value={q.title}
                onChange={(e) => updateItem(q.id, { title: e.target.value })}
                disabled={q.status === "uploading" || saving}
                className="h-8 rounded-md text-xs flex-1 min-w-0"
              />
              <Badge variant="outline" className="h-5 text-[9px] uppercase shrink-0">
                {q.resource_type.replace("_", " ")}
              </Badge>
              <span className="text-[9px] text-muted-foreground shrink-0 hidden sm:inline">
                {(q.file.size / (1024 * 1024)).toFixed(1)}MB
              </span>
              {q.status === "error" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => retryItem(q.id)}
                  title={q.error}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(q.id)}
                disabled={q.status === "uploading"}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={saveAll}
              disabled={saving || uploadedCount === 0}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
              )}
              Save {uploadedCount} resource{uploadedCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkResourceUpload;
