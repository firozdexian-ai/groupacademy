import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "./DashboardSkeleton";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { extractFirstName } from "@/lib/utils";

export function LeadHunterManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState(""); // New: Search within the job selector
  const [huntMode, setHuntMode] = useState<"select" | "paste">("select");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewHunt, setShowNewHunt] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [rawJD, setRawJD] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);

  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, jobsRes] = await Promise.all([
        supabase.from("lead_hunt_sessions").select("*").order("created_at", { ascending: false }),
        // Fetch more jobs to ensure search works, but keep it performant
        supabase
          .from("jobs")
          .select("id, title, company_name, description")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setSessions(sessionsRes.data || []);
      setActiveJobs(jobsRes.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered jobs based on user input in the selector
  const filteredJobs = useMemo(() => {
    if (!jobSearch) return activeJobs;
    const term = jobSearch.toLowerCase();
    return activeJobs.filter(
      (j) => j.title.toLowerCase().includes(term) || j.company_name.toLowerCase().includes(term),
    );
  }, [activeJobs, jobSearch]);

  const handleJobSelection = (job: any) => {
    setSelectedJobId(job.id);
    setJobTitle(job.title);
    setCompanyName(job.company_name);
    setJobDescription(job.description);
    toast.success(`Specs imported for ${job.title}`);
  };

  const startHunt = async () => {
    setIsSearching(true);
    const finalDescription = huntMode === "select" ? jobDescription : rawJD;
    try {
      const { data, error } = await supabase.functions.invoke("lead-hunt-match", {
        body: {
          jobTitle: huntMode === "select" ? jobTitle : "External Hunt",
          companyName: huntMode === "select" ? companyName : "Manual",
          jobDescription: finalDescription,
          leadsRequested,
        },
      });
      if (error) throw error;
      toast.success("Lead hunt initiated!");
      loadData();
      setShowNewHunt(false);
      setJobSearch("");
    } catch (err) {
      toast.error("Match engine failed");
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading && !selectedSession) return <DashboardTableSkeleton rows={8} columns={4} />;

  return (
    <div className="space-y-6">
      {/* Sessions Grid omitted for brevity, same as previous version */}

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-background">
          <div className="bg-primary p-6 text-white">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Smart Pipeline Builder
            </h2>
            <p className="text-xs font-bold opacity-80 mt-1">
              Select from {activeJobs.length}+ verified internal jobs.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={huntMode === "select" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold"
                onClick={() => setHuntMode("select")}
              >
                <Database className="w-4 h-4" /> Internal Database
              </Button>
              <Button
                variant={huntMode === "paste" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold"
                onClick={() => setHuntMode("paste")}
              >
                <Type className="w-4 h-4" /> External Paste
              </Button>
            </div>

            {huntMode === "select" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type job title or company to filter..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-9 bg-muted/30"
                  />
                </div>

                <ScrollArea className="h-[250px] border rounded-lg bg-muted/10 p-2">
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
                      <div className="text-center py-10 text-muted-foreground italic text-sm">
                        No jobs found matching "{jobSearch}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">Job Specification</Label>
                <Textarea
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Paste full requirements..."
                  rows={8}
                  className="bg-muted/30"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-muted/10 border-t gap-3">
            <Button variant="ghost" className="font-bold" onClick={() => setShowNewHunt(false)}>
              Cancel
            </Button>
            <Button
              onClick={startHunt}
              disabled={isSearching || (huntMode === "select" && !selectedJobId) || (huntMode === "paste" && !rawJD)}
              className="bg-primary font-black px-10"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
              Launch Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TalentDetailDialog open={talentDetailOpen} onOpenChange={setTalentDetailOpen} talent={selectedTalent} />
    </div>
  );
}
