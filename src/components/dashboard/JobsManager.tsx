import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Loader2,
  Linkedin,
  BarChart3,
  Bookmark,
  Brain,
  MousePointer2,
  Upload,
  X,
  Activity,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Globe,
  Briefcase,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardTableSkeleton } from "./DashboardSkeleton";
import { BatchLinkedInJobUpload } from "./BatchLinkedInJobUpload";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Marketplace Inventory Terminal (Jobs Manager)
 * High-fidelity orchestrator for job lifecycle, AI-enhancement, and engagement telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced cross-table analytics.
 */

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
const APPLICATION_TYPES = ["internal", "email", "link"] as const;
const SOURCE_PLATFORMS = ["linkedin", "facebook", "indeed", "company_website", "other"] as const;
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "AED", "SAR", "INR", "SGD"];

type JobFormState = {
  title: string;
  company_name: string;
  company_logo_url: string;
  location: string;
  job_type: (typeof JOB_TYPES)[number];
  experience_level: (typeof EXPERIENCE_LEVELS)[number];
  salary_range_min: string;
  salary_range_max: string;
  salary_currency: string;
  description: string;
  application_type: (typeof APPLICATION_TYPES)[number];
  application_email: string;
  application_url: string;
  source_platform: (typeof SOURCE_PLATFORMS)[number];
  source_image_url: string;
  is_active: boolean;
  is_featured: boolean;
  ai_assessment_enabled: boolean;
  vacancies: string;
  deadline: string;
};

const EMPTY_FORM: JobFormState = {
  title: "",
  company_name: "",
  company_logo_url: "",
  location: "",
  job_type: "full_time",
  experience_level: "entry",
  salary_range_min: "",
  salary_range_max: "",
  salary_currency: "BDT",
  description: "",
  application_type: "internal",
  application_email: "",
  application_url: "",
  source_platform: "other",
  source_image_url: "",
  is_active: true,
  is_featured: false,
  ai_assessment_enabled: false,
  vacancies: "1",
  deadline: "",
};

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  application_type: string;
  salary_range_min?: number | null;
  salary_currency?: string | null;
}

