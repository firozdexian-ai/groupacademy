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
  Play, Square, Loader2, CheckCircle2, AlertTriangle, Brain,
  HelpCircle, BookOpen, FileText, MessageSquare, RotateCcw,
  ChevronDown, Eye, Pencil, Check, X, Trash2
} from "lucide-react";

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

type GeneratorType = "quizzes" | "flashcards" | "scenarios" | "course-metadata" | "blog-posts" | "feed-posts";

const GENERATORS: Record<GeneratorType, { label: string; icon: React.ElementType; description: string; endpoint: string; batchSize: number; needsSchool: boolean; countLabel: string }> = {
  "quizzes": {
    label: "Quiz Questions",
    icon: HelpCircle,
    description: "Generate 5 MCQ questions per module for the Assess stage",
    endpoint: "batch-generate-quizzes",
    batchSize: 3,
    needsSchool: true,
    countLabel: "questions",
  },
  "flashcards": {
    label: "Flashcards",
    icon: BookOpen,
    description: "Generate 8-12 flashcard pairs per module for the Practice stage",
    endpoint: "batch-generate-flashcards",
    batchSize: 3,
    needsSchool: true,
    countLabel: "flashcard sets",
  },
  "scenarios": {
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
    description: "Generate course descriptions, learning objectives, and estimated hours",
    endpoint: "batch-generate-course-metadata",
    batchSize: 5,
    needsSchool: true,
    countLabel: "courses",
  },
  "blog-posts": {
    label: "Blog Posts",
    icon: FileText,
    description: "Generate SEO-optimized blog posts — saved as drafts for review",
    endpoint: "batch-generate-blog-posts",
    batchSize: 5,
    needsSchool: false,
    countLabel: "posts",
  },
  "feed-posts": {
    label: "Feed Posts",
    icon: MessageSquare,
    description: "Generate community seed posts — saved as drafts for review",
    endpoint: "batch-generate-feed-posts",
    batchSize: 10,
    needsSchool: false,
    countLabel: "posts",
  },
};

