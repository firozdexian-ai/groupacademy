import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Star,
  Wand2,
  Image,
  Share2,
  Brain,
  Link as LinkIcon,
  Linkedin,
  Facebook,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Types ---
interface AssessmentConfig {
  question_count: number;
  voice_enabled: boolean;
}

type JobType = "full_time" | "part_time" | "contract" | "internship" | "freelance" | "remote";
type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
type SourcePlatform = "facebook" | "linkedin" | "bdjobs" | "website" | "other";
type ApplicationType = "email" | "link";

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
  description: string;
  ai_enhanced_description: string | null;
  requirements: string[];
  application_type: ApplicationType;
  application_email: string | null;
  application_url: string | null;
  source_url: string | null;
  source_platform: SourcePlatform | null;
  source_image_url: string | null;
  profession_category_id: string | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  ai_assessment_enabled: boolean | null;
  assessment_config: AssessmentConfig;
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

const SOURCE_PLATFORMS: { value: SourcePlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "bdjobs", label: "BdJobs" },
  { value: "website", label: "Company Website" },
  { value: "other", label: "Other" },
];

const getDefaultDeadline = () => {
  const lastDay = endOfMonth(new Date());
  return format(lastDay, "yyyy-MM-dd");
};

const emptyJob = {
  title: "",
  company_name: "",
  company_logo_url: "",
  location: "",
  job_type: "full_time" as JobType,
  experience_level: "entry" as ExperienceLevel,
  salary_range_min: null as number | null,
  salary_range_max: null as number | null,
  description: "",
  ai_enhanced_description: null as string | null,
  requirements: [] as string[],
  application_type: "email" as ApplicationType,
  application_email: "",
  application_url: "",
  source_url: "",
  source_platform: "other" as SourcePlatform,
  source_image_url: "",
  profession_category_id: null as string | null,
  deadline: getDefaultDeadline(),
  is_active: true,
  is_featured: false,
  ai_assessment_enabled: false,
  assessment_config: { question_count: 6, voice_enabled: true },
  vacancies: 1,
};

const ITEMS_PER_PAGE = 10;

