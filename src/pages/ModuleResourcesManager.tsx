import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Upload,
  Video,
  FileText,
  Brain,
  HelpCircle,
  FileCheck,
  Trash2,
  Plus,
  Save,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

type ResourceType = Database["public"]["Enums"]["resource_type"];

interface ModuleResource {
  id?: string;
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
  lastSavedAt?: Date;
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

// CTO Strategy: Hardened JSON Editor for complex curriculum data
function JsonDataEditor({ value, onChange, label = "Object Schema" }: any) {
  const [rawText, setRawText] = useState(() => JSON.stringify(value || {}, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const handleTextChange = (text: string) => {
    setRawText(text);
    try {
      const parsed = JSON.parse(text);
      setParseError(null);
      onChange(parsed);
    } catch (e) {
      setParseError("Invalid Logic: Check syntax.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</Label>
        {parseError && (
          <Badge variant="destructive" className="h-5 text-[8px] animate-pulse">
            {parseError}
          </Badge>
        )}
      </div>
      <Textarea
        value={rawText}
        onChange={(e) => handleTextChange(e.target.value)}
        className={cn(
          "font-mono text-xs rounded-xl bg-muted/20 border-border/40 min-h-[200px] leading-relaxed",
          parseError && "border-rose-500/50",
        )}
      />
    </div>
  );
}

export default function ModuleResourcesManager() {
  const { contentId, moduleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [activeStage, setActiveStage] = useState("1");
  const [saveStates, setSaveStates] = useState<Record<string, ResourceSaveState>>({});

  useEffect(() => {
    loadData();
  }, [contentId, moduleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: courseData } = await supabase.from("content").select("id, title").eq("id", contentId).single();
      const { data: moduleData } = await supabase.from("course_modules").select("*").eq("id", moduleId).single();
      const { data: resData } = await supabase
        .from("module_resources")
        .select("*")
        .eq("module_id", moduleId)
        .order("display_order");

      if (courseData) setCourse(courseData);
      if (moduleData) setModule(moduleData);
      if (resData) {
        setResources(resData);
        const states: Record<string, ResourceSaveState> = {};
        resData.forEach((r) => {
          states[r.id] = { status: "saved" };
        });
        setSaveStates(states);
      }
    } catch (e) {
      toast.error("Handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  const addResource = (stage: number, type: ResourceType) => {
    const tempId = `temp-${Date.now()}`;
    const newRes: ModuleResource = {
      title: resourceTypeLabels[type],
      description: "",
      resource_type: type,
      resource_url: null,
      resource_data: {},
      stage_number: stage,
      display_order: resources.filter((r) => r.stage_number === stage).length,
      is_required: false,
    };
    setResources([...resources, newRes]);
    setSaveStates((prev) => ({ ...prev, [tempId]: { status: "unsaved" } }));
  };

  const saveResource = async (resource: ModuleResource, index: number) => {
    const key = resource.id || `temp-${index}`;
    setSaveStates((prev) => ({ ...prev, [key]: { status: "saving" } }));

    try {
      const payload = {
        ...resource,
        module_id: moduleId,
        description: resource.description || null,
      };

      let result;
      if (resource.id) {
        result = await supabase.from("module_resources").update(payload).eq("id", resource.id).select().single();
      } else {
        result = await supabase.from("module_resources").insert([payload]).select().single();
      }

      if (result.error) throw result.error;

      const updatedResources = [...resources];
      updatedResources[index] = result.data;
      setResources(updatedResources);
      setSaveStates((prev) => ({ ...prev, [result.data.id]: { status: "saved", lastSavedAt: new Date() } }));
      toast.success("Artifact Synchronized.");
    } catch (err: any) {
      setSaveStates((prev) => ({ ...prev, [key]: { status: "error", error: err.message } }));
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center animate-pulse font-black text-muted-foreground uppercase">
        Booting Resource Terminal...
      </div>
    );

  const unsavedTotal = Object.values(saveStates).filter((s) => s.status === "unsaved").length;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/content/${contentId}/modules`)}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Curriculum Manager
            </Button>
            <div className="h-4 w-px bg-border" />
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Resource Node</p>
              <p className="text-sm font-black tracking-tight">{module?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unsavedTotal > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 border-none font-black text-[9px] uppercase animate-pulse"
              >
                {unsavedTotal} Changes Pending
              </Badge>
            )}
            <Button
              onClick={async () => {
                const { data, error } = await supabase.rpc("generate_content_gigs_for_course" as any, {
                  _content_id: contentId,
                });
                if (error) toast.error(error.message);
                else toast.success(`Generated ${data ?? 0} content gigs for this course.`);
              }}
              variant="outline"
              className="h-10 rounded-xl border-primary/30 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest"
            >
              <Zap className="h-3 w-3 mr-2" /> Generate Gigs
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="h-10 rounded-xl border-border/40 font-black uppercase text-[10px] tracking-widest"
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Sync Terminal
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1.5 bg-card/50 backdrop-blur-md rounded-[24px] border border-border/40 mb-10 shadow-xl shadow-primary/5">
            {stageConfig.map((stage) => (
              <TabsTrigger
                key={stage.number}
                value={String(stage.number)}
                className="flex flex-col gap-1.5 py-4 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
              >
                <stage.icon className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">{stage.name}</span>
                {resources.filter((r) => r.stage_number === stage.number).length > 0 && (
                  <div className="h-1 w-4 bg-current/30 rounded-full mt-1" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {stageConfig.map((stage) => {
            const stageResources = resources.filter((r) => r.stage_number === stage.number);
            return (
              <TabsContent
                key={stage.number}
                value={String(stage.number)}
                className="space-y-6 focus-visible:outline-none"
              >
                <Card className="rounded-[32px] border-border/40 bg-card/30 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/20 py-6 px-8 flex flex-row items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                        <stage.icon className="h-5 w-5 text-primary" /> Phase 0{stage.number}: {stage.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                        Artifact Injection Layer
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {stage.resourceTypes.map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => addResource(stage.number, type)}
                          className="h-9 rounded-xl border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                          <Plus className="h-3 w-3 mr-1.5" /> {type.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    {stageResources.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[28px] bg-muted/10 group cursor-pointer hover:bg-muted/20 transition-all">
                        <Zap className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          Stage Incomplete: Initialize Artifacts
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {stageResources.map((resource, idx) => {
                          const resKey = resource.id || `temp-${idx}`;
                          const state = saveStates[resKey] || { status: "unsaved" };
                          return (
                            <Card
                              key={resKey}
                              className="rounded-[28px] border-border/40 bg-background shadow-lg overflow-hidden group hover:border-primary/20 transition-all"
                            >
                              <CardHeader className="py-4 px-6 border-b border-border/20 flex flex-row items-center justify-between bg-muted/20">
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant="outline"
                                    className="h-6 rounded-full border-primary/20 bg-primary/5 text-primary font-black text-[8px] uppercase tracking-tighter"
                                  >
                                    {resource.resource_type.replace("_", " ")}
                                  </Badge>
                                  {state.status === "saved" ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Locked</span>
                                    </div>
                                  ) : state.status === "saving" ? (
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Syncing</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-amber-500">
                                      <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Modified</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => saveResource(resource, idx)}
                                    disabled={state.status === "saving"}
                                  >
                                    <Save
                                      className={cn(
                                        "h-4 w-4",
                                        state.status === "unsaved"
                                          ? "text-primary animate-bounce"
                                          : "text-muted-foreground",
                                      )}
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-6">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                      Asset Identity
                                    </Label>
                                    <Input
                                      value={resource.title}
                                      onChange={(e) => {
                                        const update = [...resources];
                                        update[idx].title = e.target.value;
                                        setResources(update);
                                        setSaveStates((prev) => ({ ...prev, [resKey]: { status: "unsaved" } }));
                                      }}
                                      className="h-10 rounded-xl border-border/40 font-bold text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between bg-muted/30 px-4 rounded-xl border border-border/20 mt-6">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                      Required
                                    </span>
                                    <Switch
                                      checked={resource.is_required}
                                      onCheckedChange={(val) => {
                                        const update = [...resources];
                                        update[idx].is_required = val;
                                        setResources(update);
                                        setSaveStates((prev) => ({ ...prev, [resKey]: { status: "unsaved" } }));
                                      }}
                                    />
                                  </div>
                                </div>

                                {resource.resource_type === "flashcards" || resource.resource_type === "ai_scenario" ? (
                                  <JsonDataEditor
                                    value={resource.resource_data}
                                    label={
                                      resource.resource_type === "flashcards"
                                        ? "Neural Recall Schema"
                                        : "Simulated Logic Tree"
                                    }
                                    onChange={(data: any) => {
                                      const update = [...resources];
                                      update[idx].resource_data = data;
                                      setResources(update);
                                      setSaveStates((prev) => ({ ...prev, [resKey]: { status: "unsaved" } }));
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                      Source Pointer (URL/Endpoint)
                                    </Label>
                                    <Input
                                      value={resource.resource_url || ""}
                                      onChange={(e) => {
                                        const update = [...resources];
                                        update[idx].resource_url = e.target.value;
                                        setResources(update);
                                        setSaveStates((prev) => ({ ...prev, [resKey]: { status: "unsaved" } }));
                                      }}
                                      className="h-10 rounded-xl border-border/40 font-mono text-xs text-primary"
                                      placeholder="https://..."
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
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

// Internal Icon Fix
function CircleDot(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function MessageCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
