import { useEffect, useState } from "react";
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
  Plus, Search, Edit, Trash2, Sparkles, MapPin, Building2, 
  Calendar, ExternalLink, Loader2, Copy, Eye, EyeOff, Star, Wand2, Image
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: any;
  application_type: string;
  application_email: string | null;
  application_url: string | null;
  source_url: string | null;
  source_platform: string | null;
  source_image_url: string | null;
  profession_category_id: string | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "remote", label: "Remote" },
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
];

const SOURCE_PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "bdjobs", label: "BdJobs" },
  { value: "website", label: "Company Website" },
  { value: "other", label: "Other" },
];

const emptyJob = {
  title: "",
  company_name: "",
  company_logo_url: "",
  location: "",
  job_type: "full_time",
  experience_level: "entry",
  salary_range_min: null as number | null,
  salary_range_max: null as number | null,
  description: "",
  ai_enhanced_description: null as string | null,
  requirements: [] as string[],
  application_type: "link", // Default to link - works without email domain
  application_email: "",
  application_url: "",
  source_url: "",
  source_platform: "other",
  source_image_url: "",
  profession_category_id: null as string | null,
  deadline: "",
  is_active: true,
  is_featured: false,
};

export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState(emptyJob);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");
  const [rawJobPost, setRawJobPost] = useState("");
  const [showParseSection, setShowParseSection] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadJobs();
    loadCategories();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading jobs timed out"
      );

      if (queryError) throw queryError;
      setJobs(data || []);
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load jobs");
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("profession_categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name")
        ).then(q => q),
        TIMEOUTS.CATEGORY_LOAD,
        "Loading categories timed out"
      );

      if (queryError) throw queryError;
      setCategories(data || []);
    } catch (err: any) {
      console.error("Error loading categories:", err);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && job.is_active) ||
      (statusFilter === "inactive" && !job.is_active) ||
      (statusFilter === "featured" && job.is_featured);
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        company_name: job.company_name,
        company_logo_url: job.company_logo_url || "",
        location: job.location || "",
        job_type: job.job_type,
        experience_level: job.experience_level,
        salary_range_min: job.salary_range_min,
        salary_range_max: job.salary_range_max,
        description: job.description,
        ai_enhanced_description: job.ai_enhanced_description,
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        application_type: job.application_type,
        application_email: job.application_email || "",
        application_url: job.application_url || "",
        source_url: job.source_url || "",
        source_platform: job.source_platform || "other",
        source_image_url: job.source_image_url || "",
        profession_category_id: job.profession_category_id,
        deadline: job.deadline ? job.deadline.split("T")[0] : "",
        is_active: job.is_active,
        is_featured: job.is_featured,
      });
    } else {
      setEditingJob(null);
      setFormData(emptyJob);
    }
    setRawJobPost("");
    setShowParseSection(false);
    setIsDialogOpen(true);
  };

  const handleParseJobPost = async () => {
    if (!rawJobPost.trim() || rawJobPost.length < 50) {
      toast.error("Please paste a complete job post (minimum 50 characters)");
      return;
    }

    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-job-post', {
        body: { jobPostText: rawJobPost }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to parse job post');

      const parsed = data.parsed;
      
      // Map parsed data to form
      setFormData(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        company_name: parsed.company_name || prev.company_name,
        location: parsed.location || prev.location,
        job_type: parsed.job_type || prev.job_type,
        experience_level: parsed.experience_level || prev.experience_level,
        salary_range_min: parsed.salary_range_min || prev.salary_range_min,
        salary_range_max: parsed.salary_range_max || prev.salary_range_max,
        description: parsed.description || prev.description,
        requirements: parsed.requirements || prev.requirements,
        application_email: parsed.application_email || prev.application_email,
        application_url: parsed.application_url || prev.application_url,
        source_platform: parsed.source_platform || prev.source_platform,
        deadline: parsed.deadline || prev.deadline,
        profession_category_id: data.professionCategoryId || prev.profession_category_id,
      }));

      toast.success("Job post parsed! Review and edit as needed.");
      setShowParseSection(false);
    } catch (error: any) {
      console.error("Error parsing job post:", error);
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-job-description`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            description: formData.description,
            title: formData.title,
            company: formData.company_name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enhance description");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        ai_enhanced_description: data.enhanced_description,
      }));
      toast.success("Description enhanced with AI!");
    } catch (error: any) {
      console.error("Error enhancing description:", error);
      toast.error("Failed to enhance description");
    } finally {
      setEnhancing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `job-images/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, source_image_url: publicUrl }));
      toast.success("Image uploaded!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.company_name.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.application_type === "email" && !formData.application_email?.trim()) {
      toast.error("Please enter an application email");
      return;
    }

    if (formData.application_type === "link" && !formData.application_url?.trim()) {
      toast.error("Please enter an application URL");
      return;
    }

    setSaving(true);
    try {
      const jobData = {
        title: formData.title.trim(),
        company_name: formData.company_name.trim(),
        company_logo_url: formData.company_logo_url?.trim() || null,
        location: formData.location?.trim() || null,
        job_type: formData.job_type as "full_time" | "part_time" | "contract" | "internship" | "freelance" | "remote",
        experience_level: formData.experience_level as "entry" | "mid" | "senior" | "executive",
        salary_range_min: formData.salary_range_min,
        salary_range_max: formData.salary_range_max,
        description: formData.description.trim(),
        ai_enhanced_description: formData.ai_enhanced_description?.trim() || null,
        requirements: formData.requirements,
        application_type: formData.application_type as "email" | "link",
        application_email: formData.application_type === "email" ? formData.application_email?.trim() : null,
        application_url: formData.application_type === "link" ? formData.application_url?.trim() : null,
        source_url: formData.source_url?.trim() || null,
        source_platform: formData.source_platform as "facebook" | "linkedin" | "bdjobs" | "website" | "other",
        source_image_url: formData.source_image_url?.trim() || null,
        profession_category_id: formData.profession_category_id || null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      if (editingJob) {
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("jobs")
            .update(jobData)
            .eq("id", editingJob.id)),
          TIMEOUTS.DEFAULT,
          "Update timed out"
        );
        if (error) throw error;
        toast.success("Job updated successfully");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("jobs").insert(jobData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out"
        );
        if (error) throw error;
        toast.success("Job created successfully");
      }

      setIsDialogOpen(false);
      loadJobs();
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("jobs").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Job deleted successfully");
      loadJobs();
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
    }
  };

  const handleToggleActive = async (job: Job) => {
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase
          .from("jobs")
          .update({ is_active: !job.is_active })
          .eq("id", job.id)),
        TIMEOUTS.DEFAULT,
        "Update timed out"
      );
      if (error) throw error;
      toast.success(job.is_active ? "Job deactivated" : "Job activated");
      loadJobs();
    } catch (error: any) {
      console.error("Error toggling job:", error);
      toast.error(error.message || "Failed to update job");
    }
  };

  const handleDuplicate = (job: Job) => {
    setEditingJob(null);
    setFormData({
      ...emptyJob,
      title: `${job.title} (Copy)`,
      company_name: job.company_name,
      company_logo_url: job.company_logo_url || "",
      location: job.location || "",
      job_type: job.job_type,
      experience_level: job.experience_level,
      salary_range_min: job.salary_range_min,
      salary_range_max: job.salary_range_max,
      description: job.description,
      ai_enhanced_description: job.ai_enhanced_description,
      requirements: Array.isArray(job.requirements) ? [...job.requirements] : [],
      application_type: job.application_type,
      application_email: job.application_email || "",
      application_url: job.application_url || "",
      source_url: job.source_url || "",
      source_platform: job.source_platform || "other",
      source_image_url: job.source_image_url || "",
      profession_category_id: job.profession_category_id,
    });
    setIsDialogOpen(true);
  };

  const activeCount = jobs.filter((j) => j.is_active).length;
  const featuredCount = jobs.filter((j) => j.is_featured).length;

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={8} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load jobs" message={error} onRetry={loadJobs} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg">Jobs Manager ({jobs.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} active • {featuredCount} featured
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs found. Add your first job listing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {job.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                        )}
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {job.company_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.location ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {JOB_TYPES.find((t) => t.value === job.job_type)?.label || job.job_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {SOURCE_PLATFORMS.find((p) => p.value === job.source_platform)?.label || job.source_platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.deadline ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(job.deadline), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(job)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(job)}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(job)}
                          title={job.is_active ? "Deactivate" : "Activate"}
                        >
                          {job.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(job.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* AI Parse Section */}
              {!editingJob && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Parse Job Post with AI
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowParseSection(!showParseSection)}
                    >
                      {showParseSection ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {showParseSection && (
                    <>
                      <Textarea
                        placeholder="Paste the full job post from Facebook, LinkedIn, etc. The AI will extract all fields automatically..."
                        value={rawJobPost}
                        onChange={(e) => setRawJobPost(e.target.value)}
                        rows={6}
                      />
                      <Button
                        onClick={handleParseJobPost}
                        disabled={parsing || rawJobPost.length < 50}
                        className="w-full"
                      >
                        {parsing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Parsing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Parse & Auto-Fill
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Basic Info */}
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
                  <Label htmlFor="logo">Company Logo URL</Label>
                  <Input
                    id="logo"
                    value={formData.company_logo_url}
                    onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Source Image Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Job Post Image (from social media)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.source_image_url}
                    onChange={(e) => setFormData({ ...formData, source_image_url: e.target.value })}
                    placeholder="Paste image URL or upload..."
                    className="flex-1"
                  />
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <Button variant="outline" disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                    </Button>
                  </div>
                </div>
                {formData.source_image_url && (
                  <img 
                    src={formData.source_image_url} 
                    alt="Job post" 
                    className="mt-2 max-h-40 rounded-lg border object-contain"
                  />
                )}
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(v) => setFormData({ ...formData, job_type: v })}
                  >
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
                    onValueChange={(v) => setFormData({ ...formData, experience_level: v })}
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

              {/* Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Salary Min (BDT)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_range_min || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary_range_min: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="e.g., 30000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max">Salary Max (BDT)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_range_max || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary_range_max: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Job Description *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceDescription}
                    disabled={enhancing || !formData.description.trim()}
                  >
                    {enhancing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Enhance with AI
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Paste the raw job description here..."
                  rows={6}
                />
              </div>

              {formData.ai_enhanced_description && (
                <div className="space-y-2">
                  <Label>AI-Enhanced Description</Label>
                  <div className="p-4 bg-muted/50 rounded-lg border text-sm whitespace-pre-wrap">
                    {formData.ai_enhanced_description}
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="space-y-2">
                <Label>Requirements/Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder="Add a requirement..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                  />
                  <Button type="button" onClick={handleAddRequirement} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requirements.map((req: string, i: number) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {req}
                        <button
                          onClick={() => handleRemoveRequirement(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Application Method */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Application Type</Label>
                    <Select
                      value={formData.application_type}
                      onValueChange={(v) => setFormData({ ...formData, application_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">External Link (Recommended)</SelectItem>
                        <SelectItem value="email">Email Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.application_type === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="app_email">Application Email *</Label>
                      <Input
                        id="app_email"
                        type="email"
                        value={formData.application_email}
                        onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
                        placeholder="hr@company.com"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="app_url">Application URL *</Label>
                      <Input
                        id="app_url"
                        value={formData.application_url}
                        onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>
                
                {formData.application_type === "email" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Email applications require manual forwarding by admin until email domain is verified. 
                      Use "External Link" for automatic applicant redirect.
                    </p>
                  </div>
                )}
              </div>

              {/* Source & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Platform</Label>
                  <Select
                    value={formData.source_platform}
                    onValueChange={(v) => setFormData({ ...formData, source_platform: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profession Category</Label>
                  <Select
                    value={formData.profession_category_id || "none"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, profession_category_id: v === "none" ? null : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_url">Source URL (Reference)</Label>
                  <Input
                    id="source_url"
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
