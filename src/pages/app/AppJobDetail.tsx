import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/hooks/useCredits";
import { useJobMatchCached } from "@/hooks/useJobMatchCached";
import { recordToolRun } from "@/hooks/useToolRuns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Bookmark,
  ShieldCheck,
  Flame,
  Share2,
  ChevronDown,
  Sparkles,
  Loader2,
  CheckCircle2,
  Target,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ExternalApplicationPrep } from "@/components/jobs/ExternalApplicationPrep";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlinePassed } from "@/lib/constants/jobTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  company_id: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: any;
  preferred_skills: any;
  application_type: string;
  application_email: string | null;
  application_url: string | null;
  deadline: string | null;
  is_featured: boolean;
  created_at: string;
  ai_assessment_enabled: boolean;
}

interface ExistingApplication {
  id: string;
  application_status: string;
  assessment_id?: string;
  assessment_status?: string;
}

function deadlineMeta(deadline: string | null) {
  if (!deadline) return { label: "Open until filled", tone: "muted" as const, urgent: false };
  const now = new Date();
  const d = new Date(deadline);
  if (d < now) return { label: "Closed", tone: "destructive" as const, urgent: false };
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days <= 2) return { label: `Closes in ${days}d`, tone: "destructive" as const, urgent: true };
  if (days <= 7) return { label: `Closes in ${days}d`, tone: "warning" as const, urgent: true };
  return { label: `Closes ${d.toLocaleDateString()}`, tone: "muted" as const, urgent: false };
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const c = currency || "BDT";
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`);
  if (min && max) return `${c} ${fmt(min)}–${fmt(max)}`;
  return `${c} ${fmt((min || max) as number)}+`;
}

function toChips(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { talent } = useTalent();
  const { isSaved: checkIsSaved, toggleSave } = useSavedItems();
  const { balance, canAfford, deductCredits } = useCredits();

  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyAI, setShowApplyAI] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [liveScore, setLiveScore] = useState<{ score: number; rationale?: string | null } | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const { data: cachedMatch } = useJobMatchCached(id, talent?.id);

  const isSaved = id ? checkIsSaved(id, "job") : false;
  const dl = useMemo(() => deadlineMeta(job?.deadline ?? null), [job?.deadline]);
  const deadlinePassed = job?.deadline ? isDeadlinePassed(job.deadline) : false;

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (jobError) throw jobError;
      setJob(jobData as Job);

      if (talent?.id) {
        const { data: appData } = await (supabase as any)
          .from("job_applications")
          .select(`id, application_status, job_assessments(id, status)`)
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (appData) {
          const assessment = (appData as any).job_assessments?.[0];
          setExistingApp({
            id: appData.id,
            application_status: appData.application_status,
            assessment_id: assessment?.id,
            assessment_status: assessment?.status,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [id, talent?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track view (fire-and-forget)
  useEffect(() => {
    if (!id || !talent?.id) return;
    (supabase as any).from("job_views").insert({ job_id: id, talent_id: talent.id }).then(() => {});
  }, [id, talent?.id]);

  const handleApply = () => {
    if (!job) return;
    if (job.application_type === "link") {
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION?.cost ?? 5;
      if ((balance ?? 0) < cost) return toast.error(`Need ${cost} credits.`);
      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  const handleScore = useCallback(async () => {
    if (!id || !talent?.id) return;
    if (!canAfford("JOB_MATCH_SCORE")) return toast.error("Need 10 credits.");
    setScoring(true);
    try {
      const ok = await deductCredits("JOB_MATCH_SCORE", id, "Job match score");
      if (!ok) throw new Error("payment");
      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId: id, talentId: talent.id },
      });
      if (error) throw error;
      setLiveScore({ score: data?.match_score ?? 0, rationale: data?.rationale });
      recordToolRun({ toolKey: "score", costCredits: 10, jobId: id, payload: { score: data?.match_score } });
      toast.success("Match scored");
    } catch (e) {
      toast.error("Couldn't score this job. Try again.");
    } finally {
      setScoring(false);
    }
  }, [id, talent?.id, canAfford, deductCredits]);

  // Auto-score if ?score=1 was passed (from ScoreMeJobPicker)
  useEffect(() => {
    if (searchParams.get("score") === "1" && !cachedMatch && !liveScore && !scoring && job && talent?.id) {
      handleScore();
    }
  }, [searchParams, cachedMatch, liveScore, scoring, job, talent?.id, handleScore]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Job not found.</div>;
  }

  const score = liveScore?.score ?? cachedMatch?.score ?? null;
  const rationale = liveScore?.rationale ?? cachedMatch?.rationale ?? null;
  const salary = formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency);
  const requirementChips = toChips(job.requirements);
  const niceToHaveChips = toChips(job.preferred_skills);

  // Sticky CTA state
  let ctaLabel = "Apply now";
  let ctaDisabled = false;
  let ctaAction: () => void = handleApply;
  if (deadlinePassed) {
    ctaLabel = "Closed";
    ctaDisabled = true;
  } else if (existingApp) {
    if (job.ai_assessment_enabled && existingApp.assessment_status !== "completed") {
      ctaLabel = "Continue assessment";
      ctaAction = () =>
        existingApp.assessment_id
          ? navigate(`/app/job-assessment/${existingApp.assessment_id}`)
          : navigate(`/app/applications/${existingApp.id}`);
    } else {
      ctaLabel = "View application";
      ctaAction = () => navigate(`/app/applications/${existingApp.id}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-32 space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: job.title, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied");
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toggleSave(job.id, "job")}>
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current text-primary")} />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="h-14 w-14 rounded-xl bg-primary/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt={job.company_name} className="object-cover w-full h-full" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight">{job.title}</h1>
              <p className="text-sm text-muted-foreground truncate">{job.company_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {job.location || "Remote"}
              </p>
            </div>
            {job.is_featured && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                <Flame className="h-3 w-3 mr-1" /> Featured
              </Badge>
            )}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Briefcase className="h-3 w-3" /> {getJobTypeLabel(job.job_type)}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <ShieldCheck className="h-3 w-3" /> {getExperienceLevelLabel(job.experience_level)}
            </Badge>
            {salary && (
              <Badge variant="secondary" className="text-[11px]">
                {salary}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-[11px]",
                dl.tone === "destructive" && "text-destructive border-destructive/40",
                dl.tone === "warning" && "text-amber-600 border-amber-500/40",
              )}
            >
              <Clock className="h-3 w-3" /> {dl.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Match strip */}
      {talent?.id && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              {scoring ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : score != null ? (
                <span className="text-sm font-bold text-primary">{Math.round(score)}%</span>
              ) : (
                <Target className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {score != null ? (
                <>
                  <p className="text-sm font-semibold">
                    {score >= 75 ? "Strong match" : score >= 50 ? "Decent match" : "Light match"}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {rationale || "Based on your skills, experience and CV."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">See how you match</p>
                  <p className="text-[11px] text-muted-foreground">10 credits · gaps + tailored advice</p>
                </>
              )}
            </div>
            {score == null && (
              <Button size="sm" className="shrink-0" onClick={handleScore} disabled={scoring}>
                {scoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Score me"}
              </Button>
            )}
          </CardContent>
          {score != null && rationale && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="w-full text-[11px] font-medium text-primary px-3 pb-2 flex items-center justify-center gap-1">
                  Why you match <ChevronDown className="h-3 w-3" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 text-xs text-muted-foreground whitespace-pre-wrap">{rationale}</div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>
      )}

      {/* Pending assessment nudge */}
      {existingApp && job.ai_assessment_enabled && existingApp.assessment_status !== "completed" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">AI assessment required</p>
              <p className="text-[11px] text-muted-foreground">Complete it to finalize your application.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                existingApp.assessment_id && navigate(`/app/job-assessment/${existingApp.assessment_id}`)
              }
            >
              Start
            </Button>
          </CardContent>
        </Card>
      )}

      {/* About this role */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-sm font-semibold">About this role</h2>
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <div
              className={cn(
                "text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed",
                !descriptionOpen && "line-clamp-6",
              )}
            >
              {job.ai_enhanced_description || job.description}
            </div>
            <CollapsibleTrigger asChild>
              <button className="mt-2 text-xs font-medium text-primary flex items-center gap-1">
                {descriptionOpen ? "Show less" : "Read full description"}
                <ChevronDown className={cn("h-3 w-3 transition-transform", descriptionOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Requirements */}
      {requirementChips.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Requirements</h2>
            <div className="flex flex-wrap gap-1.5">
              {requirementChips.map((c, i) => (
                <Badge key={i} variant="secondary" className="text-[11px]">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-primary/70" />
                  {c}
                </Badge>
              ))}
            </div>
            {niceToHaveChips.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-muted-foreground pt-1">Nice to have</p>
                <div className="flex flex-wrap gap-1.5">
                  {niceToHaveChips.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* About company */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt={job.company_name} className="object-cover w-full h-full" />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{job.company_name}</p>
            <p className="text-[11px] text-muted-foreground">
              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </p>
          </div>
          {job.company_id && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs?company=${encodeURIComponent(job.company_name)}`)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Similar */}
      <RelatedJobs
        currentJobId={job.id}
        companyName={job.company_name}
        location={job.location || "Remote"}
        linkPrefix="/app/jobs"
      />

      {/* Sticky bottom apply bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-safe">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-[11px] font-medium",
                dl.tone === "destructive" && "text-destructive",
                dl.tone === "warning" && "text-amber-600",
                dl.tone === "muted" && "text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3 inline mr-1" />
              {dl.label}
            </p>
            {existingApp && (
              <p className="text-[11px] text-muted-foreground truncate">
                <Sparkles className="h-3 w-3 inline mr-1" /> Applied · {existingApp.application_status}
              </p>
            )}
          </div>
          <Button size="lg" className="shrink-0 h-12 px-6 rounded-xl" onClick={ctaAction} disabled={ctaDisabled}>
            {ctaLabel} {!ctaDisabled && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </div>
      </div>

      {showApplyAI && job.application_url && (
        <ExternalApplicationPrep
          open={showApplyAI}
          onOpenChange={setShowApplyAI}
          jobId={job.id}
          applicationUrl={job.application_url}
          jobTitle={job.title}
          companyName={job.company_name}
        />
      )}
    </div>
  );
}
