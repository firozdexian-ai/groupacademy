import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Play, Square, Loader2, CheckCircle2, AlertTriangle, Brain, HelpCircle, BookOpen, FileText, MessageSquare } from "lucide-react";

interface SchoolInfo {
  id: string;
  name: string;
  total: number;
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
    description: "Generate SEO-optimized blog posts about career development",
    endpoint: "batch-generate-blog-posts",
    batchSize: 5,
    needsSchool: false,
    countLabel: "posts",
  },
  "feed-posts": {
    label: "Feed Posts",
    icon: MessageSquare,
    description: "Generate community seed posts for the social feed",
    endpoint: "batch-generate-feed-posts",
    batchSize: 10,
    needsSchool: false,
    countLabel: "posts",
  },
};

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
  const stopRef = useRef(false);

  const generator = GENERATORS[activeTab];

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      if (data) {
        setSchools(data.map((s) => ({ id: s.id, name: s.name, total: 0 })));
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

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
        if (generator.needsSchool) body.school_id = selectedSchool;
        if (!generator.needsSchool) body.count = generator.batchSize;

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
          toast.warning("Rate limited. Pausing 30s...");
          await new Promise((r) => setTimeout(r, 30000));
          continue;
        }
        if (response.status === 402) {
          addLog("❌ AI credits exhausted.");
          toast.error("AI credits exhausted. Please top up.");
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
          // Content generators (blog/feed) don't have remaining, run once
          addLog(`✅ Generated ${result.inserted || 0} ${generator.countLabel}. Total: ${result.total_posts || "?"}`);
          break;
        }

        if (batchCount === 0) {
          addLog(`✅ All ${generator.countLabel} complete!`);
          currentRemaining = 0;
          break;
        }

        addLog(`✓ Generated ${batchCount} ${generator.countLabel} (${currentRemaining} remaining)`);

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
  };

  const stopBatch = () => {
    stopRef.current = true;
    addLog("Stopping after current batch...");
  };

  const progressPct = totalItems > 0 ? Math.round(((totalItems - remaining) / totalItems) * 100) : (processed > 0 ? 100 : 0);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => { if (!isRunning) setActiveTab(v as GeneratorType); }}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto">
          {(Object.entries(GENERATORS) as [GeneratorType, typeof GENERATORS[GeneratorType]][]).map(([key, gen]) => (
            <TabsTrigger key={key} value={key} disabled={isRunning} className="text-xs gap-1 py-2">
              <gen.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{gen.label}</span>
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
                <div className="flex flex-col sm:flex-row gap-3">
                  {GENERATORS[key].needsSchool && (
                    <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={isRunning}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading schools..." : "Select a school"} />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {!isRunning ? (
                    <Button onClick={runBatch} disabled={GENERATORS[key].needsSchool && (!selectedSchool || isLoading)} className="gap-2">
                      <Play className="w-4 h-4" />
                      Start Generating
                    </Button>
                  ) : (
                    <Button onClick={stopBatch} variant="destructive" className="gap-2">
                      <Square className="w-4 h-4" />
                      Stop
                    </Button>
                  )}
                </div>

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
                  <div className="bg-muted/50 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                    {batchLog.map((log, i) => (
                      <div key={i} className="text-muted-foreground">{log}</div>
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
