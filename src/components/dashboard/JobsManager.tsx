import { useState, useEffect, useCallback } from "react";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  Loader2,
  Copy,
  Share2,
  Linkedin,
  Facebook,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Wand2,
  CheckCircle2,
  Send,
  Link as LinkIcon,
  Check,
  Building2,
  ImageIcon,
  Calendar,
  Mail,
  ExternalLink,
  Star,
  Brain,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Utility: Copy to Clipboard ---
const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    return true;
  } catch (err) {
    console.error("Copy failed", err);
    return false;
  }
};

// --- Valid job fields for payload sanitization ---
const VALID_JOB_FIELDS = [
  'title', 'company_name', 'company_logo_url', 'location', 'job_type',
  'experience_level', 'salary_range_min', 'salary_range_max', 'description',
  'ai_enhanced_description', 'requirements', 'preferred_skills', 'application_type',
  'application_email', 'application_url', 'source_url', 'source_platform',
  'profession_category_id', 'deadline', 'is_active', 'is_featured',
  'posted_by', 'source_image_url', 'company_id', 'ai_assessment_enabled',
  'assessment_config', 'vacancies'
];

// --- Types ---
type JobType = "full_time" | "part_time" | "contract" | "internship" | "freelance" | "remote";
type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
type SourcePlatform = "facebook" | "linkedin" | "bdjobs" | "website" | "other";

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
  description: string;
  ai_enhanced_description: string | null;
  requirements: string[];
  application_type: ApplicationType;
  application_email: string | null;
  application_url: string | null;
  source_platform: SourcePlatform | null;
  source_image_url: string | null;
  profession_category_id: string | null;
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
interface ShareLog {
  channel: string;
  shared_at: string;
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
  description: "",
  ai_enhanced_description: null as string | null,
  requirements: [] as string[],
  application_type: "link" as ApplicationType,
  application_email: "",
  application_url: "",
  source_platform: "other" as SourcePlatform,
  source_image_url: "",
  profession_category_id: null as string | null,
  deadline: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  is_active: true,
  is_featured: false,
  ai_assessment_enabled: false,
  assessment_config: { questions: 5, voice: false },
  vacancies: 1,
};

