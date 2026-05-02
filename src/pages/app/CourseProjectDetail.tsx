import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, BookOpen, Coins, Clock, CheckCircle2, Lock, Upload,
  ChevronDown, ChevronUp, Loader2, Send,
} from "lucide-react";
import { GigUploader, type UploadedFile } from "@/components/gigs/GigUploader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

/**
 * Course Project Detail — claim, complete, and submit a bundled course-build project.
 */

const KIND_LABEL: Record<string, string> = {
  cover: "Cover image",
  intro_video: "Intro video",
  module_slides: "Module slides",
  module_quiz: "Module quiz",
  module_video: "Module video",
  reading: "Reading material",
  caption: "Captions",
  translation: "Translation",
  exercise: "Exercise",
  flashcards: "Flashcards",
  other: "Other",
};

export default function CourseProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const qc = useQueryClient();
  const [openSubtask, setOpenSubtask] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["course-project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from("course_projects" as any)
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;

      const { data: course } = await supabase
        .from("content")
        .select("id, title, description, cover_image_url")
        .eq("id", (project as any).course_id)
        .maybeSingle();

      const { data: subtasks } = await supabase
        .from("course_project_subtasks" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("display_order")
        .order("created_at");

      return { project: project as any, course, subtasks: (subtasks as any[]) || [] };
    },
  });

  const isOwner = !!talent?.id && data?.project?.claimed_by === talent.id;
  const isOpen = data?.project?.status === "open";
  const isLocked = data?.project ? !["open", "claimed", "in_progress"].includes(data.project.status) : true;

  const claim = useMutation({
    mutationFn: async () => {
      const { data: res, error } = await supabase.rpc("claim_course_project" as any, {
        p_project_id: projectId,
      });
      if (error) throw error;
      if (!(res as any)?.success) throw new Error((res as any)?.error || "Could not claim");
    },
    onSuccess: () => {
      toast.success("Project claimed — you have 14 days to complete it.");
      qc.invalidateQueries({ queryKey: ["course-project", projectId] });
      qc.invalidateQueries({ queryKey: ["course-projects-grouped"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_projects" as any)
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project submitted for review.");
      qc.invalidateQueries({ queryKey: ["course-project", projectId] });
    },
  });

  const allSubtasksDone = useMemo(
    () =>
      !!data?.subtasks?.length &&
      data.subtasks.every((s: any) => ["approved", "in_review"].includes(s.status)),
    [data?.subtasks],
  );

  if (isLoading || !data) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-3 pb-32">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  const { project, course, subtasks } = data;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-32 animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => navigate("/app/gigs")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Gig Hub
      </button>

      {/* Hero */}
      <Card className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            {course?.cover_image_url ? (
              <img src={course.cover_image_url} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                Course Project
              </Badge>
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                {course?.title || "Untitled course"}
              </h1>
              {course?.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
            <Stat icon={CheckCircle2} label="Subtasks" value={`${subtasks.length}`} />
            <Stat
              icon={Coins}
              label="Reward"
              value={`${Number(project.total_credit_reward || subtasks.reduce((s: number, t: any) => s + Number(t.credit_reward || 0), 0))} cr`}
            />
            <Stat
              icon={Clock}
              label={project.deadline ? "Deadline" : "Status"}
              value={
                project.deadline
                  ? formatDistanceToNow(new Date(project.deadline), { addSuffix: true })
                  : project.status
              }
            />
          </div>

          {project.status !== "open" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold">
                <span>Progress</span>
                <span>{project.progress_percent}%</span>
              </div>
              <Progress value={project.progress_percent} className="h-2" />
            </div>
          )}

          {isOpen ? (
            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => claim.mutate()}
              disabled={claim.isPending || !talent?.id}
            >
              {claim.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Claim this project
            </Button>
          ) : isOwner && project.status !== "submitted" && project.status !== "approved" && project.status !== "paid" ? (
            <Button
              className="w-full h-11 rounded-xl"
              onClick={() => submitProject.mutate()}
              disabled={!allSubtasksDone || submitProject.isPending}
            >
              {submitProject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Submit project for review
            </Button>
          ) : !isOwner && project.claimed_by ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2 text-xs text-amber-700 font-semibold">
              <Lock className="h-4 w-4" /> Already claimed by another talent
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Subtasks */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wide text-primary px-1">Subtasks</h2>
        {subtasks.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              This project has no subtasks yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          subtasks.map((s: any) => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              isOwner={isOwner}
              isLocked={isLocked}
              expanded={openSubtask === s.id}
              onToggle={() => setOpenSubtask(openSubtask === s.id ? null : s.id)}
              onUpdated={() => qc.invalidateQueries({ queryKey: ["course-project", projectId] })}
            />
          ))
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-sm font-black mt-0.5 capitalize truncate">{value}</p>
    </div>
  );
}

function SubtaskRow({
  subtask,
  isOwner,
  isLocked,
  expanded,
  onToggle,
  onUpdated,
}: {
  subtask: any;
  isOwner: boolean;
  isLocked: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
}) {
  const [files, setFiles] = useState<UploadedFile[]>(
    Array.isArray(subtask.submitted_files) ? subtask.submitted_files : [],
  );
  const [notes, setNotes] = useState<string>(subtask.submitted_notes || "");
  const [saving, setSaving] = useState(false);
  const canEdit = isOwner && !isLocked && subtask.status !== "approved";

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("course_project_subtasks" as any)
      .update({
        submitted_files: files,
        submitted_notes: notes || null,
        submitted_at: files.length ? new Date().toISOString() : null,
        status: files.length ? "in_review" : "pending",
      })
      .eq("id", subtask.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subtask saved.");
    onUpdated();
  };

  const statusColor =
    subtask.status === "approved"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
      : subtask.status === "in_review"
        ? "border-blue-500/30 bg-blue-500/5 text-blue-700"
        : subtask.status === "rejected"
          ? "border-rose-500/30 bg-rose-500/5 text-rose-700"
          : "border-border/50 bg-card/60 text-muted-foreground";

  return (
    <Card className="rounded-2xl border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
            statusColor,
          )}
        >
          {subtask.status === "approved" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-bold h-5 px-1.5">
              {KIND_LABEL[subtask.kind] || subtask.kind}
            </Badge>
            <Badge className={cn("text-[10px] h-5 px-1.5 capitalize border", statusColor)}>
              {subtask.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm font-bold mt-0.5 line-clamp-1">{subtask.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
            <Coins className="h-3 w-3" /> {subtask.credit_reward}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <CardContent className="p-3 pt-0 space-y-3 border-t border-border/40">
          {subtask.brief && <p className="text-xs text-muted-foreground">{subtask.brief}</p>}
          {subtask.expected_format && (
            <div className="text-[11px] text-muted-foreground">
              <span className="font-semibold">Expected format:</span> {subtask.expected_format}
            </div>
          )}

          {canEdit ? (
            <>
              <GigUploader
                value={files}
                onChange={setFiles}
                folder={`subtask/${subtask.id}`}
                maxFiles={5}
              />
              <Textarea
                placeholder="Notes for the reviewer (optional)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl text-sm"
                rows={2}
              />
              <Button onClick={save} disabled={saving} className="w-full h-10 rounded-xl">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save subtask
              </Button>
            </>
          ) : files.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">Submitted files</p>
              <ul className="text-xs space-y-1">
                {files.map((f) => (
                  <li key={f.path} className="truncate">
                    📎 {f.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              {isOwner ? "Project must be claimed and unlocked to upload." : "Claim the project to work on this subtask."}
            </p>
          )}

          {subtask.reviewer_notes && (
            <div className="rounded-xl border border-border/40 bg-muted/30 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
                Reviewer notes
              </p>
              <p className="text-xs">{subtask.reviewer_notes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
