import { useState, useEffect, useCallback } from "react";
import { scoreJobMatch } from "@/domains/jobs/api/jobsApi";
import {
  listActiveJobsLite,
  findJobIdsBySearch,
  searchAdminApplications,
  updateApplicationStatus,
  updateJobApplication,
} from "@/domains/jobs/repo/jobsRepo";
import { findTalentIdsBySearch } from "@/domains/talent/repo/talentRepo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UserPlus,
  ExternalLink,
  Mail,
  Phone,
  Loader2,
  FileText,
  Sparkles,
  Search,
  Filter,
  Zap,
  ShieldCheck,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { AIRelevanceScore } from "./AIRelevanceScore";
import { AddExternalApplicationDialog } from "./AddExternalApplicationDialog";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * GroUp Academy: Job Application Intelligence Tab
 * CTO Reference: Authoritative registry for tracking candidate flow and neural matching metrics.
 */

interface AppRow {
  id: string;
  job_id: string;
  talent_id: string | null;
  application_status: string | null;
  delivery_status: string | null;
  created_at: string | null;
  cv_url: string | null;
  source: string | null;
  ai_match_score: number | null;
  ai_match_rationale: string | null;
  external_notes: string | null;
  jobs: { title: string; company_name: string } | null;
  talents: { full_name: string; email: string; phone: string | null } | null;
}

const STATUS_OPTIONS = ["submitted", "sent_to_employer", "viewed", "shortlisted", "rejected"] as const;

