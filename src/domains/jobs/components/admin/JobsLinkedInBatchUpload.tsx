import { useState, useRef } from "react";
import { insertJobsBulk, listExistingJobSourceUrls } from "@/domains/jobs/repo/jobsRepo";
import { listCompaniesByNames, insertCompaniesBulk } from "@/domains/companies/repo/companiesRepo";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
 Upload,
 FileJson,
 Loader2,
 CheckCircle2,
 AlertCircle,
 Link as LinkIcon,
 Mail,
 Linkedin as LinkedinIcon,
 Building2,
 ShieldCheck,
 Zap,
 Database,
 ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Job Registry Ingestion Node
 * High-fidelity orchestrator for bulk LinkedIn job artifacts and company mapping.
 * 2026 Standard: Executive Logic geometry with reinforced deduplication telemetry.
 */

// --- Types & Schema ---
interface LinkedInJob {
 title?: string;
 linkedinUrl?: string;
 descriptionText?: string;
 descriptionHtml?: string;
 employmentType?: string;
 experienceLevel?: string;
 workRemoteAllowed?: boolean;
 expireAt?: string;
 location?: { parsed?: { text?: string }; linkedinText?: string };
 company?: {
 name?: string;
 logo?: string;
 website?: string;
 linkedinUrl?: string;
 description?: string;
 industries?: { name?: string }[];
 locations?: { country?: string; city?: string; line1?: string }[];
 };
 applyMethod?: { type?: string; companyApplyUrl?: string };
 salary?: { min?: number; max?: number };
}

interface MappedJob {
 title: string;
 company_name: string;
 company_logo_url: string | null;
 company_id: string | null;
 location: string | null;
 job_type: string;
 experience_level: string;
 description: string;
 ai_enhanced_description: string | null;
 application_type: "link" | "email";
 application_email: string | null;
 application_url: string | null;
 source_url: string | null;
 source_platform: "linkedin";
 deadline: string | null;
 salary_range_min: number | null;
 salary_range_max: number | null;
 is_active: boolean;
}

type ApplyVia = "direct" | "email" | "linkedin";

interface CompanyData {
 name: string;
 website: string | null;
 linkedin_url: string | null;
 logo_url: string | null;
 industry: string | null;
 address: string | null;
 notes: string | null;
}

// --- Logic Mappers ---
function mapEmploymentType(type?: string, isRemote?: boolean): string {
 if (isRemote) return "remote";
 const map: Record<string, string> = {
 full_time: "full_time",
 part_time: "part_time",
 contract: "contract",
 internship: "internship",
 freelance: "freelance",
 };
 return map[type || ""] || "full_time";
}

function mapExperienceLevel(level?: string): string {
 if (!level) return "mid";
 const l = level.toLowerCase();
 if (l.includes("entry") || l.includes("associate") || l.includes("internship")) return "entry";
 if (l.includes("mid-senior") || l.includes("senior")) return "senior";
 if (l.includes("director") || l.includes("executive")) return "executive";
 return "mid";
}

function resolveApplicationMethod(job: LinkedInJob): {
 application_type: "link" | "email";
 application_email: string | null;
 application_url: string | null;
 applyVia: ApplyVia;
} {
 const emailMatch = job.descriptionText?.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
 const hasDirectUrl = job.applyMethod?.type === "OffsiteApply" && job.applyMethod?.companyApplyUrl;

 if (emailMatch)
 return {
 application_type: "email",
 application_email: emailMatch[0],
 application_url: hasDirectUrl ? job.applyMethod!.companyApplyUrl! : job.linkedinUrl || null,
 applyVia: "email",
 };
 if (hasDirectUrl)
 return {
 application_type: "link",
 application_url: job.applyMethod!.companyApplyUrl!,
 application_email: null,
 applyVia: "direct",
 };
 return {
 application_type: "link",
 application_url: job.linkedinUrl || null,
 application_email: null,
 applyVia: "linkedin",
 };
}

