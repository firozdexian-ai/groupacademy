import { useState, useEffect, useCallback } from "react";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Loader2,
  Copy,
  Forward,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Trophy,
  CheckCircle,
  TrendingUp,
  Mic,
  List,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  Clock,
  Star,
  XCircle,
  Activity,
  ShieldCheck,
  Zap,
  Terminal, // CTO FIX: Restored Terminal icon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // CTO FIX: Restored DialogFooter
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Application Lifecycle Terminal (Job Applications)
 * High-fidelity orchestrator for recruitment telemetry and AI-driven candidate vetting.
 * 2026 Standard: Executive Logic geometry with reinforced cross-table ingestion.
 */

type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
type ApplicationType = Database["public"]["Enums"]["application_type"];

interface JobAssessment {
  id: string;
  ai_score: number | null;
  ai_analysis: any;
  status: string;
  completed_at: string | null;
}

interface JobApplication {
  id: string;
  job_id: string;
  professional_id: string;
  talent_id: string | null;
  application_status: ApplicationStatus | null;
  delivery_status: DeliveryStatus | null;
  cover_letter: string | null;
  cv_url: string | null;
  is_paid: boolean | null;
  created_at: string | null;
  delivery_error: string | null;
  applicant_notified_at: string | null;
  jobs: {
    title: string;
    company_name: string;
    application_type: ApplicationType;
    application_email: string | null;
    application_url: string | null;
    ai_assessment_enabled: boolean | null;
  } | null;
  talents: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
  job_assessments?: JobAssessment[];
}

const ITEMS_PER_PAGE = 10;

const APPLICATION_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: "SUBMITTED", color: "text-blue-500", bg: "bg-blue-500/10" },
  sent_to_employer: { label: "FORWARDED", color: "text-purple-500", bg: "bg-purple-500/10" },
  viewed: { label: "AUDITED", color: "text-amber-500", bg: "bg-amber-500/10" },
  shortlisted: { label: "PRIORITY", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  rejected: { label: "TERMINATED", color: "text-destructive", bg: "bg-destructive/10" },
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const getFirstName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  const prefixes = ["md.", "md", "mst.", "mst", "dr.", "dr", "engr.", "engr"];
  if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) return parts[1];
  return parts[0];
};

