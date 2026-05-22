import * as React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { useJobMatchCached } from "@/domains/jobs";
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
  Flame,
  Share2,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Target,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { RelatedJobs } from "@/domains/jobs/components/RelatedJobs";
import { WhyYouMatchPanel } from "@/domains/jobs/components/WhyYouMatchPanel";
import { JobApplyCTA } from "@/domains/jobs/components/JobApplyCTA";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlinePassed } from "@/lib/constants/jobTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { scoreJobMatch } from "@/domains/jobs/api/jobsApi";

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

interface DeadlineMeta {
  label: string;
  tone: "muted" | "destructive" | "warning";
}

function getDeadlineMeta(deadline: string | null): DeadlineMeta {
  if (!deadline) return { label: "Open until filled", tone: "muted" };
  const now = new Date();
  const target = new Date(deadline);
  if (target < now) return { label: "Closed", tone: "destructive" };
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  if (days <= 2) return { label: `Closes in ${days}d`, tone: "destructive" };
  if (days <= 7) return { label: `Closes in ${days}d`, tone: "warning" };
  return { label: `Closes ${target.toLocaleDateString("en-US", { timeZone: "UTC" })}`, tone: "muted" };
}

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string | null {
  if (!min && !max) return null;
  const code = currency || "BDT";
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`);
  if (min && max) return `${code} ${fmt(min)}–${fmt(max)}`;
  return `${code} ${fmt((min || max) as number)}+`;
}

function parseChips(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Authenticated job detail page: header, match score, description,
 * requirements, related jobs, and a unified sticky apply CTA.
 */
export default function AppJobDetail() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { talent } = useTalent();
  const { isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [job, setJob] = React.useState<Job | null>(null);
  const [existingApplication, setExistingApplication] = React.useState<ExistingApplication | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [scoring, setScoring] = React.useState<boolean>(false);
  const [liveScore, setLiveScore] = React.useState<{
    score: number;
    rationale?: string | null;
    verifiedMatch?: any | null;
  } | null>(null);
  const [descriptionOpen, setDescriptionOpen] = React.useState<boolean>(false);

  const { data: cachedMatch } = useJobMatchCached(jobId, talent?.id);
  const jobSaved = jobId ? isSaved(jobId, "job") : false;

  const deadlineMeta = React.useMemo(() => getDeadlineMeta(job?.deadline ?? null), [job?.deadline]);
  const deadlinePassed = React.useMemo(
    () => (job?.deadline ? isDeadlinePassed(job.deadline) : false),
    [job?.deadline],
  );

  // Load job + existing application
  React.useEffect(() => {
    if (!jobId) return;
    const mounted = { current: true };

    (async () => {
      setLoading(true);
      try {
        const { data: jobData, error: jobErr } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .maybeSingle();

        if (jobErr) throw jobErr;
        if (!jobData) {
          if (mounted.current) setLoading(false);
          return;
        }

        if (!mounted.current) return;
        setJob(jobData as unknown as Job);

        if (talent?.id) {
          const { data: appData } = await supabase
            .from("job_applications")
            .select(`id, application_status, job_assessments(id, status)`)
            .eq("job_id", jobId)
            .eq("talent_id", talent.id)
            .maybeSingle();

          if (appData && mounted.current) {
            const cast = appData as any;
            const assessment = cast.job_assessments?.[0];
            setExistingApplication({
              id: cast.id,
              application_status: cast.application_status,
              assessment_id: assessment?.id,
              assessment_status: assessment?.status,
            });
          }
        }
      } catch {
        toast.error("Couldn't load this job. Please try again.");
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, [jobId, talent?.id]);

  // Track view
  React.useEffect(() => {
    if (!jobId || !talent?.id) return;
    supabase.from("job_views").insert({ job_id: jobId, talent_id: talent.id }).then(() => {});
  }, [jobId, talent?.id]);

  const runScore = React.useCallback(async () => {
    if (!jobId || !talent?.id) return;
    if (!canAfford("JOB_MATCH_SCORE")) {
      toast.error("You need 10 credits to score this match.");
      return;
    }
    setScoring(true);
    try {
      const paid = await deductCredits("JOB_MATCH_SCORE", jobId, "Job match score");
      if (!paid) throw new Error("payment_failed");

      const res: any = await scoreJobMatch({ jobId, talentId: talent.id });
      setLiveScore({
        score: res?.match_score ?? 0,
        rationale: res?.rationale,
        verifiedMatch: res?.verified_match ?? null,
      });
      recordToolRun({
        toolKey: "score",
        costCredits: 10,
        jobId,
        payload: { score: res?.match_score },
      });
      toast.success("Match score ready.");
    } catch {
      toast.error("Couldn't score this job right now. Please try again.");
    } finally {
      setScoring(false);
    }
  }, [jobId, talent?.id, canAfford, deductCredits]);

  // Auto-score when arriving with ?score=1
  React.useEffect(() => {
    if (
      searchParams.get("score") === "1" &&
      !cachedMatch &&
      !liveScore &&
      !scoring &&
      job &&
      talent?.id
    ) {
      runScore();
    }
  }, [searchParams, cachedMatch, liveScore, scoring, job, talent?.id, runScore]);

  const handleShare = React.useCallback(() => {
    if (!job) return;
    if (navigator.share) {
      navigator.share({ title: job.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied.");
    }
  }, [job]);

  const handleToggleSave = React.useCallback(() => {
    if (job) toggleSave(job.id, "job");
  }, [job, toggleSave]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div role="alert" className="min-h-[40vh] grid place-items-center text-center p-6">
        <div className="max-w-xs space-y-4">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Job not found</p>
            <p className="text-xs text-muted-foreground">
              This job may have been removed or is no longer visible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const score = liveScore?.score ?? cachedMatch?.score ?? null;
  const rationale = liveScore?.rationale ?? cachedMatch?.rationale ?? null;
  const verifiedMatch = liveScore?.verifiedMatch ?? null;
  const salaryLabel = formatSalaryRange(job.salary_range_min, job.salary_range_max, job.salary_currency);
  const requirementChips = parseChips(job.requirements);
  const niceToHaveChips = parseChips(job.preferred_skills);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-32 space-y-4">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> <span>Back</span>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
            title="Share this job"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleSave}
            title={jobSaved ? "Unsave job" : "Save job"}
          >
            <Bookmark className={cn("h-4 w-4", jobSaved && "fill-current text-primary")} />
          </Button>
        </div>
      </header>

      {/* Job header */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="h-12 w-12 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt="" className="object-cover w-full h-full" />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {job.title}
              </h1>
              <p className="text-sm font-medium text-muted-foreground truncate">{job.company_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.location || "Remote"}</span>
              </p>
            </div>
            {job.is_featured && (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 gap-1 shrink-0"
              >
                <Flame className="h-3 w-3 fill-amber-500" /> Featured
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[11px] gap-1">
              <Briefcase className="h-3 w-3" /> {getJobTypeLabel(job.job_type)}
            </Badge>
            <Badge variant="secondary" className="text-[11px] gap-1">
              <Sparkles className="h-3 w-3" /> {getExperienceLevelLabel(job.experience_level)}
            </Badge>
            {salaryLabel && (
              <Badge
                variant="outline"
                className="text-[11px] border-primary/30 bg-primary/5 text-primary"
              >
                {salaryLabel}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] gap-1",
                deadlineMeta.tone === "destructive" && "text-destructive border-destructive/30 bg-destructive/5",
                deadlineMeta.tone === "warning" && "text-amber-600 border-amber-500/30 bg-amber-500/5",
              )}
            >
              <Clock className="h-3 w-3" /> {deadlineMeta.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Match score */}
      {talent?.id && (
        <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-background border border-primary/10 flex items-center justify-center shrink-0">
              {scoring ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : score !== null ? (
                <span className="text-sm font-bold text-primary tabular-nums">
                  {Math.round(score)}%
                </span>
              ) : (
                <Target className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              {score !== null ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {score >= 75
                      ? "Strong match"
                      : score >= 50
                        ? "Decent match"
                        : "Light match"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {rationale || "AI compared your profile against this job's requirements."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">See why you match</p>
                  <p className="text-xs text-muted-foreground">
                    10 credits · gap analysis + tailored learning suggestions.
                  </p>
                </>
              )}
            </div>
            {score === null && (
              <Button
                type="button"
                size="sm"
                onClick={runScore}
                disabled={scoring}
                className="shrink-0"
              >
                {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Score me"}
              </Button>
            )}
          </CardContent>

          {score !== null && rationale && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full h-7 border-t border-border/10 text-[11px] font-semibold text-primary flex items-center justify-center gap-1 hover:bg-muted/40"
                >
                  See full reasoning <ChevronDown className="h-3 w-3" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap border-t border-border/10 bg-muted/[0.02]">
                  {rationale}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>
      )}

      {/* Verified skills + gaps panel */}
      {verifiedMatch && <WhyYouMatchPanel verifiedMatch={verifiedMatch} />}

      {/* Assessment nudge */}
      {existingApplication &&
        job.ai_assessment_enabled &&
        existingApplication.assessment_status !== "completed" && (
          <Card className="rounded-xl border-amber-500/30 bg-amber-500/[0.04]">
            <CardContent className="p-3.5 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Finish your AI interview
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete the short skill assessment to send your application to the employer.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (existingApplication.assessment_id) {
                    navigate(`/app/job-assessment/${existingApplication.assessment_id}`);
                  } else {
                    navigate(`/app/applications/${existingApplication.id}`);
                  }
                }}
                className="shrink-0"
              >
                Resume
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Description */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/10 pb-2">
            About this role
          </h2>
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <div
              className={cn(
                "text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap",
                !descriptionOpen && "line-clamp-6",
              )}
            >
              {job.ai_enhanced_description || job.description}
            </div>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
              >
                {descriptionOpen ? "Show less" : "Read more"}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", descriptionOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Requirements */}
      {requirementChips.length > 0 && (
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/10 pb-2">
              Requirements
            </p>
            <div className="flex flex-wrap gap-1.5">
              {requirementChips.map((chip, i) => (
                <Badge
                  key={`req-${i}`}
                  variant="secondary"
                  className="text-[11px] gap-1 bg-background border border-border/40 text-muted-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>{chip}</span>
                </Badge>
              ))}
            </div>

            {niceToHaveChips.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-medium text-muted-foreground/70">
                  Nice to have
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {niceToHaveChips.map((chip, i) => (
                    <Badge
                      key={`pref-${i}`}
                      variant="outline"
                      className="text-[11px] border-border/40 text-muted-foreground/80"
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* About the company */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="" className="object-cover w-full h-full" />
            ) : (
              <Building2 className="h-5 w-5 text-primary/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{job.company_name}</p>
            <p className="text-[11px] text-muted-foreground">
              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </p>
          </div>
          {job.company_id && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/app/jobs?company=${encodeURIComponent(job.company_name)}`)}
              className="shrink-0"
              title="See more jobs at this company"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Similar roles */}
      <RelatedJobs
        currentJobId={job.id}
        companyName={job.company_name}
        location={job.location || ""}
        linkPrefix="/app/jobs"
      />

      {/* Sticky apply bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p
              className={cn(
                "text-[11px] font-medium flex items-center gap-1",
                deadlineMeta.tone === "destructive" && "text-destructive",
                deadlineMeta.tone === "warning" && "text-amber-600",
                deadlineMeta.tone === "muted" && "text-muted-foreground",
              )}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{deadlineMeta.label}</span>
            </p>
            {existingApplication && (
              <p className="text-[11px] text-muted-foreground truncate">
                Applied · {existingApplication.application_status}
              </p>
            )}
          </div>

          <JobApplyCTA
            job={job}
            existingApplication={existingApplication}
            deadlinePassed={deadlinePassed}
            authMode="in-app"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
