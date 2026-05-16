import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Clock, Bookmark, Star, Banknote, Brain, Zap, ShieldCheck } from "lucide-react";
import { VerifiedMatchBadge } from "@/components/jobs/VerifiedMatchBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import {
  JOB_TYPE_COLORS,
  getJobTypeLabel,
  getExperienceLevelLabel,
  isDeadlineUrgent,
  isDeadlinePassed,
} from "@/lib/constants/jobTypes";

/**
 * GroUp Academy: Professional Opportunities Node (JobCard)
 * CTO Reference: Authoritative component for job lead visualization and AI matching.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

export interface JobCardData {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level?: string;
  is_featured?: boolean;
  created_at: string;
  deadline?: string | null;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
}

export interface JobMatchInfo {
  match_score: number;
  reason: string;
  match_reason?: "verified_skill" | "keyword" | "location_only";
  verified_match?: {
    mastery_score?: number;
    verified_credentials?: Array<{ topic_tag: string; level: string; verify_code?: string }>;
  } | null;
}

interface JobCardProps {
  job: JobCardData;
  variant?: "default" | "compact" | "featured";
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onClick: () => void;
  className?: string;
  matchInfo?: JobMatchInfo;
  whyChip?: string;
}

export function JobCard({
  job,
  variant = "default",
  isSaved = false,
  onSaveToggle,
  onClick,
  className,
  matchInfo,
  whyChip,
}: JobCardProps) {
  const queryClient = useQueryClient();
  const isCompact = variant === "compact";
  const isClosed = isDeadlinePassed(job.deadline || null);
  const [logoError, setLogoError] = useState(false);

  // Monitor opportunity visibility impressions safely via analytics tokens
  useEffect(() => {
    if (job?.id) {
      trackEvent("opportunity_card_item_rendered", {
        jobId: job.id,
        variantMode: variant,
        isFeaturedJob: !!job.is_featured,
        hasMatchScore: !!matchInfo,
      });
    }
  }, [job, variant, matchInfo]);

  if (!job || !job.id || !job.title) {
    trackError("JobCard component mounted without explicit model anchors.", {
      component: "JobCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleRowContainerClick = () => {
    if (isClosed) return;
    trackEvent("opportunity_card_container_clicked", { jobId: job.id, variantMode: variant });
    try {
      onClick();
    } catch (err) {
      trackError(err, {
        component: "JobCard",
        action: "execute_onClick_navigation_callback",
        jobId: job.id,
      });
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!onSaveToggle) return;

    trackEvent("opportunity_card_save_toggled", {
      jobId: job.id,
      transitionToSavedState: !isSaved,
    });

    try {
      await onSaveToggle();

      // Automated Efficiency: Synchronize cache pools instantly across parallel views
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      queryClient.invalidateQueries({ queryKey: ["ranked-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err, {
        component: "JobCard",
        action: "execute_onSaveToggle_callback",
        jobId: job.id,
      });
    }
  };

  const formatSalarySync = () => {
    if (!job.salary_range_min && !job.salary_range_max) return null;
    const currency = job.salary_currency || "BDT";
    const symbol = currency === "USD" ? "$" : currency === "BDT" ? "৳" : currency;
    const isPrefix = currency === "USD";

    const formatProtocol = (num: number | null | undefined) => {
      if (!num) return "";
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toString();
    };

    const min = formatProtocol(job.salary_range_min);
    const max = formatProtocol(job.salary_range_max);

    if (min && max) {
      return isPrefix ? `${symbol}${min}-${symbol}${max}` : `${min}-${max}${symbol}`;
    }
    const val = min || max;
    return isPrefix ? `${symbol}${val}` : `${val}${symbol}`;
  };

  const dynamicSalaryStringValue = formatSalarySync();

  // VIEW MODE A: COMPACT VIEW MATRIX TRACK
  if (isCompact) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden transition-all duration-300 border border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/30 shadow-sm w-full transform-gpu group focus-visible:ring-2 focus-visible:ring-ring select-none sm:select-text",
          isClosed && "opacity-40 grayscale pointer-events-none select-none",
          className,
        )}
        onClick={handleRowContainerClick}
      >
        <CardContent className="p-3.5 flex items-center justify-between gap-3.5 w-full min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
            {/* Branded Profile Identity Logo Element */}
            <div className="w-10 h-10 rounded-xl bg-background border border-border/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner select-none">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={`${job.company_name} corporate identification logo`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-4 h-4 text-primary/40 stroke-[2.2]" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 text-left">
              <h3 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight truncate leading-tight group-hover:text-primary transition-colors w-full break-all">
                {job.title}
              </h3>
              <p className="text-[11px] font-bold text-muted-foreground/80 truncate w-full tracking-tight">
                {job.company_name}
              </p>
              {whyChip && (
                <p className="text-[10px] font-semibold text-primary/80 italic truncate w-full select-text selection:bg-primary/10 mt-0.5 leading-none">
                  &ldquo;{whyChip}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 select-none">
            {matchInfo && (
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 gap-1 text-[10px] h-5.5 px-2 font-extrabold shadow-sm tabular-nums"
              >
                <Brain className="w-3 h-3 fill-primary/5 stroke-[2.2]" />
                <span>{matchInfo.match_score}% Fit</span>
              </Badge>
            )}

            {matchInfo?.match_reason === "verified_skill" && (
              <VerifiedMatchBadge
                compact
                credentials={matchInfo.verified_match?.verified_credentials}
                masteryScore={matchInfo.verified_match?.mastery_score}
              />
            )}

            <Badge
              variant="secondary"
              className={cn(
                "text-[9px] font-extrabold h-5.5 px-2 uppercase tracking-wide rounded-md border-none select-none",
                JOB_TYPE_COLORS[job.job_type],
              )}
            >
              {getJobTypeLabel(job.job_type)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // VIEW MODE B: DEFAULT STANDALONE VIEW MATRIX PORTAL
  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-all duration-300 group h-full flex flex-col relative border border-border/40 select-none sm:select-text transform-gpu shadow-sm rounded-2xl",
        "bg-card/40 backdrop-blur-md hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring outline-none",
        job.is_featured && "border-amber-500/20 bg-amber-500/[0.01] dark:bg-amber-500/[0.003] shadow-inner",
        isClosed && "opacity-40 grayscale pointer-events-none select-none",
        className,
      )}
      onClick={handleRowContainerClick}
    >
      <CardContent className="p-5 sm:p-5.5 flex flex-col h-full space-y-4.5 text-left w-full min-w-0">
        {/* HUD LEVEL 1: CORPORATE DENSITY IDENTITY ELEMENT */}
        <div className="flex justify-between items-start gap-3.5 w-full min-w-0">
          <div className="flex gap-3.5 items-center flex-1 min-w-0 text-left">
            <div className="w-13 h-13 rounded-2xl bg-background border border-border/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-102 group-hover:rotate-1 select-none">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={`${job.company_name} organization branded logo`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground/30 stroke-[2.2]" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5 text-left">
              <h3 className="font-bold text-sm sm:text-base text-foreground/90 tracking-tight group-hover:text-primary transition-colors leading-snug truncate pr-1 break-all w-full">
                {job.title}
              </h3>
              <div className="flex items-center gap-1.5 leading-none w-full truncate select-none">
                <p className="text-xs font-semibold text-muted-foreground/80 truncate max-w-[85%]">
                  {job.company_name}
                </p>
                {job.is_featured && (
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-500/10 shrink-0 animate-pulse drop-shadow-[0_1px_4px_rgba(245,158,11,0.2)]" />
                )}
              </div>
            </div>
          </div>

          {/* Stash / Bookmark Intercept Control Trigger */}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="shrink-0 h-9 w-9 rounded-xl border border-border/40 hover:border-primary/20 bg-background/40 hover:bg-primary/5 active:scale-90 transition-all shadow-sm cursor-pointer select-none"
            onClick={handleSaveClick}
            aria-label={
              isSaved
                ? `Remove ${job.title} from saved pipeline logs`
                : `Save ${job.title} into tracking dashboard folder`
            }
          >
            <Bookmark
              className={cn(
                "h-4.5 w-4.5 stroke-[2.2] transition-transform duration-300",
                isSaved
                  ? "fill-primary text-primary scale-105 drop-shadow-[0_1px_4px_rgba(var(--primary-rgb),0.2)]"
                  : "text-muted-foreground/50",
              )}
            />
          </Button>
        </div>

        {/* HUD LEVEL 2: COMPLIANCE REASONING PROFILE TEXT */}
        {matchInfo && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden select-text text-left w-full min-w-0">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none select-none">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5 fill-primary/5 stroke-[2.2] opacity-70" />
            <div className="space-y-1 flex-1 min-w-0 leading-none">
              <div className="flex items-center justify-between gap-4 select-none leading-none w-full">
                <p className="text-[9px] font-bold uppercase tracking-wider text-primary/80 pl-0.5">
                  AI Alignment Evaluation
                </p>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-[9px] font-extrabold h-4.5 px-2 rounded-md shadow-sm select-none tabular-nums"
                >
                  {matchInfo.match_score}% compliance fit
                </Badge>
              </div>
              <p className="text-xs font-semibold text-foreground/80 line-clamp-2 leading-relaxed mt-1 break-words select-text selection:bg-primary/10">
                {matchInfo.reason}
              </p>
            </div>
          </div>
        )}

        {matchInfo?.match_reason === "verified_skill" && (
          <VerifiedMatchBadge
            credentials={matchInfo.verified_match?.verified_credentials}
            masteryScore={matchInfo.verified_match?.mastery_score}
          />
        )}

        {/* HUD LEVEL 3: METADATA COMPLIANCE BADGE STRIP ROW */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none w-full max-w-full">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-extrabold uppercase tracking-wide px-2.5 h-6 rounded-md border shadow-sm select-none shrink-0",
              JOB_TYPE_COLORS[job.job_type],
            )}
          >
            {getJobTypeLabel(job.job_type)}
          </Badge>

          {dynamicSalaryStringValue && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold px-2.5 h-6 rounded-md border border-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 tabular-nums tracking-wide shadow-sm shrink-0 flex items-center gap-1"
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[2.2]" />
              <span>{dynamicSalaryStringValue}</span>
            </Badge>
          )}

          {job.is_featured && (
            <Badge className="bg-amber-500 border-none h-6 px-2.5 rounded-md text-[9px] font-bold tracking-wide uppercase shadow-sm select-none gap-1 shrink-0 text-white">
              <Star className="w-3 h-3 fill-current shrink-0 stroke-[2.2]" />
              <span>Featured</span>
            </Badge>
          )}
        </div>

        {/* HUD LEVEL 4: SPATIAL GEOGRAPHY FOOTER BANNER STRIP */}
        <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto border-t border-border/10 select-none text-xs text-muted-foreground/80 font-bold tracking-tight tabular-nums w-full">
          <div className="flex items-center gap-1 truncate max-w-[65%] text-left">
            <MapPin className="h-3.5 w-3.5 text-primary stroke-[2.2] shrink-0" />
            <span className="truncate text-ellipsis select-text select-none pl-0.5">
              {job.location || "Remote Deployment"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-medium bg-muted/20 px-2 py-0.5 border border-border/20 rounded-full text-muted-foreground text-[11px] lowercase">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.2]" />
            <span>
              staged {new Date(job.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
