import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import StatsCard from "./StatsCard";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  Target,
  Loader2,
  Star,
  Sparkles,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  Zap,
  Database,
  Type,
  MoreHorizontal,
  MessageSquare,
  Mail,
  Linkedin,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { extractFirstName } from "@/lib/utils";

export function LeadHunterManager() {
  // Data State
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [huntMode, setHuntMode] = useState<"select" | "paste">("select");

  // Status State
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedJobId, setSelectedJobId] = useState("");
  const [rawJD, setRawJD] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);

  // Detail View State
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsRes, jobsRes] = await Promise.all([
        supabase.from("lead_hunt_sessions").select("*").order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("id, title, company_name, description")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;

      setSessions(sessionsRes.data || []);
      setActiveJobs(jobsRes.data || []);
    } catch (err: any) {
      console.error("LeadHunter Load Error:", err);
      setError(err.message || "Failed to connect to the recruitment engine.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return activeJobs;
    const term = jobSearch.toLowerCase();
    return activeJobs.filter(
      (j) => j.title?.toLowerCase().includes(term) || j.company_name?.toLowerCase().includes(term),
    );
  }, [activeJobs, jobSearch]);

  const handleJobSelection = (job: any) => {
    setSelectedJobId(job.id);
    setJobTitle(job.title);
    setCompanyName(job.company_name);
    setJobDescription(job.description);
    toast.success("Specs imported successfully");
  };

  const startHunt = async () => {
    setIsSearching(true);
    const finalDescription = huntMode === "select" ? jobDescription : rawJD;
    try {
      const { data, error: huntError } = await supabase.functions.invoke("lead-hunt-match", {
        body: {
          jobTitle: huntMode === "select" ? jobTitle : "External Hunt",
          companyName: huntMode === "select" ? companyName : "Manual",
          jobDescription: finalDescription,
          leadsRequested,
        },
      });
      if (huntError) throw huntError;
      toast.success("AI search complete!");
      loadData();
      setShowNewHunt(false);
      setJobSearch("");
    } catch (err) {
      toast.error("Match engine failed to respond.");
    } finally {
      setIsSearching(false);
    }
  };

  if (error) return <DashboardErrorState title="System Offline" message={error} onRetry={loadData} />;
  if (isLoading && !selectedSession) return <DashboardTableSkeleton rows={8} columns={4} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="border-muted shadow-sm bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4 px-6">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Executive Hunter
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground">
              Identify matches across our 2,211 talent profiles.
            </CardDescription>
          </div>
          <Button onClick={() => setShowNewHunt(true)} className="bg-primary font-black shadow-lg shadow-primary/30">
            <Zap className="w-4 h-4 mr-2" /> New Hunt
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {sessions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-xl opacity-50">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-bold">No Hunt Sessions Active</p>
              <p className="text-xs">Click 'New Hunt' to start matching talent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <Card
                  key={s.id}
                  className="hover:border-primary/50 cursor-pointer transition-all bg-background border-muted group"
                  onClick={() => setSelectedSession(s)}
                >
                  <div className="p-4 space-y-3">
                    <p className="font-bold text-foreground group-hover:text-primary truncate">{s.job_title}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-muted/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.company_name}</p>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {s.leads_requested} Target
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-background">
          <div className="bg-primary p-6 text-white">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Lead Engine
            </h2>
            <p className="text-xs font-bold opacity-80 mt-1">Select from {activeJobs.length} active platform jobs.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={huntMode === "select" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold border-muted-foreground/20"
                onClick={() => setHuntMode("select")}
              >
                <Database className="w-4 h-4" /> Internal Database
              </Button>
              <Button
                variant={huntMode === "paste" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold border-muted-foreground/20"
                onClick={() => setHuntMode("paste")}
              >
                <Type className="w-4 h-4" /> Manual Paste
              </Button>
            </div>

            {huntMode === "select" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs or companies..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-9 bg-muted/30 border-muted-foreground/20"
                  />
                </div>

                <ScrollArea className="h-[250px] border border-muted/50 rounded-lg bg-muted/5 p-2">
                  <div className="space-y-1">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => handleJobSelection(job)}
                          className={`p-3 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${selectedJobId === job.id ? "bg-primary text-white" : "hover:bg-muted"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{job.title}</p>
                            <p
                              className={`text-[10px] uppercase font-bold ${selectedJobId === job.id ? "text-white/80" : "text-muted-foreground"}`}
                            >
                              {job.company_name}
                            </p>
                          </div>
                          {selectedJobId === job.id && <CheckCircle className="h-4 w-4 ml-2" />}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs font-bold italic">No matching listings found.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-2 animate-in slide-in-from-bottom-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-widest">
                  Requirements Specification
                </Label>
                <Textarea
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Paste skills, tools, and experience requirements here..."
                  rows={8}
                  className="bg-muted/20 border-muted-foreground/20"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
            <Button variant="ghost" className="font-bold" onClick={() => setShowNewHunt(false)}>
              Cancel
            </Button>
            <Button
              onClick={startHunt}
              disabled={isSearching || (huntMode === "select" && !selectedJobId) || (huntMode === "paste" && !rawJD)}
              className="bg-primary font-black px-10 shadow-lg shadow-primary/40 transition-all active:scale-95"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
              Launch Match Engine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTalent && (
        <TalentDetailDialog open={talentDetailOpen} onOpenChange={setTalentDetailOpen} talent={selectedTalent} />
      )}
    </div>
  );
}
