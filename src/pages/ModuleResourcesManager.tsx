import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Video,
  FileText,
  Brain,
  HelpCircle,
  FileCheck,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Zap,
  MessageCircle,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { ModuleResourceFileUpload } from "@/components/dashboard/learning/modules/ModuleResourceFileUpload";
import { BulkResourceUpload } from "@/components/dashboard/learning/BulkResourceUpload";
import { DraggableList } from "@/components/dashboard/common/DraggableList";
import { GripVertical } from "lucide-react";

type ResourceType = Database["public"]["Enums"]["resource_type"];

interface ModuleResource {
  id?: string;
  _key?: string; // stable client key
  title: string;
  description: string;
  resource_type: ResourceType;
  resource_url: string | null;
  resource_data: any;
  stage_number: number;
  display_order: number;
  is_required: boolean;
}

interface ResourceSaveState {
  status: "saved" | "unsaved" | "saving" | "error";
  error?: string;
}

const stageConfig = [
  { number: 1, name: "Orientation", icon: Video, resourceTypes: ["video", "infographic"] as ResourceType[] },
  { number: 2, name: "Learn", icon: FileText, resourceTypes: ["slides", "mindmap", "infographic"] as ResourceType[] },
  { number: 3, name: "Discuss", icon: MessageCircle, resourceTypes: ["audio_podcast"] as ResourceType[] },
  { number: 4, name: "Practice", icon: Brain, resourceTypes: ["flashcards", "ai_scenario"] as ResourceType[] },
  { number: 5, name: "Assess", icon: HelpCircle, resourceTypes: ["quiz"] as ResourceType[] },
  { number: 6, name: "Progress", icon: FileCheck, resourceTypes: ["report"] as ResourceType[] },
];

const resourceTypeLabels: Record<ResourceType, string> = {
  video: "Strategic Video",
  slides: "Knowledge Deck",
  infographic: "Visual Map",
  mindmap: "Neural Map",
  audio_podcast: "Audio Brief",
  flashcards: "Recall Set",
  ai_scenario: "Neural Scenario",
  quiz: "Assessment",
  report: "Progress Report",
};

const acceptByType: Partial<Record<ResourceType, string>> = {
  video: "video/*",
  slides: ".pdf,.ppt,.pptx,application/pdf",
  infographic: "image/*,application/pdf",
  mindmap: "image/*,application/pdf",
  audio_podcast: "audio/*",
  report: ".pdf,application/pdf",
};

const isJsonType = (t: ResourceType) => t === "flashcards" || t === "ai_scenario" || t === "quiz";

function JsonDataEditor({ value, onChange, label }: any) {
  const [rawText, setRawText] = useState(() => JSON.stringify(value || {}, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</Label>
        {parseError && (
          <Badge variant="destructive" className="h-5 text-[8px]">
            {parseError}
          </Badge>
        )}
      </div>
      <Textarea
        value={rawText}
        onChange={(e) => {
          setRawText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setParseError(null);
            onChange(parsed);
          } catch {
            setParseError("Invalid JSON");
          }
        }}
        className={cn(
          "font-mono text-xs rounded-xl bg-muted/20 border-border/40 min-h-[180px] leading-relaxed",
          parseError && "border-rose-500/50",
        )}
      />
    </div>
  );
}