// --- 1. NEW SHARE DIALOG COMPONENT ---
const ShareJobDialog = ({ job, isOpen, onClose }: { job: Job | null; isOpen: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("linkedin");
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [customChannel, setCustomChannel] = useState("");

  useEffect(() => {
    if (job && isOpen) loadShareLogs();
  }, [job, isOpen]);

  const loadShareLogs = async () => {
    if (!job) return;
    const { data } = await supabase.from("job_share_logs").select("channel, shared_at").eq("job_id", job.id);
    setShareLogs(data || []);
  };

  const isShared = (channel: string) => shareLogs.some((log) => log.channel === channel);

  const recordShare = async (channel: string) => {
    if (!job) return;
    setShareLogs((prev) => [...prev, { channel, shared_at: new Date().toISOString() }]);

    const { error } = await supabase.from("job_share_logs").insert({
      job_id: job.id,
      channel: channel,
      shared_at: new Date().toISOString(),
    });

    if (error) {
      setShareLogs((prev) => prev.filter((l) => l.channel !== channel)); // Revert if failed
      toast.error("Failed to save progress");
    } else {
      toast.success(`Marked as shared on ${channel}`);
    }
  };

  if (!job) return null;
  // Use public route for external sharing to enable anonymous tracking
  const jobUrl = `${window.location.origin}/jobs/${job.id}`;
  const getShareLink = (source: string) => `${jobUrl}?source=${source}`;

  const copyLink = async (source: string) => {
    await copyToClipboard(getShareLink(source));
    toast.success(`Link for ${source} copied!`);
  };

  const handleSocialShare = (platform: "linkedin" | "facebook" | "whatsapp" | "telegram") => {
    const link = getShareLink(platform);
    recordShare(platform);
    let url = "";
    const caption = `Check out this job: ${job.title} at ${job.company_name}\n${link}`;
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Job: ${job.title}`)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  const templates = {
    english: `🚀 Hiring: ${job.title}\n🏢 ${job.company_name}\n📍 ${job.location}\n\nApply: ${getShareLink(activeTab)}\n\n#hiring #jobsearch`,
    bangla: `📢 চাকরির সুযোগ: ${job.title}\n🏢 ${job.company_name}\n📍 ${job.location}\n\nআবেদন: ${getShareLink(activeTab)}\n\n#bdjobs`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promote: {job.title}</DialogTitle>
          <DialogDescription>Share across channels.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-6 mt-4">
          <div className="w-1/3 border-r pr-6 space-y-4">
            {[
              { id: "linkedin", label: "LinkedIn", icon: Linkedin },
              { id: "facebook", label: "Facebook", icon: Facebook },
              { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
              { id: "telegram", label: "Telegram", icon: Send },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveTab(ch.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${activeTab === ch.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
              >
                <div className="flex items-center gap-3">
                  <ch.icon className="w-4 h-4" /> <span>{ch.label}</span>
                </div>
                {isShared(ch.id) && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t">
              <button
                onClick={() => setActiveTab("custom")}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm ${activeTab === "custom" ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
              >
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-4 h-4" />
                  <span>Custom Link</span>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            {(activeTab === "linkedin" || activeTab === "facebook") && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                  Use this template for best results.
                </div>
                <Textarea
                  value={activeTab === "linkedin" ? templates.english : templates.bangla}
                  readOnly
                  rows={5}
                  className="text-xs bg-muted/30"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(activeTab === "linkedin" ? templates.english : templates.bangla)}
                  className="w-full"
                >
                  <Copy className="w-3 h-3 mr-2" /> Copy Caption
                </Button>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSocialShare(activeTab as any)}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share Direct
                </Button>
              </div>
            )}
            {(activeTab === "whatsapp" || activeTab === "telegram") && (
              <div className="space-y-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleSocialShare(activeTab as any)}
                >
                  Open App
                </Button>
                <div className="flex gap-2">
                  <Input readOnly value={getShareLink(activeTab)} className="bg-muted text-xs" />
                  <Button variant="outline" onClick={() => copyLink(activeTab)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    recordShare(activeTab);
                    toast.success("Marked!");
                  }}
                  disabled={isShared(activeTab)}
                >
                  {isShared(activeTab) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Done
                    </>
                  ) : (
                    "Mark as Done Manually"
                  )}
                </Button>
              </div>
            )}
            {activeTab === "custom" && (
              <div className="space-y-4">
                <Input
                  placeholder="Channel Name (e.g. newsletter)"
                  value={customChannel}
                  onChange={(e) => setCustomChannel(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input readOnly value={getShareLink(customChannel || "custom")} className="bg-muted" />
                  <Button onClick={() => copyLink(customChannel || "custom")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    recordShare(customChannel || "custom");
                    toast.success("Marked!");
                  }}
                >
                  <Check className="w-4 h-4 mr-2" /> Mark as Done
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- 2. RESTORED JOB FORM COMPONENT ---
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
    if (!rawJobPost.trim() || rawJobPost.length < 50) return toast.error("Please paste a complete job post");
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", { body: { jobPostText: rawJobPost } });
      if (error || !data?.success) throw new Error(data?.error || "Failed to parse");
      setFormData((prev: any) => ({ ...prev, ...data.parsed }));
      toast.success("Job parsed! Review details.");
      setShowParseSection(false);
    } catch (error: any) {
      const message = error?.message?.toLowerCase() || "";
      if (message.includes("malformed")) {
        toast.error("AI couldn't parse this format. Please try a cleaner job post or enter manually.");
      } else if (message.includes("quota") || message.includes("402")) {
        toast.error("AI service temporarily unavailable. Please enter job details manually.");
      } else if (message.includes("rate limit") || message.includes("429")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Parse failed. Please try again or enter manually.");
      }
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
    } catch (error) {
      toast.error("Enhance failed");
    } finally {
      setEnhancing(false);
    }
  };

  const uploadToStorage = async (file: File, path: string) => {
    const fileName = `${path}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    // Use job-assets bucket for job-related uploads
    const { error: uploadError } = await supabase.storage.from("job-assets").upload(fileName, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from("job-assets").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadToStorage(file, "company-logos");
      setFormData((prev: any) => ({ ...prev, company_logo_url: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSourceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadToStorage(file, "source-images");
      setFormData((prev: any) => ({ ...prev, source_image_url: url }));
      toast.success("Source image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData((prev: any) => ({ ...prev, requirements: [...prev.requirements, requirementInput.trim()] }));
      setRequirementInput("");
    }
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      toast.error("Job title is required");
      return false;
    }
    if (!formData.company_name?.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (formData.application_type === "email" && !formData.application_email?.trim()) {
      toast.error("Employer email is required for email applications");
      return false;
    }
    if (formData.application_type === "link" && !formData.application_url?.trim()) {
      toast.error("Application URL is required for link applications");
      return false;
    }
    return true;
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
            <>
              <Textarea
                placeholder="Paste job post..."
                value={rawJobPost}
                onChange={(e) => setRawJobPost(e.target.value)}
                rows={6}
              />
              <Button onClick={handleParseJobPost} disabled={parsing} className="w-full">
                {parsing ? <Loader2 className="animate-spin" /> : "Auto-Fill"}
              </Button>
            </>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex gap-2">
            <Input
              value={formData.company_logo_url || ""}
              onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
              className="flex-1"
            />
            <div className="relative">
              <Input type="file" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button variant="outline" disabled={uploadingLogo}>
                {uploadingLogo ? <Loader2 className="animate-spin" /> : "Up"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.job_type} onValueChange={(v) => setFormData({ ...formData, job_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Select
            value={formData.experience_level}
            onValueChange={(v) => setFormData({ ...formData, experience_level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
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
        <div className="space-y-2">
          <Label>Vacancies</Label>
          <Input
            type="number"
            value={formData.vacancies}
            onChange={(e) => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 1 })}
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
      <div className="space-y-2">
        <Label>Requirements</Label>
        <div className="flex gap-2">
          <Input
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRequirement()}
            placeholder="Add a requirement..."
          />
          <Button onClick={handleAddRequirement} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.requirements.map((req: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {req}{" "}
              <button
                onClick={() =>
                  setFormData((prev: any) => ({
                    ...prev,
                    requirements: prev.requirements.filter((_: any, idx: number) => idx !== i),
                  }))
                }
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Source Image Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Source Image (Social Media Screenshot)
        </Label>
        <div className="flex gap-2">
          <Input
            value={formData.source_image_url || ""}
            onChange={(e) => setFormData({ ...formData, source_image_url: e.target.value })}
            placeholder="Paste URL or upload..."
            className="flex-1"
          />
          <div className="relative">
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleSourceImageUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            <Button variant="outline" disabled={uploadingImage}>
              {uploadingImage ? <Loader2 className="animate-spin h-4 w-4" /> : "Upload"}
            </Button>
          </div>
        </div>
        {formData.source_image_url && (
          <img src={formData.source_image_url} alt="Source" className="h-24 rounded border mt-2 object-cover" />
        )}
      </div>

      {/* Application Settings */}
      <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Application Settings
        </Label>
        
        <div className="space-y-2">
          <Label>Application Method *</Label>
          <Select 
            value={formData.application_type || "link"} 
            onValueChange={(v) => setFormData({ ...formData, application_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> External Link (Redirect to URL)
                </span>
              </SelectItem>
              <SelectItem value="email">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email to Employer
                </span>
              </SelectItem>
              <SelectItem value="internal">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Internal Application
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.application_type === "email" && (
          <div className="space-y-2">
            <Label>Employer Email *</Label>
            <Input 
              type="email"
              placeholder="hr@company.com"
              value={formData.application_email || ""}
              onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Applications will need to be manually forwarded to this email.
            </p>
          </div>
        )}

        {formData.application_type === "link" && (
          <div className="space-y-2">
            <Label>Application URL *</Label>
            <Input 
              type="url"
              placeholder="https://careers.company.com/apply"
              value={formData.application_url || ""}
              onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Applicants will be redirected here after applying.
            </p>
          </div>
        )}
      </div>

      {/* Deadline & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Deadline
          </Label>
          <Input 
            type="date"
            value={formData.deadline?.split('T')[0] || ""}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Profession Category</Label>
          <Select 
            value={formData.profession_category_id || "none"} 
            onValueChange={(v) => setFormData({ ...formData, profession_category_id: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Switch 
            checked={formData.is_active ?? true}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <div>
            <Label>Active</Label>
            <p className="text-xs text-muted-foreground">Show in job listings</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Switch 
            checked={formData.is_featured ?? false}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
          />
          <div>
            <Label className="flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </Label>
            <p className="text-xs text-muted-foreground">Highlight in feed</p>
          </div>
        </div>
      </div>

      {/* AI Assessment Section */}
      <div className="space-y-4 p-4 border rounded-lg bg-accent/30">
        <div className="flex items-center gap-3">
          <Switch 
            checked={formData.ai_assessment_enabled ?? false}
            onCheckedChange={(checked) => setFormData({ 
              ...formData, 
              ai_assessment_enabled: checked 
            })}
          />
          <div className="flex-1">
            <Label className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" /> Enable AI Assessment
            </Label>
            <p className="text-xs text-muted-foreground">
              Applicants will take an AI-generated skills assessment
            </p>
          </div>
        </div>

        {formData.ai_assessment_enabled && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t mt-3">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select 
                value={String(formData.assessment_config?.questions || 5)}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  assessment_config: { 
                    ...formData.assessment_config, 
                    questions: parseInt(v) 
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions</SelectItem>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <Switch 
                checked={formData.assessment_config?.voice ?? false}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  assessment_config: { 
                    ...formData.assessment_config, 
                    voice: checked 
                  }
                })}
              />
              <div>
                <Label className="flex items-center gap-1">
                  <Mic className="w-3 h-3" /> Voice Mode
                </Label>
                <p className="text-xs text-muted-foreground">Allow voice answers</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => validateForm() && onSave(formData)} disabled={saving}>
          {saving ? <Loader2 className="animate-spin mr-2" /> : null} Save Job
        </Button>
      </div>
    </div>
  );
};

// --- 3. MAIN MANAGER COMPONENT ---
export function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);

  // Load profession categories
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from("profession_categories")
        .select("id, name")
        .order("name");
      setCategories(data || []);
    };
    loadCategories();
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
      if (statusFilter !== "all")
        query =
          statusFilter === "featured"
            ? query.eq("is_featured", true)
            : query.eq("is_active", statusFilter === "active");
      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Timeout");
      if (result.error) throw result.error;
      setJobs((result.data as unknown as Job[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSaveJob = async (formData: any) => {
    setSaving(true);
    try {
      // Basic company linking logic
      let companyId = null;
      if (formData.company_name) {
        const { data: co } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", formData.company_name)
          .maybeSingle();
        if (co) companyId = co.id;
        else {
          const { data: newCo, error: coError } = await supabase
            .from("companies")
            .insert({ name: formData.company_name })
            .select()
            .single();
          if (coError) console.warn("Company creation failed:", coError);
          if (newCo) companyId = newCo.id;
        }
      }
      // Sanitize payload to only include valid job fields
      const payload = Object.fromEntries(
        Object.entries({ ...formData, company_id: companyId })
          .filter(([key]) => VALID_JOB_FIELDS.includes(key))
      ) as Record<string, unknown>;
      
      console.log("Saving job payload:", payload);
      
      let error;
      if (editingJob) {
        const result = await supabase.from("jobs").update(payload as any).eq("id", editingJob.id);
        error = result.error;
      } else {
        const result = await supabase.from("jobs").insert(payload as any).select().single();
        error = result.error;
      }
      
      if (error) {
        console.error("Job save error:", error);
        if (error.message?.includes("null value")) {
          toast.error("Please fill all required fields (title, company, description)");
        } else if (error.message?.includes("row-level security")) {
          toast.error("Permission denied. Please contact admin.");
        } else {
          toast.error(`Save failed: ${error.message}`);
        }
        return;
      }
      
      toast.success("Job saved successfully!");
      setIsDialogOpen(false);
      setEditingJob(null);
      loadJobs();
    } catch (err: any) {
      console.error("Unexpected error saving job:", err);
      toast.error(`Unexpected error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    toast.success("Deleted");
    loadJobs();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Jobs Manager</CardTitle>
              <p className="text-sm text-muted-foreground">{totalCount} jobs</p>
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
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                className="pl-9"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : error ? (
            <DashboardErrorState title="Error" message={error} onRetry={loadJobs} />
          ) : (
            <div className="rounded-md border">
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
                          <div className="font-medium">{job.title}</div>
                          <div className="text-xs text-muted-foreground">{job.company_name}</div>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setShareJob(job);
                              setIsShareOpen(true);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-red-50"
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
          {Math.ceil(totalCount / ITEMS_PER_PAGE) > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <ShareJobDialog job={shareJob} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
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
    </>
  );
}
