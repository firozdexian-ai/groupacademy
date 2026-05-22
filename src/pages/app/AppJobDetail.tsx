import * as React from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
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
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { ExternalApplicationPrep } from "@/domains/jobs/components/ExternalApplicationPrep";
import { RelatedJobs } from "@/domains/jobs/components/RelatedJobs";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlinePassed } from "@/lib/constants/jobTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { scoreJobMatch } from "@/domains/jobs/api/jobsApi";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
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

interface DeadlineMetadata {
  label: string;
  tone: "muted" | "destructive" | "warning";
  urgent: boolean;
}

interface DatabaseApplicationResponse {
  id: string;
  application_status: string;
  job_assessments: { id: string; status: string }[] | null;
}

// =========================================================================
// PURE UTILITY TRANSLATION COMPILERS (INSULATED FROM RENDER RUNWAYS)
// =========================================================================
function compileDeadlineMetadata(deadlineStringUrl: string | null): DeadlineMetadata {
  if (!deadlineStringUrl) {
    return { label: "Open Until Filled", tone: "muted", urgent: false };
  }
  const currentSystemDateNode = new Date();
  const targetedDeadlineDateNode = new Date(deadlineStringUrl);

  if (targetedDeadlineDateNode < currentSystemDateNode) {
    return { label: "Closed", tone: "destructive", urgent: false };
  }

  const calculatedDaysDifferenceNum = Math.ceil(
    (targetedDeadlineDateNode.getTime() - currentSystemDateNode.getTime()) / 86400000,
  );
  if (calculatedDaysDifferenceNum <= 2) {
    return { label: `Closes In ${calculatedDaysDifferenceNum}d`, tone: "destructive", urgent: true };
  }
  if (calculatedDaysDifferenceNum <= 7) {
    return { label: `Closes In ${calculatedDaysDifferenceNum}d`, tone: "warning", urgent: true };
  }

  return {
    label: `Closes ${targetedDeadlineDateNode.toLocaleDateString("en-US", { timeZone: "UTC" })}`,
    tone: "muted",
    urgent: false,
  };
}

function compileSalaryCurrencyLabel(
  minRangeNum: number | null,
  maxRangeNum: number | null,
  currencyStringCode: string | null,
): string | null {
  if (!minRangeNum && !maxRangeNum) return null;
  const verifiedCurrencyCodeStr = currencyStringCode || "BDT";
  const formatQuantumScaleStr = (numericVal: number) =>
    numericVal >= 1000 ? `${(numericVal / 1000).toFixed(0)}K` : `${numericVal}`;

  if (minRangeNum && maxRangeNum) {
    return `${verifiedCurrencyCodeStr} ${formatQuantumScaleStr(minRangeNum)}–${formatQuantumScaleStr(maxRangeNum)}`;
  }
  return `${verifiedCurrencyCodeStr} ${formatQuantumScaleStr((minRangeNum || maxRangeNum) as number)}+`;
}

