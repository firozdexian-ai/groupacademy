import { useState, useEffect, useCallback } from "react";
import {
  listAdminJobs,
  updateJobsBulk,
  deleteJobsBulk,
  updateJob,
  deleteJob,
  getJobEngagementCounts,
  archiveExpiredJobs,
} from "@/domains/jobs/repo/jobsRepo";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Linkedin,
  MousePointer2,
  Bookmark,
  Brain,
  Search,
  Zap,
  Activity,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { JobFormDialog } from "./JobFormDialog";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Job Infrastructure Registry (JobsManageTab)
 * CTO Reference: Authoritative command center for job lifecycle and engagement telemetry.
 * Resolved TS1382 by escaping the '>' character in SelectItem.
 */

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  application_type: string;
  source_platform: string | null;
  deadline: string | null;
}

interface EngagementData {
  clicks: number;
  saves: number;
  recommendations: number;
}

export function JobsManageTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engagement, setEngagement] = useState<Record<string, EngagementData>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  const queryClient = useQueryClient();

  const PAGE_SIZE = 20;

  const purgeExpired = useCallback(async () => {
    if (purging) return;
    if (!confirm("Archive all jobs past their deadline (and inactive-stale jobs >90d old)?")) return;
    setPurging(true);
    try {
      const { data, error } = await (supabase as any).rpc("archive_expired_jobs");
      if (error) throw error;
      const archived = Number(data ?? 0);
      toast.success(`Purged ${archived} expired job${archived === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-hub-dashboard"] });
      loadJobs();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to purge expired jobs");
    } finally {
      setPurging(false);
    }
  }, [purging, queryClient]);

  const fetchEngagement = useCallback(async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const stats = await getJobEngagementCounts(jobIds);
    setEngagement(stats);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, count } = await listAdminJobs({
        columns:
          "id,title,company_name,location,is_active,is_featured,created_at,application_type,source_platform,deadline",
        search: searchQuery,
        status: statusFilter as any,
        page,
        pageSize: PAGE_SIZE,
      });
      setJobs(rows as Job[]);
      setTotalCount(count || 0);
      if (rows.length) fetchEngagement(rows.map((j: any) => j.id));
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page, fetchEngagement]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const bulkUpdate = async (patch: Partial<Pick<Job, "is_active" | "is_featured" | "is_active">>) => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    try {
      await updateJobsBulk(ids, patch);
    } catch (e: any) {
      return toast.error("Could not update: " + e.message);
    }
    toast.success(`${ids.length} jobs updated`);
    setSelected(new Set());
    loadJobs();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} jobs?`)) return;
    try {
      await deleteJobsBulk(Array.from(selected));
    } catch {
      return toast.error("Delete failed");
    }
    toast.success("Jobs deleted");
    setSelected(new Set());
    loadJobs();
  };

  const inlineToggle = async (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
    try {
      await updateJob(id, { [field]: value });
    } catch {
      toast.error("Could not save change");
      loadJobs();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="SEARCH INFRASTRUCTURE..."
                  className="h-10 rounded-xl border-2 pl-9 font-bold uppercase text-[10px] tracking-widest bg-background/50"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-10 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-tight">
                  <SelectValue placeholder="STATUS_PROTOCOL" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="text-[10px] font-bold">
                    ALL_POSTINGS
                  </SelectItem>
                  <SelectItem value="active" className="text-[10px] font-bold">
                    ACTIVE_NODES
                  </SelectItem>
                  <SelectItem value="inactive" className="text-[10px] font-bold">
                    INACTIVE_NODES
                  </SelectItem>
                  <SelectItem value="featured" className="text-[10px] font-bold">
                    FEATURED_AUTH
                  </SelectItem>
                  {/* FIXED: Replaced '>' with HTML entity &gt; to resolve TS1382 */}
                  <SelectItem value="stale" className="text-[10px] font-bold">
                    STALE_NODES (&gt;60d)
                  </SelectItem>
                  <SelectItem value="expired" className="text-[10px] font-bold">
                    PAST_DEADLINE
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className="h-10 px-4 rounded-xl border-2 font-semibold gap-2 bg-background/50 uppercase"
              >
                <Activity className="h-3.5 w-3.5" /> {totalCount} TOTAL_UNITS
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={purgeExpired}
                disabled={purging}
                className="h-10 px-5 rounded-xl border-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-semibold uppercase text-[10px] tracking-widest gap-2"
                title="Archive jobs past deadline or stale (>90d)"
              >
                <Flame className="h-4 w-4" />
                {purging ? "Purging…" : "Purge Expired"}
              </Button>
              <Button
                onClick={() => {
                  setEditingJobId(null);
                  setDialogOpen(true);
                }}
                className="h-10 px-6 rounded-xl font-semibold uppercase text-[10px] tracking-widest gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" /> Deploy Units
              </Button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-3 mt-4 p-4 bg-primary/5 rounded-xl border-2 border-primary/20 animate-in slide-in-from-top-2">
              <p className="text-[10px] font-semibold text-primary italic mr-4">
                {selected.size} NODES_SELECTED
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-semibold uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_active: true })}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-semibold uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_active: false })}
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-semibold uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_featured: true })}
              >
                Feature
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 rounded-lg font-semibold uppercase text-[9px]"
                onClick={bulkDelete}
              >
                Terminate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 ml-auto font-bold uppercase text-[9px]"
                onClick={() => setSelected(new Set())}
              >
                Abort Selection
              </Button>
            </div>
          )}
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
                    <TableHead className="w-8 pl-6">
                      <Checkbox
                        checked={jobs.length > 0 && selected.size === jobs.length}
                        onCheckedChange={(v) => setSelected(v ? new Set(jobs.map((j) => j.id)) : new Set())}
                      />
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest py-5">Job</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest">Source</TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest text-center">
                      Active
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest text-center">
                      Featured
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-[10px] tracking-widest text-center">
                      Engagement_Telemetry
                    </TableHead>
                    <TableHead className="text-right py-5 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const e = engagement[job.id] || { clicks: 0, saves: 0, recommendations: 0 };
                    return (
                      <TableRow
                        key={job.id}
                        className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="pl-6">
                          <Checkbox checked={selected.has(job.id)} onCheckedChange={() => toggleSelected(job.id)} />
                        </TableCell>
                        <TableCell className="py-5 text-left">
                          <p className="font-semibold text-sm uppercase italic tracking-tight">{job.title}</p>
                          <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                            {job.company_name} · {job.location || "REMOTE_ACCESS"}
                          </p>
                        </TableCell>
                        <TableCell className="text-left">
                          <Badge
                            variant="outline"
                            className="font-semibold text-[9px] uppercase italic border-2 bg-background"
                          >
                            {job.source_platform === "linkedin" && (
                              <Linkedin className="w-3 h-3 mr-1.5 text-blue-500" />
                            )}
                            {(job.source_platform || "other").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={job.is_active}
                            onCheckedChange={(v) => inlineToggle(job.id, "is_active", v)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={job.is_featured}
                            onCheckedChange={(v) => inlineToggle(job.id, "is_featured", v)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-4 text-[10px] font-semibold text-muted-foreground/60">
                            <span
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                              title="CLICKS"
                            >
                              <MousePointer2 className="w-3 h-3" /> {e.clicks}
                            </span>
                            <span
                              className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                              title="SAVES"
                            >
                              <Bookmark className="w-3 h-3" /> {e.saves}
                            </span>
                            <span
                              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                              title="AI_HITS"
                            >
                              <Brain className="w-3 h-3" /> {e.recommendations}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon" aria-label="Edit"
                              className="h-9 w-9 hover:bg-primary/10"
                              onClick={() => {
                                setEditingJobId(job.id);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon" aria-label="Delete"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm("Terminate listing node?")) {
                                  await deleteJob(job.id);
                                  loadJobs();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-border/10 bg-muted/5">
                  <span className="text-[10px] font-semibold uppercase italic text-muted-foreground/60 tracking-widest">
                    Registry Page {page} of {totalPages}
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

      <JobFormDialog open={dialogOpen} onOpenChange={setDialogOpen} jobId={editingJobId} onSaved={loadJobs} />
    </div>
  );
}