export function JobsApplicationsTab() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [jobsList, setJobsList] = useState<{ id: string; title: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortByScore, setSortByScore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bulkScoring, setBulkScoring] = useState(false);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);

  const PAGE_SIZE = 20;

  const loadJobs = useCallback(async () => {
    const data = await listActiveJobsLite(500);
    setJobsList(data as any);
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      let talentIds: string[] | undefined;
      let jobIds: string[] | undefined;
      const searchActive = !!search.trim();
      if (searchActive) {
        const [tIds, jIds] = await Promise.all([
          findTalentIdsBySearch(search.trim(), 200),
          findJobIdsBySearch(search.trim(), 200),
        ]);
        talentIds = tIds;
        jobIds = jIds;
      }

      const { rows, count } = await searchAdminApplications({
        statusFilter,
        sourceFilter,
        jobFilter,
        scoreFilter,
        sortByScore,
        page,
        pageSize: PAGE_SIZE,
        talentIds,
        jobIds,
        searchActive,
      });
      setApps(rows as any);
      setTotalCount(count);
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, jobFilter, scoreFilter, sortByScore, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);
  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const updateStatus = async (id: string, st: string) => {
    try {
      await updateApplicationStatus(id, st);
    } catch (error: any) {
      return toast.error("Could not update: " + error.message);
    }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, application_status: st } : a)));
    toast.success("Status updated");
  };

  const handleBulkScore = async () => {
    const unscored = apps.filter((a) => a.ai_match_score == null && a.talent_id);
    if (!unscored.length) return toast.info("All applications are already scored.");
    setBulkScoring(true);
    let done = 0;
    const tid = toast.loading(`Scoring: 0/${unscored.length}...`);
    for (const a of unscored) {
      try {
        const data = await scoreJobMatch({
          jobId: a.job_id,
          talentId: a.talent_id,
        });
        const overall = Math.round(Number(data?.overall_match ?? data?.score ?? 0));
        const reco = data?.recommendation || "";
        await updateJobApplication(a.id, {
          ai_match_score: overall,
          ai_match_rationale: reco,
          ai_scored_at: new Date().toISOString(),
        });
        done++;
        toast.loading(`Scoring: ${done}/${unscored.length}...`, { id: tid });
      } catch {
        // Continue processing batch
      }
    }
    toast.success(`Scored ${done} of ${unscored.length} applications.`, { id: tid });
    setBulkScoring(false);
    loadApps();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* EXECUTIVE FILTER BAR */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="SEARCH NODES..."
                  className="h-10 rounded-xl border-2 pl-9 font-bold uppercase text-[10px] tracking-widest bg-background/50"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-10 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-tight">
                  <SelectValue placeholder="SOURCE" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="text-[10px] font-bold">
                    ALL_SOURCES
                  </SelectItem>
                  <SelectItem value="platform" className="text-[10px] font-bold uppercase">
                    Platform
                  </SelectItem>
                  <SelectItem value="external" className="text-[10px] font-bold uppercase">
                    External
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-10 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-tight">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="text-[10px] font-bold">
                    ALL_STATUSES
                  </SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={scoreFilter}
                onValueChange={(v) => {
                  setScoreFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-tight">
                  <SelectValue placeholder="AI_SCORE" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="text-[10px] font-bold">
                    ANY_SCORE
                  </SelectItem>
                  <SelectItem value="scored" className="text-[10px] font-bold uppercase">
                    Scored
                  </SelectItem>
                  <SelectItem value="unscored" className="text-[10px] font-bold uppercase">
                    Unscored
                  </SelectItem>
                  <SelectItem value="strong" className="text-[10px] font-bold uppercase text-emerald-600">
                    Strong (80+)
                  </SelectItem>
                  <SelectItem value="weak" className="text-[10px] font-bold uppercase text-destructive">
                    Weak (&lt;40)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant={sortByScore ? "default" : "outline"}
                className="h-10 px-4 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-2"
                onClick={() => setSortByScore((v) => !v)}
              >
                <Zap className={cn("h-3.5 w-3.5", sortByScore ? "fill-current" : "")} /> Sort by score
              </Button>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkScore}
                disabled={bulkScoring}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-2"
              >
                {bulkScoring ? <InlineSpinner size="sm" /> : <Sparkles className="h-4 w-4" />}
                Bulk_Analyze
              </Button>
              <Button
                size="sm"
                onClick={() => setExternalDialogOpen(true)}
                className="flex-1 sm:flex-none h-10 px-5 rounded-xl font-semibold uppercase text-[10px] tracking-widest gap-2 shadow-lg"
              >
                <UserPlus className="h-4 w-4" /> Bridge_External
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <DashboardTableSkeleton rows={8} columns={7} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest py-5 pl-8">
                      Candidate node
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">
                      Target infrastructure
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">Source</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">AI analysis</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">Pipeline status</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">Applied</TableHead>
                    <TableHead className="text-right py-5 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                    >
                      <TableCell className="py-5 pl-8">
                        <p className="font-semibold text-sm uppercase italic tracking-tight">
                          {app.talents?.full_name || "NULL_ENTITY"}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground mt-0.5 italic">
                          {app.talents?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold uppercase tracking-tight leading-tight">{app.jobs?.title}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase italic">
                          {app.jobs?.company_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={app.source === "external" ? "default" : "secondary"}
                          className="font-semibold text-[9px] uppercase italic border-2 rounded-full px-3"
                        >
                          {app.source || "platform"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AIRelevanceScore
                          applicationId={app.id}
                          jobId={app.job_id}
                          talentId={app.talent_id}
                          score={app.ai_match_score}
                          rationale={app.ai_match_rationale}
                          onScored={(s, r) =>
                            setApps((prev) =>
                              prev.map((x) =>
                                x.id === app.id ? { ...x, ai_match_score: s, ai_match_rationale: r } : x,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={app.application_status || "submitted"}
                          onValueChange={(v) => updateStatus(app.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[140px] rounded-lg border-2 font-semibold uppercase text-[9px] italic">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">
                                {s.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-[10px] font-semibold text-muted-foreground/50 uppercase">
                        {app.created_at ? format(new Date(app.created_at), "MMM d") : ""}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          {app.cv_url && (
                            <Button
                              variant="ghost"
                              size="icon" aria-label="View CV"
                              className="h-8 w-8 hover:bg-primary/10"
                              asChild
                              title="View CV"
                            >
                              <a href={app.cv_url} target="_blank" rel="noreferrer">
                                <FileText className="h-4 w-4 text-primary" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon" aria-label="Email applicant"
                            className="h-8 w-8 hover:bg-primary/10"
                            asChild
                            title="Email applicant"
                          >
                            <a href={`mailto:${app.talents?.email}`}>
                              <Mail className="h-4 w-4 text-primary" />
                            </a>
                          </Button>
                          {app.talents?.phone && (
                            <Button
                              variant="ghost"
                              size="icon" aria-label="WHATSAPP_LINK"
                              className="h-8 w-8 hover:bg-primary/10"
                              asChild
                              title="WHATSAPP_LINK"
                            >
                              <a
                                href={`https://wa.me/${app.talents.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Phone className="h-4 w-4 text-primary" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {apps.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-20 font-semibold uppercase text-xs tracking-tight opacity-30"
                      >
                        Zero nodes detected in current filter range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* PAGINATION PROTOCOL */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-border/10 bg-muted/5">
                  <span className="text-[10px] font-semibold uppercase italic text-muted-foreground/60 tracking-widest">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-2 font-semibold uppercase text-[10px]"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev_Node
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-2 font-semibold uppercase text-[10px]"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next_Node
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExternalApplicationDialog
        open={externalDialogOpen}
        onOpenChange={setExternalDialogOpen}
        jobs={jobsList}
        onCreated={loadApps}
      />
    </div>
  );
}
