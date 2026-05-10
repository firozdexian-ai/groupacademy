import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  Layers,
  BookOpen,
  GripVertical,
} from "lucide-react";

type Course = { id: string; title: string; thumbnail_url: string | null; modules_count: number | null };
type Project = {
  id: string;
  course_id: string;
  status: string;
  is_published: boolean;
  total_credit_reward: number;
  completion_bonus: number;
  progress_percent: number;
  claimed_by: string | null;
  created_at: string;
  course?: { title: string; thumbnail_url: string | null };
};
type Subtask = {
  id: string;
  project_id: string;
  kind: string;
  module_id: string | null;
  title: string;
  brief: string | null;
  expected_format: string | null;
  credit_reward: number;
  display_order: number;
  status: string;
};

const SUBTASK_KINDS = [
  "cover",
  "intro_video",
  "module_slides",
  "module_video",
  "module_quiz",
  "reading",
  "caption",
  "translation",
  "exercise",
  "flashcards",
  "other",
];

export function GigsCourseProjectsTab() {
  const [loading, setLoading] = useState(true);
  const [coursesNoProject, setCoursesNoProject] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [genOpen, setGenOpen] = useState(false);
  const [genCourseId, setGenCourseId] = useState<string>("");
  const [genCredit, setGenCredit] = useState(5);
  const [genBonus, setGenBonus] = useState(25);
  const [generating, setGenerating] = useState(false);

  const [editProject, setEditProject] = useState<Project | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase
        .from("course_projects")
        .select("*, course:content!course_projects_course_id_fkey(title,thumbnail_url)")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const projList = (pData ?? []) as any as Project[];
      setProjects(projList);

      const projectCourseIds = new Set(projList.map((p) => p.course_id));
      const { data: cData, error: cErr } = await supabase
        .from("content")
        .select("id,title,thumbnail_url,modules_count,content_type")
        .eq("content_type", "recorded_course")
        .order("created_at", { ascending: false });
      if (cErr) throw cErr;
      setCoursesNoProject(((cData ?? []) as any).filter((c: Course) => !projectCourseIds.has(c.id)));
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    if (!genCourseId) {
      toast.error("Pick a course");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc("generate_course_project", {
        p_course_id: genCourseId,
        p_credit_per_subtask: genCredit,
        p_completion_bonus: genBonus,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed");
      toast.success(`Draft created — ${result.subtask_count} subtasks, ${result.total_credit_reward} credits`);
      setGenOpen(false);
      setGenCourseId("");
      await load();
      // Auto-open the newly created draft for review
      const { data: newProj } = await supabase
        .from("course_projects")
        .select("*, course:content!course_projects_course_id_fkey(title,thumbnail_url)")
        .eq("id", result.project_id)
        .maybeSingle();
      if (newProj) openEdit(newProj as any);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = async (p: Project) => {
    setEditProject(p);
    setSubLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_project_subtasks")
        .select("*")
        .eq("project_id", p.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      setSubtasks((data ?? []) as Subtask[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load subtasks");
    } finally {
      setSubLoading(false);
    }
  };

  const saveSubtask = async (st: Subtask) => {
    setSavingId(st.id);
    try {
      const { error } = await supabase
        .from("course_project_subtasks")
        .update({
          title: st.title,
          brief: st.brief,
          expected_format: st.expected_format,
          credit_reward: st.credit_reward,
          kind: st.kind as any,
          display_order: st.display_order,
        })
        .eq("id", st.id);
      if (error) throw error;
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const deleteSubtask = async (id: string) => {
    if (!confirm("Delete this subtask?")) return;
    const { error } = await supabase.from("course_project_subtasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSubtasks((s) => s.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  const addSubtask = async () => {
    if (!editProject) return;
    const nextOrder = (subtasks[subtasks.length - 1]?.display_order ?? 0) + 1;
    const { data, error } = await supabase
      .from("course_project_subtasks")
      .insert({
        project_id: editProject.id,
        kind: "other" as any,
        title: "New subtask",
        brief: "",
        expected_format: "",
        credit_reward: 5,
        display_order: nextOrder,
      })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setSubtasks((s) => [...s, data as Subtask]);
  };

  const recomputeTotal = useMemo(
    () => subtasks.reduce((sum, s) => sum + Number(s.credit_reward || 0), 0),
    [subtasks],
  );

  const syncProjectTotal = async () => {
    if (!editProject) return;
    const { error } = await supabase
      .from("course_projects")
      .update({ total_credit_reward: recomputeTotal })
      .eq("id", editProject.id);
    if (error) return toast.error(error.message);
    toast.success("Total updated");
    setEditProject({ ...editProject, total_credit_reward: recomputeTotal });
    await load();
  };

  const togglePublish = async (p: Project) => {
    const next = !p.is_published;
    const { error } = await supabase
      .from("course_projects")
      .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Published — visible to talents" : "Unpublished");
    await load();
    if (editProject?.id === p.id) setEditProject({ ...p, is_published: next });
  };

  const updateBonus = async (p: Project, bonus: number) => {
    const { error } = await supabase
      .from("course_projects")
      .update({ completion_bonus: bonus })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setEditProject({ ...p, completion_bonus: bonus });
    await load();
  };

  const deleteProject = async (p: Project) => {
    if (!confirm(`Delete draft project for "${p.course?.title}"? This cannot be undone.`)) return;
    const { data, error } = await supabase.rpc("delete_course_project", { p_project_id: p.id });
    if (error) return toast.error(error.message);
    const r = data as any;
    if (!r?.success) return toast.error(r?.error || "Delete failed");
    toast.success("Deleted");
    setEditProject(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Course Projects</h2>
          <p className="text-sm text-muted-foreground">
            Auto-generate course-bundled gig projects, review subtasks, then publish.
          </p>
        </div>
        <Button onClick={() => setGenOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate from course
        </Button>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts ({projects.filter((p) => !p.is_published).length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({projects.filter((p) => p.is_published).length})
          </TabsTrigger>
          <TabsTrigger value="missing">Courses without project ({coursesNoProject.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="mt-4">
          <ProjectGrid
            loading={loading}
            items={projects.filter((p) => !p.is_published)}
            onOpen={openEdit}
            onPublish={togglePublish}
            onDelete={deleteProject}
          />
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          <ProjectGrid
            loading={loading}
            items={projects.filter((p) => p.is_published)}
            onOpen={openEdit}
            onPublish={togglePublish}
            onDelete={deleteProject}
          />
        </TabsContent>
        <TabsContent value="missing" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : coursesNoProject.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              All courses have a project.
            </p>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {coursesNoProject.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.modules_count ?? 0} modules
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() => {
                        setGenCourseId(c.id);
                        setGenOpen(true);
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate project
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generator dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate course project</DialogTitle>
            <DialogDescription>
              Creates a draft project + subtasks (cover, intro video, slides/video/quiz per module).
              You can edit everything before publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Course</Label>
              <Select value={genCourseId} onValueChange={setGenCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a course…" />
                </SelectTrigger>
                <SelectContent>
                  {coursesNoProject.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Credits / subtask</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={genCredit}
                  onChange={(e) => setGenCredit(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Completion bonus</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={genBonus}
                  onChange={(e) => setGenBonus(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !genCourseId} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={(o) => !o && setEditProject(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {editProject.course?.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 flex-wrap">
                  <Badge variant={editProject.is_published ? "default" : "secondary"}>
                    {editProject.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline">Status: {editProject.status}</Badge>
                  <span className="text-xs">
                    Total: {editProject.total_credit_reward} cr · Bonus: {editProject.completion_bonus} cr
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 flex-wrap pb-2 border-b">
                <Button size="sm" variant="outline" onClick={syncProjectTotal} className="gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Sync total ({recomputeTotal} cr)
                </Button>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Bonus</Label>
                  <Input
                    type="number"
                    step="0.5"
                    className="h-8 w-20"
                    defaultValue={editProject.completion_bonus}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== editProject.completion_bonus) updateBonus(editProject, v);
                    }}
                  />
                </div>
                <Button size="sm" variant="secondary" onClick={addSubtask} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add subtask
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={editProject.is_published ? "outline" : "default"}
                    onClick={() => togglePublish(editProject)}
                    className="gap-1"
                  >
                    {editProject.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {editProject.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  {!editProject.claimed_by && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteProject(editProject)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {subLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {subtasks.map((st, idx) => (
                    <Card key={st.id}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                          <Input
                            className="h-8 flex-1"
                            value={st.title}
                            onChange={(e) =>
                              setSubtasks((s) =>
                                s.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x)),
                              )
                            }
                          />
                          <Select
                            value={st.kind}
                            onValueChange={(v) =>
                              setSubtasks((s) =>
                                s.map((x) => (x.id === st.id ? { ...x, kind: v } : x)),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBTASK_KINDS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.5"
                            className="h-8 w-20"
                            value={st.credit_reward}
                            onChange={(e) =>
                              setSubtasks((s) =>
                                s.map((x) =>
                                  x.id === st.id ? { ...x, credit_reward: Number(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <Textarea
                          placeholder="Brief / instructions for the talent"
                          rows={2}
                          value={st.brief ?? ""}
                          onChange={(e) =>
                            setSubtasks((s) =>
                              s.map((x) => (x.id === st.id ? { ...x, brief: e.target.value } : x)),
                            )
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Expected format (e.g. PDF, MP4 1080p)"
                            className="h-8 flex-1"
                            value={st.expected_format ?? ""}
                            onChange={(e) =>
                              setSubtasks((s) =>
                                s.map((x) =>
                                  x.id === st.id ? { ...x, expected_format: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveSubtask(st)}
                            disabled={savingId === st.id}
                            className="gap-1"
                          >
                            {savingId === st.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSubtask(st.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {subtasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No subtasks yet. Click "Add subtask".
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectGrid({
  loading,
  items,
  onOpen,
  onPublish,
  onDelete,
}: {
  loading: boolean;
  items: Project[];
  onOpen: (p: Project) => void;
  onPublish: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground py-12 text-center">Nothing here yet.</p>;
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Card key={p.id}>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm truncate">{p.course?.title || "Untitled"}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant={p.is_published ? "default" : "secondary"} className="text-xs">
                {p.is_published ? "Published" : "Draft"}
              </Badge>
              <Badge variant="outline" className="text-xs">{p.status}</Badge>
              {p.claimed_by && <Badge variant="outline" className="text-xs">Claimed</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {p.total_credit_reward} cr + {p.completion_bonus} bonus · {p.progress_percent}%
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpen(p)}>
                Review
              </Button>
              <Button
                size="sm"
                variant={p.is_published ? "ghost" : "default"}
                onClick={() => onPublish(p)}
              >
                {p.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              {!p.claimed_by && (
                <Button size="sm" variant="ghost" onClick={() => onDelete(p)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