async function resolveCompanies(
 jobs: LinkedInJob[],
): Promise<{ nameToId: Map<string, string>; created: number; enriched: number }> {
 const uniqueCompanies = new Map<string, CompanyData>();
 jobs.forEach((job) => {
 const name = job.company?.name;
 if (!name) return;
 const loc = job.company?.locations?.[0];
 const address = loc ? [loc.line1, loc.city, loc.country].filter(Boolean).join(", ") : null;
 uniqueCompanies.set(name.toLowerCase(), {
 name,
 website: job.company?.website || null,
 linkedin_url: job.company?.linkedinUrl || null,
 logo_url: job.company?.logo || null,
 industry: job.company?.industries?.[0]?.name || null,
 address,
 notes: job.company?.description?.slice(0, 500) || null,
 });
 });

 const existing = await listCompaniesByNames(
   [...uniqueCompanies.values()].map((c) => c.name),
 );
 const nameToId = new Map<string, string>();
 const toCreate: CompanyData[] = [];

 for (const [key, company] of uniqueCompanies) {
 const match = existing?.find((e) => e.name.toLowerCase() === key);
 if (match) {
 nameToId.set(key, match.id);
 } else {
 toCreate.push(company);
 }
 }

 let createdCount = 0;
 if (toCreate.length > 0) {
 const created = await insertCompaniesBulk(toCreate as any);
 created?.forEach((c) => nameToId.set(c.name.toLowerCase(), c.id));
 createdCount = created?.length || 0;
 }


 return { nameToId, created: createdCount, enriched: 0 };
}

