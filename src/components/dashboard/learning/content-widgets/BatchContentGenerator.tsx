import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Play,
  Square,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  HelpCircle,
  BookOpen,
  FileText,
  MessageSquare,
  RotateCcw,
  ChevronDown,
  Eye,
  Pencil,
  Check,
  X,
  Trash2,
  ShieldCheck,
  Zap,
  Terminal,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Autonomous Content Factory
 * High-fidelity orchestrator for batch AI generation and artifact review.
 * 2026 Standard: Executive Logic geometry with reinforced rate-limit telemetry.
 */

interface SchoolInfo {
  id: string;
  name: string;
  total: number;
  pending: number;
}

interface DraftPost {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  text_content?: string;
  tags?: string[];
  category?: string;
  status: string;
  created_at: string;
  author_name?: string;
}

type GeneratorType =
  | "quizzes"
  | "flashcards"
  | "scenarios"
  | "course-metadata"
  | "descriptions"
  | "blog-posts"
  | "feed-posts";

const GENERATORS: Record<
  GeneratorType,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    endpoint: string;
    batchSize: number;
    needsSchool: boolean;
    countLabel: string;
  }
> = {
  quizzes: {
    label: "Quiz Questions",
    icon: HelpCircle,
    description: "Generate 5 MCQ questions per module for the Assess stage",
    endpoint: "batch-generate-quizzes",
    batchSize: 3,
    needsSchool: true,
    countLabel: "questions",
  },
  flashcards: {
    label: "Flashcards",
    icon: BookOpen,
    description: "Generate 8-12 flashcard pairs per module for the Practice stage",
    endpoint: "batch-generate-flashcards",
    batchSize: 3,
    needsSchool: true,
    countLabel: "flashcard sets",
  },
  scenarios: {
    label: "AI Scenarios",
    icon: Brain,
    description: "Generate workplace decision scenarios per module for the Practice stage",
    endpoint: "batch-generate-scenarios",
    batchSize: 3,
    needsSchool: true,
    countLabel: "scenarios",
  },
  "course-metadata": {
    label: "Course Metadata",
    icon: FileText,
    description: "Generate descriptions, objectives, and hours for courses",
    endpoint: "batch-generate-course-metadata",
    batchSize: 5,
    needsSchool: true,
    countLabel: "courses",
  },
  descriptions: {
    label: "Module Specs",
    icon: FileText,
    description: "Generate 5-7 bullet guides for low-detail module descriptions",
    endpoint: "batch-generate-descriptions",
    batchSize: 3,
    needsSchool: true,
    countLabel: "descriptions",
  },
  "blog-posts": {
    label: "Intel Drafts",
    icon: Zap,
    description: "Generate SEO-optimized career intelligence drafts",
    endpoint: "batch-generate-blog-posts",
    batchSize: 5,
    needsSchool: false,
    countLabel: "posts",
  },
  "feed-posts": {
    label: "Seed Posts",
    icon: MessageSquare,
    description: "Generate community engagement artifacts",
    endpoint: "batch-generate-feed-posts",
    batchSize: 10,
    needsSchool: false,
    countLabel: "posts",
  },
};

const BLOG_CATEGORIES = [
  "career-advice",
  "industry-trends",
  "interview-tips",
  "remote-work",
  "skill-development",
  "workplace-culture",
];

