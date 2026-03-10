import { useState, useEffect, useCallback } from "react";
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
  Download,
  Sparkles,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadFile } from "@/lib/downloadFile";
import { useIsMobile } from "@/hooks/use-mobile";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface LeadHuntSession {
  id: string;
  job_title: string;
  company_name: string | null;
  job_description: string;
  leads_requested: number;
  status: string;
  created_at: string;
  match_count?: number;
}

interface LeadMatch {
  id: string;
  initial_score: number | null;
  ai_match_score: number | null;
  ai_analysis: any;
  shortlisted: boolean;
  talent: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    skills: string[];
    experience: any[];
    cv_url: string | null;
  };
}

const ITEMS_PER_PAGE = 10;

export function LeadHunterManager() {
  const isMobile = useIsMobile();

  // Data State
  const [sessions, setSessions] = useState<LeadHuntSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // KPI State
  const [kpiTotalMatches, setKpiTotalMatches] = useState(0);
  const [kpiShortlisted, setKpiShortlisted] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Session search
  const [sessionSearch, setSessionSearch] = useState("");
  const debouncedSearch = useDebounce(sessionSearch, 300);

  // New hunt state
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [rawJD, setRawJD] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);
  const [isSearching, setIsSearching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [jdParsed, setJdParsed] = useState(false);

  // Session detail state
  const [selectedSession, setSelectedSession] = useState<LeadHuntSession | null>(null);
  const [matches, setMatches] = useState<LeadMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<string | null>(null);
  const [scoringAll, setScoringAll] = useState(false);

  // Analysis dialog
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<LeadMatch | null>(null);

  // Talent detail dialog
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [talentDetailEmail, setTalentDetailEmail] = useState("");
  const [talentDetailName, setTalentDetailName] = useState("");

  // Deleting
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Load KPIs
  const loadKPIs = useCallback(async () => {
    try {
      const [matchesRes, shortlistRes] = await Promise.all([
        supabase.from("lead_hunt_matches").select("id", { count: "exact", head: true }),
        supabase.from("lead_hunt_matches").select("id", { count: "exact", head: true }).eq("shortlisted", true),
      ]);
      setKpiTotalMatches(matchesRes.count || 0);
      setKpiShortlisted(shortlistRes.count || 0);
    } catch (err) {
      console.error("KPI load error:", err);
    }
  }, []);

  // Fetch Sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("lead_hunt_sessions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch.trim()) {
        query = query.ilike("job_title", `%${debouncedSearch.trim()}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading sessions timed out");

      if (result.error) throw result.error;
      const sessionData = (result.data as LeadHuntSession[]) || [];

      // Fetch match counts for these sessions
      if (sessionData.length > 0) {
        const sessionIds = sessionData.map((s) => s.id);
        const { data: matchCounts } = await supabase
          .from("lead_hunt_matches")
          .select("session_id")
          .in("session_id", sessionIds);

        const countMap: Record<string, number> = {};
        (matchCounts || []).forEach((m: any) => {
          countMap[m.session_id] = (countMap[m.session_id] || 0) + 1;
        });
        sessionData.forEach((s) => {
          s.match_count = countMap[s.id] || 0;
        });
      }

      setSessions(sessionData);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading sessions:", err);
      setError(err.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadSessions();
    loadKPIs();
  }, [loadSessions, loadKPIs]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadSessionMatches = async (session: LeadHuntSession) => {
    setSelectedSession(session);
    setLoadingMatches(true);

    try {
      const { data, error } = await supabase
        .from("lead_hunt_matches")
        .select(`
          id, initial_score, ai_match_score, ai_analysis, shortlisted,
          talent:talents ( id, full_name, email, phone, skills, experience, cv_url )
        `)
        .eq("session_id", session.id)
        .order("ai_match_score", { ascending: false, nullsFirst: false });

      if (error) throw error;

      const validMatches = (data || []).filter((m: any) => m.talent) as unknown as LeadMatch[];
      setMatches(validMatches);
    } catch (err: any) {
      console.error("Error loading matches:", err);
      toast.error("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  const parseJD = async () => {
    if (!rawJD.trim()) {
      toast.error("Please paste a job description first");
      return;
    }
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", {
        body: { rawText: rawJD },
      });
      if (error) throw error;
      setJobTitle(data.title || "");
      setCompanyName(data.company_name || "");
      setJobDescription(data.description || rawJD);
      setJdParsed(true);
      toast.success("JD parsed successfully — review the extracted fields");
    } catch (err: any) {
      console.error("Parse error:", err);
      toast.error("Failed to parse JD. You can fill the fields manually.");
      setJobTitle("");
      setCompanyName("");
      setJobDescription(rawJD);
      setJdParsed(true);
    } finally {
      setIsParsing(false);
    }
  };

  const resetNewHunt = () => {
    setRawJD("");
    setJobTitle("");
    setCompanyName("");
    setJobDescription("");
    setJdParsed(false);
  };

  const startNewHunt = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-hunt-match", {
        body: {
          jobTitle: jobTitle || "Untitled Position",
          companyName,
          jobDescription,
          leadsRequested,
        },
      });

      if (error) throw error;

      toast.success(`Found ${data.matchCount} matching candidates!`);

      await loadSessions();
      loadKPIs();

      const { data: newSession } = await supabase
        .from("lead_hunt_sessions")
        .select("*")
        .eq("id", data.sessionId)
        .single();

      if (newSession) {
        loadSessionMatches(newSession);
      }

      setShowNewHunt(false);
      resetNewHunt();
    } catch (err: any) {
      console.error("Hunt error:", err);
      toast.error(err.message || "Failed to find matches");
    } finally {
      setIsSearching(false);
    }
  };

  const scoreCandidate = async (match: LeadMatch) => {
    setScoringMatch(match.id);
    try {
      const { data, error } = await supabase.functions.invoke("score-talent-match", {
        body: { matchId: match.id },
      });

      if (error) throw error;

      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, ai_match_score: data.score, ai_analysis: data.analysis } : m)),
      );

      toast.success(`AI Score: ${data.score}%`);
    } catch (err: any) {
      console.error("Scoring error:", err);
      toast.error("Failed to score candidate. AI service may be busy.");
    } finally {
      setScoringMatch(null);
    }
  };

  const scoreAllUnscored = async () => {
    const unscored = matches.filter((m) => !m.ai_match_score);
    if (unscored.length === 0) {
      toast.info("All candidates already scored");
      return;
    }

    setScoringAll(true);
    let scored = 0;
    for (const match of unscored) {
      try {
        setScoringMatch(match.id);
        const { data, error } = await supabase.functions.invoke("score-talent-match", {
          body: { matchId: match.id },
        });

        if (error) throw error;

        setMatches((prev) =>
          prev.map((m) => (m.id === match.id ? { ...m, ai_match_score: data.score, ai_analysis: data.analysis } : m)),
        );
        scored++;
      } catch (err: any) {
        console.error(`Failed to score ${match.talent.full_name}:`, err);
      }
    }
    setScoringMatch(null);
    setScoringAll(false);
    toast.success(`Scored ${scored}/${unscored.length} candidates`);
  };

  const toggleShortlist = async (match: LeadMatch) => {
    try {
      const { error } = await supabase
        .from("lead_hunt_matches")
        .update({ shortlisted: !match.shortlisted })
        .eq("id", match.id);

      if (error) throw error;

      setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, shortlisted: !m.shortlisted } : m)));
    } catch (err: any) {
      console.error("Shortlist error:", err);
      toast.error("Failed to update shortlist");
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeletingSession(sessionId);
    try {
      const { error } = await supabase.from("lead_hunt_sessions").delete().eq("id", sessionId);
      if (error) throw error;
      toast.success("Session deleted");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setTotalCount((c) => c - 1);
      loadKPIs();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete session");
    } finally {
      setDeletingSession(null);
    }
  };

  const exportMatches = (onlyShortlisted: boolean = false) => {
    const listToExport = onlyShortlisted ? matches.filter((m) => m.shortlisted) : matches;

    if (listToExport.length === 0) {
      toast.warning(onlyShortlisted ? "No candidates shortlisted" : "No matches found to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Initial Score", "AI Score", "Skills", "Shortlisted"];
    const rows = listToExport.map((m) => [
      m.talent.full_name,
      m.talent.email,
      m.talent.phone || "",
      m.initial_score?.toString() || "",
      m.ai_match_score?.toString() || "",
      (m.talent.skills as string[])?.slice(0, 5).join("; ") || "",
      m.shortlisted ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-hunt-${selectedSession?.job_title || "export"}-${onlyShortlisted ? "shortlist" : "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${onlyShortlisted ? "Shortlist" : "All matches"} exported`);
  };

  const viewAnalysis = (match: LeadMatch) => {
    setSelectedMatch(match);
    setShowAnalysis(true);
  };

  const openTalentDetail = (match: LeadMatch) => {
    setTalentDetailEmail(match.talent.email);
    setTalentDetailName(match.talent.full_name);
    setTalentDetailOpen(true);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const unscoredCount = matches.filter((m) => !m.ai_match_score).length;

  if (isLoading && !selectedSession) {
    return <DashboardTableSkeleton rows={5} columns={4} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load lead hunter" message={error} onRetry={loadSessions} />;
  }

  // Session Detail View
  if (selectedSession) {
    return (
      <div className="space-y-6">
        {/* Header - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{selectedSession.job_title}</h2>
            <p className="text-sm text-muted-foreground">{selectedSession.company_name || "No company specified"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscoredCount > 0 && (
              <Button variant="secondary" size="sm" onClick={scoreAllUnscored} disabled={scoringAll}>
                {scoringAll ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scoring...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Score All ({unscoredCount})</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => exportMatches(false)}>
              <Download className="w-4 h-4 mr-2" /> Export All
            </Button>
            <Button variant="default" size="sm" onClick={() => exportMatches(true)}>
              <Star className="w-4 h-4 mr-2" /> Export Shortlist
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matched Candidates ({matches.length})</CardTitle>
            <CardDescription>{matches.filter((m) => m.shortlisted).length} shortlisted candidates</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMatches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No matches found for this criteria.</p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 border rounded-lg space-y-3 ${match.shortlisted ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          className="font-medium text-left text-primary hover:underline truncate block w-full"
                          onClick={() => openTalentDetail(match)}
                        >
                          {match.talent.full_name}
                        </button>
                        <p className="text-sm text-muted-foreground truncate">{match.talent.email}</p>
                      </div>
                      <Checkbox checked={match.shortlisted} onCheckedChange={() => toggleShortlist(match)} />
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(match.talent.skills as string[])?.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {((match.talent.skills as string[])?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(match.talent.skills as string[]).length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        Initial: <Badge variant="outline" className="ml-1">{match.initial_score || 0}%</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        AI:{" "}
                        {match.ai_match_score ? (
                          <Badge
                            variant={match.ai_match_score >= 70 ? "default" : match.ai_match_score >= 50 ? "secondary" : "outline"}
                            className="ml-1 cursor-pointer"
                            onClick={() => viewAnalysis(match)}
                          >
                            {match.ai_match_score}%
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs ml-1"
                            onClick={() => scoreCandidate(match)}
                            disabled={scoringMatch === match.id}
                          >
                            {scoringMatch === match.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <><Sparkles className="w-3 h-3 mr-1" />Score</>
                            )}
                          </Button>
                        )}
                      </div>
                      {match.talent.cv_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 ml-auto"
                          onClick={() => downloadFile(match.talent.cv_url!, `${match.talent.full_name}-CV.pdf`)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table Layout */
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Star className="w-4 h-4" />
                      </TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead className="text-center">Initial Score</TableHead>
                      <TableHead className="text-center">AI Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id} className={match.shortlisted ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox checked={match.shortlisted} onCheckedChange={() => toggleShortlist(match)} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <button
                              className="font-medium text-left text-primary hover:underline"
                              onClick={() => openTalentDetail(match)}
                            >
                              {match.talent.full_name}
                            </button>
                            <p className="text-sm text-muted-foreground">{match.talent.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {(match.talent.skills as string[])?.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {((match.talent.skills as string[])?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(match.talent.skills as string[]).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{match.initial_score || 0}%</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {match.ai_match_score ? (
                            <Badge
                              variant={match.ai_match_score >= 70 ? "default" : match.ai_match_score >= 50 ? "secondary" : "outline"}
                              className="cursor-pointer hover:bg-primary/80"
                              onClick={() => viewAnalysis(match)}
                            >
                              {match.ai_match_score}%
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => scoreCandidate(match)}
                              disabled={scoringMatch === match.id}
                            >
                              {scoringMatch === match.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <><Sparkles className="w-3 h-3 mr-1" />Score</>
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {match.talent.cv_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(match.talent.cv_url!, `${match.talent.full_name}-CV.pdf`)}
                                title="Download CV"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Dialog */}
        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI Analysis: {selectedMatch?.talent.full_name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {selectedMatch?.ai_analysis && (
                <div className="space-y-4 p-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-4xl font-bold text-primary">{selectedMatch.ai_match_score}%</div>
                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mt-1">
                      Match Score
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-card border rounded-lg shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase">Skills Match</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.skills_match || 0}%</p>
                    </div>
                    <div className="p-3 bg-card border rounded-lg shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase">Experience Fit</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.experience_fit || 0}%</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" /> Strengths
                    </h4>
                    <ul className="space-y-1 bg-success/10 p-3 rounded-md text-sm text-foreground">
                      {selectedMatch.ai_analysis.strengths?.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-medium mb-1 text-primary">AI Recommendation</h4>
                    <p className="text-sm leading-relaxed">{selectedMatch.ai_analysis.recommendation}</p>
                  </div>
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setShowAnalysis(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Talent Detail Dialog */}
        <TalentDetailDialog
          open={talentDetailOpen}
          onOpenChange={setTalentDetailOpen}
          talentEmail={talentDetailEmail}
          talentName={talentDetailName}
        />
      </div>
    );
  }

  // Sessions List View (Default)
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Sessions" value={totalCount} icon={Target} variant="default" />
        <StatsCard title="Total Matches" value={kpiTotalMatches} icon={Users} variant="secondary" />
        <StatsCard title="Shortlisted" value={kpiShortlisted} icon={Star} variant="success" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Lead Hunter
              </CardTitle>
              <CardDescription>Find matching candidates for your job openings</CardDescription>
            </div>
            <Button onClick={() => setShowNewHunt(true)}>
              <Search className="w-4 h-4 mr-2" />
              New Hunt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search sessions by job title..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No lead hunts yet</p>
              <p className="text-sm">Start by creating a new hunt with a job description</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => loadSessionMatches(session)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors truncate">{session.job_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.company_name || "No company"} • {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {typeof session.match_count === "number" && (
                        <Badge variant="outline" className="text-xs">
                          {session.match_count} matches
                        </Badge>
                      )}
                      <Badge variant={session.status === "active" ? "default" : "secondary"}>{session.status}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{session.job_title}" and all its matches.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSession(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingSession === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* New Hunt Dialog */}
      <Dialog open={showNewHunt} onOpenChange={(open) => { setShowNewHunt(open); if (!open) resetNewHunt(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start New Lead Hunt</DialogTitle>
          </DialogHeader>

          {!jdParsed ? (
            /* Step 1: Paste JD */
            <div className="space-y-4">
              <div>
                <Label htmlFor="raw-jd">Paste the full Job Description</Label>
                <Textarea
                  id="raw-jd"
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Paste the entire job posting here — title, company, requirements, responsibilities, etc."
                  rows={12}
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewHunt(false)}>Cancel</Button>
                <Button onClick={parseJD} disabled={isParsing || !rawJD.trim()}>
                  {isParsing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Parse with AI</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Step 2: Review parsed fields */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span>AI extracted the fields below. Review and edit if needed.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., TechCorp"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="jd">Job Description</Label>
                <Textarea
                  id="jd"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="leads">Number of leads to find</Label>
                <Input
                  id="leads"
                  type="number"
                  min={5}
                  max={50}
                  value={leadsRequested}
                  onChange={(e) => setLeadsRequested(parseInt(e.target.value) || 20)}
                />
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={resetNewHunt} className="sm:mr-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />Re-paste JD
                </Button>
                <Button variant="outline" onClick={() => setShowNewHunt(false)}>Cancel</Button>
                <Button onClick={startNewHunt} disabled={isSearching || !jobDescription.trim()}>
                  {isSearching ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" />Find Matches</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
