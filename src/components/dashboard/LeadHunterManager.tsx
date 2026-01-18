import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
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
  FileText,
  Sparkles,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadFile } from "@/lib/downloadFile";

// --- Internal Hook for Debounce ---
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
    skills: string[]; // Fixed type
    experience: any[];
    cv_url: string | null;
  };
}

const ITEMS_PER_PAGE = 10;

export function LeadHunterManager() {
  // Data State
  const [sessions, setSessions] = useState<LeadHuntSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination (Sessions)
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New hunt state
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);
  const [isSearching, setIsSearching] = useState(false);

  // Session detail state
  const [selectedSession, setSelectedSession] = useState<LeadHuntSession | null>(null);
  const [matches, setMatches] = useState<LeadMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<string | null>(null);

  // Analysis dialog
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<LeadMatch | null>(null);

  // Fetch Sessions (Paginated)
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("lead_hunt_sessions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading sessions timed out");

      if (result.error) throw result.error;
      setSessions((result.data as LeadHuntSession[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading sessions:", err);
      setError(err.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadSessionMatches = async (session: LeadHuntSession) => {
    setSelectedSession(session);
    setLoadingMatches(true);

    try {
      const { data, error } = await supabase
        .from("lead_hunt_matches")
        .select(
          `
          id,
          initial_score,
          ai_match_score,
          ai_analysis,
          shortlisted,
          talent:talents (
            id,
            full_name,
            email,
            phone,
            skills,
            experience,
            cv_url
          )
        `,
        )
        .eq("session_id", session.id)
        .order("ai_match_score", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Filter out any matches where talent relation is null (deleted users)
      const validMatches = (data || []).filter((m: any) => m.talent) as unknown as LeadMatch[];
      setMatches(validMatches);
    } catch (err: any) {
      console.error("Error loading matches:", err);
      toast.error("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
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

      // Reload sessions and open the new one
      await loadSessions();

      const { data: newSession } = await supabase
        .from("lead_hunt_sessions")
        .select("*")
        .eq("id", data.sessionId)
        .single();

      if (newSession) {
        loadSessionMatches(newSession);
      }

      setShowNewHunt(false);
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");
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

  // Improved Export: Allows exporting All or Shortlisted
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{selectedSession.job_title}</h2>
            <p className="text-sm text-muted-foreground">{selectedSession.company_name || "No company specified"}</p>
          </div>
          <div className="flex gap-2">
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
            ) : (
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
                            <p className="font-medium">{match.talent.full_name}</p>
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
                              variant={
                                match.ai_match_score >= 70
                                  ? "default"
                                  : match.ai_match_score >= 50
                                    ? "secondary"
                                    : "outline"
                              }
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
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Score
                                </>
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

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-card border rounded-lg shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase">Skills Match</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.skills_match || 0}%</p>
                    </div>
                    <div className="p-3 bg-card border rounded-lg shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase">Experience Fit</p>
                      <p className="text-xl font-semibold">
                        {selectedMatch.ai_analysis.breakdown?.experience_fit || 0}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" /> Strengths
                    </h4>
                    <ul className="space-y-1 bg-green-50 p-3 rounded-md text-sm text-green-900">
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
      </div>
    );
  }

  // Sessions List View (Default)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Lead Hunter
              </CardTitle>
              <CardDescription>Find matching candidates for your job openings ({totalCount} sessions)</CardDescription>
            </div>
            <Button onClick={() => setShowNewHunt(true)}>
              <Search className="w-4 h-4 mr-2" />
              New Hunt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">{session.job_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.company_name || "No company"} • {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === "active" ? "default" : "secondary"}>{session.status}</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* New Hunt Dialog */}
      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start New Lead Hunt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="company">Company Name (Optional)</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., TechCorp"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="jd">Job Description *</Label>
              <Textarea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewHunt(false)}>
              Cancel
            </Button>
            <Button onClick={startNewHunt} disabled={isSearching || !jobDescription.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Matches
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
