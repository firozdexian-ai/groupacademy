import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, Mail, Linkedin as LinkedinIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// --- Types ---
interface LinkedInJob {
  title?: string;
  linkedinUrl?: string;
  descriptionText?: string;
  descriptionHtml?: string;
  employmentType?: string;
  experienceLevel?: string;
  workRemoteAllowed?: boolean;
  expireAt?: string;
  location?: {
    parsed?: { text?: string };
    linkedinText?: string;
  };
  company?: {
    name?: string;
    logo?: string;
    website?: string;
  };
  applyMethod?: {
    type?: string;
    companyApplyUrl?: string;
    easyApplyUrl?: string;
  };
  salary?: {
    min?: number;
    max?: number;
  };
}

interface MappedJob {
  title: string;
  company_name: string;
  company_logo_url: string | null;
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

// --- Mappers ---
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
  // 1. Extract email from description
  const emailMatch = job.descriptionText?.match(/[\w.-]+@[\w.-]+\.\w{2,}/);

  // 2. Check for direct company URL
  const hasDirectUrl =
    job.applyMethod?.type === "OffsiteApply" && job.applyMethod?.companyApplyUrl;

  if (emailMatch) {
    return {
      application_type: "email",
      application_email: emailMatch[0],
      application_url: hasDirectUrl ? job.applyMethod!.companyApplyUrl! : job.linkedinUrl || null,
      applyVia: "email",
    };
  }

  if (hasDirectUrl) {
    return {
      application_type: "link",
      application_url: job.applyMethod!.companyApplyUrl!,
      application_email: null,
      applyVia: "direct",
    };
  }

  return {
    application_type: "link",
    application_url: job.linkedinUrl || null,
    application_email: null,
    applyVia: "linkedin",
  };
}

function mapLinkedInJob(job: LinkedInJob): MappedJob & { applyVia: ApplyVia } {
  const appMethod = resolveApplicationMethod(job);
  return {
    title: job.title || "Untitled",
    company_name: job.company?.name || "Unknown",
    company_logo_url: job.company?.logo || null,
    location: job.location?.parsed?.text || job.location?.linkedinText || null,
    job_type: mapEmploymentType(job.employmentType, job.workRemoteAllowed),
    experience_level: mapExperienceLevel(job.experienceLevel),
    description: job.descriptionText || "",
    ai_enhanced_description: job.descriptionHtml || null,
    application_type: appMethod.application_type,
    application_email: appMethod.application_email,
    application_url: appMethod.application_url,
    source_url: job.linkedinUrl || null,
    source_platform: "linkedin",
    deadline: job.expireAt || null,
    salary_range_min: job.salary?.min || null,
    salary_range_max: job.salary?.max || null,
    is_active: true,
    applyVia: appMethod.applyVia,
  };
}

// --- Component ---
type Step = "upload" | "preview" | "importing" | "results";

interface ImportStats {
  created: number;
  skipped: number;
  errors: string[];
  byMethod: { direct: number; email: number; linkedin: number };
}

