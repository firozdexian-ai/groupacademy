import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Layers,
  ArrowUp,
  ArrowDown,
  Video,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Wand2,
  GripVertical,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ResearchPromptDialog from "@/components/modules/ResearchPromptDialog";
import { BatchContentGenerator } from "@/components/dashboard/learning/content-widgets/BatchContentGenerator";
import { DraggableList } from "@/components/dashboard/common/DraggableList";
import { ItemBankAnalyticsPanel } from "@/components/learning/ItemBankAnalyticsPanel";
import { useModuleReviewBadge } from "@/hooks/useModuleReviewBadge";

function ReviewNudge({ moduleId, onClick }: { moduleId: string; onClick: () => void }) {
  const { flagged, loading } = useModuleReviewBadge(moduleId);
  if (loading || flagged <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition"
      title="Items flagged for author review"
    >
      {flagged} need review
    </button>
  );
}

/**
 * Curriculum Module Manager
 * Lists, creates, reorders and edits modules for a given course.
 * Each module exposes a deep-link to its 6-stage Resource Manager.
 */

interface CourseModule {
  id: string;
  content_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number | null;
  is_preview: boolean | null;
}

type SaveStatus = "saved" | "unsaved" | "saving";

interface ModuleManagementProps {
  contentId?: string | null;
  onBack?: () => void;
}

