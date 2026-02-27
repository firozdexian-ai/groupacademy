import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, Mail, Linkedin as LinkedinIcon, Building2 } from "lucide-react";
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
    linkedinUrl?: string;
    description?: string;
    industries?: { name?: string }[];
    locations?: { country?: string; city?: string; postalCode?: string; geographicArea?: string; line1?: string; description?: string }[];
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
  const emailMatch = job.descriptionText?.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
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

function formatCompanyAddress(loc?: LinkedInJob["company"]["locations"][0]): string | null {
  if (!loc) return null;
  const parts = [loc.line1, loc.city, loc.geographicArea, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function extractCompanyData(job: LinkedInJob): CompanyData | null {
  const name = job.company?.name;
  if (!name) return null;
  return {
    name,
    website: job.company?.website || null,
    linkedin_url: job.company?.linkedinUrl || null,
    logo_url: job.company?.logo || null,
    industry: job.company?.industries?.[0]?.name || null,
    address: formatCompanyAddress(job.company?.locations?.[0]),
    notes: job.company?.description?.slice(0, 500) || null,
  };
}

async function resolveCompanies(
  jobs: LinkedInJob[]
): Promise<{ nameToId: Map<string, string>; created: number; enriched: number }> {
  // 1. Extract unique companies
  const uniqueCompanies = new Map<string, CompanyData>();
  for (const job of jobs) {
    const data = extractCompanyData(job);
    if (data && !uniqueCompanies.has(data.name.toLowerCase())) {
      uniqueCompanies.set(data.name.toLowerCase(), data);
    }
  }

  if (uniqueCompanies.size === 0) return { nameToId: new Map(), created: 0, enriched: 0 };

  // 2. Query existing companies
  const companyNames = [...uniqueCompanies.values()].map((c) => c.name);
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name, website, linkedin_url, logo_url, industry, address, notes")
    .in("name", companyNames);

  const nameToId = new Map<string, string>();
  const toCreate: CompanyData[] = [];
  const toUpdate: { id: string; [key: string]: any }[] = [];

  for (const [key, company] of uniqueCompanies) {
    const match = existing?.find((e) => e.name.toLowerCase() === key);
    if (match) {
      nameToId.set(key, match.id);
      // Enrich missing fields
      const updates: Record<string, any> = {};
      if (!match.website && company.website) updates.website = company.website;
      if (!match.linkedin_url && company.linkedin_url) updates.linkedin_url = company.linkedin_url;
      if (!match.logo_url && company.logo_url) updates.logo_url = company.logo_url;
      if (!match.industry && company.industry) updates.industry = company.industry;
      if (!match.address && company.address) updates.address = company.address;
      if (!match.notes && company.notes) updates.notes = company.notes;
      if (Object.keys(updates).length > 0) toUpdate.push({ id: match.id, ...updates });
    } else {
      toCreate.push(company);
    }
  }

  // 3. Create new companies
  let createdCount = 0;
  if (toCreate.length > 0) {
    const { data: created, error } = await supabase
      .from("companies")
      .insert(toCreate as any)
      .select("id, name");
    if (!error && created) {
      created.forEach((c: any) => nameToId.set(c.name.toLowerCase(), c.id));
      createdCount = created.length;
    }
  }

  // 4. Enrich existing companies
  let enrichedCount = 0;
  for (const upd of toUpdate) {
    const { id, ...fields } = upd;
    const { error } = await supabase.from("companies").update(fields).eq("id", id);
    if (!error) enrichedCount++;
  }

  return { nameToId, created: createdCount, enriched: enrichedCount };
}

function mapLinkedInJob(
  job: LinkedInJob,
  companyIdMap?: Map<string, string>
): MappedJob & { applyVia: ApplyVia } {
  const appMethod = resolveApplicationMethod(job);
  const companyKey = job.company?.name?.toLowerCase() || "";
  return {
    title: job.title || "Untitled",
    company_name: job.company?.name || "Unknown",
    company_logo_url: job.company?.logo || null,
    company_id: companyIdMap?.get(companyKey) || null,
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
  companiesCreated: number;
  companiesEnriched: number;
}

interface CompanyPreview {
  total: number;
  newCount: number;
  existingCount: number;
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [rawJobs, setRawJobs] = useState<LinkedInJob[]>([]);
  const [mappedJobs, setMappedJobs] = useState<(MappedJob & { applyVia: ApplyVia })[]>([]);
  const [newJobs, setNewJobs] = useState<(MappedJob & { applyVia: ApplyVia })[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [companyPreview, setCompanyPreview] = useState<CompanyPreview>({ total: 0, newCount: 0, existingCount: 0 });
  const [progress, setProgress] = useState(0);
  const [importPhase, setImportPhase] = useState<"companies" | "jobs">("companies");
  const [stats, setStats] = useState<ImportStats>({
    created: 0, skipped: 0, errors: [], byMethod: { direct: 0, email: 0, linkedin: 0 },
    companiesCreated: 0, companiesEnriched: 0,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setIsProcessingFile(false);
    setRawJobs([]);
    setMappedJobs([]);
    setNewJobs([]);
    setDuplicateCount(0);
    setCompanyPreview({ total: 0, newCount: 0, existingCount: 0 });
    setProgress(0);
    setImportPhase("companies");
    setStats({
      created: 0, skipped: 0, errors: [], byMethod: { direct: 0, email: 0, linkedin: 0 },
      companiesCreated: 0, companiesEnriched: 0,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const arr: LinkedInJob[] = Array.isArray(raw) ? raw : [raw];
      if (arr.length === 0) throw new Error("Empty array");

      setRawJobs(arr);
      const mapped = arr.map((j) => mapLinkedInJob(j));
      setMappedJobs(mapped);

      // Dedup check: source_url
      const sourceUrls = mapped.map((j) => j.source_url).filter(Boolean);
      const { data: existingByUrl } = await supabase
        .from("jobs")
        .select("source_url")
        .eq("source_platform", "linkedin")
        .in("source_url", sourceUrls);

      const existingUrlSet = new Set(existingByUrl?.map((j) => j.source_url) || []);

      // Secondary dedup: bulk fetch existing jobs by company names, compare in-memory
      const companyNamesForDedup = [...new Set(mapped.map(j => j.company_name))];
      const existingJobPairs = new Set<string>();

      for (let i = 0; i < companyNamesForDedup.length; i += 20) {
        const batch = companyNamesForDedup.slice(i, i + 20);
        const { data: existingJobs } = await supabase
          .from("jobs")
          .select("title, company_name")
          .in("company_name", batch);
        existingJobs?.forEach(j => {
          existingJobPairs.add(`${j.title.toLowerCase().trim()}|||${j.company_name.toLowerCase().trim()}`);
        });
      }

      const fresh = mapped.filter((j) => {
        if (existingUrlSet.has(j.source_url)) return false;
        const key = `${j.title.toLowerCase().trim()}|||${j.company_name.toLowerCase().trim()}`;
        if (existingJobPairs.has(key)) return false;
        return true;
      });
      const dupes = mapped.length - fresh.length;

      setNewJobs(fresh);
      setDuplicateCount(dupes);

      // Company preview: check which are new vs existing
      const uniqueNames = new Map<string, string>();
      arr.forEach((j) => {
        const name = j.company?.name;
        if (name && !uniqueNames.has(name.toLowerCase())) {
          uniqueNames.set(name.toLowerCase(), name);
        }
      });

      const companyNames = [...uniqueNames.values()];
      let existingCompanyCount = 0;
      if (companyNames.length > 0) {
        const { data: existingCompanies } = await supabase
          .from("companies")
          .select("name")
          .in("name", companyNames);
        existingCompanyCount = existingCompanies?.length || 0;
      }

      setCompanyPreview({
        total: uniqueNames.size,
        newCount: uniqueNames.size - existingCompanyCount,
        existingCount: existingCompanyCount,
      });

      setStep("preview");
      toast.success(`Parsed ${mapped.length} jobs from ${uniqueNames.size} companies`);
    } catch (err: any) {
      toast.error("Failed to process file: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessingFile(false);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    setStep("importing");
    setImportPhase("companies");
    setProgress(0);

    // Phase 1: Resolve companies
    const { nameToId, created: companiesCreated, enriched: companiesEnriched } = await resolveCompanies(rawJobs);
    setProgress(100);

    // Phase 2: Insert jobs with company_id
    setImportPhase("jobs");
    setProgress(0);

    // Re-map jobs with company IDs
    const jobsToInsert = newJobs.map(({ applyVia, ...job }) => ({
      ...job,
      company_id: nameToId.get(job.company_name.toLowerCase()) || null,
    }));

    const result: ImportStats = {
      created: 0, skipped: duplicateCount, errors: [],
      byMethod: { direct: 0, email: 0, linkedin: 0 },
      companiesCreated, companiesEnriched,
    };

    for (let i = 0; i < jobsToInsert.length; i += 10) {
      const chunk = jobsToInsert.slice(i, i + 10);
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
      setProgress(Math.min(100, Math.round(((i + 10) / jobsToInsert.length) * 100)));
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

  // Determine per-job company status for preview
  const existingCompanyNames = new Set<string>();
  // We compute this from companyPreview data at render time
  // (actual check was done during file upload)

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
            {step === "upload" && "Upload a LinkedIn scraper JSON export to bulk-import jobs and companies."}
            {step === "preview" && `${mappedJobs.length} jobs • ${companyPreview.total} companies • ${duplicateCount} duplicates • ${newJobs.length} ready`}
            {step === "importing" && (importPhase === "companies" ? "Resolving companies..." : "Importing jobs in batches...")}
            {step === "results" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            {isProcessingFile ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing file & checking for duplicates…</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <FileJson className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Upload the <code className="bg-muted px-1 rounded">.json</code> file exported from your LinkedIn scraper.
                  Companies will be auto-created and linked.
                </p>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                <Button onClick={() => fileRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" /> Select JSON File
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            {/* Company summary */}
            <div className="flex gap-3 flex-wrap items-center">
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 gap-1">
                <Building2 className="w-3 h-3" /> Companies: {companyPreview.total}
              </Badge>
              {companyPreview.newCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {companyPreview.newCount} new • {companyPreview.existingCount} existing
                </span>
              )}
              <span className="text-muted-foreground">|</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                <LinkIcon className="w-3 h-3" /> Direct: {methodBreakdown.direct}
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
                  {mappedJobs.map((job, i) => {
                    const isDupe = !newJobs.find((nj) => nj.source_url === job.source_url);
                    return (
                      <TableRow key={i} className={duplicateCount > 0 && isDupe ? "opacity-40" : ""}>
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
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport} disabled={newJobs.length === 0} className="gap-2">
                Import {newJobs.length} Jobs + {companyPreview.newCount} Companies
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {importPhase === "companies" ? "Resolving companies..." : "Importing jobs..."}
            </p>
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

            {/* Company stats */}
            <div className="flex gap-3 flex-wrap justify-center">
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 gap-1">
                <Building2 className="w-3 h-3" /> {stats.companiesCreated} companies created
              </Badge>
              {stats.companiesEnriched > 0 && (
                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 gap-1">
                  {stats.companiesEnriched} enriched
                </Badge>
              )}
            </div>

            {/* Apply method breakdown */}
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