export function BatchLinkedInJobUpload({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [mappedJobs, setMappedJobs] = useState<(MappedJob & { applyVia: ApplyVia })[]>([]);
  const [newJobs, setNewJobs] = useState<MappedJob[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({ created: 0, skipped: 0, errors: [], byMethod: { direct: 0, email: 0, linkedin: 0 } });
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setMappedJobs([]);
    setNewJobs([]);
    setDuplicateCount(0);
    setProgress(0);
    setStats({ created: 0, skipped: 0, errors: [], byMethod: { direct: 0, email: 0, linkedin: 0 } });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const arr = Array.isArray(raw) ? raw : [raw];
      if (arr.length === 0) throw new Error("Empty array");

      const mapped = arr.map(mapLinkedInJob);
      setMappedJobs(mapped);

      // Dedup check
      const sourceUrls = mapped.map((j) => j.source_url).filter(Boolean);
      const { data: existing } = await supabase
        .from("jobs")
        .select("source_url")
        .eq("source_platform", "linkedin")
        .in("source_url", sourceUrls);

      const existingSet = new Set(existing?.map((j) => j.source_url) || []);
      const fresh = mapped.filter((j) => !existingSet.has(j.source_url));
      const dupes = mapped.length - fresh.length;

      setNewJobs(fresh.map(({ applyVia, ...rest }) => rest));
      setDuplicateCount(dupes);
      setStep("preview");
      toast.success(`Parsed ${mapped.length} jobs, ${dupes} duplicates found`);
    } catch (err: any) {
      toast.error("Invalid JSON file: " + (err.message || "Parse error"));
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    setStep("importing");
    const result: ImportStats = { created: 0, skipped: duplicateCount, errors: [], byMethod: { direct: 0, email: 0, linkedin: 0 } };

    for (let i = 0; i < newJobs.length; i += 10) {
      const chunk = newJobs.slice(i, i + 10);
      const { error } = await supabase.from("jobs").insert(chunk as any);
      if (error) {
        result.errors.push(`Chunk ${Math.floor(i / 10) + 1}: ${error.message}`);
      } else {
        result.created += chunk.length;
        chunk.forEach((j) => {
          if (j.application_type === "email") result.byMethod.email++;
          else if (j.application_url && !j.application_url.includes("linkedin.com")) result.byMethod.direct++;
          else result.byMethod.linkedin++;
        });
      }
      setProgress(Math.min(100, Math.round(((i + 10) / newJobs.length) * 100)));
    }

    setStats(result);
    setStep("results");
    if (result.created > 0) onComplete();
  };

  const methodBreakdown = {
    direct: mappedJobs.filter((j) => j.applyVia === "direct").length,
    email: mappedJobs.filter((j) => j.applyVia === "email").length,
    linkedin: mappedJobs.filter((j) => j.applyVia === "linkedin").length,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkedinIcon className="w-5 h-5 text-blue-600" />
            Import LinkedIn Jobs
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a LinkedIn scraper JSON export to bulk-import jobs."}
            {step === "preview" && `${mappedJobs.length} jobs parsed • ${duplicateCount} duplicates skipped • ${newJobs.length} ready to import`}
            {step === "importing" && "Importing jobs in batches..."}
            {step === "results" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileJson className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Upload the <code className="bg-muted px-1 rounded">.json</code> file exported from your LinkedIn scraper.
            </p>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            <Button onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" /> Select JSON File
            </Button>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            {/* Method breakdown */}
            <div className="flex gap-3 flex-wrap">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                <LinkIcon className="w-3 h-3" /> Direct Link: {methodBreakdown.direct}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
                <Mail className="w-3 h-3" /> Email: {methodBreakdown.email}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 gap-1">
                <LinkedinIcon className="w-3 h-3" /> LinkedIn: {methodBreakdown.linkedin}
              </Badge>
            </div>

            <ScrollArea className="flex-1 max-h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Apply Via</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedJobs.map((job, i) => (
                    <TableRow key={i} className={duplicateCount > 0 && !newJobs.find((nj) => nj.source_url === job.source_url) ? "opacity-40" : ""}>
                      <TableCell className="font-medium max-w-[200px] truncate">{job.title}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{job.company_name}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{job.location || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{job.job_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {job.applyVia === "direct" && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs gap-1">
                            <LinkIcon className="w-3 h-3" /> Direct
                          </Badge>
                        )}
                        {job.applyVia === "email" && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </Badge>
                        )}
                        {job.applyVia === "linkedin" && (
                          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs gap-1">
                            <LinkedinIcon className="w-3 h-3" /> LinkedIn
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {job.deadline ? format(new Date(job.deadline), "MMM d") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport} disabled={newJobs.length === 0} className="gap-2">
                Import {newJobs.length} Jobs
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <Progress value={progress} className="w-64" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && (
          <div className="py-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold">{stats.created} jobs imported</p>
              {stats.skipped > 0 && <p className="text-sm text-muted-foreground">{stats.skipped} duplicates skipped</p>}
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Direct Link: {stats.byMethod.direct}</Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Email: {stats.byMethod.email}</Badge>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">LinkedIn: {stats.byMethod.linkedin}</Badge>
            </div>

            {stats.errors.length > 0 && (
              <div className="w-full max-w-md bg-destructive/10 rounded-md p-3 space-y-1">
                <p className="text-sm font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {stats.errors.length} error(s)
                </p>
                {stats.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive/80">{e}</p>
                ))}
              </div>
            )}

            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
