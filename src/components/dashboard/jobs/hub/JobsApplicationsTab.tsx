import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
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
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { AIRelevanceScore } from "./AIRelevanceScore";
import { AddExternalApplicationDialog } from "./AddExternalApplicationDialog";
import { cn } from "@/lib/utils";

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
    const { data } = await supabase
      .from("jobs")
      .select("id,title,company_name")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500);
    setJobsList((data || []) as any);
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("job_applications").select(
        `id, job_id, talent_id, application_status, delivery_status, created_at, cv_url, source, ai_match_score, ai_match_rationale, external_notes,
           jobs (title, company_name),
           talents (full_name, email, phone)`,
        { count: "exact" },
      );

      if (statusFilter !== "all") query = query.eq("application_status", statusFilter as any);
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (jobFilter !== "all") query = query.eq("job_id", jobFilter);

      // Score-based Neural Filtering
      if (scoreFilter === "scored") query = query.not("ai_match_score", "is", null);
      else if (scoreFilter === "unscored") query = query.is("ai_match_score", null);
      else if (scoreFilter === "strong") query = query.gte("ai_match_score", 80);
      else if (scoreFilter === "weak") query = query.lt("ai_match_score", 40);

      if (search.trim()) {
        const safe = sanitizeIlike(search.trim());
        const [tMatch, jMatch] = await Promise.all([
          supabase.from("talents").select("id").or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`).limit(200),
          supabase.from("jobs").select("id").or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`).limit(200),
        ]);
        const tIds = (tMatch.data || []).map((t) => t.id);
        const jIds = (jMatch.data || []).map((j) => j.id);
        const orParts: string[] = [];
        if (tIds.length) orParts.push(`talent_id.in.(${tIds.join(",")})`);
        if (jIds.length) orParts.push(`job_id.in.(${jIds.join(",")})`);
        if (orParts.length) query = query.or(orParts.join(","));
        else {
          setApps([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      if (sortByScore) query = query.order("ai_match_score", { ascending: false, nullsFirst: false });
      else query = query.order("created_at", { ascending: false });

      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      setApps((data as any) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast.error("Registry Ingestion Fault: " + err.message);
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
    const { error } = await supabase
      .from("job_applications")
      .update({ application_status: st as any })
      .eq("id", id);
    if (error) return toast.error("Protocol Fault: " + error.message);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, application_status: st } : a)));
    toast.success("Status Synchronized");
  };

  const handleBulkScore = async () => {
    const unscored = apps.filter((a) => a.ai_match_score == null && a.talent_id);
    if (!unscored.length) return toast.info("Protocol Redundancy: All nodes already scored.");
    setBulkScoring(true);
    let done = 0;
    const tid = toast.loading(`Scoring Nodes: 0/${unscored.length}...`);
    for (const a of unscored) {
      try {
        const { data, error } = await supabase.functions.invoke("score-job-match", {
          body: { jobId: a.job_id, talentId: a.talent_id },
        });
        if (error) throw error;
        const overall = Math.round(Number(data?.overall_match ?? data?.score ?? 0));
        const reco = data?.recommendation || "";
        await supabase
          .from("job_applications")
          .update({
            ai_match_score: overall,
            ai_match_rationale: reco,
            ai_scored_at: new Date().toISOString(),
          })
          .eq("id", a.id);
        done++;
        toast.loading(`Neural Analysis: ${done}/${unscored.length}...`, { id: tid });
      } catch {
        // Continue processing batch
      }
    }
    toast.success(`Protocol Finalized: ${done}/${unscored.length} nodes analyzed.`, { id: tid });
    setBulkScoring(false);
    loadApps();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* EXECUTIVE FILTER BAR */}
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-xl overflow-hidden">
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
                <SelectTrigger className="w-[130px] h-10 rounded-xl border-2 font-black uppercase text-[10px] tracking-tighter">
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
                <SelectTrigger className="w-[150px] h-10 rounded-xl border-2 font-black uppercase text-[10px] tracking-tighter">
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
                <SelectTrigger className="w-[140px] h-10 rounded-xl border-2 font-black uppercase text-[10px] tracking-tighter">
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
                className="h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                onClick={() => setSortByScore((v) => !v)}
              >
                <Zap className={cn("h-3.5 w-3.5", sortByScore ? "fill-current" : "")} /> Neural_Sort
              </Button>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkScore}
                disabled={bulkScoring}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                {bulkScoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Bulk_Analyze
              </Button>
              <Button
                size="sm"
                onClick={() => setExternalDialogOpen(true)}
                className="flex-1 sm:flex-none h-10 px-5 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg"
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
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                      Candidate node
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">
                      Target infrastructure
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Source</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">AI analysis</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Pipeline status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Applied</TableHead>
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
                        <p className="font-black text-sm uppercase italic tracking-tight">
                          {app.talents?.full_name || "NULL_ENTITY"}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic">
                          {app.talents?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-black uppercase tracking-tighter leading-tight">{app.jobs?.title}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase italic">
                          {app.jobs?.company_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={app.source === "external" ? "default" : "secondary"}
                          className="font-black text-[9px] uppercase italic border-2 rounded-full px-3"
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
                          <SelectTrigger className="h-8 w-[140px] rounded-lg border-2 font-black uppercase text-[9px] italic">
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
                      <TableCell className="text-[10px] font-black italic text-muted-foreground/50 uppercase">
                        {app.created_at ? format(new Date(app.created_at), "MMM d") : ""}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          {app.cv_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10"
                              asChild
                              title="VIEW_ARTIFACT"
                            >
                              <a href={app.cv_url} target="_blank" rel="noreferrer">
                                <FileText className="h-4 w-4 text-primary" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            asChild
                            title="DISPATCH_MAIL"
                          >
                            <a href={`mailto:${app.talents?.email}`}>
                              <Mail className="h-4 w-4 text-primary" />
                            </a>
                          </Button>
                          {app.talents?.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
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
                        className="text-center py-20 italic font-black uppercase text-xs tracking-[0.2em] opacity-30"
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
                  <span className="text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                    Protocol Page {page} of {totalPages}
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

      <AddExternalApplicationDialog
        open={externalDialogOpen}
        onOpenChange={setExternalDialogOpen}
        jobs={jobsList}
        onCreated={loadApps}
      />
    </div>
  );
}