export default function ModuleManagement(props: ModuleManagementProps = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const contentId = props.contentId ?? params.contentId ?? null;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<{ title: string; content_type: string } | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveStatus>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [researchModuleId, setResearchModuleId] = useState<string | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [analyticsModuleId, setAnalyticsModuleId] = useState<string | null>(null);
  

  const handleBack = () => {
    if (props.onBack) return props.onBack();
    if (contentId) navigate(`/content/${contentId}/edit`);
    else navigate(-1);
  };

  const loadModules = useCallback(async () => {
    if (!contentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [courseRes, modulesRes] = await Promise.all([
        supabase.from("content").select("title, content_type").eq("id", contentId).maybeSingle(),
        supabase
          .from("course_modules")
          .select("id, content_id, title, description, video_url, duration_minutes, display_order, is_preview")
          .eq("content_id", contentId)
          .order("display_order", { ascending: true, nullsFirst: false }),
      ]);

      if (courseRes.data) setCourse(courseRes.data);
      if (modulesRes.error) throw modulesRes.error;

      const mods = (modulesRes.data || []) as CourseModule[];
      setModules(mods);
      setSaveStates({});

      // Fetch resource counts per module so admins see content readiness at a glance.
      if (mods.length > 0) {
        const ids = mods.map((m) => m.id);
        const { data: resRows } = await supabase
          .from("module_resources")
          .select("module_id")
          .in("module_id", ids);
        const counts: Record<string, number> = {};
        (resRows || []).forEach((r: any) => {
          counts[r.module_id] = (counts[r.module_id] || 0) + 1;
        });
        setResourceCounts(counts);
      } else {
        setResourceCounts({});
      }
    } catch (e: any) {
      toast.error(`Failed to load modules: ${e.message ?? "unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const markUnsaved = (id: string) =>
    setSaveStates((prev) => ({ ...prev, [id]: prev[id] === "saving" ? prev[id] : "unsaved" }));

  const updateField = (id: string, field: keyof CourseModule, value: any) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    markUnsaved(id);
  };

  const addModule = async () => {
    if (!contentId) return;
    const nextOrder = modules.reduce((max, m) => Math.max(max, m.display_order ?? 0), 0) + 1;
    try {
      const { data, error } = await supabase
        .from("course_modules")
        .insert([
          {
            content_id: contentId,
            title: `Module ${nextOrder}`,
            description: "",
            display_order: nextOrder,
            is_preview: false,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setModules((prev) => [...prev, data as CourseModule]);
      toast.success("Module created.");
    } catch (e: any) {
      toast.error(`Could not create module: ${e.message}`);
    }
  };

  const saveModule = async (mod: CourseModule) => {
    setSaveStates((prev) => ({ ...prev, [mod.id]: "saving" }));
    try {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: mod.title,
          description: mod.description,
          video_url: mod.video_url,
          duration_minutes: mod.duration_minutes,
          display_order: mod.display_order,
          is_preview: mod.is_preview,
        })
        .eq("id", mod.id);
      if (error) throw error;
      setSaveStates((prev) => ({ ...prev, [mod.id]: "saved" }));
      toast.success("Module saved.");
    } catch (e: any) {
      setSaveStates((prev) => ({ ...prev, [mod.id]: "unsaved" }));
      toast.error(`Save failed: ${e.message}`);
    }
  };

  const reorder = async (id: string, direction: "up" | "down") => {
    const idx = modules.findIndex((m) => m.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= modules.length) return;
    const newList = [...modules];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    await reorderModules(newList);
  };

  const reorderModules = async (newList: CourseModule[]) => {
    // Densely renumber and persist only changed rows.
    const renumbered = newList.map((m, i) => ({ ...m, display_order: i + 1 }));
    const changed = renumbered.filter((m) => {
      const orig = modules.find((o) => o.id === m.id);
      return orig && orig.display_order !== m.display_order;
    });
    setModules(renumbered);
    if (!changed.length) return;
    try {
      await Promise.all(
        changed.map((m) =>
          supabase.from("course_modules").update({ display_order: m.display_order }).eq("id", m.id),
        ),
      );
    } catch (e: any) {
      toast.error("Reorder failed; reloading.");
      loadModules();
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("course_modules").delete().eq("id", deleteId);
      if (error) throw error;
      setModules((prev) => prev.filter((m) => m.id !== deleteId));
      toast.success("Module deleted.");
    } catch (e: any) {
      toast.error(`Delete failed: ${e.message}`);
    } finally {
      setDeleteId(null);
    }
  };

  const openResources = (moduleId: string) => {
    // When the admin opened Module Management from the dashboard (via props.onBack),
    // tag the deep-link so ModuleResourcesManager returns to the dashboard tab on Back.
    const fromDashboard = !!props.onBack;
    const qs = fromDashboard ? "?fromTab=1" : "";
    navigate(`/content/${contentId}/modules/${moduleId}/resources${qs}`);
  };

  if (!contentId) {
    return (
      <div className="p-10 text-center space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No course selected</p>
        <Button variant="outline" onClick={handleBack} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                Module Architecture
              </p>
              <p className="text-sm font-black tracking-tight truncate">
                {course?.title ?? "Course"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/instructor/review-queue")}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
              title="Items flagged across all modules"
            >
              <BarChart3 className="mr-2 h-3.5 w-3.5" /> Review queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadModules}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={addModule}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Module
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-xs font-black uppercase tracking-widest">Loading modules…</span>
          </div>
        ) : modules.length === 0 ? (
          <Card className="rounded-[24px] border-dashed border-border/60">
            <CardContent className="py-16 flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest">No modules yet</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Create the first module for this course. Each module becomes a stage-based learning unit.
                </p>
              </div>
              <Button onClick={addModule} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                <Plus className="mr-2 h-3.5 w-3.5" /> Create First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DraggableList
            items={modules}
            getId={(m) => m.id}
            onReorder={reorderModules}
            renderItem={(mod, index, dragHandle) => {
              const status = saveStates[mod.id] ?? "saved";
              return (
                <Card key={mod.id} className="rounded-[24px] border-border/40 overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-lg font-black text-[10px] tracking-widest">
                        #{mod.display_order ?? index + 1}
                      </Badge>
                      {mod.video_url && (
                        <Badge variant="secondary" className="rounded-lg gap-1 font-black text-[10px] tracking-widest">
                          <Video className="h-3 w-3" /> Video
                        </Badge>
                      )}
                      {(() => {
                        const c = resourceCounts[mod.id] || 0;
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg gap-1 font-black text-[10px] tracking-widest",
                              c === 0
                                ? "border-rose-500/30 text-rose-600 bg-rose-500/5"
                                : c < 6
                                  ? "border-amber-500/30 text-amber-600 bg-amber-500/5"
                                  : "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
                            )}
                          >
                            <Layers className="h-3 w-3" /> {c} resource{c === 1 ? "" : "s"}
                          </Badge>
                        );
                      })()}
                      {status === "unsaved" && (
                        <Badge className="rounded-lg bg-amber-500/15 text-amber-600 border-amber-500/30 font-black text-[10px] tracking-widest">
                          Unsaved
                        </Badge>
                      )}
                      {status === "saving" && (
                        <Badge variant="outline" className="rounded-lg font-black text-[10px] tracking-widest">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        {...dragHandle}
                        className={cn(dragHandle.className, "h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50")}
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={index === 0}
                        onClick={() => reorder(mod.id, "up")}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={index === modules.length - 1}
                        onClick={() => reorder(mod.id, "down")}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(mod.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Title
                      </Label>
                      <Input
                        value={mod.title}
                        onChange={(e) => updateField(mod.id, "title", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={mod.description ?? ""}
                        onChange={(e) => updateField(mod.id, "description", e.target.value)}
                        className="rounded-xl min-h-[80px]"
                        placeholder="What will the talent learn in this module?"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Video URL (optional)
                        </Label>
                        <Input
                          value={mod.video_url ?? ""}
                          onChange={(e) => updateField(mod.id, "video_url", e.target.value)}
                          placeholder="https://…"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Duration (minutes)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={mod.duration_minutes ?? ""}
                          onChange={(e) =>
                            updateField(
                              mod.id,
                              "duration_minutes",
                              e.target.value === "" ? null : parseInt(e.target.value, 10),
                            )
                          }
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Free Preview</p>
                        <p className="text-[10px] text-muted-foreground">
                          Allow non-enrolled talents to view this module.
                        </p>
                      </div>
                      <Switch
                        checked={!!mod.is_preview}
                        onCheckedChange={(v) => updateField(mod.id, "is_preview", v)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResources(mod.id)}
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest group"
                      >
                        <Layers className="mr-1.5 h-3.5 w-3.5" />
                        Resources
                        <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResearchModuleId(mod.id)}
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-primary/30 text-primary"
                        title="Open AI deep-research prompt for this module"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Research
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/quiz-manage/${contentId}`)}
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        title="Open the quiz builder for this course"
                      >
                        <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Quiz
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudioOpen(true)}
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        title="Bulk-generate content with AI Content Studio"
                      >
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" /> AI Studio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAnalyticsModuleId(mod.id)}
                        className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                        title="Item-bank analytics for this module"
                      >
                        <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Analytics
                      </Button>
                      <ReviewNudge moduleId={mod.id} onClick={() => setAnalyticsModuleId(mod.id)} />
                    </div>
                    <Button
                      onClick={() => saveModule(mod)}
                      disabled={status === "saving" || status === "saved"}
                      size="sm"
                      className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                    >
                      {status === "saving" ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-3.5 w-3.5" />
                      )}
                      Save Module
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            }}
          />
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this module?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the module and all of its stage resources. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {researchModuleId && (() => {
        const mod = modules.find((m) => m.id === researchModuleId);
        if (!mod) return null;
        const idx = modules.findIndex((m) => m.id === researchModuleId);
        return (
          <ResearchPromptDialog
            open={!!researchModuleId}
            onOpenChange={(o) => !o && setResearchModuleId(null)}
            moduleTitle={mod.title}
            moduleDescription={mod.description ?? ""}
            moduleIndex={idx + 1}
            totalModules={modules.length}
            courseTitle={course?.title ?? "Course"}
            courseIndex={1}
            totalCourses={1}
            levelName={course?.content_type ?? "Course"}
            programName={course?.title ?? ""}
            schoolName="GroUp Academy"
            academyName="GroUp Academy"
          />
        );
      })()}

      <Sheet open={studioOpen} onOpenChange={setStudioOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>AI Content Studio</SheetTitle>
            <SheetDescription>Bulk-generate quizzes, scenarios, and other resources.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <BatchContentGenerator />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!analyticsModuleId} onOpenChange={(o) => !o && setAnalyticsModuleId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Item-bank Analytics</SheetTitle>
            <SheetDescription>Per-item difficulty, topic mastery, and items needing review.</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {analyticsModuleId && <ItemBankAnalyticsPanel moduleId={analyticsModuleId} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