function parseRawChipsDataArray(variableInputSource: any): string[] {
  if (!variableInputSource) return [];
  if (Array.isArray(variableInputSource)) return variableInputSource.map(String).filter(Boolean);
  if (typeof variableInputSource === "string") {
    return variableInputSource
      .split(/[,;\n]/)
      .map((chipStr) => chipStr.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * GroUp Academy: Authoritative Placement Specification Cockpit Hub (AppJobDetail)
 * Hardened responsive details cockpit analyzing matching telemetry, insulating credit top-up links, and neutralizing local timezone drifts.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppJobDetail() {
  const { id: unverifiedJobIdentifierStr } = useParams<{ id: string }>();
  const navigateHook = useNavigate();
  const [urlSearchParamsMap] = useSearchParams();

  const { talent: talentProfileRecord } = useTalent();
  const { isSaved: checkIsItemSaved, toggleSave: triggerToggleSaveMutation } = useSavedItems();
  const { balance, canAfford, deductCredits } = useCredits();

  const [jobRecordState, setJobRecordState] = React.useState<Job | null>(null);
  const [existingApplicationState, setExistingApplicationState] = React.useState<ExistingApplication | null>(null);
  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);

  const [isExternalApplySheetOpen, setIsExternalApplySheetOpen] = React.useState<boolean>(false);
  const [isScoringMutationPending, setIsScoringMutationPending] = React.useState<boolean>(false);
  const [liveEvaluationScoreState, setLiveEvaluationScoreState] = React.useState<{
    score: number;
    rationale?: string | null;
  } | null>(null);
  const [isDescriptionPanelOpen, setIsDescriptionPanelOpen] = React.useState<boolean>(false);

  const { data: cachedMatchTelemetryPayload } = useJobMatchCached(unverifiedJobIdentifierStr, talentProfileRecord?.id);

  const isCurrentJobSavedFlag = unverifiedJobIdentifierStr
    ? checkIsItemSaved(unverifiedJobIdentifierStr, "job")
    : false;

  const computedDeadlineMeta = React.useMemo<DeadlineMetadata>(() => {
    return compileDeadlineMetadata(jobRecordState?.deadline ?? null);
  }, [jobRecordState?.deadline]);

  const isPositionDeadlineExpired = React.useMemo<boolean>(() => {
    return jobRecordState?.deadline ? isDeadlinePassed(jobRecordState.deadline) : false;
  }, [jobRecordState?.deadline]);

  // =========================================================================
  // LIFECYCLE SECTOR 1: SECURE ATOMIC SYNCHRONIZATION RUNWAY LOOP
  // =========================================================================
  const loadPositionSpecificationsInventory = React.useCallback(
    async (isThreadMountedFlag: { current: boolean }) => {
      if (!unverifiedJobIdentifierStr) return;

      setIsDataLayerLoading(true);
      try {
        const { data: jobQueryPayload, error: jobHandshakeError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", unverifiedJobIdentifierStr)
          .maybeSingle();

        if (jobHandshakeError) throw jobHandshakeError;
        if (!jobQueryPayload) {
          if (isThreadMountedFlag.current) setIsDataLayerLoading(false);
          return;
        }

        if (!isThreadMountedFlag.current) return;
        setJobRecordState(jobQueryPayload as unknown as Job);

        if (talentProfileRecord?.id) {
          const { data: existingApplicationPayload, error: applicationQueryError } = await supabase
            .from("job_applications")
            .select(`id, application_status, job_assessments(id, status)`)
            .eq("job_id", unverifiedJobIdentifierStr)
            .eq("talent_id", talentProfileRecord.id)
            .maybeSingle();

          if (!applicationQueryError && existingApplicationPayload && isThreadMountedFlag.current) {
            const castAppRecord = existingApplicationPayload as unknown as DatabaseApplicationResponse;
            const matchingAssessmentNode = castAppRecord.job_assessments?.[0];

            setExistingApplicationState({
              id: castAppRecord.id,
              application_status: castAppRecord.application_status,
              assessment_id: matchingAssessmentNode?.id,
              assessment_status: matchingAssessmentNode?.status,
            });
          }
        }
      } catch (fatalHandshakeException) {
        toast.error("Failed to compile profile record mapping index.");
      } finally {
        if (isThreadMountedFlag.current) setIsDataLayerLoading(false);
      }
    },
    [unverifiedJobIdentifierStr, talentProfileRecord?.id],
  );

  React.useEffect(() => {
    const isThreadMountedFlag = { current: true };
    loadPositionSpecificationsInventory(isThreadMountedFlag);

    return () => {
      isThreadMountedFlag.current = false;
    };
  }, [unverifiedJobIdentifierStr, loadPositionSpecificationsInventory]);

  // Fire-and-forget analytical user tracking loop
  React.useEffect(() => {
    if (!unverifiedJobIdentifierStr || !talentProfileRecord?.id) return;
    supabase
      .from("job_views")
      .insert({ job_id: unverifiedJobIdentifierStr, talent_id: talentProfileRecord.id })
      .then(() => {
        /* Telemetry logged successfully */
      });
  }, [unverifiedJobIdentifierStr, talentProfileRecord?.id]);

  // =========================================================================
  // ACTION HOOKS: PERSISTENT CREDIT TELEMETRY MUTATION ACTIONS
  // =========================================================================
  const handleIngressApplicationRouteRedirect = React.useCallback(() => {
    if (!jobRecordState) return;

    if (jobRecordState.application_type === "link") {
      const targetExecutionCostCredits = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION?.cost ?? 5;
      if ((balance ?? 0) < targetExecutionCostCredits) {
        toast.error(
          `Transaction blocked. Additional balance volume required: ${targetExecutionCostCredits.toString()} Credits.`,
        );
        return;
      }
      setIsExternalApplySheetOpen(true);
    } else {
      navigateHook(`/app/jobs/${unverifiedJobIdentifierStr}/apply`);
    }
  }, [jobRecordState, unverifiedJobIdentifierStr, balance, navigateHook]);

  const handleScoreVerificationSequence = React.useCallback(async () => {
    if (!unverifiedJobIdentifierStr || !talentProfileRecord?.id) return;
    if (!canAfford("JOB_MATCH_SCORE")) {
      toast.error("Deduction layer rejected. Evaluation requires 10 active credits.");
      return;
    }

    setIsScoringMutationPending(true);
    try {
      const isPaymentSettled = await deductCredits(
        "JOB_MATCH_SCORE",
        unverifiedJobIdentifierStr,
        "Job alignment fit score compilation",
      );
      if (!isPaymentSettled) throw new Error("Credit mapping handshaking failure.");

      const edgeFunctionResponseData: any = await scoreJobMatch({ jobId: unverifiedJobIdentifierStr, talentId: talentProfileRecord.id });

      setLiveEvaluationScoreState({
        score: edgeFunctionResponseData?.match_score ?? 0,
        rationale: edgeFunctionResponseData?.rationale,
      });

      recordToolRun({
        toolKey: "score",
        costCredits: 10,
        jobId: unverifiedJobIdentifierStr,
        payload: { score: edgeFunctionResponseData?.match_score },
      });

      toast.success("Match score ready.");
    } catch (fatalAIEngineException) {
      toast.error("Couldn't score this job right now. Please try again.");
    } finally {
      setIsScoringMutationPending(false);
    }
  }, [unverifiedJobIdentifierStr, talentProfileRecord?.id, canAfford, deductCredits]);

  // Auto-score processing ingest trigger layers
  React.useEffect(() => {
    const isScoreParameterPassed = urlSearchParamsMap.get("score") === "1";
    if (
      isScoreParameterPassed &&
      !cachedMatchTelemetryPayload &&
      !liveEvaluationScoreState &&
      !isScoringMutationPending &&
      jobRecordState &&
      talentProfileRecord?.id
    ) {
      handleScoreVerificationSequence();
    }
  }, [
    urlSearchParamsMap,
    cachedMatchTelemetryPayload,
    liveEvaluationScoreState,
    isScoringMutationPending,
    jobRecordState,
    talentProfileRecord?.id,
    handleScoreVerificationSequence,
  ]);

  const handleShareRegistryCoordinates = React.useCallback(() => {
    if (!jobRecordState) return;
    if (navigator.share) {
      navigator.share({ title: jobRecordState.title, url: window.location.href }).catch(() => {
        /* Thread silent fallback */
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied.");
    }
  }, [jobRecordState]);

  const handleToggleBookmarkMutation = React.useCallback(() => {
    if (jobRecordState) {
      triggerToggleSaveMutation(jobRecordState.id, "job");
    }
  }, [jobRecordState, triggerToggleSaveMutation]);

  // =========================================================================
  // CONDITION LAYOUT ASSIGNMENTS AND RENDER COMPILERS
  // =========================================================================
  if (isDataLayerLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 text-left antialiased block w-full select-none pointer-events-none">
        <Skeleton className="h-8 w-32 rounded-lg block" />
        <Skeleton className="h-28 w-full rounded-xl block shadow-none" />
        <Skeleton className="h-14 w-full rounded-xl block" />
        <Skeleton className="h-44 w-full rounded-xl block" />
      </div>
    );
  }

  if (!jobRecordState) {
    return (
      <div
        role="alert"
        className="min-h-[40vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <AlertCircle className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Job not found</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              This job may have been removed or is no longer visible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const resolvedActiveScoreNum = liveEvaluationScoreState?.score ?? cachedMatchTelemetryPayload?.score ?? null;
  const resolvedRationaleString = liveEvaluationScoreState?.rationale ?? cachedMatchTelemetryPayload?.rationale ?? null;
  const compiledSalaryLabelStr = compileSalaryCurrencyLabel(
    jobRecordState.salary_range_min,
    jobRecordState.salary_range_max,
    jobRecordState.salary_currency,
  );

  const requirementChipsArray = parseRawChipsDataArray(jobRecordState.requirements);
  const niceToHaveChipsArray = parseRawChipsDataArray(jobRecordState.preferred_skills);

  // Reconcile and calculate button layout priorities dynamically
  let buttonLabelString = "Confirm & Proceed to Application";
  let isCtaDisabledFlag = false;
  let computedCtaCallback = handleIngressApplicationRouteRedirect;

  if (isPositionDeadlineExpired) {
    buttonLabelString = "Vetting Closed";
    isCtaDisabledFlag = true;
  } else if (existingApplicationState) {
    if (jobRecordState.ai_assessment_enabled && existingApplicationState.assessment_status !== "completed") {
      buttonLabelString = "Resume Active AI Assessment Task";
      computedCtaCallback = () => {
        if (existingApplicationState.assessment_id) {
          navigateHook(`/app/job-assessment/${existingApplicationState.assessment_id}`);
        } else {
          navigateHook(`/app/applications/${existingApplicationState.id}`);
        }
      };
    } else {
      buttonLabelString = "Inspect Existing Submission Dossier";
      computedCtaCallback = () => navigateHook(`/app/applications/${existingApplicationState.id}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-32 space-y-4 block text-left antialiased transform-gpu w-full">
      {/* HUD LEVEL 1: APPLICATION HEADER MANAGEMENT ACTIONS BAR */}
      <header className="flex items-center justify-between select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 rounded-md font-bold uppercase tracking-wide text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => navigateHook(-1)}
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" /> <span>Return</span>
        </Button>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md cursor-pointer text-muted-foreground/60 hover:text-foreground hover:bg-accent"
            onClick={handleShareRegistryCoordinates}
            title="Share parameters indexing row"
          >
            <Share2 className="h-4 w-4 stroke-[2.2]" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md cursor-pointer hover:bg-accent"
            onClick={handleToggleBookmarkMutation}
            title="Toggle item bookmark ledger flag"
          >
            <Bookmark
              className={cn(
                "h-4 w-4 stroke-[2.2] text-muted-foreground/60 hover:text-foreground",
                isCurrentJobSavedFlag && "fill-current text-primary hover:text-primary",
              )}
            />
          </Button>
        </div>
      </header>

      {/* HUD LEVEL 2: DETAILED ASSIGNMENT MATRICES SOURCE SNAPSHOT */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
        <CardContent className="p-4 space-y-3.5 block w-full leading-none">
          <div className="flex gap-3.5 items-start leading-none w-full block">
            <div className="h-12 w-12 rounded-lg bg-background border border-border/40 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden select-none pointer-events-none">
              {jobRecordState.company_logo_url ? (
                <img src={jobRecordState.company_logo_url} alt="" className="object-cover w-full h-full block" />
              ) : (
                <Building2 className="h-5 w-5 text-primary stroke-[2.2]" />
              )}
            </div>

            <div className="min-w-0 flex-1 leading-none space-y-1 block">
              <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
                {jobRecordState.title}
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/70 truncate block select-text leading-tight">
                {jobRecordState.company_name}
              </p>
              <p className="font-mono text-[9px] sm:text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight block truncate select-none pointer-events-none inline-flex items-center gap-1.5 pt-0.5">
                <MapPin className="h-3 w-3 stroke-[2] shrink-0 text-primary" />{" "}
                <span>LOCALITY: {jobRecordState.location || "Distributed Node Framework"}</span>
              </p>
            </div>

            {jobRecordState.is_featured && (
              <Badge
                variant="outline"
                className="font-mono text-[8px] font-black uppercase px-1.5 h-4.5 rounded-sm border-amber-500/20 bg-amber-500/5 text-amber-600 tracking-wide pt-0.5 shrink-0 select-none pointer-events-none leading-none"
              >
                <Flame className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500 stroke-[1.5]" /> FEATURED RUN
              </Badge>
            )}
          </div>

          {/* Core Telemetry Tag Pills */}
          <div className="flex flex-wrap gap-1.5 select-none pointer-events-none leading-none pt-0.5 w-full block">
            <Badge
              variant="secondary"
              className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border border-border/5"
            >
              <Briefcase className="h-3 w-3 mr-1 text-primary stroke-[2.2]" />{" "}
              {getJobTypeLabel(jobRecordState.job_type).toUpperCase()}
            </Badge>
            <Badge
              variant="secondary"
              className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border border-border/5"
            >
              <IocIconNode className="h-3 w-3 mr-1 text-primary stroke-[2.2]" />{" "}
              {getExperienceLevelLabel(jobRecordState.experience_level).toUpperCase()}
            </Badge>
            {compiledSalaryLabelStr && (
              <Badge
                variant="outline"
                className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded-sm border-primary/20 bg-primary/5 text-primary tracking-wide shrink-0 leading-none pt-0.5"
              >
                {compiledSalaryLabelStr}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded-sm pt-0.5 leading-none shrink-0 border",
                computedDeadlineMeta.tone === "destructive" &&
                  "text-destructive border-destructive/20 bg-destructive/5",
                computedDeadlineMeta.tone === "warning" && "text-amber-600 border-amber-500/20 bg-amber-500/5",
                computedDeadlineMeta.tone === "muted" && "text-muted-foreground/60 border-border bg-card",
              )}
            >
              <Clock className="h-3 w-3 mr-1 stroke-[2.2]" /> {computedDeadlineMeta.label.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* HUD LEVEL 3: RECONCILED AI COMPETABILITY ALIGNMENT STRIP */}
      {talentProfileRecord?.id && (
        <Card className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/[0.01] to-transparent shadow-none overflow-hidden block w-full">
          <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
            <div className="h-10 w-10 rounded-lg bg-background border border-primary/10 flex items-center justify-center shrink-0 shadow-2xs select-none pointer-events-none font-mono">
              {isScoringMutationPending ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin stroke-[2.5]" />
              ) : resolvedActiveScoreNum !== null ? (
                <span className="text-xs font-black text-primary tabular-nums pt-0.5">
                  {Math.round(resolvedActiveScoreNum).toString()}%
                </span>
              ) : (
                <Target className="h-4.5 w-4.5 text-primary stroke-[2]" />
              )}
            </div>

            <div className="flex-1 min-w-0 leading-none space-y-1 block">
              {resolvedActiveScoreNum !== null ? (
                <>
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground select-none pointer-events-none pt-0.5">
                    {resolvedActiveScoreNum >= 75
                      ? "Excellent Capability Fit"
                      : resolvedActiveScoreNum >= 50
                        ? "Sufficient Profile Parity"
                        : "Minimal Alignment Overlap"}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal block select-text line-clamp-1 pr-2">
                    {resolvedRationaleString ||
                      "Algorithmic telemetry computed indexing resume vectors against repository requirements."}
                  </p>
                </>
              ) : (
                <div className="select-none pointer-events-none">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground pt-0.5">
                    Evaluate Synthetic Capability Alignment
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground/50 leading-tight block">
                    Quantum Cost: 10 Credits · Unlocks structural gap analysis manifests & tailored syllabus guidance
                    patches.
                  </p>
                </div>
              )}
            </div>

            {resolvedActiveScoreNum === null && (
              <Button
                type="button"
                size="sm"
                onClick={handleScoreVerificationSequence}
                disabled={isScoringMutationPending}
                className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-3 shrink-0 cursor-pointer shadow-2xs transform-gpu active:scale-[0.985]"
              >
                {isScoringMutationPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Match"}
              </Button>
            )}
          </CardContent>

          {resolvedActiveScoreNum !== null && resolvedRationaleString && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full h-6 border-t border-border/5 text-[10px] font-mono font-black uppercase text-primary tracking-wide pb-1 flex items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-muted/40 outline-none"
                >
                  <span>Deconstruct Rationale Breakdown</span>{" "}
                  <ChevronDown className="h-3 w-3 stroke-[2.2] shrink-0 pt-0.5 animate-bounce" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="animate-in fade-in duration-100">
                <div className="px-4 py-3 text-xs text-muted-foreground/80 font-medium leading-relaxed select-text border-t border-border/5 whitespace-pre-wrap block w-full bg-muted/[0.01]">
                  {resolvedRationaleString}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>
      )}

      {/* HUD LEVEL 4: SYSTEM COMPLIANCE INTERFACE VETTING NUDGES */}
      {existingApplicationState &&
        jobRecordState.ai_assessment_enabled &&
        existingApplicationState.assessment_status !== "completed" && (
          <Card className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] shadow-none overflow-hidden block w-full">
            <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
              <AlertCircle className="h-5 w-5 text-amber-500 stroke-[2.2] shrink-0 select-none pointer-events-none animate-pulse" />
              <div className="flex-1 min-w-0 leading-none space-y-1 block select-none pointer-events-none">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground">
                  AI Interview Telemetry Action Required
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground/60 leading-tight block">
                  Complete the dynamic skill mapping exam sequence to release your portfolio map.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={computedCtaCallback}
                className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider px-3.5 shrink-0 cursor-pointer shadow-2xs transform-gpu active:scale-[0.985]"
              >
                Initialize
              </Button>
            </CardContent>
          </Card>
        )}

      {/* HUD LEVEL 5: ABSTRACT POSITION FUNCTIONAL DESCRIPTION BLOCK */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
        <CardContent className="p-4 space-y-2 block w-full leading-none">
          <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
            Role Core Specification Description
          </h2>
          <Collapsible
            open={isDescriptionPanelOpen}
            onOpenChange={setIsDescriptionPanelOpen}
            className="w-full block pt-1"
          >
            <div
              className={cn(
                "text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed select-text whitespace-pre-wrap block tracking-normal",
                !isDescriptionPanelOpen && "line-clamp-6",
              )}
            >
              {jobRecordState.ai_enhanced_description || jobRecordState.description}
            </div>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="mt-2.5 font-mono text-[10px] font-black uppercase text-primary tracking-wide flex items-center gap-1 cursor-pointer hover:underline outline-none"
              >
                <span>
                  {isDescriptionPanelOpen ? "Contract Specification Abstract" : "Decompress Full Narrative Record"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 stroke-[2.2] transition-transform",
                    isDescriptionPanelOpen && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>

      {/* HUD LEVEL 6: TECHNICAL DEMAND PREREQUISITES PILL STRIPS */}
      {requirementChipsArray.length > 0 && (
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
          <CardContent className="p-4 space-y-3.5 block w-full leading-none">
            <p className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
              Core Technical Competency Requirements
            </p>
            <div className="flex flex-wrap gap-1.5 select-none pointer-events-none block w-full mt-1">
              {requirementChipsArray.map((chipLabelStr, arrayIdx) => (
                <Badge
                  key={`required-competency-pill-${arrayIdx}`}
                  variant="secondary"
                  className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded border border-border/40 bg-background text-muted-foreground/60 leading-none pt-0.5"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1 text-primary stroke-[2] shrink-0" />
                  <span>{chipLabelStr}</span>
                </Badge>
              ))}
            </div>

            {niceToHaveChipsArray.length > 0 && (
              <div className="space-y-2 pt-1 block w-full leading-none">
                <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block select-none pointer-events-none leading-none">
                  Secondary Preferred Differentiator Vectors
                </p>
                <div className="flex flex-wrap gap-1.5 select-none pointer-events-none block w-full">
                  {niceToHaveChipsArray.map((chipLabelStr, arrayIdx) => (
                    <Badge
                      key={`preferred-competency-pill-${arrayIdx}`}
                      variant="outline"
                      className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded border-border/40 bg-card/50 text-muted-foreground/50 leading-none pt-0.5"
                    >
                      {chipLabelStr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 7: PARENT EMPLOYMENT BRAND MATRIX CARD */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
        <CardContent className="p-3.5 flex items-center justify-between gap-4 leading-none w-full block">
          <div className="h-10 w-10 rounded-lg bg-background border border-border/40 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden select-none pointer-events-none">
            {jobRecordState.company_logo_url ? (
              <img src={jobRecordState.company_logo_url} alt="" className="object-cover w-full h-full block" />
            ) : (
              <Building2 className="h-4.5 w-4.5 text-primary/60 stroke-[2]" />
            )}
          </div>
          <div className="flex-1 min-w-0 leading-none space-y-1 block">
            <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide truncate block pt-0.5 select-text">
              {jobRecordState.company_name}
            </p>
            <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight block select-none pointer-events-none tabular-nums leading-none">
              TRANSMISSION TIMELINE SIGNED:{" "}
              {formatDistanceToNow(new Date(jobRecordState.created_at), { addSuffix: true }).toUpperCase()}
            </p>
          </div>
          {jobRecordState.company_id && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateHook(`/jobs?company=${encodeURIComponent(jobRecordState.company_name)}`)}
              className="h-8 w-8 rounded-lg border border-border/10 p-0 text-muted-foreground/50 hover:text-foreground hover:bg-accent cursor-pointer shadow-none shrink-0 block"
              title="Filter placements index catalog by brand marker"
            >
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] mx-auto block" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* HUD LEVEL 8: DISCRETE RECOMMENDATION GRIDS ALIGNMENT VECTOR */}
      <RelatedJobs
        currentJobId={jobRecordState.id}
        companyName={jobRecordState.company_name}
        location={jobRecordState.location || "Distributed Node"}
        linkPrefix="/app/jobs"
      />

      {/* HUD LEVEL 9: STICKY SUBMISSION CONTROLLER FOOTER HUB BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-md select-none pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4 leading-none w-full block">
          <div className="flex-1 min-w-0 leading-none space-y-1 block font-mono text-[10px] font-black uppercase tracking-tight">
            <p
              className={cn(
                "leading-none block flex items-center gap-1 pt-0.5 shrink-0",
                computedDeadlineMeta.tone === "destructive" && "text-destructive",
                computedDeadlineMeta.tone === "warning" && "text-amber-600",
                computedDeadlineMeta.tone === "muted" && "text-muted-foreground/50",
              )}
            >
              <Clock className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span>{computedDeadlineMeta.label}</span>
            </p>
            {existingApplicationState && (
              <p className="text-muted-foreground/40 block leading-none truncate shrink-0 max-w-[140px] sm:max-w-xs">
                <Sparkles className="h-3.5 w-3.5 stroke-[2] shrink-0 mr-0.5 text-primary" />
                <span>REGISTRY ROW STATE: {existingApplicationState.application_status.toUpperCase()}</span>
              </p>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            disabled={isCtaDisabledFlag}
            onClick={computedCtaCallback}
            className="shrink-0 h-11 px-5 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
          >
            <span>{buttonLabelString}</span>
            {!isCtaDisabledFlag && <ArrowRight className="h-4 w-4 stroke-[2.5] shrink-0" />}
          </Button>
        </div>
      </div>

      {isExternalApplySheetOpen && jobRecordState.application_url && (
        <ExternalApplicationPrep
          open={isExternalApplySheetOpen}
          onOpenChange={setIsExternalApplySheetOpen}
          jobId={jobRecordState.id}
          applicationUrl={jobRecordState.application_url}
          jobTitle={jobRecordState.title}
          companyName={jobRecordState.company_name}
        />
      )}

    </div>
  );
}

// Macro typing helper abstraction injecting core icons defensively without rendering cascades
function IocIconNode({ className }: { className?: string }) {
  return <Briefcase className={className} />;
}