const BLOG_CATEGORIES = [
  "career-advice", "industry-trends", "interview-tips", "remote-work",
  "skill-development", "workplace-culture", "freelancing", "tech-careers",
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

  // Blog/feed generation controls
  const [blogCategory, setBlogCategory] = useState("career-advice");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");

  // Draft review state
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const generator = GENERATORS[activeTab];

  // ─── School completion stats ───
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: schoolsData } = await supabase.from("schools").select("id, name").order("name");
      if (!schoolsData) return;

      const schoolInfos: SchoolInfo[] = [];
      for (const school of schoolsData) {
        const { data: programs } = await supabase
          .from("profession_categories").select("id").eq("school_id", school.id);
        if (!programs?.length) continue;
        const programIds = programs.map((p) => p.id);

        const { data: contents } = await supabase
          .from("content").select("id, description, learning_objectives, estimated_hours")
          .in("profession_line_id", programIds);
        if (!contents?.length) continue;
        const contentIds = contents.map((c) => c.id);

        const { data: modules } = await supabase
          .from("course_modules").select("id").in("content_id", contentIds);
        if (!modules?.length) continue;
        const moduleIds = modules.map((m) => m.id);
        const totalModules = modules.length;

        let pending = 0;
        if (activeTab === "quizzes") {
          const { data: quizModules } = await supabase
            .from("quiz_questions").select("module_id").in("module_id", moduleIds);
          const modulesWithQuiz = new Set((quizModules || []).map((q: any) => q.module_id));
          pending = totalModules - modulesWithQuiz.size;
        } else if (activeTab === "flashcards") {
          const { data: res } = await supabase
            .from("module_resources").select("module_id")
            .in("module_id", moduleIds).eq("resource_type", "flashcards");
          const done = new Set((res || []).map((r: any) => r.module_id));
          pending = totalModules - done.size;
        } else if (activeTab === "scenarios") {
          const { data: res } = await supabase
            .from("module_resources").select("module_id")
            .in("module_id", moduleIds).eq("resource_type", "ai_scenario");
          const done = new Set((res || []).map((r: any) => r.module_id));
          pending = totalModules - done.size;
        } else if (activeTab === "course-metadata") {
          pending = contents.filter(
            (c: any) => !c.description || !c.learning_objectives || !c.estimated_hours
          ).length;
        }

        schoolInfos.push({
          id: school.id,
          name: school.name,
          total: activeTab === "course-metadata" ? contents.length : totalModules,
          pending,
        });
      }

      setSchools(schoolInfos);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (GENERATORS[activeTab].needsSchool) fetchSchools();
  }, [fetchSchools, activeTab]);

  // ─── Draft loading ───
  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      if (activeTab === "blog-posts") {
        const { data } = await supabase
          .from("blog_posts").select("id, title, slug, excerpt, content, tags, category, status, created_at, author_name")
          .eq("status", "draft").order("created_at", { ascending: false });
        setDrafts((data || []) as DraftPost[]);
      } else if (activeTab === "feed-posts") {
        const { data } = await supabase
          .from("feed_posts").select("id, text_content, tags, status, created_at, author_name")
          .eq("status", "pending").order("created_at", { ascending: false });
        setDrafts((data || []) as DraftPost[]);
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!GENERATORS[activeTab].needsSchool) fetchDrafts();
  }, [fetchDrafts, activeTab]);

  const addLog = (msg: string) => {
    setBatchLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const runBatch = async () => {
    if (generator.needsSchool && !selectedSchool) {
      toast.error("Select a school first");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Not authenticated"); return; }

    setIsRunning(true);
    stopRef.current = false;
    setProcessed(0);
    setRemaining(0);
    setTotalItems(0);
    setBatchLog([]);
    addLog(`Starting ${generator.label} generation...`);

    let totalProcessed = 0;
    let consecutiveErrors = 0;
    let currentRemaining = Infinity;

    while (currentRemaining > 0 && !stopRef.current) {
      try {
        const body: any = { batch_size: generator.batchSize };
        if (generator.needsSchool) {
          body.school_id = selectedSchool;
          if (regenerateAll) body.regenerate_all = true;
        }
        if (!generator.needsSchool) {
          body.count = generator.batchSize;
          if (topic) body.topic = topic;
          if (context) body.context = context;
          if (activeTab === "blog-posts") body.category = blogCategory;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${generator.endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify(body),
          }
        );

        if (response.status === 429) {
          addLog("⚠️ Rate limited — pausing 30s...");
          await new Promise((r) => setTimeout(r, 30000));
          continue;
        }
        if (response.status === 402) {
          addLog("❌ AI credits exhausted.");
          toast.error("AI credits exhausted.");
          break;
        }
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown" }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        const batchCount = result.inserted || result.updated || result.processed || 0;
        totalProcessed += batchCount;
        currentRemaining = result.remaining ?? 0;
        setProcessed(totalProcessed);
        setRemaining(currentRemaining);
        if (result.total) setTotalItems(result.total);
        consecutiveErrors = 0;

        if (batchCount === 0 && !generator.needsSchool) {
          addLog(`✅ Generated ${result.inserted || 0} ${generator.countLabel} as drafts.`);
          break;
        }

        if (batchCount === 0) {
          addLog(`✅ All ${generator.countLabel} complete!`);
          currentRemaining = 0;
          break;
        }

        addLog(`✓ Generated ${batchCount} ${generator.countLabel} (${currentRemaining > 0 ? currentRemaining + " remaining" : "done"})`);

        if (!generator.needsSchool) break; // blog/feed run once

        if (currentRemaining > 0 && !stopRef.current) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err: unknown) {
        consecutiveErrors++;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        addLog(`❌ Error: ${errMsg}`);
        if (consecutiveErrors >= 3) {
          addLog("Too many errors. Stopping.");
          toast.error("Too many errors. Stopped.");
          break;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    if (stopRef.current) {
      addLog(`⏹ Stopped. Processed ${totalProcessed} ${generator.countLabel}.`);
    } else if (currentRemaining <= 0) {
      addLog(`🎉 Done! Processed ${totalProcessed} ${generator.countLabel} total.`);
    }
    setIsRunning(false);

    // Refresh data
    if (generator.needsSchool) fetchSchools();
    else fetchDrafts();
  };

  const stopBatch = () => {
    stopRef.current = true;
    addLog("Stopping after current batch...");
  };

  // ─── Draft actions ───
  const approveDraft = async (draft: DraftPost) => {
    setApprovingIds((prev) => new Set(prev).add(draft.id));
    try {
      if (activeTab === "blog-posts") {
        await supabase.from("blog_posts").update({
          status: "published",
          published_at: new Date().toISOString(),
        }).eq("id", draft.id);
      } else {
        await supabase.from("feed_posts").update({
          status: "published",
          is_active: true,
        }).eq("id", draft.id);
      }
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast.success("Post approved and published!");
    } catch {
      toast.error("Failed to approve");
    } finally {
      setApprovingIds((prev) => { const s = new Set(prev); s.delete(draft.id); return s; });
    }
  };

  const rejectDraft = async (id: string) => {
    const table = activeTab === "blog-posts" ? "blog_posts" : "feed_posts";
    await supabase.from(table).delete().eq("id", id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    toast.success("Draft rejected and deleted.");
  };

  const saveEdit = async (draft: DraftPost) => {
    if (activeTab === "blog-posts") {
      await supabase.from("blog_posts").update({ content: editContent }).eq("id", draft.id);
    } else {
      await supabase.from("feed_posts").update({ text_content: editContent }).eq("id", draft.id);
    }
    setDrafts((prev) => prev.map((d) =>
      d.id === draft.id
        ? { ...d, content: activeTab === "blog-posts" ? editContent : d.content, text_content: activeTab === "feed-posts" ? editContent : d.text_content }
        : d
    ));
    setEditingId(null);
    toast.success("Saved!");
  };

  const approveAll = async () => {
    if (!drafts.length) return;
    const table = activeTab === "blog-posts" ? "blog_posts" : "feed_posts";
    const ids = drafts.map((d) => d.id);

    if (activeTab === "blog-posts") {
      await supabase.from(table).update({ status: "published", published_at: new Date().toISOString() }).in("id", ids);
    } else {
      await supabase.from(table).update({ status: "published", is_active: true }).in("id", ids);
    }
    setDrafts([]);
    toast.success(`All ${ids.length} drafts approved!`);
  };

  const rejectAll = async () => {
    if (!drafts.length) return;
    const table = activeTab === "blog-posts" ? "blog_posts" : "feed_posts";
    const ids = drafts.map((d) => d.id);
    await supabase.from(table).delete().in("id", ids);
    setDrafts([]);
    toast.success(`All ${ids.length} drafts deleted.`);
  };

  const progressPct = totalItems > 0 ? Math.round(((totalItems - remaining) / totalItems) * 100) : (processed > 0 ? 100 : 0);

  const totalPending = schools.reduce((s, sc) => s + sc.pending, 0);
  const totalComplete = schools.filter((s) => s.pending === 0).length;
  const selectedSchoolInfo = schools.find((s) => s.id === selectedSchool);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => { if (!isRunning) setActiveTab(v as GeneratorType); }}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto">
          {(Object.entries(GENERATORS) as [GeneratorType, typeof GENERATORS[GeneratorType]][]).map(([key, gen]) => (
            <TabsTrigger key={key} value={key} disabled={isRunning} className="text-xs gap-1 py-2 relative">
              <gen.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{gen.label}</span>
              {!gen.needsSchool && key === activeTab && drafts.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[9px] leading-none">
                  {drafts.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(GENERATORS) as GeneratorType[]).map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => { const Icon = GENERATORS[key].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                  Batch {GENERATORS[key].label} Generator
                </CardTitle>
                <CardDescription>{GENERATORS[key].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ─── School completion summary (learning tabs only) ─── */}
                {GENERATORS[key].needsSchool && !isLoading && schools.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{schools.length}</div>
                      <div className="text-xs text-muted-foreground">Schools</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-destructive">{totalPending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{totalComplete}</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {GENERATORS[key].needsSchool && (
                    <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={isRunning}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading schools..." : "Select a school"} />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            <span className="flex items-center gap-2">
                              {school.name}
                              {school.pending === 0 ? (
                                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Done</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">{school.pending} pending</Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* ─── Blog/Feed generation controls ─── */}
                  {!GENERATORS[key].needsSchool && key === "blog-posts" && (
                    <Select value={blogCategory} onValueChange={setBlogCategory} disabled={isRunning}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {!isRunning ? (
                    <Button onClick={runBatch} disabled={GENERATORS[key].needsSchool && (!selectedSchool || isLoading)} className="gap-2">
                      <Play className="w-4 h-4" />
                      Generate {!GENERATORS[key].needsSchool ? "Drafts" : ""}
                    </Button>
                  ) : (
                    <Button onClick={stopBatch} variant="destructive" className="gap-2">
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  )}
                </div>

                {/* Topic and context for blog/feed */}
                {!GENERATORS[key].needsSchool && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Topic (optional)</Label>
                      <Input
                        placeholder="e.g. Remote work trends in tech"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Context (optional)</Label>
                      <Input
                        placeholder="e.g. Target fresh graduates in Bangladesh"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                  </div>
                )}

                {/* Regenerate toggle for school-based generators */}
                {GENERATORS[key].needsSchool && selectedSchoolInfo && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">Regenerate existing (overwrite)</Label>
                    </div>
                    <Switch checked={regenerateAll} onCheckedChange={setRegenerateAll} disabled={isRunning} />
                  </div>
                )}

                {(isRunning || processed > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                        {!isRunning && processed > 0 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        {isRunning ? "Processing..." : "Complete"}
                      </span>
                      <span className="text-muted-foreground">
                        {processed} {GENERATORS[key].countLabel} generated
                        {remaining > 0 && ` • ${remaining} remaining`}
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                )}

                {batchLog.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                    {batchLog.map((log, i) => (
                      <div key={i} className="text-muted-foreground">{log}</div>
                    ))}
                  </div>
                )}

                {/* ─── School status list (learning tabs) ─── */}
                {GENERATORS[key].needsSchool && !isLoading && schools.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">School Status</h4>
                    {schools.map((school) => {
                      const pct = school.total > 0 ? Math.round(((school.total - school.pending) / school.total) * 100) : 100;
                      return (
                        <div key={school.id} className="flex items-center gap-3 text-sm">
                          <span className="flex-1 truncate">{school.name}</span>
                          <Progress value={pct} className="h-1.5 w-24" />
                          <span className="text-xs w-16 text-right text-muted-foreground">
                            {school.total - school.pending}/{school.total}
                          </span>
                          {school.pending === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ─── Pending Drafts Review (blog/feed tabs) ─── */}
                {!GENERATORS[key].needsSchool && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Pending Review
                        {drafts.length > 0 && (
                          <Badge variant="secondary">{drafts.length}</Badge>
                        )}
                      </h4>
                      {drafts.length > 0 && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={approveAll}>
                            <Check className="w-3 h-3" /> Approve All
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs h-7 text-destructive" onClick={rejectAll}>
                            <Trash2 className="w-3 h-3" /> Reject All
                          </Button>
                        </div>
                      )}
                    </div>

                    {loadingDrafts && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}

                    {!loadingDrafts && drafts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No drafts pending review. Generate some above!</p>
                    )}

                    {drafts.map((draft) => (
                      <Collapsible key={draft.id}>
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {draft.title || (draft.text_content || "").slice(0, 80) + "..."}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(draft.created_at).toLocaleDateString()}
                                {draft.category && ` · ${draft.category}`}
                              </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-3 pb-3 space-y-3">
                              {editingId === draft.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[200px] text-sm font-mono"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => saveEdit(draft)} className="gap-1">
                                      <Check className="w-3 h-3" /> Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto text-sm prose prose-sm dark:prose-invert max-w-none">
                                    {key === "blog-posts" ? (
                                      <ReactMarkdown>{draft.content || ""}</ReactMarkdown>
                                    ) : (
                                      <p className="whitespace-pre-wrap">{draft.text_content}</p>
                                    )}
                                  </div>
                                  {key === "feed-posts" && draft.text_content && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {draft.text_content.trim().split(/\s+/).length} words
                                    </p>
                                  )}
                                </>
                              )}

                              {draft.tags && draft.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {draft.tags.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                                  ))}
                                </div>
                              )}

                              {editingId !== draft.id && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => approveDraft(draft)}
                                    disabled={approvingIds.has(draft.id)}
                                  >
                                    {approvingIds.has(draft.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                      setEditingId(draft.id);
                                      setEditContent(key === "blog-posts" ? (draft.content || "") : (draft.text_content || ""));
                                    }}
                                  >
                                    <Pencil className="w-3 h-3" /> Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1 text-destructive"
                                    onClick={() => rejectDraft(draft.id)}
                                  >
                                    <X className="w-3 h-3" /> Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
