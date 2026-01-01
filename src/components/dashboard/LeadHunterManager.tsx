import { useState, useEffect } from "react";
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
import { Search, Target, Loader2, Star, Download, Eye, Sparkles, CheckCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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
    skills: any[];
    experience: any[];
    cv_url: string | null;
  };
}

export function LeadHunterManager() {
  const [sessions, setSessions] = useState<LeadHuntSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New hunt state
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
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

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from('lead_hunt_sessions')
            .select('*')
            .order('created_at', { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading sessions timed out"
      );

      if (queryError) throw queryError;
      setSessions(data || []);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMatches = async (session: LeadHuntSession) => {
    setSelectedSession(session);
    setLoadingMatches(true);
    
    try {
      const { data, error } = await supabase
        .from('lead_hunt_matches')
        .select(`
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
        `)
        .eq('session_id', session.id)
        .order('ai_match_score', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setMatches((data || []) as LeadMatch[]);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      toast.error('Failed to load matches');
    } finally {
      setLoadingMatches(false);
    }
  };

  const startNewHunt = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('lead-hunt-match', {
        body: {
          jobTitle: jobTitle || 'Untitled Position',
          companyName,
          jobDescription,
          leadsRequested
        }
      });

      if (error) throw error;

      toast.success(`Found ${data.matchCount} matching candidates!`);
      
      // Reload sessions and open the new one
      await loadSessions();
      
      const { data: newSession } = await supabase
        .from('lead_hunt_sessions')
        .select('*')
        .eq('id', data.sessionId)
        .single();
        
      if (newSession) {
        loadSessionMatches(newSession);
      }
      
      setShowNewHunt(false);
      setJobTitle('');
      setCompanyName('');
      setJobDescription('');

    } catch (err: any) {
      console.error('Hunt error:', err);
      toast.error(err.message || 'Failed to find matches');
    } finally {
      setIsSearching(false);
    }
  };

  const scoreCandidate = async (match: LeadMatch) => {
    setScoringMatch(match.id);
    try {
      const { data, error } = await supabase.functions.invoke('score-talent-match', {
        body: { matchId: match.id }
      });

      if (error) throw error;

      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === match.id 
          ? { ...m, ai_match_score: data.score, ai_analysis: data.analysis }
          : m
      ));

      toast.success(`AI Score: ${data.score}%`);
    } catch (err: any) {
      console.error('Scoring error:', err);
      toast.error('Failed to score candidate');
    } finally {
      setScoringMatch(null);
    }
  };

  const toggleShortlist = async (match: LeadMatch) => {
    try {
      const { error } = await supabase
        .from('lead_hunt_matches')
        .update({ shortlisted: !match.shortlisted })
        .eq('id', match.id);

      if (error) throw error;

      setMatches(prev => prev.map(m => 
        m.id === match.id ? { ...m, shortlisted: !m.shortlisted } : m
      ));
    } catch (err: any) {
      console.error('Shortlist error:', err);
      toast.error('Failed to update shortlist');
    }
  };

  const exportShortlist = () => {
    const shortlisted = matches.filter(m => m.shortlisted);
    if (shortlisted.length === 0) {
      toast.error('No candidates shortlisted');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Initial Score', 'AI Score', 'Skills'];
    const rows = shortlisted.map(m => [
      m.talent.full_name,
      m.talent.email,
      m.talent.phone || '',
      m.initial_score?.toString() || '',
      m.ai_match_score?.toString() || '',
      (m.talent.skills as string[])?.slice(0, 5).join('; ') || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-hunt-${selectedSession?.job_title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Shortlist exported');
  };

  const viewAnalysis = (match: LeadMatch) => {
    setSelectedMatch(match);
    setShowAnalysis(true);
  };

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
            <p className="text-sm text-muted-foreground">{selectedSession.company_name || 'No company specified'}</p>
          </div>
          <Button variant="outline" onClick={exportShortlist}>
            <Download className="w-4 h-4 mr-2" />
            Export Shortlist
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matched Candidates ({matches.length})</CardTitle>
            <CardDescription>
              {matches.filter(m => m.shortlisted).length} shortlisted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMatches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No matches found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
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
                    <TableRow key={match.id} className={match.shortlisted ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={match.shortlisted}
                          onCheckedChange={() => toggleShortlist(match)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{match.talent.full_name}</p>
                          <p className="text-sm text-muted-foreground">{match.talent.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{match.initial_score || 0}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {match.ai_match_score ? (
                          <Badge 
                            variant={match.ai_match_score >= 70 ? 'default' : match.ai_match_score >= 50 ? 'secondary' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => viewAnalysis(match)}
                          >
                            {match.ai_match_score}%
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => scoreCandidate(match)}
                            disabled={scoringMatch === match.id}
                          >
                            {scoringMatch === match.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-1" />
                                Get AI Score
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {match.talent.cv_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={match.talent.cv_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{selectedMatch.ai_match_score}%</div>
                    <p className="text-muted-foreground">Overall Match Score</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Skills Match</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.skills_match || 0}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Experience Fit</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.experience_fit || 0}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Education Fit</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.education_fit || 0}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Potential</p>
                      <p className="text-xl font-semibold">{selectedMatch.ai_analysis.breakdown?.potential_fit || 0}%</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedMatch.ai_analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm">{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Gaps to Address</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedMatch.ai_analysis.gaps?.map((g: string, i: number) => (
                        <li key={i} className="text-sm">{g}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg">
                    <h4 className="font-medium mb-1">Recommendation</h4>
                    <p className="text-sm">{selectedMatch.ai_analysis.recommendation}</p>
                  </div>

                  {selectedMatch.ai_analysis.interview_focus && (
                    <div>
                      <h4 className="font-medium mb-2">Interview Focus Areas</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedMatch.ai_analysis.interview_focus?.map((f: string, i: number) => (
                          <li key={i} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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

  // Sessions List View
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
              <CardDescription>
                Find matching candidates for your job openings
              </CardDescription>
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
            <div className="space-y-2">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadSessionMatches(session)}
                >
                  <div>
                    <p className="font-medium">{session.job_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.company_name || 'No company'} • {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
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