// --- Main Component ---
export function JobsLinkedInBatchUpload({
 isOpen,
 onClose,
 onComplete,
}: {
 isOpen: boolean;
 onClose: () => void;
 onComplete: () => void;
}) {
 const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
 const [isProcessingFile, setIsProcessingFile] = useState(false);
 const [rawJobs, setRawJobs] = useState<LinkedInJob[]>([]);
 const [mappedJobs, setMappedJobs] = useState<(MappedJob & { applyVia: ApplyVia })[]>([]);
 const [newJobs, setNewJobs] = useState<(MappedJob & { applyVia: ApplyVia })[]>([]);
 const [duplicateCount, setDuplicateCount] = useState(0);
 const [progress, setProgress] = useState(0);
 const [importPhase, setImportPhase] = useState<"companies" | "jobs">("companies");
 const [stats, setStats] = useState({ created: 0, skipped: 0, errors: [] as string[], companiesCreated: 0 });
 const fileRef = useRef<HTMLInputElement>(null);

 const reset = () => {
 setStep("upload");
 setIsProcessingFile(false);
 setRawJobs([]);
 setMappedJobs([]);
 setNewJobs([]);
 setDuplicateCount(0);
 setProgress(0);
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsProcessingFile(true);
 try {
 const text = await file.text();
 const arr: LinkedInJob[] = JSON.parse(text);
 setRawJobs(arr);
 const mapped = arr.map((j) => {
 const appMethod = resolveApplicationMethod(j);
 return {
 title: j.title || "Untitled",
 company_name: j.company?.name || "Unknown",
 company_logo_url: j.company?.logo || null,
 company_id: null,
 location: j.location?.parsed?.text || j.location?.linkedinText || null,
 job_type: mapEmploymentType(j.employmentType, j.workRemoteAllowed),
 experience_level: mapExperienceLevel(j.experienceLevel),
 description: j.descriptionText || "",
 ai_enhanced_description: j.descriptionHtml || null,
 application_type: appMethod.application_type,
 application_email: appMethod.application_email,
 application_url: appMethod.application_url,
 source_url: j.linkedinUrl || null,
 source_platform: "linkedin" as const,
 deadline: j.expireAt || null,
 salary_range_min: j.salary?.min || null,
 salary_range_max: j.salary?.max || null,
 is_active: true,
 applyVia: appMethod.applyVia,
 };
 });
 setMappedJobs(mapped);

 const { data: existing } = await supabase
 .from("jobs")
 .select("source_url")
 .in("source_url", mapped.map((j) => j.source_url).filter(Boolean));
 const existingUrls = new Set(existing?.map((j) => j.source_url));
 const fresh = mapped.filter((j) => !existingUrls.has(j.source_url));

 setNewJobs(fresh);
 setDuplicateCount(mapped.length - fresh.length);
 setStep("preview");
 toast.success("Payload Synthesis Complete");
 } catch (err) {
 toast.error("Invalid JSON");
 } finally {
 setIsProcessingFile(false);
 }
 };

 const handleImportSequence = async () => {
 setStep("importing");
 setImportPhase("companies");
 const { nameToId, created: companiesCreated } = await resolveCompanies(rawJobs);

 setImportPhase("jobs");
 const jobsToInsert = newJobs.map(({ applyVia, ...job }) => ({
 ...job,
 company_id: nameToId.get(job.company_name.toLowerCase()) || null,
 }));

 const batchSize = 10;
 let created = 0;
 const errors: string[] = [];

 for (let i = 0; i < jobsToInsert.length; i += batchSize) {
 const chunk = jobsToInsert.slice(i, i + batchSize);
 try {
 await insertJobsBulk(chunk as any);
 created += chunk.length;
 } catch (e: any) {
 errors.push(e?.message ?? String(e));
 }
 setProgress(Math.round(((i + chunk.length) / jobsToInsert.length) * 100));
 }

 setStats({ created, skipped: duplicateCount, errors, companiesCreated });
 setStep("results");
 onComplete();
 };

 return (
 <Dialog
 open={isOpen}
 onOpenChange={(open) => {
 if (!open) {
 reset();
 onClose();
 }
 }}
 >
 <DialogContent className="max-w-5xl h-[85vh] max-h-[85vh] rounded-2xl border-4 border-border/40 bg-background/95 p-0 overflow-hidden shadow-sm flex flex-col">
 <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary shrink-0" />

 <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
 <DialogHeader className="px-10 pt-8 pb-6 shrink-0">
 <div className="flex items-center gap-5">
 <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
 <LinkedinIcon className="h-8 w-8 text-primary" />
 </div>
 <div className="space-y-1">
 <DialogTitle className="text-3xl font-semibold uppercase tracking-tight italic">
 Registry Ingestion
 </DialogTitle>
 <DialogDescription className="text-sm font-medium text-muted-foreground/60 italic">
 LinkedIn bulk upload
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <ScrollArea className="flex-1 min-h-0 px-10">
 {step === "upload" && (
 <div className="flex flex-col items-center justify-center py-20 gap-8 animate-in fade-in zoom-in-95">
 {isProcessingFile ? (
 <div className="space-y-4 text-center">
 <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto stroke-[1.5px]" />
 <p className="text-[11px] font-semibold text-primary animate-pulse">
 Checking Deduplication Logic...
 </p>
 </div>
 ) : (
 <>
 <div
 className="group relative border-4 border-dashed rounded-2xl p-20 text-center transition-all hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
 onClick={() => fileRef.current?.click()}
 >
 <div className="h-20 w-20 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-6 border border-border/60 group-hover:rotate-6 transition-transform">
 <FileJson className="h-10 w-10 text-muted-foreground" />
 </div>
 <p className="text-xl font-semibold uppercase tracking-tight italic">Select LinkedIn Payload</p>
 <p className="text-sm font-medium text-muted-foreground mt-2">
 Supports .JSON Log Formats
 </p>
 <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
 </div>
 <Card className="rounded-2xl border bg-muted/5 max-w-sm border-none shadow-none">
 <CardContent className="p-4 flex items-center gap-4">
 <ShieldCheck className="h-8 w-8 text-primary/40 shrink-0" />
 <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic">
 Recursive deduplication active. Artifacts with matching source URLs will be purged from
 injection.
 </p>
 </CardContent>
 </Card>
 </>
 )}
 </div>
 )}

 {step === "preview" && (
 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="rounded-2xl border bg-card p-6 shadow-sm">
 <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 tracking-widest mb-2 italic">
 Total Artifacts
 </p>
 <p className="text-3xl font-semibold tracking-tight leading-none">{mappedJobs.length}</p>
 </Card>
 <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm">
 <p className="text-[9px] font-semibold uppercase text-emerald-600 tracking-widest mb-2 italic">
 Ready for Injection
 </p>
 <p className="text-3xl font-semibold tracking-tight leading-none text-emerald-600">
 {newJobs.length}
 </p>
 </Card>
 <Card className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
 <p className="text-[9px] font-semibold uppercase text-amber-600 tracking-widest mb-2 italic">
 Duplicate Nodes Purged
 </p>
 <p className="text-3xl font-semibold tracking-tight leading-none text-amber-600">
 {duplicateCount}
 </p>
 </Card>
 </div>

 <div className="rounded-2xl border border-border/40 overflow-hidden bg-background">
 <Table>
 <TableHeader className="bg-muted/50">
 <TableRow>
 <TableHead className="text-[9px] font-semibold px-6">
 Role Artifact
 </TableHead>
 <TableHead className="text-[9px] font-semibold">Entity Node</TableHead>
 <TableHead className="text-[9px] font-semibold">Logic Path</TableHead>
 <TableHead className="text-[9px] font-semibold">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {mappedJobs.slice(0, 50).map((job, i) => {
 const isDupe = !newJobs.find((nj) => nj.source_url === job.source_url);
 return (
 <TableRow
 key={i}
 className={cn(
 "group transition-colors",
 isDupe ? "opacity-30 bg-muted/10" : "hover:bg-primary/[0.02]",
 )}
 >
 <TableCell className="px-6 py-4 font-semibold uppercase tracking-tight text-xs italic">
 {job.title}
 </TableCell>
 <TableCell className="text-[11px] font-medium text-muted-foreground">
 {job.company_name}
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className="text-[8px] font-semibold border"
 >
 {job.applyVia}
 </Badge>
 </TableCell>
 <TableCell>
 <Badge
 className={cn(
 "rounded-lg font-black text-[8px] border-none px-3 py-1",
 isDupe ? "bg-amber-500 text-white" : "bg-emerald-500 text-white",
 )}
 >
 {isDupe ? "PURGED" : "VALID"}
 </Badge>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 </div>
 )}

 {step === "importing" && (
 <div className="py-20 flex flex-col items-center gap-10">
 <div className="relative">
 <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
 <Loader2 className="h-24 w-24 animate-spin text-primary relative z-10 stroke-[1px]" />
 </div>
 <div className="space-y-6 text-center w-full max-w-md">
 <div className="space-y-2">
 <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary italic">
 Injesting Logic Artifacts
 </p>
 <h3 className="text-2xl font-semibold uppercase tracking-tight italic">
 Phase: {importPhase.toUpperCase()}
 </h3>
 </div>
 <Progress value={progress} className="h-3 rounded-full bg-primary/10" />
 <p className="font-mono text-[10px] text-muted-foreground opacity-60">
 SYNC_STATUS: {progress}% COMMITTED
 </p>
 </div>
 </div>
 )}

 {step === "results" && (
 <div className="py-8 space-y-10 animate-in zoom-in-95">
 <div className="text-center space-y-4">
 <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border-4 border-emerald-500/20 rotate-6 shadow-sm">
 <CheckCircle2 className="h-10 w-10 text-emerald-500" />
 </div>
 <h3 className="text-3xl font-semibold uppercase tracking-tight italic">Upload complete</h3>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 shadow-sm group">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-emerald-500/40 shadow-sm transition-transform group-hover:rotate-6">
 <Zap className="h-8 w-8 text-white" />
 </div>
 <div>
 <p className="text-4xl font-semibold tracking-tight leading-none">{stats.created}</p>
 <p className="text-[10px] font-semibold mt-2 opacity-60">
 Role Artifacts Generated
 </p>
 </div>
 </div>
 </Card>
 <Card className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 shadow-sm group">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-blue-500/40 shadow-sm transition-transform group-hover:rotate-6">
 <Building2 className="h-8 w-8 text-white" />
 </div>
 <div>
 <p className="text-4xl font-semibold tracking-tight leading-none">
 {stats.companiesCreated}
 </p>
 <p className="text-[10px] font-semibold mt-2 opacity-60">
 Company Nodes Synced
 </p>
 </div>
 </div>
 </Card>
 </div>

 {stats.errors.length > 0 && (
 <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
 <div className="p-4 bg-destructive/10 border-b border-destructive/10 flex items-center gap-3">
 <AlertCircle className="h-4 w-4 text-destructive" />
 <span className="text-[10px] font-semibold text-destructive">
 Logic Exceptions ({stats.errors.length})
 </span>
 </div>
 <CardContent className="p-6">
 <ScrollArea className="h-[120px]">
 <ul className="space-y-2">
 {stats.errors.map((error, idx) => (
 <li key={idx} className="text-[11px] font-mono text-destructive/80 leading-relaxed">
 [FAULT_ID: {idx.toString().padStart(3, "0")}] {error}
 </li>
 ))}
 </ul>
 </ScrollArea>
 </CardContent>
 </Card>
 )}
 </div>
 )}
 </ScrollArea>

 <div className="flex justify-between items-center gap-4 px-10 py-5 border-t border-border/20 bg-background/95 shrink-0">
 {step === "preview" ? (
 <Button
 variant="ghost"
 onClick={reset}
 className="font-semibold uppercase text-xs h-12 px-8"
 >
 Abort Ingestion
 </Button>
 ) : (
 <div />
 )}

 {step === "preview" && (
 <Button
 onClick={handleImportSequence}
 disabled={newJobs.length === 0}
 className="h-10 px-4 rounded-xl font-semibold text-[11px] shadow-sm group"
 >
 Authorize Registry Injection{" "}
 <ChevronRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
 </Button>
 )}

 {step === "results" && (
 <Button
 onClick={() => {
 reset();
 onClose();
 }}
 className="h-10 px-4 rounded-xl font-semibold text-[11px] shadow-sm"
 >
 Terminate Session
 </Button>
 )}
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
}
