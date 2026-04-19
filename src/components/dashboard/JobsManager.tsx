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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";
import { DashboardTableSkeleton } from "./DashboardSkeleton";
import { BatchLinkedInJobUpload } from "./BatchLinkedInJobUpload";

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
  job_type: typeof JOB_TYPES[number];
  experience_level: typeof EXPERIENCE_LEVELS[number];
  salary_range_min: string;
  salary_range_max: string;
  salary_currency: string;
  description: string;
  application_type: typeof APPLICATION_TYPES[number];
  application_email: string;
  application_url: string;
  source_platform: typeof SOURCE_PLATFORMS[number];
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

  const fetchEngagement = useCallback(async (jobIds: string[]) => {
    if (jobIds.length === 0) return;
    const clicksRes = await supabase.from("job_analytics").select("job_id").in("job_id", jobIds);
    const savesRes = await (supabase.from("saved_items") as any).select("item_id").eq("kind", "job").in("item_id", jobIds);
    const recsRes = await supabase.from("ai_job_recommendations").select("job_id").in("job_id", jobIds);

    const stats: Record<string, EngagementData> = {};
    jobIds.forEach((id) => (stats[id] = { job_id: id, clicks: 0, saves: 0, recommendations: 0 }));
    ((clicksRes.data ?? []) as Array<{ job_id: string }>).forEach((c) => stats[c.job_id] && stats[c.job_id].clicks++);
    ((savesRes.data ?? []) as Array<{ item_id: string }>).forEach((s) => stats[s.item_id] && stats[s.item_id].saves++);
    ((recsRes.data ?? []) as Array<{ job_id: string }>).forEach((r) => stats[r.job_id] && stats[r.job_id].recommendations++);
    setEngagement(stats);
  }, []);

  const loadJobs = useCallback(async () => {
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
      if (data) fetchEngagement(data.map((j) => j.id));
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, fetchEngagement]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const openNew = () => {
    setEditingJobId(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = async (job: Job) => {
    setEditingJobId(job.id);
    const { data, error } = await supabase.from("jobs").select("*").eq("id", job.id).single();
    if (error || !data) {
      toast.error("Failed to load job");
      return;
    }
    setForm({
      title: data.title || "",
      company_name: data.company_name || "",
      company_logo_url: data.company_logo_url || "",
      location: data.location || "",
      job_type: (data.job_type as any) || "full_time",
      experience_level: (data.experience_level as any) || "entry",
      salary_range_min: data.salary_range_min?.toString() || "",
      salary_range_max: data.salary_range_max?.toString() || "",
      salary_currency: data.salary_currency || "BDT",
      description: data.description || "",
      application_type: (data.application_type as any) || "internal",
      application_email: data.application_email || "",
      application_url: data.application_url || "",
      source_platform: (data.source_platform as any) || "other",
      source_image_url: data.source_image_url || "",
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      ai_assessment_enabled: data.ai_assessment_enabled ?? false,
      vacancies: data.vacancies?.toString() || "1",
      deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : "",
    });
    setIsDialogOpen(true);
  };

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const fileName = `job-logos/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("job-assets").upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("job-assets").getPublicUrl(fileName);
      updateField("company_logo_url", publicUrl);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (form.description.length < 30) {
      toast.error("Add at least 30 characters before enhancing");
      return;
    }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: {
          title: form.title,
          company: form.company_name,
          description: form.description,
        },
      });
      if (error) throw error;
      const enhanced = data?.enhanced || data?.description;
      if (enhanced) {
        updateField("description", enhanced);
        toast.success("Description enhanced");
      } else {
        toast.info("No enhancement returned");
      }
    } catch (err: any) {
      toast.error("AI enhance failed: " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.company_name.trim()) {
      toast.error("Title and company are required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (form.application_type === "email" && !form.application_email) {
      toast.error("Email is required for email applications");
      return;
    }
    if (form.application_type === "link" && !form.application_url) {
      toast.error("URL is required for link applications");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        company_name: form.company_name.trim(),
        company_logo_url: form.company_logo_url || null,
        location: form.location || null,
        job_type: form.job_type,
        experience_level: form.experience_level,
        salary_range_min: form.salary_range_min ? parseInt(form.salary_range_min) : null,
        salary_range_max: form.salary_range_max ? parseInt(form.salary_range_max) : null,
        salary_currency: form.salary_currency,
        description: form.description,
        application_type: form.application_type,
        application_email: form.application_type === "email" ? form.application_email : null,
        application_url: form.application_type === "link" ? form.application_url : null,
        source_platform: form.source_platform,
        source_image_url: form.source_image_url || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        ai_assessment_enabled: form.ai_assessment_enabled,
        vacancies: parseInt(form.vacancies) || 1,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      if (editingJobId) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", editingJobId);
        if (error) throw error;
        toast.success("Job updated");
      } else {
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) throw error;
        toast.success("Job created");
      }

      setIsDialogOpen(false);
      loadJobs();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace Manager</h1>
          <p className="text-sm text-muted-foreground">Monitor performance and pipeline status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsLinkedInImportOpen(true)}>
            <Linkedin className="w-4 h-4 mr-2" /> Batch Upload
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="engagement">Engagement AI</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search jobs/companies..."
                  className="max-w-xs h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Postings</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <DashboardTableSkeleton rows={5} columns={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Detail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <p className="font-bold text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company_name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Live" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{job.location || "Remote"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(job)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={async () => {
                              if (confirm("Remove listing?")) {
                                await supabase.from("jobs").delete().eq("id", job.id);
                                loadJobs();
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Job Clicks</p>
                <h3 className="text-2xl font-bold">{Object.values(engagement).reduce((a, b) => a + b.clicks, 0)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">AI Recommendation Hits</p>
                <h3 className="text-2xl font-bold">{Object.values(engagement).reduce((a, b) => a + b.recommendations, 0)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Talent Bookmarks</p>
                <h3 className="text-2xl font-bold">{Object.values(engagement).reduce((a, b) => a + b.saves, 0)}</h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Engagement Rankings
              </CardTitle>
              <CardDescription>Top jobs by talent interest and AI matching</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center"><MousePointer2 className="w-3 h-3 mx-auto" /> Clicks</TableHead>
                    <TableHead className="text-center"><Bookmark className="w-3 h-3 mx-auto" /> Saves</TableHead>
                    <TableHead className="text-center"><Brain className="w-3 h-3 mx-auto" /> AI Hits</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const stats = engagement[job.id] || { clicks: 0, saves: 0, recommendations: 0 };
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium text-xs">{job.title}</TableCell>
                        <TableCell className="text-center text-xs">{stats.clicks}</TableCell>
                        <TableCell className="text-center text-xs">{stats.saves}</TableCell>
                        <TableCell className="text-center text-xs">{stats.recommendations}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px]">
                            {stats.clicks + stats.saves * 3} pts
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

      <BatchLinkedInJobUpload
        isOpen={isLinkedInImportOpen}
        onClose={() => setIsLinkedInImportOpen(false)}
        onComplete={loadJobs}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJobId ? "Edit Job Posting" : "New Job Posting"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Senior Frontend Developer" />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Dhaka, Bangladesh" />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                {form.company_logo_url ? (
                  <div className="relative">
                    <img src={form.company_logo_url} alt="Logo" className="h-14 w-14 rounded-lg object-cover border" />
                    <button
                      onClick={() => updateField("company_logo_url", "")}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="h-14 w-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                  </label>
                )}
                <Input
                  value={form.company_logo_url}
                  onChange={(e) => updateField("company_logo_url", e.target.value)}
                  placeholder="…or paste logo URL"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Type / Level / Source */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={(v) => updateField("job_type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Experience</Label>
                <Select value={form.experience_level} onValueChange={(v) => updateField("experience_level", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_LEVELS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source Platform</Label>
                <Select value={form.source_platform} onValueChange={(v) => updateField("source_platform", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_PLATFORMS.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Salary Min</Label>
                <Input type="number" value={form.salary_range_min} onChange={(e) => updateField("salary_range_min", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Salary Max</Label>
                <Input type="number" value={form.salary_range_max} onChange={(e) => updateField("salary_range_max", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.salary_currency} onValueChange={(v) => updateField("salary_currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Description *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceDescription} disabled={isEnhancing}>
                  {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI Enhance
                </Button>
              </div>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={8}
                placeholder="Role responsibilities, requirements, benefits…"
              />
            </div>

            {/* Application */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Application Type</Label>
                <Select value={form.application_type} onValueChange={(v) => updateField("application_type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{APPLICATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.application_type === "email" && (
                <div className="space-y-1.5">
                  <Label>Application Email *</Label>
                  <Input type="email" value={form.application_email} onChange={(e) => updateField("application_email", e.target.value)} />
                </div>
              )}
              {form.application_type === "link" && (
                <div className="space-y-1.5">
                  <Label>Application URL *</Label>
                  <Input type="url" placeholder="https://…" value={form.application_url} onChange={(e) => updateField("application_url", e.target.value)} />
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Vacancies</Label>
                <Input type="number" min="1" value={form.vacancies} onChange={(e) => updateField("vacancies", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => updateField("deadline", e.target.value)} />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.ai_assessment_enabled} onCheckedChange={(v) => updateField("ai_assessment_enabled", v)} />
                <span className="text-sm">AI Assessment</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingJobId ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
