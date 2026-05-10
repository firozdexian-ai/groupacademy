import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
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
import { DashboardTableSkeleton } from "../DashboardSkeleton";
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
    const [clicksRes, savesRes, recsRes] = await Promise.all([
      supabase.from("job_analytics").select("job_id").in("job_id", jobIds),
      (supabase.from("saved_items") as any).select("item_id").eq("kind", "job").in("item_id", jobIds),
      supabase.from("ai_job_recommendations").select("job_id").in("job_id", jobIds),
    ]);
    const stats: Record<string, EngagementData> = {};
    jobIds.forEach((id) => (stats[id] = { clicks: 0, saves: 0, recommendations: 0 }));
    ((clicksRes.data ?? []) as any[]).forEach((c) => stats[c.job_id] && stats[c.job_id].clicks++);
    ((savesRes.data ?? []) as any[]).forEach((s) => stats[s.item_id] && stats[s.item_id].saves++);
    ((recsRes.data ?? []) as any[]).forEach((r) => stats[r.job_id] && stats[r.job_id].recommendations++);
    setEngagement(stats);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select(
          "id,title,company_name,location,is_active,is_featured,created_at,application_type,source_platform,deadline",
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (searchQuery) {
        const safe = sanitizeIlike(searchQuery);
        query = query.or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`);
      }

      if (statusFilter === "active") query = query.eq("is_active", true);
      else if (statusFilter === "inactive") query = query.eq("is_active", false);
      else if (statusFilter === "featured") query = query.eq("is_featured", true);
      else if (statusFilter === "stale") {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        query = query.lt("created_at", sixtyDaysAgo);
      } else if (statusFilter === "expired") {
        query = query.not("deadline", "is", null).lt("deadline", new Date().toISOString());
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      setJobs((data || []) as Job[]);
      setTotalCount(count || 0);
      if (data?.length) fetchEngagement(data.map((j) => j.id));
    } catch (err: any) {
      toast.error("Registry Ingestion Fault: " + err.message);
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
    const { error } = await supabase.from("jobs").update(patch).in("id", ids);
    if (error) return toast.error("Protocol Fault: " + error.message);
    toast.success(`${ids.length} Nodes Synchronized`);
    setSelected(new Set());
    loadJobs();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Confirm unit termination for ${selected.size} nodes?`)) return;
    const { error } = await supabase.from("jobs").delete().in("id", Array.from(selected));
    if (error) return toast.error("Termination Fault");
    toast.success("Nodes Decommissioned");
    setSelected(new Set());
    loadJobs();
  };

  const inlineToggle = async (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
    const { error } = await supabase
      .from("jobs")
      .update({ [field]: value })
      .eq("id", id);
    if (error) {
      toast.error("Protocol Sync Error");
      loadJobs();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-xl overflow-hidden">
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
                <SelectTrigger className="w-[180px] h-10 rounded-xl border-2 font-black uppercase text-[10px] tracking-tighter">
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
                className="h-10 px-4 rounded-xl border-2 font-black italic gap-2 bg-background/50 uppercase"
              >
                <Activity className="h-3.5 w-3.5" /> {totalCount} TOTAL_UNITS
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={purgeExpired}
                disabled={purging}
                className="h-10 px-5 rounded-xl border-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-black uppercase text-[10px] tracking-widest gap-2"
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
                className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg"
              >
                <Plus className="h-4 w-4" /> Deploy Units
              </Button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-3 mt-4 p-4 bg-primary/5 rounded-[24px] border-2 border-primary/20 animate-in slide-in-from-top-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic mr-4">
                {selected.size} NODES_SELECTED
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-black uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_active: true })}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-black uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_active: false })}
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-2 font-black uppercase text-[9px]"
                onClick={() => bulkUpdate({ is_featured: true })}
              >
                Feature
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 rounded-lg font-black uppercase text-[9px]"
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
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="w-8 pl-6">
                      <Checkbox
                        checked={jobs.length > 0 && selected.size === jobs.length}
                        onCheckedChange={(v) => setSelected(v ? new Set(jobs.map((j) => j.id)) : new Set())}
                      />
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Job Unit</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Source_Node</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                      Protocol_Active
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                      Featured_Auth
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
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
                          <p className="font-black text-sm uppercase italic tracking-tight">{job.title}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {job.company_name} · {job.location || "REMOTE_ACCESS"}
                          </p>
                        </TableCell>
                        <TableCell className="text-left">
                          <Badge
                            variant="outline"
                            className="font-black text-[9px] uppercase italic border-2 bg-background"
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
                          <div className="flex justify-center items-center gap-4 text-[10px] font-black italic text-muted-foreground/60">
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
                              size="icon"
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
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm("Terminate listing node?")) {
                                  await supabase.from("jobs").delete().eq("id", job.id);
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
                  <span className="text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                    Registry Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-2 font-black uppercase text-[10px]"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev_Node
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-2 font-black uppercase text-[10px]"
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