// --- Sub-Component: Job Form (Inline to keep single file) ---
// Extracted to reduce main component complexity
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");

  const handleParseJobPost = async () => {
    if (!rawJobPost.trim() || rawJobPost.length < 50) {
      toast.error("Please paste a complete job post (minimum 50 characters)");
      return;
    }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", {
        body: { jobPostText: rawJobPost },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to parse job post");

      const parsed = data.parsed;
      setFormData((prev: any) => ({
        ...prev,
        title: parsed.title || prev.title,
        company_name: parsed.company_name || prev.company_name,
        location: parsed.location || prev.location,
        job_type: (parsed.job_type as JobType) || prev.job_type,
        experience_level: (parsed.experience_level as ExperienceLevel) || prev.experience_level,
        salary_range_min: parsed.salary_range_min || prev.salary_range_min,
        salary_range_max: parsed.salary_range_max || prev.salary_range_max,
        description: parsed.description || prev.description,
        requirements: parsed.requirements || prev.requirements,
        application_email: parsed.application_email || prev.application_email,
        application_url: parsed.application_url || prev.application_url,
        source_platform: (parsed.source_platform as SourcePlatform) || prev.source_platform,
        deadline: parsed.deadline || prev.deadline,
        profession_category_id: data.professionCategoryId || prev.profession_category_id,
      }));
      toast.success("Job post parsed! Review and edit as needed.");
      setShowParseSection(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse job post");
    } finally {
      setParsing(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!formData.description.trim()) {
      toast.error("Please enter a job description first");
      return;
    }
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: {
          description: formData.description,
          title: formData.title,
          company: formData.company_name,
        },
      });
      if (error) throw error;
      setFormData((prev: any) => ({ ...prev, ai_enhanced_description: data.enhanced_description }));
      toast.success("Description enhanced with AI!");
    } catch (error: any) {
      toast.error("Failed to enhance description");
    } finally {
      setEnhancing(false);
    }
  };

  const uploadToStorage = async (file: File, path: string) => {
    const fileName = `${path}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const { error: uploadError } = await supabase.storage.from("public-uploads").upload(fileName, file); // Ensure bucket exists
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from("public-uploads").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadToStorage(file, "job-images");
      setFormData((prev: any) => ({ ...prev, source_image_url: publicUrl }));
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const publicUrl = await uploadToStorage(file, "company-logos");
      setFormData((prev: any) => ({ ...prev, company_logo_url: publicUrl }));
      toast.success("Logo uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      requirements: prev.requirements.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="grid gap-6 py-4">
      {/* AI Parse Section */}
      {!formData.id && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Parse Job Post with AI
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setShowParseSection(!showParseSection)}>
              {showParseSection ? "Hide" : "Show"}
            </Button>
          </div>
          {showParseSection && (
            <>
              <Textarea
                placeholder="Paste the full job post..."
                value={rawJobPost}
                onChange={(e) => setRawJobPost(e.target.value)}
                rows={6}
              />
              <Button onClick={handleParseJobPost} disabled={parsing || rawJobPost.length < 50} className="w-full">
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" /> Parse & Auto-Fill
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="e.g., Tech Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Dhaka, Bangladesh"
          />
        </div>
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex gap-2">
            <Input
              value={formData.company_logo_url}
              onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
              placeholder="URL or upload..."
              className="flex-1"
            />
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingLogo}
              />
              <Button variant="outline" disabled={uploadingLogo}>
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Job Type</Label>
          <Select value={formData.job_type} onValueChange={(v) => setFormData({ ...formData, job_type: v as JobType })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Experience Level</Label>
          <Select
            value={formData.experience_level}
            onValueChange={(v) => setFormData({ ...formData, experience_level: v as ExperienceLevel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Salary Min</Label>
          <Input
            type="number"
            value={formData.salary_range_min || ""}
            onChange={(e) =>
              setFormData({ ...formData, salary_range_min: e.target.value ? parseInt(e.target.value) : null })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Salary Max</Label>
          <Input
            type="number"
            value={formData.salary_range_max || ""}
            onChange={(e) =>
              setFormData({ ...formData, salary_range_max: e.target.value ? parseInt(e.target.value) : null })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Vacancies</Label>
          <Input
            type="number"
            min="1"
            value={formData.vacancies}
            onChange={(e) => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Job Description *</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnhanceDescription}
            disabled={enhancing || !formData.description.trim()}
          >
            {enhancing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}{" "}
            Enhance with AI
          </Button>
        </div>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          placeholder="Paste raw description..."
        />
      </div>

      <div className="space-y-2">
        <Label>Requirements</Label>
        <div className="flex gap-2">
          <Input
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
            placeholder="Add requirement..."
          />
          <Button type="button" onClick={handleAddRequirement} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.requirements.map((req: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {req}{" "}
              <button onClick={() => handleRemoveRequirement(i)} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Job
        </Button>
      </div>
    </div>
  );
};

// --- Main Component ---
export function JobsManager() {
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch Data (Paginated)
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });

      // Search Logic
      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`,
        );
      }

      // Filter Logic
      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);
      if (statusFilter === "featured") query = query.eq("is_featured", true);

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading jobs timed out");

      if (result.error) throw result.error;

      setJobs((result.data as unknown as Job[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load jobs");
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadJobs();
    loadCategories();
  }, [loadJobs]);

  const loadCategories = async () => {
    const { data } = await supabase.from("profession_categories").select("id, name").eq("is_active", true);
    setCategories(data || []);
  };

  const handleSaveJob = async (formData: any) => {
    setSaving(true);
    try {
      // Company Logic (Create or Update)
      let companyId: string | null = null;
      const companyName = formData.company_name.trim();

      if (companyName) {
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", companyName)
          .maybeSingle();
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({ name: companyName })
            .select("id")
            .single();
          if (newCompany) companyId = newCompany.id;
        }
      }

      const jobData = {
        ...formData,
        company_id: companyId,
        requirements: formData.requirements, // Ensure array type
      };

      // Remove ID from insert data to prevent duplicate key error
      delete jobData.id;

      if (editingJob) {
        await supabase.from("jobs").update(jobData).eq("id", editingJob.id);
        toast.success("Job updated");
      } else {
        await supabase.from("jobs").insert(jobData);
        toast.success("Job created");
      }
      setIsDialogOpen(false);
      loadJobs();
    } catch (error: any) {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    toast.success("Job deleted");
    loadJobs();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg">Jobs Manager</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total {totalCount} jobs found</p>
          </div>
          <Button
            onClick={() => {
              setEditingJob(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Job
          </Button>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <DashboardTableSkeleton rows={5} columns={8} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadJobs} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{job.location || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.job_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.is_active ? "default" : "secondary"}>
                          {job.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.deadline ? format(new Date(job.deadline), "MMM d") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, '_blank');
                              }}>
                                <Linkedin className="w-4 h-4 mr-2" /> Share to LinkedIn
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`, '_blank');
                              }}>
                                <Facebook className="w-4 h-4 mr-2" /> Share to Facebook
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;
                                const message = `🔔 Hiring Alert! ${job.title} at ${job.company_name}${job.location ? ` in ${job.location}` : ''}. Apply now!`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + jobUrl)}`, '_blank');
                              }}>
                                <MessageCircle className="w-4 h-4 mr-2" /> Share to WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;
                                navigator.clipboard.writeText(jobUrl);
                                toast.success('Job link copied to clipboard!');
                              }}>
                                <Copy className="w-4 h-4 mr-2" /> Copy Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
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
      </CardContent>
    </Card>
  );
}
