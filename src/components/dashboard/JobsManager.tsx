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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { COUNTRIES } from "@/lib/constants/countries";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Clock,
  MapPin,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { BatchLinkedInJobUpload } from "./BatchLinkedInJobUpload";

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
  "title",
  "company_name",
  "company_logo_url",
  "location",
  "job_type",
  "experience_level",
  "salary_range_min",
  "salary_range_max",
  "description",
  "ai_enhanced_description",
  "requirements",
  "preferred_skills",
  "application_type",
  "application_email",
  "application_url",
  "source_url",
  "source_platform",
  "profession_category_id",
  "deadline",
  "is_active",
  "is_featured",
  "posted_by",
  "source_image_url",
  "company_id",
  "ai_assessment_enabled",
  "assessment_config",
  "vacancies",
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

const SOURCE_PLATFORM_ICONS: Record<string, { icon: typeof Linkedin; className: string }> = {
  linkedin: { icon: Linkedin, className: "text-blue-600" },
  facebook: { icon: Facebook, className: "text-blue-500" },
  website: { icon: ExternalLink, className: "text-muted-foreground" },
  bdjobs: { icon: Building2, className: "text-orange-500" },
  other: { icon: LinkIcon, className: "text-muted-foreground" },
};

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

const ShareJobDialog = ({ job, isOpen, onClose }: { job: Job | null; isOpen: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("linkedin");
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [customChannel, setCustomChannel] = useState("");
  const [aiCaptions, setAiCaptions] = useState<Record<string, string>>({});
  const [loadingCaption, setLoadingCaption] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (job && isOpen) {
      loadShareLogs();
      setAiCaptions({});
    }
  }, [job, isOpen]);

  useEffect(() => {
    if (job && isOpen && ["linkedin", "facebook", "whatsapp", "telegram"].includes(activeTab) && !aiCaptions[activeTab]) {
      generateCaption(activeTab);
    }
  }, [activeTab, job, isOpen]);

  const loadShareLogs = async () => {
    if (!job) return;
    const { data } = await supabase.from("job_share_logs").select("channel, shared_at").eq("job_id", job.id);
    setShareLogs(data || []);
  };

  const isShared = (channel: string) => shareLogs.some((log) => log.channel === channel);

  const generateCaption = async (channel: string) => {
    if (!job) return;
    setLoadingCaption(true);
    try {
      const jobUrl = `${window.location.origin}/jobs/${job.id}?source=${channel}`;
      const { data, error } = await supabase.functions.invoke("generate-job-share-caption", {
        body: {
          title: job.title,
          company: job.company_name,
          location: job.location,
          job_type: job.job_type,
          requirements: job.requirements,
          apply_link: jobUrl,
          channel,
        },
      });
      if (error) throw error;
      if (data?.caption) {
        setAiCaptions((prev) => ({ ...prev, [channel]: data.caption }));
      }
    } catch (err) {
      console.error("Caption generation failed:", err);
      const jobUrl = `${window.location.origin}/jobs/${job.id}?source=${channel}`;
      setAiCaptions((prev) => ({
        ...prev,
        [channel]: `🚀 ${job.title} at ${job.company_name}\n📍 ${job.location}\n\nApply: ${jobUrl}`,
      }));
    } finally {
      setLoadingCaption(false);
    }
  };

  const recordShare = async (channel: string) => {
    if (!job) return;
    setShareLogs((prev) => [...prev, { channel, shared_at: new Date().toISOString() }]);
    const { error } = await supabase.from("job_share_logs").insert({
      job_id: job.id, channel, shared_at: new Date().toISOString(),
    });
    if (error) {
      setShareLogs((prev) => prev.filter((l) => l.channel !== channel));
      toast.error("Failed to save progress");
    } else {
      toast.success(`Marked as shared on ${channel}`);
    }
  };

  if (!job) return null;
  const jobUrl = `${window.location.origin}/jobs/${job.id}`;
  const getShareLink = (source: string) => `${jobUrl}?source=${source}`;

  const copyLink = async (source: string) => {
    await copyToClipboard(getShareLink(source));
    toast.success(`Link for ${source} copied!`);
  };

  const handleSocialShare = (platform: "linkedin" | "facebook" | "whatsapp" | "telegram") => {
    const link = getShareLink(platform);
    recordShare(platform);
    const caption = aiCaptions[platform] || `Check out this job: ${job.title} at ${job.company_name}\n${link}`;
    let url = "";
    switch (platform) {
      case "linkedin": url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`; break;
      case "facebook": url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`; break;
      case "whatsapp": url = `https://wa.me/?text=${encodeURIComponent(caption)}`; break;
      case "telegram": url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(caption)}`; break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  const currentCaption = aiCaptions[activeTab] || "";

  const channels = [
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "telegram", label: "Telegram", icon: Send },
  ];

  const captionContent = (
    <div className="space-y-4">
      {["linkedin", "facebook", "whatsapp", "telegram"].includes(activeTab) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" /> AI Caption
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAiCaptions((prev) => ({ ...prev, [activeTab]: "" }));
                generateCaption(activeTab);
              }}
              disabled={loadingCaption}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loadingCaption ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
          {loadingCaption && !currentCaption ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <Textarea
              value={currentCaption}
              onChange={(e) => setAiCaptions((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              rows={8}
              className="text-xs whitespace-pre-wrap"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { copyToClipboard(currentCaption); toast.success("Caption copied!"); }}
            className="w-full"
            disabled={!currentCaption}
          >
            <Copy className="w-3 h-3 mr-2" /> Copy Caption
          </Button>
          <Button className="w-full" onClick={() => handleSocialShare(activeTab as any)}>
            <Share2 className="w-4 h-4 mr-2" /> Share on {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Button>
          {!isShared(activeTab) && (
            <Button variant="secondary" className="w-full" onClick={() => recordShare(activeTab)}>
              Mark as Done Manually
            </Button>
          )}
        </div>
      )}
      {activeTab === "custom" && (
        <div className="space-y-4">
          <Input placeholder="Channel Name (e.g. newsletter)" value={customChannel} onChange={(e) => setCustomChannel(e.target.value)} />
          <div className="flex gap-2">
            <Input readOnly value={getShareLink(customChannel || "custom")} className="bg-muted" />
            <Button onClick={() => copyLink(customChannel || "custom")}><Copy className="w-4 h-4" /></Button>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => { recordShare(customChannel || "custom"); toast.success("Marked!"); }}>
            <Check className="w-4 h-4 mr-2" /> Mark as Done
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "max-w-full h-[90vh] overflow-y-auto" : "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle className="text-base">Promote: {job.title}</DialogTitle>
          <DialogDescription>Share across channels with AI-generated captions.</DialogDescription>
        </DialogHeader>
        {isMobile ? (
          <div className="space-y-4 mt-2">
            {/* Horizontal scrollable pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveTab(ch.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    activeTab === ch.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <ch.icon className="w-3 h-3" />
                  {ch.label}
                  {isShared(ch.id) && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <LinkIcon className="w-3 h-3" /> Custom
              </button>
            </div>
            {captionContent}
          </div>
        ) : (
          <div className="flex gap-6 mt-4">
            <div className="w-1/3 border-r pr-6 space-y-4">
              {channels.map((ch) => (
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
                    <LinkIcon className="w-4 h-4" /> <span>Custom Link</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex-1">
              {captionContent}
            </div>
          </div>
        )}
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
      toast.error("Parse failed. Please try again or enter manually.");
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
    if (formData.application_type === "link") {
      if (!formData.application_url?.trim()) {
        toast.error("Application URL is required for link applications");
        return false;
      }
      try {
        new URL(formData.application_url);
      } catch {
        toast.error("Please enter a valid URL (must start with http:// or https://)");
        return false;
      }
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

      {/* Basic Info */}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Type & Salary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Description */}
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

      {/* Requirements */}
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

      {/* Source Image */}
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
                  <ExternalLink className="w-4 h-4" /> External Link
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
              className="border-blue-200 focus:border-blue-500"
            />
            <p className="text-xs text-muted-foreground">⚠️ Required for email applications.</p>
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
          </div>
        )}
      </div>

      {/* Deadline & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Deadline
          </Label>
          <Input
            type="date"
            value={formData.deadline?.split("T")[0] || ""}
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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                ai_assessment_enabled: checked,
              })
            }
          />
          <div className="flex-1">
            <Label className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" /> Enable AI Assessment
            </Label>
            <p className="text-xs text-muted-foreground">Applicants will take an AI-generated skills assessment</p>
          </div>
        </div>

        {formData.ai_assessment_enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t mt-3">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select
                value={String(formData.assessment_config?.questions || 5)}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    assessment_config: {
                      ...formData.assessment_config,
                      questions: parseInt(v),
                    },
                  })
                }
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
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    assessment_config: {
                      ...formData.assessment_config,
                      voice: checked,
                    },
                  })
                }
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
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [jobShareCounts, setJobShareCounts] = useState<Record<string, number>>({});
  const [jobApplyClicks, setJobApplyClicks] = useState<Record<string, number>>({});

  const [expiringLoading, setExpiringLoading] = useState(false);
  const [isLinkedInImportOpen, setIsLinkedInImportOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [countryCounts, setCountryCounts] = useState<{ name: string; flag: string; count: number }[]>([]);
  const [filteredCompaniesList, setFilteredCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const COUNTRY_ALIASES: Record<string, string[]> = useMemo(() => ({
    "United Arab Emirates": ["UAE", "United Arab Emirates", "Dubai", "Abu Dhabi"],
    "United Kingdom": ["UK", "United Kingdom", "England", "Scotland", "Wales"],
    "United States": ["USA", "United States", "US"],
  }), []);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase.from("profession_categories").select("id, name").order("name");
      setCategories(data || []);
    };
    const loadCompanies = async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      setCompaniesList(data || []);
    };
    loadCategories();
    loadCompanies();
  }, []);

  // --- Cascading filter helpers ---
  const computeCountryCounts = useCallback((rows: { location: string | null }[]) => {
    const counts: Record<string, number> = {};
    const flagMap: Record<string, string> = {};
    COUNTRIES.forEach((c) => { flagMap[c.name] = c.flag; });
    rows.forEach((row) => {
      const loc = row.location || "";
      COUNTRIES.forEach((country) => {
        const aliases = COUNTRY_ALIASES[country.name] || [country.name];
        if (aliases.some((a) => loc.toLowerCase().includes(a.toLowerCase()))) {
          const key = country.name === "United Kingdom" ? "United Kingdom" : country.name;
          counts[key] = (counts[key] || 0) + 1;
          flagMap[key] = country.flag;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, flag: flagMap[name] || "🌍", count }))
      .sort((a, b) => b.count - a.count);
  }, [COUNTRY_ALIASES]);

  const applyLocationToQuery = useCallback((query: any, locFilter: string) => {
    if (locFilter === "bangladesh") return query.ilike("location", "%Bangladesh%");
    if (locFilter === "remote") return query.ilike("location", "%remote%");
    if (locFilter === "abroad") return query.not("location", "ilike", "%Bangladesh%");
    if (locFilter !== "all") {
      const aliases = COUNTRY_ALIASES[locFilter];
      if (aliases && aliases.length > 1) {
        return query.or(aliases.map((a: string) => `location.ilike.%${a}%`).join(","));
      }
      return query.ilike("location", `%${locFilter}%`);
    }
    return query;
  }, [COUNTRY_ALIASES]);

  // Recompute cascading filter data whenever any filter changes
  useEffect(() => {
    const loadCascadingData = async () => {
      // 1. Country counts: respect status + company (not location)
      let countryQ = supabase.from("jobs").select("location");
      if (statusFilter !== "all") {
        countryQ = statusFilter === "featured" ? countryQ.eq("is_featured", true) : countryQ.eq("is_active", statusFilter === "active");
      }
      if (companyFilter !== "all") {
        const co = companiesList.find((c) => c.id === companyFilter);
        if (co) countryQ = countryQ.ilike("company_name", `%${co.name}%`);
      }

      // 2. Company list: respect status + location (not company)
      let companyQ = supabase.from("jobs").select("company_name");
      if (statusFilter !== "all") {
        companyQ = statusFilter === "featured" ? companyQ.eq("is_featured", true) : companyQ.eq("is_active", statusFilter === "active");
      }
      companyQ = applyLocationToQuery(companyQ, locationFilter);

      // 3. Status counts: respect location + company (not status)
      let statusQ = supabase.from("jobs").select("is_active, is_featured");
      statusQ = applyLocationToQuery(statusQ, locationFilter);
      if (companyFilter !== "all") {
        const co = companiesList.find((c) => c.id === companyFilter);
        if (co) statusQ = statusQ.ilike("company_name", `%${co.name}%`);
      }

      const [countryRes, companyRes, statusRes] = await Promise.all([countryQ, companyQ, statusQ]);

      if (countryRes.data) {
        setCountryCounts(computeCountryCounts(countryRes.data as { location: string | null }[]));
      }

      if (companyRes.data) {
        const uniqueNames = new Set(
          (companyRes.data as { company_name: string }[]).map((r) => r.company_name?.toLowerCase()).filter(Boolean)
        );
        setFilteredCompaniesList(companiesList.filter((c) => uniqueNames.has(c.name.toLowerCase())));
      }

      if (statusRes.data) {
        const rows = statusRes.data as { is_active: boolean; is_featured: boolean }[];
        setStatusCounts({
          all: rows.length,
          active: rows.filter((r) => r.is_active).length,
          inactive: rows.filter((r) => !r.is_active).length,
          featured: rows.filter((r) => r.is_featured).length,
        });
      }
    };
    loadCascadingData();
  }, [statusFilter, locationFilter, companyFilter, companiesList, applyLocationToQuery, computeCountryCounts]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.rpc("auto_deactivate_expired_jobs");

      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
      if (statusFilter !== "all")
        query =
          statusFilter === "featured"
            ? query.eq("is_featured", true)
            : query.eq("is_active", statusFilter === "active");

      if (locationFilter === "bangladesh") {
        query = query.ilike("location", "%Bangladesh%");
      } else if (locationFilter === "remote") {
        query = query.ilike("location", "%remote%");
      } else if (locationFilter === "abroad") {
        query = query.not("location", "ilike", "%Bangladesh%");
      } else if (locationFilter !== "all") {
        const aliases = COUNTRY_ALIASES[locationFilter];
        if (aliases && aliases.length > 1) {
          const orClauses = aliases.map((a) => `location.ilike.%${a}%`).join(",");
          query = query.or(orClauses);
        } else {
          query = query.ilike("location", `%${locationFilter}%`);
        }
      }

      if (companyFilter !== "all") {
        const selectedCompany = companiesList.find((c) => c.id === companyFilter);
        if (selectedCompany) {
          query = query.ilike("company_name", `%${selectedCompany.name}%`);
        }
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Timeout");
      if (result.error) throw result.error;
      const fetchedJobs = (result.data as unknown as Job[]) || [];
      setJobs(fetchedJobs);
      setTotalCount(result.count || 0);

      // Parallelize share + click count fetches
      if (fetchedJobs.length > 0) {
        const jobIds = fetchedJobs.map(j => j.id);
        const [shareResult, clickResult] = await Promise.all([
          supabase.from("job_share_logs").select("job_id, channel").in("job_id", jobIds),
          supabase.from("job_apply_clicks").select("job_id").in("job_id", jobIds),
        ]);

        const counts: Record<string, Set<string>> = {};
        (shareResult.data || []).forEach(log => {
          if (!counts[log.job_id]) counts[log.job_id] = new Set();
          counts[log.job_id].add(log.channel);
        });
        const countsMap: Record<string, number> = {};
        Object.entries(counts).forEach(([id, channels]) => {
          countsMap[id] = channels.size;
        });
        setJobShareCounts(countsMap);

        const clickCounts: Record<string, number> = {};
        (clickResult.data || []).forEach(log => {
          clickCounts[log.job_id] = (clickCounts[log.job_id] || 0) + 1;
        });
        setJobApplyClicks(clickCounts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, locationFilter, companyFilter, companiesList, COUNTRY_ALIASES]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSaveJob = async (formData: any) => {
    setSaving(true);
    try {
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
      const payload = Object.fromEntries(
        Object.entries({ ...formData, company_id: companyId }).filter(([key]) => VALID_JOB_FIELDS.includes(key)),
      ) as Record<string, unknown>;

      let error;
      if (editingJob) {
        const result = await supabase
          .from("jobs")
          .update(payload as any)
          .eq("id", editingJob.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("jobs")
          .insert(payload as any)
          .select()
          .single();
        error = result.error;
      }

      if (error) {
        throw error;
      }

      toast.success("Job saved successfully!");
      setIsDialogOpen(false);
      setEditingJob(null);
      loadJobs();
    } catch (err: any) {
      console.error("Error saving job:", err);
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success("Deleted");
    loadJobs();
  };

  const handleDeactivateExpired = async () => {
    if (!confirm("Are you sure you want to deactivate all jobs where the deadline has passed?")) return;

    setExpiringLoading(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: false })
        .lt("deadline", new Date().toISOString())
        .eq("is_active", true);

      if (error) throw error;

      toast.success("Expired jobs deactivated successfully");
      loadJobs();
    } catch (err: any) {
      console.error("Bulk update failed:", err);
      toast.error("Failed to deactivate jobs: " + err.message);
    } finally {
      setExpiringLoading(false);
    }
  };

  const getSourceIcon = (platform: string | null) => {
    if (!platform) return null;
    const config = SOURCE_PLATFORM_ICONS[platform];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={`w-3 h-3 shrink-0 ${config.className}`} />;
  };

  // Mobile job card renderer
  const renderJobCard = (job: Job) => {
    const shareCount = jobShareCounts[job.id] || 0;
    const applyClickCount = jobApplyClicks[job.id] || 0;
    return (
      <div key={job.id} className="p-3 border rounded-lg space-y-2 bg-background">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {getSourceIcon(job.source_platform)}
              <span className="font-medium text-sm truncate">{job.title}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>
          </div>
          <Badge variant={job.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
            {job.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {job.location}
            </span>
          )}
          <Badge variant="outline" className="text-[10px]">{job.job_type}</Badge>
          {job.deadline && (
            <span className="flex items-center gap-1 ml-auto shrink-0">
              <Calendar className="w-3 h-3" /> {format(new Date(job.deadline), "MMM d")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] ${
                shareCount >= 4
                  ? "border-green-500 text-green-700 bg-green-50"
                  : shareCount > 0
                  ? "border-amber-500 text-amber-700 bg-amber-50"
                  : "text-muted-foreground"
              }`}
            >
              {shareCount}/4
            </Badge>
            {applyClickCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-700 bg-blue-50">
                <ExternalLink className="w-2.5 h-2.5 mr-0.5" />{applyClickCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingJob(job); setIsDialogOpen(true); }}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => { setShareJob(job); setIsShareOpen(true); }}>
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("tab", "applications"); p.set("jobId", job.id); window.location.search = p.toString(); }} title="View Applications">
              <ClipboardList className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(job.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <CardTitle>Jobs Manager</CardTitle>
              <p className="text-sm text-muted-foreground">{totalCount} jobs</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleDeactivateExpired}
                disabled={expiringLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                size={isMobile ? "sm" : "default"}
              >
                {expiringLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Clock className="w-4 h-4 mr-1" />
                )}
                {isMobile ? "Expire" : "Deactivate Expired"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsLinkedInImportOpen(true)} size={isMobile ? "sm" : "default"} className="gap-1">
                  <Linkedin className="w-4 h-4" />
                  {!isMobile && "Import LinkedIn"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingJob(null);
                    setIsDialogOpen(true);
                  }}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Job
                </Button>
              </div>
            </div>
          </div>
          {/* Filters: grid on mobile, flex on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status{statusCounts.all ? ` (${statusCounts.all})` : ""}</SelectItem>
                <SelectItem value="active">Active{statusCounts.active ? ` (${statusCounts.active})` : ""}</SelectItem>
                <SelectItem value="inactive">Inactive{statusCounts.inactive ? ` (${statusCounts.inactive})` : ""}</SelectItem>
                <SelectItem value="featured">Featured{statusCounts.featured ? ` (${statusCounts.featured})` : ""}</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={locationOpen} className="w-full sm:w-[200px] justify-between">
                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {locationFilter === "all"
                      ? "All Locations"
                      : locationFilter === "bangladesh"
                      ? "🇧🇩 Bangladesh"
                      : locationFilter === "remote"
                      ? "🌐 Remote"
                      : locationFilter === "abroad"
                      ? "🌍 All International"
                      : (() => {
                          const c = countryCounts.find((cc) => cc.name === locationFilter);
                          return c ? `${c.flag} ${c.name}` : locationFilter;
                        })()}
                  </span>
                  <ChevronRight className="ml-1 h-3 w-3 shrink-0 opacity-50 rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup heading="Quick Filters">
                      {[
                        { value: "all", label: "All Locations", icon: "📋" },
                        { value: "bangladesh", label: "Bangladesh", icon: "🇧🇩" },
                        { value: "remote", label: "Remote", icon: "🌐" },
                        { value: "abroad", label: "All International", icon: "🌍" },
                      ].map((item) => (
                        <CommandItem
                          key={item.value}
                          value={item.label}
                          onSelect={() => {
                            setLocationFilter(item.value);
                            setPage(1);
                            setLocationOpen(false);
                          }}
                        >
                          <span className="mr-2">{item.icon}</span>
                          {item.label}
                          {locationFilter === item.value && <Check className="ml-auto h-3 w-3" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {countryCounts.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Countries">
                          {countryCounts
                            .filter((c) => c.name !== "Bangladesh")
                            .map((country) => (
                              <CommandItem
                                key={country.name}
                                value={country.name}
                                onSelect={() => {
                                  setLocationFilter(country.name);
                                  setPage(1);
                                  setLocationOpen(false);
                                }}
                              >
                                <span className="mr-2">{country.flag}</span>
                                <span className="flex-1">{country.name}</span>
                                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                                  {country.count}
                                </Badge>
                                {locationFilter === country.name && <Check className="ml-1 h-3 w-3" />}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Select
              value={companyFilter}
              onValueChange={(v) => {
                setCompanyFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] col-span-2 sm:col-span-1">
                <Building2 className="w-3 h-3 mr-1" />
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies{filteredCompaniesList.length > 0 ? ` (${filteredCompaniesList.length})` : ""}</SelectItem>
                {(filteredCompaniesList.length > 0 ? filteredCompaniesList : companiesList).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardTableSkeleton rows={5} columns={isMobile ? 2 : 6} />
          ) : error ? (
            <DashboardErrorState title="Error" message={error} onRetry={loadJobs} />
          ) : isMobile ? (
            /* Mobile: card list */
            <div className="space-y-2">
              {jobs.map(renderJobCard)}
              {jobs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No jobs found</p>
              )}
            </div>
          ) : (
            /* Desktop: table */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shared</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const shareCount = jobShareCounts[job.id] || 0;
                    const applyClickCount = jobApplyClicks[job.id] || 0;
                    return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(job.source_platform)}
                          <div>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-xs text-muted-foreground">{job.company_name}</div>
                          </div>
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            shareCount >= 4
                              ? "border-green-500 text-green-700 bg-green-50"
                              : shareCount > 0
                              ? "border-amber-500 text-amber-700 bg-amber-50"
                              : "text-muted-foreground"
                          }
                        >
                          {shareCount >= 4 && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {shareCount}/4
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {applyClickCount > 0 ? (
                          <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {applyClickCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
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
                            className="text-primary"
                            title="View Applications"
                            onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("tab", "applications"); p.set("jobId", job.id); window.location.search = p.toString(); }}
                          >
                            <ClipboardList className="w-4 h-4" />
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
                    );
                  })}
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
      <BatchLinkedInJobUpload
        isOpen={isLinkedInImportOpen}
        onClose={() => setIsLinkedInImportOpen(false)}
        onComplete={loadJobs}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isMobile ? "max-w-full h-[90vh] overflow-y-auto" : "max-w-3xl max-h-[90vh] overflow-y-auto"}>
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
