import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { COUNTRIES } from "@/lib/constants/countries";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Linkedin,
  Building2,
  ExternalLink,
  Mail,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "./DashboardSkeleton";

// --- Valid job fields for payload sanitization ---
const VALID_JOB_FIELDS = [
  "title",
  "company_name",
  "company_logo_url",
  "location",
  "job_type",
  "experience_level",
  "salary_range_min",
  "salary_range_max",
  "salary_currency",
  "description",
  "ai_enhanced_description",
  "requirements",
  "application_type",
  "application_email",
  "application_url",
  "profession_category_id",
  "deadline",
  "is_active",
  "is_featured",
  "vacancies",
  "ai_assessment_enabled",
  "assessment_config",
];

type JobType = "full_time" | "part_time" | "contract" | "internship" | "freelance" | "remote";
type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
type ApplicationType = "email" | "link" | "internal";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: JobType;
  experience_level: ExperienceLevel;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: string[];
  application_type: ApplicationType;
  application_email: string | null;
  application_url: string | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  ai_assessment_enabled: boolean | null;
  assessment_config: any | null;
  vacancies: number | null;
  created_at: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "remote", label: "Remote" },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
];

const ITEMS_PER_PAGE = 10;
const emptyJob = {
  title: "",
  company_name: "",
  company_logo_url: "",
  location: "",
  job_type: "full_time" as JobType,
  experience_level: "entry" as ExperienceLevel,
  salary_range_min: null as number | null,
  salary_range_max: null as number | null,
  salary_currency: "BDT",
  description: "",
  ai_enhanced_description: null as string | null,
  requirements: [] as string[],
  application_type: "link" as ApplicationType,
  application_email: "",
  application_url: "",
  deadline: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  is_active: true,
  is_featured: false,
  ai_assessment_enabled: false,
  assessment_config: { questions: 5, voice: false },
  vacancies: 1,
};

// --- JOB FORM COMPONENT ---
const JobForm = ({
  initialData,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  initialData: any;
  categories: ProfessionCategory[];
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const [formData, setFormData] = useState(initialData);
  const [enhancing, setEnhancing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rawJobPost, setRawJobPost] = useState("");
  const [showParseSection, setShowParseSection] = useState(false);

  const handleParseJobPost = async () => {
    if (!rawJobPost.trim() || rawJobPost.length < 50) return toast.error("Please paste a complete job post");
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", { body: { jobPostText: rawJobPost } });
      if (error || !data?.success) throw new Error(data?.error || "Failed to parse");
      setFormData((prev: any) => ({ ...prev, ...data.parsed }));
      toast.success("Job parsed!");
      setShowParseSection(false);
    } catch {
      toast.error("Parse failed.");
    } finally {
      setParsing(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!formData.description) return toast.error("Enter description first");
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: { description: formData.description, title: formData.title, company: formData.company_name },
      });
      if (error) throw error;
      setFormData((prev: any) => ({ ...prev, ai_enhanced_description: data.enhanced_description }));
      toast.success("Enhanced with AI!");
    } catch {
      toast.error("Enhance failed");
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="grid gap-6 py-4">
      {!formData.id && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> AI Parse
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setShowParseSection(!showParseSection)}>
              {showParseSection ? "Hide" : "Show"}
            </Button>
          </div>
          {showParseSection && (
            <div className="space-y-2">
              <Textarea
                placeholder="Paste job text..."
                value={rawJobPost}
                onChange={(e) => setRawJobPost(e.target.value)}
                rows={4}
              />
              <Button onClick={handleParseJobPost} disabled={parsing} className="w-full">
                {parsing ? <Loader2 className="animate-spin" /> : "Fill Fields"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={formData.salary_currency || "BDT"}
            onValueChange={(v) => setFormData({ ...formData, salary_currency: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BDT">BDT (৳)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Min Salary</Label>
          <Input
            type="number"
            value={formData.salary_range_min || ""}
            onChange={(e) => setFormData({ ...formData, salary_range_min: parseInt(e.target.value) || null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Salary</Label>
          <Input
            type="number"
            value={formData.salary_range_max || ""}
            onChange={(e) => setFormData({ ...formData, salary_range_max: parseInt(e.target.value) || null })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Description</Label>
          <Button variant="outline" size="sm" onClick={handleEnhanceDescription} disabled={enhancing}>
            <Sparkles className="w-4 h-4 mr-2" /> AI Enhance
          </Button>
        </div>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)} disabled={saving}>
          {saving && <Loader2 className="animate-spin mr-2" />} Save Job
        </Button>
      </div>
    </div>
  );
};

// --- MAIN MANAGER COMPONENT ---
export function JobsManager() {
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);

  useEffect(() => {
    const loadInit = async () => {
      const { data } = await supabase.from("profession_categories").select("id, name").order("name");
      setCategories(data || []);
    };
    loadInit();
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
      if (statusFilter !== "all") query = query.eq("is_active", statusFilter === "active");

      const from = (page - 1) * ITEMS_PER_PAGE;
      const { data, count, error } = await query.range(from, from + ITEMS_PER_PAGE - 1);
      if (error) throw error;
      setJobs((data as any[]) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // --- CTO FIX: RESOLVED TYPE OVERLOAD ERROR ---
  const handleSaveJob = async (formData: any) => {
    setSaving(true);
    try {
      // 1. Create payload with strictly whitelisted keys
      const payload: Record<string, any> = {};
      VALID_JOB_FIELDS.forEach((field) => {
        if (formData[field] !== undefined) {
          payload[field] = formData[field];
        }
      });

      // 2. Perform DB operation with explicit casting to bypass overload confusion
      if (editingJob) {
        const { error } = await supabase
          .from("jobs")
          .update(payload as any) // Explicit cast to any for update payload
          .eq("id", editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert([payload as any]); // Pass as array of 1 object
        if (error) throw error;
      }

      toast.success("Job Saved");
      setIsDialogOpen(false);
      loadJobs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) {
      toast.success("Deleted");
      loadJobs();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Jobs Manager</CardTitle>
          <Button
            onClick={() => {
              setEditingJob(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Job
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              className="flex-1 min-w-[200px]"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <DashboardTableSkeleton rows={5} columns={5} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company_name}</TableCell>
                      <TableCell>
                        {job.salary_range_min ? `${job.salary_currency} ${job.salary_range_min}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingJob(job);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Add Job"}</DialogTitle>
          </DialogHeader>
          <JobForm
            initialData={editingJob || emptyJob}
            categories={categories}
            onSave={handleSaveJob}
            onCancel={() => setIsDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