export const JobApplicationsManager = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | "all">("all");
  const [jobFilter, setJobFilter] = useState<string>(searchParams.get("jobId") || "all");
  const [jobsList, setJobsList] = useState<{ id: string; title: string; company: string; count: number }[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  // CTO FIX: Defined totalPages within the component scope
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const loadRegistryTelemetry = useCallback(async () => {
    try {
      const { data } = await supabase.from("job_applications").select("job_id, jobs(title, company_name)");
      const jobMap = new Map();
      data?.forEach((r: any) => {
        const id = r.job_id;
        const existing = jobMap.get(id) || { title: r.jobs?.title, company: r.jobs?.company_name, count: 0 };
        jobMap.set(id, { ...existing, count: existing.count + 1 });
      });
      setJobsList(
        Array.from(jobMap.entries())
          .map(([id, info]) => ({ id, ...info }))
          .sort((a, b) => b.count - a.count),
      );
    } catch (err) {
      console.error("Telemetry Fault:", err);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("job_applications")
        .select(
          `
          *,
          jobs (title, company_name, application_type, application_email, application_url, ai_assessment_enabled),
          talents (full_name, email, phone),
          job_assessments!job_application_id (id, ai_score, ai_analysis, status, completed_at)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("application_status", statusFilter);
      if (deliveryFilter !== "all") query = query.eq("delivery_status", deliveryFilter);
      if (jobFilter !== "all") query = query.eq("job_id", jobFilter);

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        const [tMatch, jMatch] = await Promise.all([
          supabase.from("talents").select("id").or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`).limit(200),
          supabase.from("jobs").select("id").or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`).limit(200),
        ]);
        const tIds = (tMatch.data || []).map((t) => t.id);
        const jIds = (jMatch.data || []).map((j) => j.id);
        const orParts = [];
        if (tIds.length) orParts.push(`talent_id.in.(${tIds.join(",")})`);
        if (jIds.length) orParts.push(`job_id.in.(${jIds.join(",")})`);
        if (orParts.length) query = query.or(orParts.join(","));
        else {
          setApplications([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = await withTimeout(
        Promise.resolve(query.range(from, from + ITEMS_PER_PAGE - 1)),
        TIMEOUTS.DEFAULT,
        "Registry Timeout",
      );
      if (result.error) throw result.error;

      setApplications((result.data as any) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, deliveryFilter, jobFilter, debouncedSearch]);

  useEffect(() => {
    loadApplications();
    loadRegistryTelemetry();
  }, [loadApplications, loadRegistryTelemetry]);

  const handleStatusUpdate = async (id: string, st: ApplicationStatus) => {
    try {
      const { error } = await supabase.from("job_applications").update({ application_status: st }).eq("id", id);
      if (error) throw error;
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, application_status: st } : a)));
      toast.success("Protocol Updated");
    } catch (err) {
      toast.error("Handshake Failed");
    }
  };

  // CTO FIX: Defined handleCopyDetails within component scope
  const handleCopyDetails = (app: JobApplication) => {
    const details = `APPLICANT: ${app.talents?.full_name}\nEMAIL: ${app.talents?.email}\nJOB: ${app.jobs?.title}\nCOMPANY: ${app.jobs?.company_name}`;
    navigator.clipboard.writeText(details);
    toast.success("Handshake Copied to Clipboard");
  };

  const handleNotifyWhatsApp = async (app: JobApplication) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ applicant_notified_at: new Date().toISOString() })
      .eq("id", app.id);
    if (error) return toast.error("Notification Fault");

    const name = getFirstName(app.talents?.full_name || "");
    const msg = encodeURIComponent(
      `Hi ${name}! 🎉\n\nForwarded your application for ${app.jobs?.title} at ${app.jobs?.company_name}!\n\nBest of luck!\nGroUp Team`,
    );
    const phone = (app.talents?.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${phone.startsWith("88") ? phone : "88" + phone}?text=${msg}`, "_blank");
    loadApplications();
  };

  const exportLedger = () => {
    const csv = [
      ["Applicant", "Job", "Status", "AI_Score"].join(","),
      ...applications.map((a) =>
        [
          `"${a.talents?.full_name}"`,
          `"${a.jobs?.title}"`,
          a.application_status,
          a.job_assessments?.[0]?.ai_score || "0",
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Applications_Ledger_${Date.now()}.csv`;
    link.click();
  };

  if (loading && page === 1) return <DashboardTableSkeleton rows={8} columns={6} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Registry Nodes", val: totalCount, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          {
            label: "Active Pending",
            val: applications.filter((a) => a.delivery_status === "pending").length,
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Shortlisted",
            val: applications.filter((a) => a.application_status === "shortlisted").length,
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Transmission Faults",
            val: applications.filter((a) => a.delivery_status === "failed").length,
            icon: AlertTriangle,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-5 flex items-center gap-5">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-6 w-6", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 text-left">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Terminal className="h-8 w-8 text-primary" /> Application Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Talent Ingestion Terminal: {totalCount} Entities Analyzed
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLedger}
              className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
            >
              <Download className="h-4 w-4" /> Export Ledger
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40">
            <div className="relative group lg:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query candidate or job node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base shadow-inner"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3 lg:col-span-2">
              <Select
                value={jobFilter}
                onValueChange={(v) => {
                  setJobFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="flex-1 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                  <SelectValue placeholder="Target Node" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 max-h-[300px]">
                  <SelectItem value="all" className="font-bold">
                    GLOBAL_ARTIFACTS
                  </SelectItem>
                  {jobsList.map((j) => (
                    <SelectItem key={j.id} value={j.id} className="font-bold text-[10px] uppercase truncate">
                      [{j.count}] {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as any);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                  <SelectValue placeholder="Node Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all" className="font-bold">
                    ALL_PROTOCOLS
                  </SelectItem>
                  {Object.entries(APPLICATION_STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="font-bold text-[10px] uppercase">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2 border-border/10">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-6">
                    Candidate Artifact
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Target</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">AI_Forensics</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status Protocol</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Interrogation
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const status = APPLICATION_STATUS_CONFIG[app.application_status || "submitted"];
                  const score = app.job_assessments?.[0]?.ai_score || 0;
                  return (
                    <TableRow
                      key={app.id}
                      className="group transition-all hover:bg-primary/[0.02] border-b-2 border-border/5 last:border-0"
                    >
                      <TableCell className="px-6 py-6">
                        <div className="space-y-1 text-left">
                          <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                            {app.talents?.full_name || "NULL_ENTITY"}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                            {app.talents?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="space-y-1">
                          <p className="font-black text-xs uppercase tracking-tighter italic leading-none">
                            {app.jobs?.title}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                            {app.jobs?.company_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.jobs?.ai_assessment_enabled ? (
                          <div
                            className="flex items-center gap-3 cursor-pointer group/ai"
                            onClick={() =>
                              setSelectedAssessment({
                                assessment: app.job_assessments![0],
                                applicantName: app.talents?.full_name,
                                jobTitle: app.jobs?.title,
                              })
                            }
                          >
                            <Brain
                              className={cn(
                                "h-5 w-5 transition-transform group-hover/ai:scale-110",
                                score >= 70 ? "text-emerald-500" : "text-amber-500",
                              )}
                            />
                            <span
                              className={cn(
                                "font-black text-lg italic tracking-tighter leading-none",
                                score >= 70 ? "text-emerald-500" : "text-amber-500",
                              )}
                            >
                              {score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black opacity-10 uppercase tracking-widest">No_AI_Sync</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={app.application_status || "submitted"}
                          onValueChange={(v) => handleStatusUpdate(app.id, v as any)}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-36 h-9 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest shadow-sm",
                              status.bg,
                              status.color,
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2">
                            {Object.entries(APPLICATION_STATUS_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="font-bold text-[9px] uppercase">
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          {app.cv_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                              onClick={() => window.open(app.cv_url!, "_blank")}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                            onClick={() => handleCopyDetails(app)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {app.talents?.phone && app.delivery_status === "sent" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-10 w-10 rounded-xl transition-all",
                                app.applicant_notified_at
                                  ? "text-emerald-500/30"
                                  : "text-emerald-500 hover:bg-emerald-500/10",
                              )}
                              onClick={() => !app.applicant_notified_at && handleNotifyWhatsApp(app)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 p-8 bg-muted/20 rounded-[32px] border-2 border-border/40">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic leading-none">
                  Registry Frame
                </p>
                <p className="text-xl font-black italic tracking-tighter leading-none">
                  {page} <span className="text-xs opacity-20">of</span> {totalPages}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AssessmentDetailDialog
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        assessment={selectedAssessment?.assessment || null}
        applicantName={selectedAssessment?.applicantName || ""}
        jobTitle={selectedAssessment?.jobTitle || ""}
      />
    </div>
  );
};

const AssessmentDetailDialog = ({ isOpen, onClose, assessment, applicantName, jobTitle }: any) => {
  if (!assessment) return null;
  const score = assessment.ai_score || 0;
  const analysis = assessment.ai_analysis || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-[40px] border-4 border-primary/20 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="mb-10 text-left">
            <div className="flex items-center gap-5">
              <Brain className="h-10 w-10 text-primary" />
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                  AI Forensics Audit
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  Candidate Matching Logic: {applicantName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-10">
            <div className="flex items-center justify-between p-8 bg-muted/20 rounded-[32px] border-2 border-border/10 shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                  Global Logic Match
                </p>
                <p
                  className={cn(
                    "text-6xl font-black italic tracking-tighter leading-none",
                    score >= 70 ? "text-emerald-500" : "text-amber-500",
                  )}
                >
                  {score}%
                </p>
              </div>
              <Trophy className={cn("h-16 w-16 opacity-10", score >= 70 ? "text-emerald-500" : "text-amber-500")} />
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="bg-muted/30 rounded-xl border-2 p-1 mb-6">
                <TabsTrigger value="summary" className="flex-1 font-black uppercase text-[9px] tracking-widest">
                  Synthesis
                </TabsTrigger>
                <TabsTrigger value="breakdown" className="flex-1 font-black uppercase text-[9px] tracking-widest">
                  Metadata
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-6 text-left">
                <div className="p-6 bg-primary/5 rounded-[24px] border-2 border-primary/10 italic font-medium leading-relaxed">
                  "{analysis.overall_assessment}"
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-emerald-500/5 rounded-[24px] border-2 border-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">
                      Core Strengths
                    </p>
                    <ul className="space-y-2">
                      {analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-xs font-bold text-emerald-900 flex items-start gap-2">
                          <span>//</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-amber-500/5 rounded-[24px] border-2 border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">
                      Optimization Required
                    </p>
                    <ul className="space-y-2">
                      {analysis.areas_for_improvement?.map((s: string, i: number) => (
                        <li key={i} className="text-xs font-bold text-amber-900 flex items-start gap-2">
                          <span>//</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="breakdown">
                <div className="space-y-6">
                  {Object.entries(analysis.score_breakdown || {}).map(([key, val]: any) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                        <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
                        <span className="text-primary">{val}%</span>
                      </div>
                      <Progress value={val} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-8 border-t border-border/10">
              <Button
                onClick={onClose}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/30"
              >
                Close Audit
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