export default function ModuleResourcesManager() {
  const { contentId, moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [activeStage, setActiveStage] = useState("1");
  const [saveStates, setSaveStates] = useState<Record<string, ResourceSaveState>>({});
  

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, moduleRes, resRes] = await Promise.all([
        supabase.from("content").select("id, title").eq("id", contentId).maybeSingle(),
        supabase.from("course_modules").select("*").eq("id", moduleId).maybeSingle(),
        supabase
          .from("module_resources")
          .select("*")
          .eq("module_id", moduleId)
          .order("stage_number", { ascending: true })
          .order("display_order", { ascending: true }),
      ]);
      if (courseRes.data) setCourse(courseRes.data);
      if (moduleRes.data) setModule(moduleRes.data);
      const rows = (resRes.data || []).map((r: any) => ({ ...r, _key: r.id }));
      setResources(rows);
      const states: Record<string, ResourceSaveState> = {};
      rows.forEach((r: any) => (states[r._key] = { status: "saved" }));
      setSaveStates(states);
    } catch (e: any) {
      toast.error(`Load failed: ${e.message ?? "unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [contentId, moduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = () => {
    const fromTab = searchParams.get("fromTab");
    if (fromTab) {
      navigate(`/dashboard?tab=modules&id=${contentId}`);
    } else {
      navigate(`/content/${contentId}/modules`);
    }
  };

  const addResource = (stage: number, type: ResourceType) => {
    const tempKey = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newRes: ModuleResource = {
      _key: tempKey,
      title: resourceTypeLabels[type],
      description: "",
      resource_type: type,
      resource_url: null,
      resource_data: {},
      stage_number: stage,
      display_order: resources.filter((r) => r.stage_number === stage).length,
      is_required: false,
    };
    setResources((prev) => [...prev, newRes]);
    setSaveStates((prev) => ({ ...prev, [tempKey]: { status: "unsaved" } }));
  };

  const patchResource = (key: string, patch: Partial<ModuleResource>) => {
    setResources((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));
    setSaveStates((prev) => ({ ...prev, [key]: { status: "unsaved" } }));
  };

  const saveResource = async (resource: ModuleResource) => {
    const key = resource._key!;
    // Validate payload
    if (!resource.title?.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!isJsonType(resource.resource_type) && !resource.resource_url?.trim()) {
      toast.error("Add a file upload or URL before saving.");
      setSaveStates((prev) => ({ ...prev, [key]: { status: "error", error: "Missing URL/file" } }));
      return;
    }

    setSaveStates((prev) => ({ ...prev, [key]: { status: "saving" } }));
    try {
      const payload: any = {
        module_id: moduleId,
        title: resource.title,
        description: resource.description || null,
        resource_type: resource.resource_type,
        resource_url: resource.resource_url || null,
        resource_data: resource.resource_data ?? {},
        stage_number: resource.stage_number,
        display_order: resource.display_order ?? 0,
        is_required: !!resource.is_required,
      };

      let result;
      if (resource.id) {
        result = await supabase
          .from("module_resources")
          .update(payload)
          .eq("id", resource.id)
          .select()
          .single();
      } else {
        result = await supabase.from("module_resources").insert([payload]).select().single();
      }
      if (result.error) throw result.error;

      setResources((prev) =>
        prev.map((r) => (r._key === key ? { ...(result.data as any), _key: (result.data as any).id } : r)),
      );
      setSaveStates((prev) => {
        const next = { ...prev };
        delete next[key];
        next[(result.data as any).id] = { status: "saved" };
        return next;
      });
      toast.success("Resource saved.");
    } catch (err: any) {
      setSaveStates((prev) => ({ ...prev, [key]: { status: "error", error: err.message } }));
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const deleteResource = async (resource: ModuleResource) => {
    const key = resource._key!;
    if (!resource.id) {
      // local-only, just drop
      setResources((prev) => prev.filter((r) => r._key !== key));
      setSaveStates((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
      return;
    }
    if (!confirm(`Delete resource "${resource.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("module_resources").delete().eq("id", resource.id);
      if (error) throw error;
      setResources((prev) => prev.filter((r) => r._key !== key));
      toast.success("Resource deleted.");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const reorderStageResources = async (stage: number, newStageItems: ModuleResource[]) => {
    // Renumber within the stage densely. Persist only changed (already-saved) rows.
    const renumbered = newStageItems.map((r, i) => ({ ...r, display_order: i }));
    const updates = renumbered.filter((r) => {
      if (!r.id) return false;
      const orig = resources.find((o) => o._key === r._key);
      return orig && orig.display_order !== r.display_order;
    });
    setResources((prev) => {
      const others = prev.filter((r) => r.stage_number !== stage);
      return [...others, ...renumbered];
    });
    if (!updates.length) return;
    try {
      await Promise.all(
        updates.map((r) =>
          supabase.from("module_resources").update({ display_order: r.display_order }).eq("id", r.id!),
        ),
      );
    } catch (e: any) {
      toast.error("Reorder failed; reloading.");
      loadData();
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading resources…
      </div>
    );

  const unsavedTotal = Object.values(saveStates).filter((s) => s.status === "unsaved" || s.status === "error").length;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest truncate">
                {course?.title || "Course"}
              </p>
              <p className="text-sm font-black tracking-tight truncate">{module?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {unsavedTotal > 0 && (
              <Badge className="bg-amber-500/15 text-amber-700 border-none font-black text-[9px] uppercase">
                {unsavedTotal} pending
              </Badge>
            )}
            <Button
              onClick={() => navigate("/dashboard?tab=course-projects")}
              variant="outline"
              className="h-10 rounded-xl border-primary/30 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest"
            >
              <Zap className="h-3 w-3 mr-2" />
              Open Course Projects
            </Button>
            <Button
              onClick={loadData}
              variant="outline"
              className="h-10 rounded-xl border-border/40 font-black uppercase text-[10px] tracking-widest"
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1.5 bg-card/50 rounded-2xl border border-border/40 mb-6">
            {stageConfig.map((stage) => {
              const count = resources.filter((r) => r.stage_number === stage.number).length;
              return (
                <TabsTrigger
                  key={stage.number}
                  value={String(stage.number)}
                  className="flex flex-col gap-1 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <stage.icon className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{stage.name}</span>
                  <span className="text-[9px] opacity-70">{count}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {stageConfig.map((stage) => {
            const stageResources = resources.filter((r) => r.stage_number === stage.number);
            return (
              <TabsContent key={stage.number} value={String(stage.number)} className="space-y-4 focus-visible:outline-none">
                <Card className="rounded-3xl border-border/40 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/20 py-5 px-6 flex flex-row items-center justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                        <stage.icon className="h-5 w-5 text-primary" /> Stage {stage.number}: {stage.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground">
                        Add learning resources for this stage. Direct file upload supported.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stage.resourceTypes.map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => addResource(stage.number, type)}
                          className="h-9 rounded-xl border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white"
                        >
                          <Plus className="h-3 w-3 mr-1.5" /> {resourceTypeLabels[type]}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {moduleId && (
                      <BulkResourceUpload
                        moduleId={moduleId}
                        stageNumber={stage.number}
                        currentMaxOrder={stageResources.reduce(
                          (m, r) => Math.max(m, r.display_order ?? 0),
                          -1,
                        )}
                        onComplete={loadData}
                      />
                    )}
                    {stageResources.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/10">
                        <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                          No resources yet — bulk-upload above or add one type at a time.
                        </p>
                      </div>
                    ) : (
                      <DraggableList
                        items={stageResources}
                        getId={(r) => r._key!}
                        onReorder={(newItems) => reorderStageResources(stage.number, newItems)}
                        className="space-y-5"
                        renderItem={(resource, _i, dragHandle) => {
                          const key = resource._key!;
                          const state = saveStates[key] || { status: "saved" };
                          return (
                            <Card key={key} className="rounded-2xl border-border/40 bg-background overflow-hidden">
                              <CardHeader className="py-3 px-5 border-b border-border/20 flex flex-row items-center justify-between bg-muted/10">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div
                                    {...dragHandle}
                                    className={cn(dragHandle.className, "h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50")}
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="h-3.5 w-3.5" />
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="h-6 rounded-full border-primary/20 bg-primary/5 text-primary font-black text-[9px] uppercase"
                                  >
                                    {resource.resource_type.replace("_", " ")}
                                  </Badge>
                                  {state.status === "saved" && (
                                    <span className="flex items-center gap-1 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                      <CheckCircle2 className="h-3 w-3" /> Saved
                                    </span>
                                  )}
                                  {state.status === "saving" && (
                                    <span className="flex items-center gap-1 text-blue-500 text-[9px] font-black uppercase tracking-widest">
                                      <Loader2 className="h-3 w-3 animate-spin" /> Saving
                                    </span>
                                  )}
                                  {state.status === "unsaved" && (
                                    <span className="flex items-center gap-1 text-amber-600 text-[9px] font-black uppercase tracking-widest">
                                      <CircleDot className="h-3 w-3" /> Unsaved
                                    </span>
                                  )}
                                  {state.status === "error" && (
                                    <span className="flex items-center gap-1 text-rose-600 text-[9px] font-black uppercase tracking-widest">
                                      <AlertCircle className="h-3 w-3" /> {state.error || "Error"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => saveResource(resource)}
                                    disabled={state.status === "saving"}
                                    title="Save"
                                  >
                                    <Save className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                    onClick={() => deleteResource(resource)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr,160px] gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                      Title
                                    </Label>
                                    <Input
                                      value={resource.title}
                                      onChange={(e) => patchResource(key, { title: e.target.value })}
                                      className="h-10 rounded-xl"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between bg-muted/20 px-4 rounded-xl border border-border/20 mt-6 md:mt-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                      Required
                                    </span>
                                    <Switch
                                      checked={!!resource.is_required}
                                      onCheckedChange={(v) => patchResource(key, { is_required: v })}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Description (optional)
                                  </Label>
                                  <Textarea
                                    value={resource.description ?? ""}
                                    onChange={(e) => patchResource(key, { description: e.target.value })}
                                    rows={2}
                                    className="rounded-xl text-xs"
                                  />
                                </div>

                                {isJsonType(resource.resource_type) ? (
                                  <JsonDataEditor
                                    value={resource.resource_data}
                                    label={
                                      resource.resource_type === "flashcards"
                                        ? "Flashcards JSON"
                                        : resource.resource_type === "ai_scenario"
                                          ? "Scenario JSON"
                                          : "Quiz JSON"
                                    }
                                    onChange={(data: any) => patchResource(key, { resource_data: data })}
                                  />
                                ) : (
                                  <div className="space-y-3">
                                    <ModuleResourceFileUpload
                                      value={resource.resource_url}
                                      resourceId={resource.id}
                                      accept={acceptByType[resource.resource_type]}
                                      onChange={(url) => patchResource(key, { resource_url: url })}
                                    />
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        …or paste an external URL (YouTube, Drive, etc.)
                                      </Label>
                                      <Input
                                        value={resource.resource_url || ""}
                                        onChange={(e) => patchResource(key, { resource_url: e.target.value })}
                                        className="h-10 rounded-xl font-mono text-xs"
                                        placeholder="https://…"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end pt-1">
                                  <Button
                                    size="sm"
                                    onClick={() => saveResource(resource)}
                                    disabled={state.status === "saving"}
                                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                  >
                                    {state.status === "saving" ? (
                                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Save className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    Save Resource
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
