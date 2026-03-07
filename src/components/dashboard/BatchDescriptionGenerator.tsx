import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Square, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface SchoolInfo {
  id: string;
  name: string;
  total: number;
  pending: number;
}

export function BatchDescriptionGenerator() {
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processed, setProcessed] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const stopRef = useRef(false);

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all schools
      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, name")
        .order("name");

      if (!schoolsData) return;

      const schoolInfos: SchoolInfo[] = [];
      for (const school of schoolsData) {
        // Get programs under this school
        const { data: programs } = await supabase
          .from("profession_categories")
          .select("id")
          .eq("school_id", school.id);

        if (!programs || programs.length === 0) continue;
        const programIds = programs.map((p) => p.id);

        // Get content for these programs
        const { data: contents } = await supabase
          .from("content")
          .select("id")
          .in("profession_line_id", programIds);

        if (!contents || contents.length === 0) continue;
        const contentIds = contents.map((c) => c.id);

        // Count total modules
        const { count: totalCount } = await supabase
          .from("course_modules")
          .select("id", { count: "exact", head: true })
          .in("content_id", contentIds);

        // Get modules to check description length
        const { data: allModules } = await supabase
          .from("course_modules")
          .select("id, description")
          .in("content_id", contentIds);

        const pendingCount = (allModules || []).filter(
          (m) => (m.description || "").length < 200
        ).length;

        if (totalCount && totalCount > 0) {
          schoolInfos.push({
            id: school.id,
            name: school.name,
            total: totalCount,
            pending: pendingCount,
          });
        }
      }

      setSchools(schoolInfos);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
      toast.error("Failed to load school data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const addLog = (msg: string) => {
    setBatchLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const runBatch = async () => {
    if (!selectedSchool) {
      toast.error("Select a school first");
      return;
    }

    const school = schools.find((s) => s.id === selectedSchool);
    if (!school) return;

    setIsRunning(true);
    stopRef.current = false;
    setProcessed(0);
    setTotalPending(school.pending);
    setBatchLog([]);
    addLog(`Starting batch generation for "${school.name}" (${school.pending} modules pending)`);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Not authenticated");
      setIsRunning(false);
      return;
    }

    let totalProcessed = 0;
    let remaining = school.pending;
    let consecutiveErrors = 0;

    while (remaining > 0 && !stopRef.current) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-generate-descriptions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ school_id: selectedSchool, batch_size: 5 }),
          }
        );

        if (response.status === 429) {
          addLog("⚠️ Rate limited — pausing for 30s...");
          toast.warning("Rate limited. Pausing for 30 seconds...");
          await new Promise((r) => setTimeout(r, 30000));
          continue;
        }

        if (response.status === 402) {
          addLog("❌ AI credits exhausted. Stopping.");
          toast.error("AI credits exhausted. Please top up.");
          break;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.processed === 0) {
          addLog("✅ All modules in this school now have descriptions!");
          remaining = 0;
          break;
        }

        totalProcessed += result.processed;
        remaining = result.remaining;
        setProcessed(totalProcessed);
        setTotalPending(totalProcessed + remaining);
        consecutiveErrors = 0;

        addLog(`✓ Generated ${result.processed} descriptions (${remaining} remaining)`);

        // Wait 2s between batches
        if (remaining > 0 && !stopRef.current) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: unknown) {
        consecutiveErrors++;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        addLog(`❌ Error: ${errMsg}`);

        if (consecutiveErrors >= 3) {
          addLog("Too many consecutive errors. Stopping.");
          toast.error("Too many errors. Processing stopped.");
          break;
        }

        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    if (stopRef.current) {
      addLog(`⏹ Stopped by user. Processed ${totalProcessed} modules total.`);
    } else {
      addLog(`🎉 Done! Processed ${totalProcessed} modules total.`);
    }

    setIsRunning(false);
    fetchSchools();
  };

  const stopBatch = () => {
    stopRef.current = true;
    addLog("Stopping after current batch...");
  };

  const selectedSchoolInfo = schools.find((s) => s.id === selectedSchool);
  const progressPct = totalPending > 0 ? Math.round((processed / totalPending) * 100) : 0;
  const totalGlobalPending = schools.reduce((sum, s) => sum + s.pending, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Schools</CardDescription>
            <CardTitle className="text-2xl">{schools.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modules Needing Descriptions</CardDescription>
            <CardTitle className="text-2xl text-destructive">{totalGlobalPending.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Schools Complete</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {schools.filter((s) => s.pending === 0).length} / {schools.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Batch AI Description Generator</CardTitle>
          <CardDescription>
            Select a school and generate AI descriptions for all modules with placeholder descriptions (&lt;200 chars).
            Processes 5 modules per batch with automatic pacing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={isRunning}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isLoading ? "Loading schools..." : "Select a school"} />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <span className="flex items-center gap-2">
                      {school.name}
                      {school.pending > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {school.pending} pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">✓ Done</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!isRunning ? (
              <Button
                onClick={runBatch}
                disabled={!selectedSchool || isLoading || (selectedSchoolInfo?.pending === 0)}
                className="gap-2"
              >
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

          {/* Progress */}
          {(isRunning || processed > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                  {!isRunning && processed > 0 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  {isRunning ? "Processing..." : "Complete"}
                </span>
                <span className="text-muted-foreground">
                  {processed} / {totalPending} ({progressPct}%)
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {/* Log */}
          {batchLog.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
              {batchLog.map((log, i) => (
                <div key={i} className="text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* School List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-2">
              {schools.map((school) => (
                <div key={school.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{school.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {school.total - school.pending}/{school.total} done
                    </span>
                    <Progress
                      value={school.total > 0 ? ((school.total - school.pending) / school.total) * 100 : 100}
                      className="w-24 h-2"
                    />
                    {school.pending === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
