import { useState, useEffect } from "react";
import { uploadJobAsset } from "@/domains/jobs/repo/jobsRepo";
import { enhanceJobDescription } from "@/domains/jobs/api/jobsApi";
import { getJobById, insertJob, updateJob } from "@/domains/jobs/repo/jobsRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
 DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Upload, X, ShieldCheck, Zap, Globe, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Job Infrastructure Provisioner (V2.1.26)
 * CTO Reference: Authoritative form for job registry management.
 * Optimized with async/await lifecycle logic for high-intensity data hydration.
 */

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
const APPLICATION_TYPES = ["internal", "email", "link"] as const;
const SOURCE_PLATFORMS = ["linkedin", "facebook", "indeed", "company_website", "other"] as const;
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "AED", "SAR", "INR", "SGD"];

export type JobFormState = {
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

export const EMPTY_JOB_FORM: JobFormState = {
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

interface JobFormDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 jobId?: string | null;
 initialForm?: Partial<JobFormState>;
 onSaved?: () => void;
}

export function JobFormDialog({ open, onOpenChange, jobId, initialForm, onSaved }: JobFormDialogProps) {
 const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);
 const [loading, setLoading] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [isEnhancing, setIsEnhancing] = useState(false);
 const [isUploadingLogo, setIsUploadingLogo] = useState(false);

 const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
 setForm((f) => ({ ...f, [key]: value }));

 // PROTOCOL: Optimized Node Loading
 useEffect(() => {
 if (!open) return;

 const loadJobNode = async () => {
 if (!jobId) {
 setForm({ ...EMPTY_JOB_FORM, ...(initialForm || {}) });
 return;
 }

 setLoading(true);
 try {
 let data: any = null;
 try {
 data = await getJobById(jobId);
 } catch {
 toast.error("Save failed: Record not found.");
 return;
 }
 if (!data) {
 toast.error("Save failed: Record not found.");
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
 } catch (err) {
 console.error("Infrastructure Sync Fault:", err);
 } finally {
 setLoading(false);
 }
 };

 loadJobNode();
 }, [open, jobId, initialForm]);

 const handleLogoUpload = async (file: File) => {
 setIsUploadingLogo(true);
 const toastId = toast.loading("Deploying institutional artifact...");
 try {
 const fileName = `job-logos/${Date.now()}-${file.name}`;
 const { publicUrl } = await uploadJobAsset(fileName, file);
 updateField("company_logo_url", publicUrl);
 toast.success("Artifact Secured", { id: toastId });
 } catch (err: any) {
 toast.error("Upload Fault: " + err.message, { id: toastId });
 } finally {
 setIsUploadingLogo(false);
 }
 };

 const handleEnhanceDescription = async () => {
 if (form.description.length < 30) {
 toast.error("Error: Min 30 characters required.");
 return;
 }
 setIsEnhancing(true);
 const toastId = toast.loading("Initializing neural optimization...");
 try {
 const data = await enhanceJobDescription({
 title: form.title,
 company: form.company_name,
 description: form.description,
 });
 const enhanced = data?.enhanced || data?.description;
 if (enhanced) {
 updateField("description", enhanced);
 toast.success("Description Optimized", { id: toastId });
 }
 } catch (err: any) {
 toast.error("Neural Fault: " + err.message, { id: toastId });
 } finally {
 setIsEnhancing(false);
 }
 };

 const handleSave = async () => {
 if (!form.title.trim() || !form.company_name.trim() || !form.description.trim()) {
 toast.error("Validation Fault: Mandatory fields missing.");
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

 if (jobId) {
 await updateJob(jobId, payload);
 } else {
 await insertJob(payload);
 }
 toast.success(jobId ? "Infrastructure Updated" : "Deployment Successful");
 onOpenChange(false);
 onSaved?.();
 } catch (err: any) {
 toast.error("Save failed: " + err.message);
 } finally {
 setIsSaving(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-4 border-border/40 bg-background/95 shadow-sm rounded-2xl">
 <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

 <DialogHeader className="p-8 pb-4 text-left">
 <div className="flex justify-between items-center">
 <div className="space-y-1">
 <DialogTitle className="text-3xl font-semibold font-medium flex items-center gap-3">
 <Briefcase className="h-8 w-8 text-primary" />
 {jobId ? "Recalibrate Infrastructure" : "Deploy Job Node"}
 </DialogTitle>
 <DialogDescription className="text-sm font-medium text-muted-foreground italic">
 Strategic marketplace placement and AI content drafting
 </DialogDescription>
 </div>
 <Badge variant="outline" className="font-semibold text-[9px] border uppercase italic px-3 py-1">
 {jobId ? "NODE_EDIT_MODE" : "NODE_PROVISIONING"}
 </Badge>
 </div>
 </DialogHeader>

 <div className="flex-1 overflow-y-auto p-8 pt-0">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-12 w-12 animate-spin text-primary" />
 <p className="text-[10px] font-semibold animate-pulse">
 Ingesting Registry Data...
 </p>
 </div>
 ) : (
 <div className="space-y-10 py-4 text-left">
 {/* SECTION: CORE IDENTITY */}
 <section className="space-y-6">
 <div className="flex items-center gap-2 mb-4 border-b border-border/10 pb-2">
 <ShieldCheck className="h-4 w-4 text-primary" />
 <h4 className="text-[11px] font-semibold">Core Identity</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2 md:col-span-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Job Architecture Title *
 </Label>
 <Input
 value={form.title}
 onChange={(e) => updateField("title", e.target.value)}
 placeholder="E.G. LEAD FRONTEND ENGINEER"
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Institutional Name *
 </Label>
 <Input
 value={form.company_name}
 onChange={(e) => updateField("company_name", e.target.value)}
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Geographical Node
 </Label>
 <Input
 value={form.location}
 onChange={(e) => updateField("location", e.target.value)}
 placeholder="DHAKA, BANGLADESH"
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Institutional Artifact (Logo)
 </Label>
 <div className="flex items-center gap-4 p-4 rounded-2xl border bg-muted/5 border-dashed">
 {form.company_logo_url ? (
 <div className="relative shrink-0">
 <img
 src={form.company_logo_url}
 alt="Logo"
 className="h-16 w-16 rounded-2xl object-cover border shadow-sm"
 />
 <button
 onClick={() => updateField("company_logo_url", "")}
 className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-lg"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 ) : (
 <label className="h-16 w-16 border border-dashed border-primary/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-primary/5 shrink-0 transition-all">
 {isUploadingLogo ? (
 <Loader2 className="h-6 w-6 animate-spin text-primary" />
 ) : (
 <Upload className="h-6 w-6 text-muted-foreground" />
 )}
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
 />
 </label>
 )}
 <Input
 value={form.company_logo_url}
 onChange={(e) => updateField("company_logo_url", e.target.value)}
 placeholder="OR PASTE URL..."
 className="flex-1 h-12 rounded-xl border font-mono text-[10px]"
 />
 </div>
 </div>
 </section>

 {/* SECTION: SPECIFICATIONS */}
 <section className="space-y-6">
 <div className="flex items-center gap-2 mb-4 border-b border-border/10 pb-2">
 <Zap className="h-4 w-4 text-primary" />
 <h4 className="text-[11px] font-semibold">Technical Specs</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <SelectNode
 label="Engagement Type"
 value={form.job_type}
 options={JOB_TYPES}
 onChange={(v) => updateField("job_type", v as any)}
 />
 <SelectNode
 label="Authority Level"
 value={form.experience_level}
 options={EXPERIENCE_LEVELS}
 onChange={(v) => updateField("experience_level", v as any)}
 />
 <SelectNode
 label="Source Logic"
 value={form.source_platform}
 options={SOURCE_PLATFORMS}
 onChange={(v) => updateField("source_platform", v as any)}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Yield Floor (Min)
 </Label>
 <Input
 type="number"
 value={form.salary_range_min}
 onChange={(e) => updateField("salary_range_min", e.target.value)}
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Yield Ceiling (Max)
 </Label>
 <Input
 type="number"
 value={form.salary_range_max}
 onChange={(e) => updateField("salary_range_max", e.target.value)}
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">Currency Node</Label>
 <Select value={form.salary_currency} onValueChange={(v) => updateField("salary_currency", v)}>
 <SelectTrigger className="h-10 rounded-xl border font-bold">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl border">
 {CURRENCIES.map((c) => (
 <SelectItem key={c} value={c} className="font-bold">
 {c}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 </section>

 {/* SECTION: CORE PAYLOAD */}
 <section className="space-y-4">
 <div className="flex items-center justify-between px-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic">Narrative Payload *</Label>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={handleEnhanceDescription}
 disabled={isEnhancing}
 className="h-8 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 font-semibold text-[9px] uppercase italic tracking-widest gap-2"
 >
 {isEnhancing ? (
 <Loader2 className="h-3 w-3 animate-spin" />
 ) : (
 <Sparkles className="h-3 w-3 fill-primary/20" />
 )}
 Neural Optimization
 </Button>
 </div>
 <Textarea
 value={form.description}
 onChange={(e) => updateField("description", e.target.value)}
 rows={10}
 placeholder="INPUT ROLE RESPONSIBILITIES..."
 className="rounded-2xl border font-medium italic text-sm leading-relaxed bg-muted/5 p-8 shadow-inner"
 />
 </section>

 {/* SECTION: TRANSMISSION & LIFECYCLE */}
 <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-2xl border border-primary/10 bg-primary/5">
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 How to apply
 </Label>
 <Select
 value={form.application_type}
 onValueChange={(v) => updateField("application_type", v as any)}
 >
 <SelectTrigger className="h-10 rounded-xl border font-bold uppercase text-[10px] bg-background">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl border">
 {APPLICATION_TYPES.map((t) => (
 <SelectItem key={t} value={t} className="font-bold uppercase text-[10px]">
 {t}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 {form.application_type === "email" && (
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 Transmission Email *
 </Label>
 <Input
 type="email"
 value={form.application_email}
 onChange={(e) => updateField("application_email", e.target.value)}
 className="h-10 rounded-xl border font-bold bg-background"
 />
 </div>
 )}
 {form.application_type === "link" && (
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">
 External Redirect URL *
 </Label>
 <Input
 type="url"
 value={form.application_url}
 onChange={(e) => updateField("application_url", e.target.value)}
 className="h-10 rounded-xl border font-bold bg-background"
 />
 </div>
 )}
 </section>

 <section className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">Vacancies</Label>
 <Input
 type="number"
 min="1"
 value={form.vacancies}
 onChange={(e) => updateField("vacancies", e.target.value)}
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">Expiry Deadline</Label>
 <Input
 type="date"
 value={form.deadline}
 onChange={(e) => updateField("deadline", e.target.value)}
 className="h-10 rounded-xl border font-bold"
 />
 </div>
 <div className="md:col-span-2 flex flex-wrap gap-8 pt-4 justify-end">
 <SwitchNode
 label="Active_Node"
 checked={form.is_active}
 onChange={(v) => updateField("is_active", v)}
 />
 <SwitchNode
 label="Featured_Auth"
 checked={form.is_featured}
 onChange={(v) => updateField("is_featured", v)}
 />
 <SwitchNode
 label="AI_Assessment"
 checked={form.ai_assessment_enabled}
 onChange={(v) => updateField("ai_assessment_enabled", v)}
 />
 </div>
 </section>
 </div>
 )}
 </div>

 <DialogFooter className="p-8 bg-muted/10 border-t border-border/10">
 <Button
 variant="ghost"
 onClick={() => onOpenChange(false)}
 disabled={isSaving}
 className="font-semibold uppercase text-xs italic opacity-50"
 >
 Abort Sync
 </Button>
 <Button
 onClick={handleSave}
 disabled={isSaving || loading}
 className="h-16 px-12 rounded-xl font-semibold font-medium text-xl gap-3 shadow-sm transition-all active:scale-95"
 >
 {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6 fill-current" />}
 {jobId ? "Commit Updates" : "Initialize Deployment"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

function SelectNode({ label, value, options, onChange }: any) {
 return (
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">{label}</Label>
 <Select value={value} onValueChange={onChange}>
 <SelectTrigger className="h-10 rounded-xl border font-bold uppercase text-[10px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl border">
 {options.map((o: string) => (
 <SelectItem key={o} value={o} className="font-bold uppercase text-[10px]">
 {o.replace("_", " ")}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 );
}

function SwitchNode({ label, checked, onChange }: any) {
 return (
 <label className="flex items-center gap-3 cursor-pointer group">
 <Switch checked={checked} onCheckedChange={onChange} />
 <span className="text-[10px] font-semibold uppercase italic tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
 {label}
 </span>
 </label>
 );
}
