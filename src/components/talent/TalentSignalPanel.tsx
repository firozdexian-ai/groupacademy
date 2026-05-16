import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Award, Trophy, Layers, Sparkles, Activity, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTalentOutcomeSignal } from "@/hooks/useTalentOutcomeSignal";
import { ActiveInstructorChip } from "./ActiveInstructorChip";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

const LEVEL_ICON = {
  foundational: BadgeCheck,
  proficient: Award,
  expert: Trophy,
} as const;

const LEVEL_TONE = {
  foundational: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/15",
  proficient: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
  expert: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/15",
} as const;

interface VerifiedSkillNode {
  id: string;
  level: "foundational" | "proficient" | "expert";
  topic_tag: string;
  mastery_at_issue: number;
}

interface CompletedTrackNode {
  assignment_id: string;
  track_title: string;
  sponsor_company_logo: string | null;
  sponsor_company_name: string | null;
}

interface MasterySummaryNode {
  tracked_topics: number;
  avg_mastery: number;
}

interface Props {
  talentId?: string | null;
  compact?: boolean;
  className?: string;
}

/**
 * GroUp Academy: Talent Readiness Outcome Signal Panel (TalentSignalPanel)
 * An authoritative operational telemetry widget surfacing verified skills, performance tracks, and mastery scores.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function TalentSignalPanel({ talentId, compact = false, className }: Props) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    if (talentId) {
      trackEvent("talent_signal_panel_mounted", { talentId, isCompact: compact });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [talentId, compact]);

  const { signal, loading: isSignalLoading, error: signalQueryFetchError } = useTalentOutcomeSignal(talentId);

  // Route telemetry collection faults directly to monitoring channels
  useEffect(() => {
    if (signalQueryFetchError) {
      trackError(signalQueryFetchError, { component: "TalentSignalPanel", action: "fetch_outcome_signal", talentId });
    }
  }, [signalQueryFetchError, talentId]);

  // Defensive Normalization Pass: Verify array architectures ahead of layout mappings
  const synchronizedSignalModel = useMemo(() => {
    if (!signal) return null;

    const validatedSkillsArray = (
      Array.isArray(signal.verified_skills) ? signal.verified_skills : []
    ) as VerifiedSkillNode[];
    const validatedTracksArray = (
      Array.isArray(signal.tracks_completed) ? signal.tracks_completed : []
    ) as CompletedTrackNode[];
    const recencyScoreValueNum = Number(signal.learning_recency_score) || 0;

    const targetedSkillsMaxLimitNum = compact ? 4 : 12;
    const targetedTracksMaxLimitNum = compact ? 2 : 6;

    const masterySummaryObj = signal.mastery_summary as MasterySummaryNode | null;

    return {
      skillsSlice: validatedSkillsArray.slice(0, targetedSkillsMaxLimitNum),
      tracksSlice: validatedTracksArray.slice(0, targetedTracksMaxLimitNum),
      hasRecentActivity: recencyScoreValueNum >= 0.7,
      masterySummary: masterySummaryObj,
      rawSkillsLength: validatedSkillsArray.length,
      rawTracksLength: validatedTracksArray.length,
    };
  }, [signal, compact]);

  const shouldRenderComponentNode = useMemo(() => {
    if (!synchronizedSignalModel) return false;
    return (
      synchronizedSignalModel.skillsSlice.length > 0 ||
      synchronizedSignalModel.tracksSlice.length > 0 ||
      !!(synchronizedSignalModel.masterySummary && synchronizedSignalModel.masterySummary.tracked_topics > 0)
    );
  }, [synchronizedSignalModel]);

  // =========================================================================
  // INTERFACE PROTOCOL VIEW 1: SKELETON PLACEHOLDER LOADER TILES
  // =========================================================================
  if (isSignalLoading) {
    return (
      <div className={cn("space-y-3 text-left w-full select-none transform-gpu antialiased", className)}>
        <Skeleton className="h-4 w-28 bg-muted-foreground/10 rounded" />
        <Skeleton className="h-10 w-full bg-muted-foreground/10 rounded-lg" />
      </div>
    );
  }

  if (!synchronizedSignalModel || !shouldRenderComponentNode) return null;

  return (
    <div
      className={cn(
        "space-y-4 text-left w-full transform-gpu antialiased font-bold text-xs select-none sm:select-text",
        className,
      )}
    >
      {/* HUD LEVEL 1: TRACK SIGNAL ACTIVITY BADGE MARKS ROW */}
      <div className="flex flex-wrap gap-2 items-center w-full shrink-0">
        {synchronizedSignalModel.hasRecentActivity && (
          <Badge
            variant="outline"
            className="rounded px-2 h-5.5 text-[9px] font-extrabold tracking-wider uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 flex items-center leading-none shadow-xs shrink-0 cursor-help"
            title="Active learner node verification — active platform metrics observed within the past 30 days"
          >
            <Activity className="h-3 w-3 stroke-[2.5] shrink-0" />
            <span className="pt-0.5 block">Active Learner</span>
          </Badge>
        )}
        <ActiveInstructorChip talentId={talentId} />
      </div>

      {/* HUD LEVEL 2: EXTRACTED SKILL PROFICIENCY CREDENTIAL BADGES GRID */}
      {synchronizedSignalModel.skillsSlice.length > 0 && (
        <div className="space-y-1.5 w-full min-w-0">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/50 block leading-none">
            Verified Skill Capabilities
          </span>

          <div className="flex flex-wrap gap-1.5 items-center w-full">
            {synchronizedSignalModel.skillsSlice.map((skillItem) => {
              if (!skillItem || !skillItem.id) return null;

              const OperationalLevelIcon = LEVEL_ICON[skillItem.level] || BadgeCheck;
              const formattedPercentValueStr = (Number(skillItem.mastery_at_issue) * 100).toFixed(0);

              return (
                <Badge
                  key={skillItem.id}
                  variant="outline"
                  className={cn(
                    "rounded px-2 h-5.5 text-[10px] font-semibold tracking-wide uppercase border gap-1 flex items-center leading-none shadow-xs shrink-0 transform-gpu cursor-help",
                    LEVEL_TONE[skillItem.level] || LEVEL_TONE.foundational,
                  )}
                  title={`Mastery coefficient rated at ${formattedPercentValueStr}% parity inside this technical domain.`}
                >
                  <OperationalLevelIcon className="h-3 w-3 stroke-[2.5] shrink-0" />
                  <span className="pt-0.5 block tracking-normal font-medium">{skillItem.topic_tag}</span>
                </Badge>
              );
            })}

            {synchronizedSignalModel.rawSkillsLength > synchronizedSignalModel.skillsSlice.length && (
              <span className="text-[10px] font-mono font-bold text-muted-foreground/40 uppercase tracking-wide select-none block h-5 pt-1.5 leading-none shrink-0 pl-0.5">
                +{synchronizedSignalModel.rawSkillsLength - synchronizedSignalModel.skillsSlice.length} alternative
                domains Mapped
              </span>
            )}
          </div>
        </div>
      )}

      {/* HUD LEVEL 3: SYLLABUS TRACK COMPLETION ASSIGNMENT SUITE ROWS */}
      {synchronizedSignalModel.tracksSlice.length > 0 && (
        <div className="space-y-2 w-full min-w-0">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted-foreground/50 block leading-none select-none">
            Completed Syllabus Tracks
          </span>

          <ul className="space-y-1.5 w-full min-w-0 font-medium text-xs leading-none list-none p-0 m-0 flex flex-col">
            {synchronizedSignalModel.tracksSlice.map((trackItem) => {
              if (!trackItem || !trackItem.assignment_id) return null;

              return (
                <li
                  key={trackItem.assignment_id}
                  className="flex items-center gap-2.5 text-xs text-foreground/80 leading-none h-5 select-text w-full min-w-0"
                >
                  {trackItem.sponsor_company_logo ? (
                    <img
                      src={trackItem.sponsor_company_logo}
                      alt=""
                      loading="lazy"
                      className="h-4 w-4 rounded bg-background border border-border/10 object-cover shrink-0 select-none pointer-events-none"
                    />
                  ) : (
                    <Layers className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.2] shrink-0 select-none" />
                  )}

                  <span className="truncate text-ellipsis font-bold block leading-none pt-0.5 max-w-full select-all">
                    {trackItem.track_title}
                  </span>

                  {trackItem.sponsor_company_name && (
                    <span className="text-[10px] font-mono text-muted-foreground/50 truncate text-ellipsis block leading-none pt-0.5 pl-0.5 selection:bg-primary/10">
                      &bull; {trackItem.sponsor_company_name.trim()}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* HUD LEVEL 4: SPARK OVERALL PROGRESS CALIBRATION INSIGHT ROW */}
      {synchronizedSignalModel.masterySummary &&
        synchronizedSignalModel.masterySummary.tracked_topics > 0 &&
        !compact && (
          <div className="text-[10px] font-mono font-extrabold text-muted-foreground/50 uppercase tracking-wide flex items-center gap-1.5 w-full select-none border-t border-border/10 pt-2.5 mt-1 leading-none shrink-0 h-5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-500 fill-cyan-500/10 stroke-[2.2] shrink-0 animate-pulse" />
            <span>
              {synchronizedSignalModel.masterySummary.tracked_topics} technical topic blocks evaluated &bull; Average
              mastery yield calibration: {(Number(synchronizedSignalModel.masterySummary.avg_mastery) * 100).toFixed(0)}
              % Parity
            </span>
          </div>
        )}
    </div>
  );
}