interface EngagementData {
  job_id: string;
  clicks: number;
  saves: number;
  recommendations: number;
}

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engagement, setEngagement] = useState<Record<string, EngagementData>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isLinkedInImportOpen, setIsLinkedInImportOpen] = useState(false);

  const fetchEngagementTelemetry = useCallback(async (jobIds: string[]) => {
    if (jobIds.length === 0) return;
    const [clicksRes, savesRes, recsRes] = await Promise.all([
      supabase.from("job_analytics").select("job_id").in("job_id", jobIds),
      supabase.from("saved_items").select("item_id").eq("kind", "job").in("item_id", jobIds),
      supabase.from("ai_job_recommendations").select("job_id").in("job_id", jobIds),
    ]);

    const stats: Record<string, EngagementData> = {};
    jobIds.forEach((id) => (stats[id] = { job_id: id, clicks: 0, saves: 0, recommendations: 0 }));
    (clicksRes.data ?? []).forEach((c: any) => stats[c.job_id] && stats[c.job_id].clicks++);
    (savesRes.data ?? []).forEach((s: any) => stats[s.item_id] && stats[s.item_id].saves++);
    (recsRes.data ?? []).forEach((r: any) => stats[r.job_id] && stats[r.job_id].recommendations++);
    setEngagement(stats);
  }, []);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (searchQuery) {
        const safe = sanitizeIlike(searchQuery);
        query = query.or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`);
      }
      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "featured") query = query.eq("is_featured", true);

      const from = (page - 1) * 10;
      const { data, count, error } = await query.range(from, from + 9);
      if (error) throw error;
      setJobs(data as Job[]);
      setTotalCount(count || 0);
      if (data) fetchEngagementTelemetry(data.map((j) => j.id));
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, fetchEngagementTelemetry]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const handleSaveProtocol = async () => {
    if (!form.title.trim() || !form.company_name.trim())
      return toast.error("Identity Fault: Title and Company required");
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        salary_range_min: form.salary_range_min ? parseInt(form.salary_range_min) : null,
        salary_range_max: form.salary_range_max ? parseInt(form.salary_range_max) : null,
        vacancies: parseInt(form.vacancies) || 1,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      const { error } = editingJobId
        ? await supabase.from("jobs").update(payload).eq("id", editingJobId)
        : await supabase.from("jobs").insert(payload);

      if (error) throw error;
      toast.success(editingJobId ? "Artifact Recalibrated" : "Marketplace Node Initialized");
      setIsDialogOpen(false);
      loadRegistry();
    } catch (err: any) {
      toast.error(err.message || "Protocol Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnhanceSynthesis = async () => {
    if (form.description.length < 30) return toast.error("Payload too low for AI synthesis");
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: { title: form.title, company: form.company_name, description: form.description },
      });
      if (error) throw error;
      if (data?.enhanced) {
        setForm((f) => ({ ...f, description: data.enhanced }));
        toast.success("Description Synthesized");
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Briefcase className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Job Inventory</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Marketplace Liquidity & Talent Engagement Registry
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLinkedInImportOpen(true)}
            className="rounded-xl h-12 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <Linkedin className="w-4 h-4 text-primary" /> Batch Sync
          </Button>
          <Button
            onClick={() => {
              setEditingJobId(null);
              setForm(EMPTY_FORM);
              setIsDialogOpen(true);
            }}
            className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Initialize Node
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-md">
          <TabsTrigger
            value="inventory"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Layers className="w-4 h-4" /> Registry
          </TabsTrigger>
          <TabsTrigger
            value="engagement"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Activity className="w-4 h-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <CardHeader className="p-8 border-b border-border/10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Query artifact by role or entity..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-12 h-14 bg-muted/20 border-2 border-border/10 rounded-2xl font-bold tracking-tight"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-56 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-muted/20">
                    <SelectValue placeholder="Protocol" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-2xl">
                    <SelectItem value="all" className="font-bold">
                      GLOBAL_REGISTRY
                    </SelectItem>
                    <SelectItem value="active" className="font-bold text-emerald-500">
                      ACTIVE_NODES
                    </SelectItem>
                    <SelectItem value="featured" className="font-bold text-primary">
                      FEATURED_PRIORITY
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12">
                  <DashboardTableSkeleton rows={8} columns={5} />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                        Logic Node (Role)
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">
                        Protocol Status
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Temporal Log</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                        Interrogate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="group transition-all hover:bg-primary/[0.02]">
                        <TableCell className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                              {job.title}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                              {job.company_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 border-none",
                              job.is_active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                            )}
                          >
                            {job.is_active ? "ACTIVE_LOG" : "IDLE_DRAFT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                              onClick={() => openEdit(job)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                              onClick={async () => {
                                if (confirm("Purge artifact?")) {
                                  await supabase.from("jobs").delete().eq("id", job.id);
                                  loadRegistry();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-8 border-t border-border/10 bg-muted/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                      Registry Frame
                    </p>
                    <p className="text-xl font-black italic tracking-tighter">
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
        </TabsContent>

        <TabsContent value="engagement" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Global Handshakes (Clicks)",
                val: Object.values(engagement).reduce((a, b) => a + b.clicks, 0),
                icon: MousePointer2,
                color: "text-primary",
                bg: "bg-primary/5",
              },
              {
                label: "AI Match Success (Recs)",
                val: Object.values(engagement).reduce((a, b) => a + b.recommendations, 0),
                icon: Brain,
                color: "text-purple-500",
                bg: "bg-purple-500/5",
              },
              {
                label: "Talent Retention (Saves)",
                val: Object.values(engagement).reduce((a, b) => a + b.saves, 0),
                icon: Bookmark,
                color: "text-amber-500",
                bg: "bg-amber-500/5",
              },
            ].map((k, i) => (
              <Card
                key={i}
                className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 flex items-center gap-6 group hover:border-primary/20 transition-all"
              >
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-inner group-hover:rotate-6 transition-transform",
                    k.bg,
                  )}
                >
                  <k.icon className={cn("h-7 w-7", k.color)} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    {k.label}
                  </p>
                  <p className="text-3xl font-black tracking-tighter italic leading-none">{k.val}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30">
            <CardHeader className="p-8 border-b border-border/10">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" /> Engagement Scoreboard
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                Weighted Artifact Performance Index
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="text-[10px] font-black uppercase py-8 px-8">Logic Node</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase">Handshakes</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase">Retention</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase">AI_Impact</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase pr-8">Intensity_Index</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const stats = engagement[job.id] || { clicks: 0, saves: 0, recommendations: 0 };
                    const score = stats.clicks + stats.saves * 5 + stats.recommendations * 2;
                    return (
                      <TableRow key={job.id} className="group hover:bg-primary/[0.02] border-b border-border/5">
                        <TableCell className="px-8 py-5 font-black text-xs uppercase italic tracking-tighter">
                          {job.title}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-primary">{stats.clicks}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-amber-500">{stats.saves}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-purple-500">
                          {stats.recommendations}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] italic">
                            {score} PTS
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    {editingJobId ? "Recalibrate Node" : "Initialize Artifact"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Job Marketplace Configuration Protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Job Title *
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="h-12 rounded-xl border-2 font-bold"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Entity Name *
                  </Label>
                  <Input
                    value={form.company_name}
                    onChange={(e) => updateField("company_name", e.target.value)}
                    className="h-12 rounded-xl border-2 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Visual Identity (Logo)
                </Label>
                <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border-2 border-border/10">
                  {form.company_logo_url ? (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 shadow-inner">
                      <img src={form.company_logo_url} className="h-full w-full object-cover" />
                      <button
                        onClick={() => updateField("company_logo_url", "")}
                        className="absolute inset-0 bg-destructive/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 w-20 rounded-xl border-4 border-dashed border-border/40 hover:border-primary/40 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <Upload className="h-6 w-6 text-muted-foreground/40" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                  <Input
                    value={form.company_logo_url}
                    onChange={(e) => updateField("company_logo_url", e.target.value)}
                    placeholder="Sync Logo via URL..."
                    className="flex-1 h-12 rounded-xl border-2 italic"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Role Specification *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleEnhanceSynthesis}
                    disabled={isEnhancing}
                    className="rounded-lg border-2 h-10 px-4 font-black uppercase text-[9px] tracking-widest text-primary"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}{" "}
                    Synthesize Payload
                  </Button>
                </div>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={10}
                  className="rounded-3xl border-2 bg-muted/5 font-mono text-sm p-6 italic"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Job Type</Label>
                  <Select value={form.job_type} onValueChange={(v) => updateField("job_type", v as any)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Experience</Label>
                  <Select
                    value={form.experience_level}
                    onValueChange={(v) => updateField("experience_level", v as any)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Origin</Label>
                  <Select value={form.source_platform} onValueChange={(v) => updateField("source_platform", v as any)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_PLATFORMS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-12 p-6 rounded-[28px] border-2 bg-muted/20 border-border/10">
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Active_Node</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Featured_Priority</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.ai_assessment_enabled}
                    onCheckedChange={(v) => updateField("ai_assessment_enabled", v)}
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest">AI_Vetting_Logic</Label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={handleSaveProtocol}
                  disabled={isSaving}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  {editingJobId ? "Commit Recalibration" : "Authorize Node"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
