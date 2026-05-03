import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  X,
  Eye,
  Activity,
  ShieldCheck,
  Layers,
  Terminal,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { extractFirstName, cn } from "@/lib/utils";

/**
 * Platform Logic: Lead Hunter Terminal (Lead Extraction)
 * CTO Audit: Injected "Match Forensics" (explain-score) panel to solve the B2B Black Box problem.
 */

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
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  // CTO FIX: State to manage which explanation panel is expanded
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  const loadRegistry = useCallback(async () => {
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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const loadSessionMatches = async (session: any) => {
    setSelectedSession(session);
    setLoadingMatches(true);
    setExpandedExplanationId(null); // Reset expansions on new session
    try {
      // CTO FIX: Added ai_explanation to the select query to expose the AI's reasoning
      const { data, error: matchErr } = await supabase
        .from("lead_hunt_matches")
        .select(
          `id, ai_match_score, ai_explanation, shortlisted, talent:talents ( id, full_name, email, phone, country, cv_url )`,
        )
        .eq("session_id", session.id)
        .order("ai_match_score", { ascending: false });
      if (matchErr) throw matchErr;
      setMatches(data || []);
    } catch (err) {
      toast.error("Failed to load match results");
    } finally {
      setLoadingMatches(false);
    }
  };

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
    toast.success("Job specs imported");
  };

  const startHunt = async () => {
    setIsSearching(true);
    try {
      const { data, error: huntError } = await supabase.functions.invoke("lead-hunt-match", {
        body: {
          jobTitle: huntMode === "select" ? jobTitle : "External Hunt",
          companyName: huntMode === "select" ? companyName : "Manual",
          jobDescription: huntMode === "select" ? jobDescription : rawJD,
          leadsRequested,
        },
      });
      if (huntError) throw huntError;
      toast.success("AI extraction complete!");
      loadRegistry();
      setShowNewHunt(false);
    } catch (err) {
      toast.error("Match engine failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (match: any, channel: "whatsapp" | "email" | "linkedin") => {
    const name = extractFirstName(match.talent.full_name);
    const title = selectedSession?.job_title || jobTitle;
    try {
      if (channel === "whatsapp" && match.talent.phone) {
        window.open(
          getOutreachWhatsAppLink(match.talent.phone, "welcome", name, match.talent.country, `Opportunity: ${title}`),
          "_blank",
        );
      } else if (channel === "email" && match.talent.email) {
        window.open(
          getOutreachEmailLink(match.talent.email, "welcome", name, match.talent.country, `Opportunity: ${title}`),
          "_blank",
        );
      } else if (channel === "linkedin") {
        const msg = getOutreachLinkedInMessage("welcome", name, match.talent.country, `Opportunity: ${title}`);
        await navigator.clipboard.writeText(msg);
        toast.success("Invite synchronized to clipboard");
      }
      await supabase.from("outreach_messages").insert({ talent_id: match.talent.id, product: "welcome", channel });
    } catch (err) {
      toast.error("Outreach sequence failed");
    }
  };

  if (error) return <DashboardErrorState title="Registry Connection Fault" message={error} onRetry={loadRegistry} />;

  if (selectedSession) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedSession(null)}
            className="rounded-xl h-12 w-12 border-2 hover:bg-background shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {selectedSession.job_title}
            </h2>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase px-3">
                {selectedSession.company_name}
              </Badge>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                Session ID: {selectedSession.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8 text-left w-1/3">
                  Candidate Artifact
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left w-1/3">
                  Logic Match Yield
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8 w-1/3">
                  Outreach Hub
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingMatches ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : matches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-20 text-muted-foreground/50 font-black uppercase tracking-widest italic text-sm"
                  >
                    No viable candidates extracted.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m) => (
                  <TableRow
                    key={m.id}
                    className="group transition-all hover:bg-primary/[0.02] border-b border-border/5 last:border-0 relative"
                  >
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1 text-left">
                        <p className="font-black text-base uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                          {m.talent.full_name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          {m.talent.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-left py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                              m.ai_match_score >= 80
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-amber-500/10 border-amber-500/20",
                            )}
                          >
                            <Sparkles
                              className={cn("h-4 w-4", m.ai_match_score >= 80 ? "text-emerald-500" : "text-amber-500")}
                            />
                          </div>
                          <div>
                            <p
                              className={cn(
                                "text-xl font-black italic tracking-tighter leading-none",
                                m.ai_match_score >= 80 ? "text-emerald-600" : "text-amber-600",
                              )}
                            >
                              {m.ai_match_score}%
                            </p>
                            <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">Match Strength</p>
                          </div>
                        </div>

                        {/* CTO FIX: Match Forensics Panel */}
                        {m.ai_explanation && (
                          <div className="mt-2 w-full max-w-sm">
                            <button
                              onClick={() => setExpandedExplanationId(expandedExplanationId === m.id ? null : m.id)}
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors py-1"
                            >
                              <BrainCircuit className="w-3 h-3" />
                              {expandedExplanationId === m.id ? "Hide Forensics" : "View Match Forensics"}
                              <ChevronDown
                                className={cn(
                                  "w-3 h-3 transition-transform",
                                  expandedExplanationId === m.id && "rotate-180",
                                )}
                              />
                            </button>

                            {expandedExplanationId === m.id && (
                              <div className="mt-2 p-3 bg-muted/30 border border-border/20 rounded-xl text-xs font-medium text-foreground/80 italic leading-relaxed animate-in slide-in-from-top-2">
                                {m.ai_explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 align-top py-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all shadow-inner"
                          onClick={() => {
                            setSelectedTalent(m.talent);
                            setTalentDetailOpen(true);
                          }}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all border-2 border-transparent hover:border-border"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-56 rounded-2xl border-2 shadow-2xl p-2 bg-background/95 backdrop-blur-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-xl font-bold p-3 gap-3 cursor-pointer"
                              onClick={() => handleInvite(m, "whatsapp")}
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp Direct
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl font-bold p-3 gap-3 cursor-pointer"
                              onClick={() => handleInvite(m, "email")}
                            >
                              <Mail className="w-4 h-4 text-blue-500" /> Email Synthesis
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl font-bold p-3 gap-3 cursor-pointer"
                              onClick={() => handleInvite(m, "linkedin")}
                            >
                              <Linkedin className="w-4 h-4 text-indigo-500" /> LinkedIn Pitch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <TalentDetailDialog open={talentDetailOpen} onOpenChange={setTalentDetailOpen} talent={selectedTalent} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Target className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Extraction Hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Automated Talent Forensics & Lead Ingestion Terminal
          </p>
        </div>
        <Button
          onClick={() => setShowNewHunt(true)}
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 mr-2" /> Initialize Hunt
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((s) => (
          <Card
            key={s.id}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-lg"
            onClick={() => loadSessionMatches(s)}
          >
            <div className="h-1 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardContent className="p-6 space-y-6 text-left">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                  Inquiry Subject
                </p>
                <p className="font-black text-lg uppercase tracking-tight italic line-clamp-1 leading-none">
                  {s.job_title}
                </p>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-border/10">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Entity</p>
                  <p className="text-[11px] font-bold uppercase truncate max-w-[120px]">{s.company_name}</p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-lg border-2 font-black text-[9px] tracking-widest uppercase py-1 px-3"
                >
                  {s.leads_requested} NODES
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-20 bg-muted/10 rounded-[40px] border-2 border-dashed border-border/40">
            <Database className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/50 italic">
              No Extraction Logs Found. Initialize a Hunt to begin.
            </p>
          </div>
        )}
      </div>

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <Sparkles className="h-10 w-10 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Hunt Orchestration
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Define logic parameters for AI Lead Extraction
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <Button
                  variant={huntMode === "select" ? "default" : "outline"}
                  className={cn(
                    "h-20 rounded-[24px] border-2 flex flex-col gap-2 font-black uppercase text-[10px] tracking-widest",
                    huntMode === "select"
                      ? "shadow-xl bg-primary text-white border-primary"
                      : "opacity-40 hover:opacity-100",
                  )}
                  onClick={() => setHuntMode("select")}
                >
                  <Database className="w-5 h-5" /> Registry Target
                </Button>
                <Button
                  variant={huntMode === "paste" ? "default" : "outline"}
                  className={cn(
                    "h-20 rounded-[24px] border-2 flex flex-col gap-2 font-black uppercase text-[10px] tracking-widest",
                    huntMode === "paste"
                      ? "shadow-xl bg-primary text-white border-primary"
                      : "opacity-40 hover:opacity-100",
                  )}
                  onClick={() => setHuntMode("paste")}
                >
                  <Type className="w-5 h-5" /> Raw JD Synthesis
                </Button>
              </div>

              {huntMode === "select" ? (
                <div className="space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Identify target spec from active listings..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="pl-12 h-14 bg-muted/20 border-2 border-border/10 rounded-2xl font-bold"
                    />
                  </div>
                  <div className="rounded-[28px] border-2 border-border/10 overflow-hidden bg-background/50">
                    <ScrollArea className="h-[300px] p-2">
                      <div className="space-y-2">
                        {filteredJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => handleJobSelection(job)}
                            className={cn(
                              "p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between group",
                              selectedJobId === job.id
                                ? "bg-primary text-white shadow-xl scale-[1.02]"
                                : "hover:bg-muted",
                            )}
                          >
                            <div className="min-w-0 flex-1 text-left">
                              <p className="font-black text-sm uppercase italic leading-none">{job.title}</p>
                              <p
                                className={cn(
                                  "text-[9px] font-bold uppercase mt-2 tracking-widest",
                                  selectedJobId === job.id ? "text-white/60" : "text-muted-foreground/60",
                                )}
                              >
                                {job.company_name}
                              </p>
                            </div>
                            {selectedJobId === job.id && <ShieldCheck className="h-6 w-6 ml-3" />}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Requirements Specification
                  </Label>
                  <Textarea
                    value={rawJD}
                    onChange={(e) => setRawJD(e.target.value)}
                    placeholder="Paste logic parameters, skills, and experience criteria..."
                    className="min-h-[250px] rounded-3xl border-2 bg-muted/5 font-mono text-sm p-6 italic"
                  />
                </div>
              )}

              <DialogFooter className="pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewHunt(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={startHunt}
                  disabled={
                    isSearching || (huntMode === "select" && !selectedJobId) || (huntMode === "paste" && !rawJD)
                  }
                  className="h-14 px-12 rounded-2xl bg-primary font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 gap-3 text-white"
                >
                  {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Target className="h-5 w-5" />} Launch
                  Extraction Protocol
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
