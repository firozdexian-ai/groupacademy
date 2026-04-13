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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Trash2,
  Zap,
  Database,
  Type,
  MoreHorizontal,
  MessageSquare,
  Mail,
  Linkedin,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { extractFirstName } from "@/lib/utils";

export function LeadHunterManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [huntMode, setHuntMode] = useState<"select" | "paste">("select");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewHunt, setShowNewHunt] = useState(false);

  // Hunt State
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);

  // Session Detail State
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [sessionsRes, jobsRes] = await Promise.all([
      supabase.from("lead_hunt_sessions").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("id, title, company_name, description").eq("is_active", true).limit(50),
    ]);
    setSessions(sessionsRes.data || []);
    setActiveJobs(jobsRes.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJobSelection = (id: string) => {
    const job = activeJobs.find((j) => j.id === id);
    if (job) {
      setSelectedJobId(id);
      setJobTitle(job.title);
      setCompanyName(job.company_name);
      setJobDescription(job.description);
    }
  };

  const startHunt = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-hunt-match", {
        body: { jobTitle, companyName, jobDescription, leadsRequested },
      });
      if (error) throw error;
      toast.success("AI matching complete. Pipeline ready.");
      loadData();
      setShowNewHunt(false);
    } catch (err) {
      toast.error("Match engine failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (match: any, channel: "whatsapp" | "email" | "linkedin") => {
    const name = extractFirstName(match.talent.full_name);
    const jobInfo = `${jobTitle} at ${companyName}`;

    // Logic: Sends outreach using 'welcome' template refactored with job context
    if (channel === "whatsapp" && match.talent.phone) {
      window.open(
        getOutreachWhatsAppLink(match.talent.phone, "welcome", name, match.talent.country, jobInfo),
        "_blank",
      );
    } else if (channel === "email" && match.talent.email) {
      window.open(getOutreachEmailLink(match.talent.email, "welcome", name, match.talent.country, jobInfo), "_blank");
    } else if (channel === "linkedin") {
      const msg = getOutreachLinkedInMessage("welcome", name, match.talent.country, jobInfo);
      await navigator.clipboard.writeText(msg);
      toast.success("Invitation copied!");
    }

    await supabase.from("outreach_messages").insert({ talent_id: match.talent.id, product: "job_invite", channel });
  };

  if (isLoading && !selectedSession) return <DashboardTableSkeleton rows={8} columns={4} />;

  return (
    <div className="space-y-6">
      <Card className="border-muted shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Fulfillment Lead Hunter
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground">
              Proactive recruitment via internal talent pool matching.
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowNewHunt(true)}
            className="bg-primary font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Zap className="w-4 h-4 mr-2" /> New Fulfillment Hunt
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="hover:border-primary/50 cursor-pointer transition-all bg-card"
                onClick={() => setSelectedSession(s)}
              >
                <div className="p-4 space-y-3">
                  <p className="font-bold text-foreground truncate">{s.job_title}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-muted">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">{s.company_name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.leads_requested} Targets
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden bg-background">
          <div className="bg-primary p-6 text-white">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Pipeline Builder
            </h2>
            <p className="text-xs font-bold opacity-80 mt-1">
              Identify talent for internal roles or external acquisitions.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={huntMode === "select" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold"
                onClick={() => setHuntMode("select")}
              >
                <Database className="w-4 h-4" /> From Database
              </Button>
              <Button
                variant={huntMode === "paste" ? "default" : "outline"}
                className="h-16 flex flex-col gap-1 font-bold"
                onClick={() => setHuntMode("paste")}
              >
                <Type className="w-4 h-4" /> Paste External JD
              </Button>
            </div>

            {huntMode === "select" ? (
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">Select Verified Job</Label>
                <Select value={selectedJobId} onValueChange={handleJobSelection}>
                  <SelectTrigger className="bg-muted/30 h-12 border-muted-foreground/20">
                    <SelectValue placeholder="Browse platform listings..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeJobs.map((j) => (
                      <SelectItem key={j.id} value={j.id} className="py-2">
                        <div className="flex flex-col">
                          <span className="font-bold">{j.title}</span>
                          <span className="text-[10px] text-muted-foreground">{j.company_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">Paste Job Specs</Label>
                <Textarea
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Requirements, skills, location..."
                  rows={6}
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
              disabled={isSearching || (!selectedJobId && !rawJD)}
              className="bg-primary font-black px-10 shadow-lg shadow-primary/20"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
              Start Hunt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