export function BatchContentGenerator() {
  const [activeTab, setActiveTab] = useState<GeneratorType>("quizzes");
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processed, setProcessed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const [regenerateAll, setRegenerateAll] = useState(false);
  const stopRef = useRef(false);

  const [blogCategory, setBlogCategory] = useState("career-advice");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");

  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const generator = GENERATORS[activeTab];

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: schoolsData } = await supabase.from("schools").select("id, name").order("name");
      if (!schoolsData) return;

      const schoolInfos: SchoolInfo[] = [];
      for (const school of schoolsData) {
        const { data: programs } = await supabase.from("profession_categories").select("id").eq("school_id", school.id);
        if (!programs?.length) continue;
        const programIds = programs.map((p) => p.id);
        const { data: contents } = await supabase
          .from("content")
          .select("id, description, learning_objectives, estimated_hours")
          .in("profession_line_id", programIds);
        if (!contents?.length) continue;
        const contentIds = contents.map((c) => c.id);
        const { data: modules } = await supabase
          .from("course_modules")
          .select("id, description")
          .in("content_id", contentIds);
        if (!modules?.length) continue;

        let pending = 0;
        const moduleIds = modules.map((m) => m.id);
        if (activeTab === "quizzes") {
          const { data: qm } = await supabase.from("quiz_questions").select("module_id").in("module_id", moduleIds);
          pending = modules.length - new Set(qm?.map((q) => q.module_id)).size;
        } else if (activeTab === "descriptions") {
          pending = modules.filter((m) => (m.description || "").length < 500).length;
        } else if (activeTab === "course-metadata") {
          pending = contents.filter((c) => !c.description || !c.learning_objectives).length;
        } else {
          const rType = activeTab === "flashcards" ? "flashcards" : "ai_scenario";
          const { data: res } = await supabase
            .from("module_resources")
            .select("module_id")
            .in("module_id", moduleIds)
            .eq("resource_type", rType);
          pending = modules.length - new Set(res?.map((r) => r.module_id)).size;
        }

        schoolInfos.push({
          id: school.id,
          name: school.name,
          total: activeTab === "course-metadata" ? contents.length : modules.length,
          pending,
        });
      }
      setSchools(schoolInfos);
    } catch (err) {
      console.error("Registry Fault:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (generator.needsSchool) fetchSchools();
  }, [fetchSchools, activeTab]);

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      if (activeTab === "blog-posts") {
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("status", "draft")
          .order("created_at", { ascending: false });
        setDrafts((data || []) as DraftPost[]);
      } else if (activeTab === "feed-posts") {
        const { data } = await supabase
          .from("feed_posts")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        setDrafts((data || []) as DraftPost[]);
      }
    } finally {
      setLoadingDrafts(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!generator.needsSchool) fetchDrafts();
  }, [fetchDrafts, activeTab]);

  const addLog = (msg: string) =>
    setBatchLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  const runBatchSequence = async () => {
    if (generator.needsSchool && !selectedSchool) return toast.error("Logic Error: School node not selected");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Auth Handshake Failed");

    setIsRunning(true);
    stopRef.current = false;
    setProcessed(0);
    setRemaining(0);
    addLog(`Initializing ${generator.label} synthesis sequence...`);

    let totalProcessed = 0;
    let currentRemaining = Infinity;

    while (currentRemaining > 0 && !stopRef.current) {
      try {
        const body: any = { batch_size: generator.batchSize };
        if (generator.needsSchool) {
          body.school_id = selectedSchool;
          if (regenerateAll) body.regenerate_all = true;
        } else {
          body.count = generator.batchSize;
          if (topic) body.topic = topic;
          if (context) body.context = context;
          if (activeTab === "blog-posts") body.category = blogCategory;
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${generator.endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429) {
          addLog("⚠️ Throttle Active — cooling down 30s...");
          await new Promise((r) => setTimeout(r, 30000));
          continue;
        }

        if (!response.ok) throw new Error(`Handshake Error: ${response.status}`);

        const result = await response.json();
        const batchCount = result.inserted || result.updated || result.processed || 0;
        totalProcessed += batchCount;
        currentRemaining = result.remaining ?? 0;
        setProcessed(totalProcessed);
        setRemaining(currentRemaining);
        if (result.total) setTotalItems(result.total);

        if (batchCount === 0) {
          addLog(`✅ Synthesis Complete: All nodes sync'd.`);
          break;
        }

        addLog(`✓ Artifacts Generated: ${batchCount} ${generator.countLabel} (${currentRemaining} in queue)`);
        if (!generator.needsSchool) break;
        await new Promise((r) => setTimeout(r, 3000));
      } catch (err: any) {
        addLog(`❌ Protocol Fault: ${err.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    setIsRunning(false);
    generator.needsSchool ? fetchSchools() : fetchDrafts();
  };

  const stopSequence = () => {
    stopRef.current = true;
    addLog("Termination signal sent. Stopping after current logic cycle...");
  };

  const approveDraftArtifact = async (draft: DraftPost) => {
    setApprovingIds((prev) => new Set(prev).add(draft.id));
    try {
      const payload =
        activeTab === "blog-posts"
          ? { status: "published", published_at: new Date().toISOString() }
          : { status: "published", is_active: true };
      const table = activeTab === "blog-posts" ? "blog_posts" : "feed_posts";
      await supabase.from(table).update(payload).eq("id", draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast.success("Artifact Deployed: Node live.");
    } finally {
      setApprovingIds((prev) => {
        const s = new Set(prev);
        s.delete(draft.id);
        return s;
      });
    }
  };

  const progressPct =
    totalItems > 0 ? Math.round(((totalItems - remaining) / totalItems) * 100) : processed > 0 ? 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-1000 pb-20">
      <Tabs value={activeTab} onValueChange={(v) => !isRunning && setActiveTab(v as GeneratorType)}>
        <TabsList className="flex flex-wrap h-auto bg-muted/30 backdrop-blur-md rounded-[32px] border-2 border-border/40 p-1.5 shadow-xl">
          {(Object.entries(GENERATORS) as [GeneratorType, (typeof GENERATORS)[GeneratorType]][]).map(([key, gen]) => (
            <TabsTrigger
              key={key}
              value={key}
              disabled={isRunning}
              className="rounded-[24px] px-6 py-2.5 font-black uppercase text-[9px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all relative"
            >
              <gen.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{gen.label}</span>
              {!gen.needsSchool && key === activeTab && drafts.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-[8px] h-4 min-w-4 px-1">
                  {drafts.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(GENERATORS) as GeneratorType[]).map((key) => (
          <TabsContent
            key={key}
            value={key}
            className="mt-8 outline-none animate-in slide-in-from-bottom-4 duration-700"
          >
            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              <CardHeader className="p-10 border-b border-border/10 bg-muted/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                      {(() => {
                        const Icon = GENERATORS[key].icon;
                        return <Icon className="h-8 w-8 text-primary" />;
                      })()}
                      {GENERATORS[key].label} Factory
                    </CardTitle>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                      {GENERATORS[key].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {isRunning ? (
                      <Button
                        onClick={stopSequence}
                        variant="destructive"
                        className="rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20 gap-3"
                      >
                        <Square className="w-5 h-5" /> Kill Process
                      </Button>
                    ) : (
                      <Button
                        onClick={runBatchSequence}
                        disabled={GENERATORS[key].needsSchool && !selectedSchool}
                        className="rounded-xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 gap-3 group"
                      >
                        <Play className="w-5 h-5 group-hover:scale-110 transition-transform" /> Initialize Synthesis
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-10 space-y-10">
                {/* HUD: Factory Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {GENERATORS[key].needsSchool ? (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                          Target Faculty Node
                        </Label>
                        <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={isRunning}>
                          <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                            <SelectValue placeholder="Select faculty source..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2">
                            {schools.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="font-bold">
                                {s.name} {s.pending === 0 ? " [SYNC'D]" : ` [${s.pending} PENDING]`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                            Logic Topic
                          </Label>
                          <Input
                            placeholder="e.g. Industry Volatility Analytics"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isRunning}
                            className="h-12 rounded-xl border-2 font-bold"
                          />
                        </div>
                        {key === "blog-posts" && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                              Intel Class
                            </Label>
                            <Select value={blogCategory} onValueChange={setBlogCategory} disabled={isRunning}>
                              <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2">
                                {BLOG_CATEGORIES.map((c) => (
                                  <SelectItem key={c} value={c} className="font-bold uppercase text-[9px]">
                                    {c.replace(/-/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {GENERATORS[key].needsSchool && (
                      <div className="flex items-center justify-between p-6 rounded-[28px] border-2 bg-primary/5 border-primary/10 shadow-inner">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight italic">Purge & Recalibrate</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
                            Overwrite existing artifacts
                          </p>
                        </div>
                        <Switch checked={regenerateAll} onCheckedChange={setRegenerateAll} disabled={isRunning} />
                      </div>
                    )}
                    {!GENERATORS[key].needsSchool && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                          Context Payload
                        </Label>
                        <Textarea
                          placeholder="Define target audience logic..."
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          disabled={isRunning}
                          className="min-h-[108px] rounded-xl border-2 italic font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Telemetry: Progress Monitor */}
                {(isRunning || processed > 0) && (
                  <div className="p-8 rounded-[32px] border-2 bg-muted/10 space-y-6 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isRunning ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                          <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        )}
                        <span className="text-xl font-black uppercase tracking-tighter italic">
                          {isRunning ? "Synthesis Active" : "Cycle Verified"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-primary/20 text-primary px-4 py-1.5 rounded-lg"
                      >
                        {processed} / {totalItems || processed} ARTIFACTS SYNC'D
                      </Badge>
                    </div>
                    <Progress value={progressPct} className="h-4 rounded-full bg-primary/10" />
                  </div>
                )}

                {/* Console: Log Trace */}
                {batchLog.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 ml-2">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                        System Log Trace
                      </span>
                    </div>
                    <div className="bg-black/90 rounded-[28px] p-8 max-h-64 overflow-y-auto font-mono text-[11px] text-emerald-500 shadow-2xl border-2 border-border/10 selection:bg-emerald-500/20">
                      {batchLog.map((log, i) => (
                        <div
                          key={i}
                          className={cn("py-1 border-b border-white/5", i === 0 && "text-white animate-pulse")}
                        >
                          <span className="opacity-40 mr-4 inline-block w-20">{log.split("]")[0]}]</span>
                          {log.split("]")[1]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Node: Manual Deployment (blog/feed only) */}
                {!GENERATORS[key].needsSchool && (
                  <div className="pt-10 border-t border-border/10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                          <Eye className="h-6 w-6 text-primary" /> Review Registry
                        </h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
                          {drafts.length} Unverified Artifacts Awaiting Handshake
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {drafts.map((draft) => (
                        <Collapsible
                          key={draft.id}
                          className="group rounded-[28px] border-2 border-border/40 bg-background/50 hover:border-primary/40 transition-all"
                        >
                          <CollapsibleTrigger className="w-full flex items-center justify-between p-6 text-left">
                            <div className="space-y-1 flex-1">
                              <p className="font-black uppercase tracking-tight italic text-sm group-hover:text-primary transition-colors">
                                {draft.title || (draft.text_content || "").slice(0, 100) + "..."}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" /> {new Date(draft.created_at).toLocaleDateString()}
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                                <Badge variant="outline" className="text-[8px] h-4">
                                  {draft.category || "GENERAL"}
                                </Badge>
                              </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center transition-transform group-data-[state=open]:rotate-180">
                              <ChevronDown className="h-5 w-5" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-8 pb-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                              <div className="p-8 rounded-[24px] bg-muted/10 border-2 border-dashed border-border/60 prose prose-sm dark:prose-invert max-w-none italic">
                                {key === "blog-posts" ? (
                                  <ReactMarkdown>{draft.content || ""}</ReactMarkdown>
                                ) : (
                                  <p className="whitespace-pre-wrap">{draft.text_content}</p>
                                )}
                              </div>
                              <div className="flex gap-4">
                                <Button
                                  onClick={() => approveDraftArtifact(draft)}
                                  disabled={approvingIds.has(draft.id)}
                                  className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500"
                                >
                                  {approvingIds.has(draft.id) ? (
                                    <Loader2 className="animate-spin mr-2" />
                                  ) : (
                                    <ShieldCheck className="mr-2 w-4 h-4" />
                                  )}{" "}
                                  Authorize Deployment
                                </Button>
                                <Button
                                  variant="outline"
                                  className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
                                >
                                  <Pencil className="mr-2 w-4 h-4" /> Edit Logic
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="mr-2 w-4 h-4" /> Purge Artifact
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Operational Trace Footer */}
              <footer className="p-8 bg-muted/20 border-t border-border/10 flex items-center justify-between opacity-30">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
                    Autonomous Content Factory v2.6.4
                  </p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                    Core: Neural Synchronization Active
                  </p>
                </div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
                  ))}
                </div>
              </footer>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
