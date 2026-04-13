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
  Banknote,
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

// --- VALID JOB FIELDS ---
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
  salary_currency: string | null;
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

// --- CONSTANTS ---
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

const SOURCE_PLATFORM_ICONS: Record<string, { icon: any; className: string }> = {
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
  salary_currency: "BDT",
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

// --- SHARE JOB DIALOG COMPONENT ---
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
    if (
      job &&
      isOpen &&
      ["linkedin", "facebook", "whatsapp", "telegram"].includes(activeTab) &&
      !aiCaptions[activeTab]
    ) {
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
      if (data?.caption) setAiCaptions((prev) => ({ ...prev, [channel]: data.caption }));
    } catch (err) {
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
      job_id: job.id,
      channel,
      shared_at: new Date().toISOString(),
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
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(caption)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

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
                setAiCaptions((p) => ({ ...p, [activeTab]: "" }));
                generateCaption(activeTab);
              }}
              disabled={loadingCaption}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loadingCaption ? "animate-spin" : ""}`} /> Regenerate
            </Button>
          </div>
          {loadingCaption && !aiCaptions[activeTab] ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <Textarea
              value={aiCaptions[activeTab] || ""}
              onChange={(e) => setAiCaptions((p) => ({ ...p, [activeTab]: e.target.value }))}
              rows={8}
              className="text-xs whitespace-pre-wrap"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                copyToClipboard(aiCaptions[activeTab] || "");
                toast.success("Copied!");
              }}
              disabled={!aiCaptions[activeTab]}
            >
              <Copy className="w-3 h-3 mr-2" /> Copy text
            </Button>
            <Button size="sm" onClick={() => handleSocialShare(activeTab as any)}>
              <Share2 className="w-3 h-3 mr-2" /> Open {activeTab}
            </Button>
          </div>
        </div>
      )}
      {activeTab === "custom" && (
        <div className="space-y-4">
          <Input
            placeholder="Channel (e.g. newsletter)"
            value={customChannel}
            onChange={(e) => setCustomChannel(e.target.value)}
          />
          <div className="flex gap-2">
            <Input readOnly value={getShareLink(customChannel || "custom")} className="bg-muted text-xs" />
            <Button size="icon" onClick={() => copyLink(customChannel || "custom")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "max-w-full h-[90vh] overflow-y-auto" : "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle>Promote: {job.title}</DialogTitle>
        </DialogHeader>
        <div className={isMobile ? "space-y-4" : "flex gap-6 mt-4"}>
          <div className={isMobile ? "flex gap-2 overflow-x-auto pb-2" : "w-1/3 border-r pr-4 space-y-2"}>
            {channels.map((ch) => (
              <Button
                key={ch.id}
                variant={activeTab === ch.id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab(ch.id)}
              >
                <ch.icon className="w-4 h-4" /> <span>{ch.label}</span>
                {isShared(ch.id) && <CheckCircle2 className="ml-auto w-3 h-3 text-green-500" />}
              </Button>
            ))}
            <Button
              variant={activeTab === "custom" ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("custom")}
            >
              <LinkIcon className="w-4 h-4" /> <span>Custom Link</span>
            </Button>
          </div>
          <div className="flex-1">{captionContent}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [requirementInput, setRequirementInput] = useState("");

  const handleParseJobPost = async () => {
    if (!rawJobPost.trim() || rawJobPost.length < 50) return toast.error("Paste full post");
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", { body: { jobPostText: rawJobPost } });
      if (error || !data?.success) throw new Error("Parse failed");
      setFormData((prev: any) => ({ ...prev, ...data.parsed }));
      toast.success("AI extraction complete!");
      setShowParseSection(false);
    } catch {
      toast.error("AI Parse failed.");
    } finally {
      setParsing(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!formData.description) return toast.error("Description required");
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: { description: formData.description, title: formData.title, company: formData.company_name },
      });
      if (error) throw error;
      setFormData((p: any) => ({ ...p, ai_enhanced_description: data.enhanced_description }));
      toast.success("Description enhanced!");
    } catch {
      toast.error("Enhance failed.");
    } finally {
      setEnhancing(false);
    }
  };

  const uploadToStorage = async (file: File, path: string) => {
    const fileName = `${path}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const { error } = await supabase.storage.from("job-assets").upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from("job-assets").getPublicUrl(fileName).data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadToStorage(file, "company-logos");
      setFormData((p: any) => ({ ...p, company_logo_url: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
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
      setFormData((p: any) => ({ ...p, source_image_url: url }));
      toast.success("Screenshot saved");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.title?.trim() || !formData.company_name?.trim()) {
      toast.error("Job title and Company name are mandatory.");
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
              <Wand2 className="w-4 h-4 text-primary" /> Auto-Fill with AI
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setShowParseSection(!showParseSection)}>
              {showParseSection ? "Close" : "Open Parser"}
            </Button>
          </div>
          {showParseSection && (
            <div className="space-y-2">
              <Textarea
                placeholder="Paste raw job description..."
                value={rawJobPost}
                onChange={(e) => setRawJobPost(e.target.value)}
                rows={4}
              />
              <Button onClick={handleParseJobPost} disabled={parsing} className="w-full">
                {parsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />} Process
                Text
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Job Title *</Label>
          <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={formData.location}
            placeholder="e.g. Remote"
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
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
              <input type="file" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button variant="outline" size="icon" disabled={uploadingLogo}>
                {uploadingLogo ? <Loader2 className="animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Job Type</Label>
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
          <Label>Experience Level</Label>
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border rounded-lg bg-emerald-50/20">
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
          <Label>Min Range</Label>
          <Input
            type="number"
            value={formData.salary_range_min || ""}
            onChange={(e) => setFormData({ ...formData, salary_range_min: parseInt(e.target.value) || null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Range</Label>
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
            value={formData.vacancies || ""}
            onChange={(e) => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Description</Label>
          <Button variant="outline" size="sm" onClick={handleEnhanceDescription} disabled={enhancing}>
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" /> Enhance with AI
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (requirementInput.trim()) {
                  setFormData((p: any) => ({ ...p, requirements: [...p.requirements, requirementInput.trim()] }));
                  setRequirementInput("");
                }
              }
            }}
            placeholder="Add requirement..."
          />
          <Button
            type="button"
            onClick={() => {
              if (requirementInput.trim()) {
                setFormData((p: any) => ({ ...p, requirements: [...p.requirements, requirementInput.trim()] }));
                setRequirementInput("");
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.requirements?.map((req: string, i: number) => (
            <Badge key={i} variant="secondary" className="px-3 py-1 gap-2">
              {req}
              <button
                type="button"
                onClick={() =>
                  setFormData((p: any) => ({
                    ...p,
                    requirements: p.requirements.filter((_: any, idx: number) => idx !== i),
                  }))
                }
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
        <Label className="font-bold flex items-center gap-2">
          <Send className="w-4 h-4" /> Application Settings
        </Label>
        <div className="space-y-3">
          <Select
            value={formData.application_type}
            onValueChange={(v) => setFormData({ ...formData, application_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">External URL</SelectItem>
              <SelectItem value="email">Direct Email</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
          {formData.application_type === "link" && (
            <Input
              placeholder="https://..."
              value={formData.application_url || ""}
              onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
            />
          )}
          {formData.application_type === "email" && (
            <Input
              placeholder="hr@..."
              type="email"
              value={formData.application_email || ""}
              onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Deadline</Label>
          <Input
            type="date"
            value={formData.deadline?.split("T")[0] || ""}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.profession_category_id || "none"}
            onValueChange={(v) => setFormData({ ...formData, profession_category_id: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6 items-center border-t pt-4">
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
          <Label>Active</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(c) => setFormData({ ...formData, is_featured: c })}
          />
          <Label className="text-amber-600 flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Featured
          </Label>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-purple-50/50 space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.ai_assessment_enabled}
            onCheckedChange={(c) => setFormData({ ...formData, ai_assessment_enabled: c })}
          />
          <Label className="font-bold flex items-center gap-2 text-purple-900">
            <Brain className="w-4 h-4" /> AI Skills Assessment
          </Label>
        </div>
        {formData.ai_assessment_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Questions</Label>
              <Select
                value={String(formData.assessment_config?.questions || 5)}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    assessment_config: { ...formData.assessment_config, questions: parseInt(v) },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={formData.assessment_config?.voice}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, assessment_config: { ...formData.assessment_config, voice: c } })
                }
              />
              <Label>Voice</Label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => validateForm() && onSave(formData)} disabled={saving}>
          {saving && <Loader2 className="animate-spin mr-2" />} Save Job
        </Button>
      </div>
    </div>
  );
};

// --- MAIN MANAGER COMPONENT ---
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

  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("company") || "all");
  const [appTypeFilter, setAppTypeFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [countryCounts, setCountryCounts] = useState<{ name: string; flag: string; count: number }[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [jobShareCounts, setJobShareCounts] = useState<Record<string, number>>({});
  const [jobApplyClicks, setJobApplyClicks] = useState<Record<string, number>>({});

  const [expiringLoading, setExpiringLoading] = useState(false);
  const [isLinkedInImportOpen, setIsLinkedInImportOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      const [{ data: cats }, { data: cos }] = await Promise.all([
        supabase.from("profession_categories").select("id, name").order("name"),
        supabase.from("companies").select("id, name").order("name"),
      ]);
      setCategories(cats || []);
      setCompaniesList(cos || []);
    };
    loadMetadata();
  }, []);

  const fetchAllRows = useCallback(async (baseQuery: () => any) => {
    let allRows: any[] = [];
    let p = 0;
    let hasMore = true;
    while (hasMore) {
      const { data } = await baseQuery().range(p * 1000, (p + 1) * 1000 - 1);
      if (data?.length) {
        allRows = [...allRows, ...data];
        hasMore = data.length === 1000;
        p++;
      } else hasMore = false;
    }
    return allRows;
  }, []);

  useEffect(() => {
    const computeFilters = async () => {
      const rows = await fetchAllRows(() => supabase.from("jobs").select("location, is_active, is_featured"));
      setStatusCounts({
        all: rows.length,
        active: rows.filter((r) => r.is_active).length,
        inactive: rows.filter((r) => !r.is_active).length,
        featured: rows.filter((r) => r.is_featured).length,
      });

      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        const loc = r.location?.toLowerCase() || "";
        COUNTRIES.forEach((c) => {
          if (loc.includes(c.name.toLowerCase())) counts[c.name] = (counts[c.name] || 0) + 1;
        });
      });
      setCountryCounts(
        Object.entries(counts)
          .map(([name, count]) => ({
            name,
            count,
            flag: COUNTRIES.find((c) => c.name === name)?.flag || "🌍",
          }))
          .sort((a, b) => b.count - a.count),
      );
    };
    computeFilters();
  }, [fetchAllRows]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("jobs").select("*", { count: "exact" }).order("created_at", { ascending: false });

      if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
      if (statusFilter !== "all") {
        if (statusFilter === "featured") query = query.eq("is_featured", true);
        else query = query.eq("is_active", statusFilter === "active");
      }
      if (locationFilter !== "all") {
        if (locationFilter === "bangladesh") query = query.ilike("location", "%Bangladesh%");
        else query = query.ilike("location", `%${locationFilter}%`);
      }
      if (companyFilter !== "all") {
        const co = companiesList.find((c) => c.id === companyFilter);
        if (co) query = query.ilike("company_name", `%${co.name}%`);
      }
      // CTO FIX: CASTING filter value to satisfy TypeScript check
      if (appTypeFilter !== "all") query = query.eq("application_type", appTypeFilter as "email" | "link");

      const from = (page - 1) * ITEMS_PER_PAGE;
      const { data, count, error } = await query.range(from, from + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // CTO FIX: Force overlap via conversion to unknown first
      setJobs((data as unknown as Job[]) || []);
      setTotalCount(count || 0);

      if (data?.length) {
        const ids = data.map((j) => (j as any).id);
        const [{ data: shares }, { data: clicks }] = await Promise.all([
          supabase.from("job_share_logs").select("job_id, channel").in("job_id", ids),
          supabase.from("job_apply_clicks").select("job_id").in("job_id", ids),
        ]);
        const sCounts: Record<string, Set<string>> = {};
        shares?.forEach((s) => {
          if (!sCounts[s.job_id]) sCounts[s.job_id] = new Set();
          sCounts[s.job_id].add(s.channel);
        });
        const finalShares: Record<string, number> = {};
        Object.entries(sCounts).forEach(([id, set]) => (finalShares[id] = set.size));
        setJobShareCounts(finalShares);
        const cCounts: Record<string, number> = {};
        clicks?.forEach((c) => (cCounts[c.job_id] = (cCounts[c.job_id] || 0) + 1));
        setJobApplyClicks(cCounts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, locationFilter, companyFilter, appTypeFilter, companiesList]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSaveJob = async (formData: any) => {
    setSaving(true);
    try {
      let companyId = formData.company_id;
      if (!companyId && formData.company_name) {
        const { data: existing } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", formData.company_name)
          .maybeSingle();
        if (existing) companyId = existing.id;
        else {
          const { data: newCo } = await supabase
            .from("companies")
            .insert({ name: formData.company_name })
            .select()
            .single();
          companyId = newCo?.id;
        }
      }

      // CTO FIX: Create typed payload to satisfy Overload
      const payload: any = {};
      VALID_JOB_FIELDS.forEach((field) => {
        if (formData[field] !== undefined) {
          payload[field] = formData[field];
        }
      });
      payload.company_id = companyId;

      const { error } = editingJob
        ? await supabase.from("jobs").update(payload).eq("id", editingJob.id)
        : await supabase.from("jobs").insert([payload]);

      if (error) throw error;
      toast.success("Position saved");
      setIsDialogOpen(false);
      loadJobs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) {
      toast.success("Removed");
      loadJobs();
    }
  };

  const handleDeactivateExpired = async () => {
    setExpiringLoading(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: false })
        .lt("deadline", new Date().toISOString())
        .eq("is_active", true);
      if (error) throw error;
      toast.success("Expired jobs deactivated");
      loadJobs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExpiringLoading(false);
    }
  };

  const renderJobCard = (job: Job) => {
    const shares = jobShareCounts[job.id] || 0;
    const clicks = jobApplyClicks[job.id] || 0;
    return (
      <div
        key={job.id}
        className="p-4 border rounded-xl bg-background space-y-3 shadow-sm hover:border-primary/30 transition-all"
      >
        <div className="flex justify-between items-start">
          <span className="font-bold text-sm truncate max-w-[200px]">{job.title}</span>
          <Badge variant={job.is_active ? "default" : "secondary"}>{job.is_active ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Building2 className="w-3 h-3" /> {job.company_name}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <Badge variant="outline" className="gap-1">
            <MapPin className="w-2 h-2" /> {job.location || "Remote"}
          </Badge>
          <Badge variant="outline" className={shares >= 4 ? "border-green-500 text-green-700 bg-green-50" : ""}>
            {shares}/4 Shared
          </Badge>
          {clicks > 0 && (
            <Badge variant="outline" className="border-blue-500 text-blue-700">
              {clicks} Clicks
            </Badge>
          )}
        </div>
        <div className="flex justify-end gap-1 pt-2 border-t mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
            className="h-8 w-8 text-blue-600"
            onClick={() => {
              setShareJob(job);
              setIsShareOpen(true);
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(job.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl">Jobs Manager</CardTitle>
            <p className="text-xs text-muted-foreground">{totalCount} positions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivateExpired}
              disabled={expiringLoading}
              className="text-destructive"
            >
              <Clock className="w-4 h-4 mr-2" /> Expire Old
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsLinkedInImportOpen(true)}>
              <Linkedin className="w-4 h-4 mr-2" /> Batch Upload
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingJob(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6 bg-muted/20 p-3 rounded-lg border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({statusCounts.all || 0})</SelectItem>
                <SelectItem value="active">Active ({statusCounts.active || 0})</SelectItem>
                <SelectItem value="featured">Featured ({statusCounts.featured || 0})</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-48 h-9 justify-between">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="truncate">{locationFilter === "all" ? "All Locations" : locationFilter}</span>
                  <ChevronRight className="ml-2 w-4 h-4 rotate-90 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandGroup heading="Global">
                      <CommandItem
                        onSelect={() => {
                          setLocationFilter("all");
                          setLocationOpen(false);
                        }}
                      >
                        🌍 Global
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          setLocationFilter("bangladesh");
                          setLocationOpen(false);
                        }}
                      >
                        🇧🇩 Bangladesh
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Countries">
                      {countryCounts.map((c) => (
                        <CommandItem
                          key={c.name}
                          onSelect={() => {
                            setLocationFilter(c.name);
                            setLocationOpen(false);
                          }}
                        >
                          {c.flag} {c.name} ({c.count})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={appTypeFilter} onValueChange={setAppTypeFilter}>
              <SelectTrigger className="w-full sm:w-32 h-9">
                <SelectValue placeholder="Flow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <DashboardTableSkeleton rows={8} columns={isMobile ? 1 : 6} />
          ) : isMobile ? (
            <div className="grid grid-cols-1 gap-4">{jobs.map(renderJobCard)}</div>
          ) : (
            <div className="rounded-xl border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Job Profile</TableHead>
                    <TableHead className="font-bold">Locale</TableHead>
                    <TableHead className="font-bold">Salary</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Marketing</TableHead>
                    <TableHead className="text-right font-bold pr-6">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const sCount = jobShareCounts[job.id] || 0;
                    const cCount = jobApplyClicks[job.id] || 0;
                    return (
                      <TableRow key={job.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-bold text-sm">{job.title}</div>
                          <div className="text-xs text-muted-foreground">{job.company_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" /> {job.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100 inline-block">
                            {job.salary_range_min
                              ? `${job.salary_currency || "BDT"} ${job.salary_range_min.toLocaleString()}`
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={job.is_active ? "default" : "secondary"}
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {job.is_active ? "Active" : "Paused"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={`text-[10px] ${sCount >= 4 ? "bg-green-50" : ""}`}>
                              {sCount}/4
                            </Badge>
                            {cCount > 0 && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50">
                                {cCount} Clicks
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
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
                              className="text-blue-600"
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
                              className="text-destructive"
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
            <div className="flex justify-between items-center mt-6">
              <p className="text-xs text-muted-foreground">
                Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingJob ? "Edit Posting" : "New Listing"}</DialogTitle>
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
