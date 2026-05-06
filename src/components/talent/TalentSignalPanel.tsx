import { BadgeCheck, Award, Trophy, Layers, Sparkles, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentOutcomeSignal } from "@/hooks/useTalentOutcomeSignal";
import { cn } from "@/lib/utils";

const LEVEL_ICON = {
  foundational: BadgeCheck,
  proficient: Award,
  expert: Trophy,
} as const;

const LEVEL_TONE = {
  foundational: "text-primary bg-primary/10 border-primary/30",
  proficient: "text-success-green bg-success-green/10 border-success-green/30",
  expert: "text-amber-500 bg-amber-500/10 border-amber-500/30",
} as const;

interface Props {
  talentId?: string | null;
  compact?: boolean;
  className?: string;
}

/**
 * Unified panel surfacing a talent's verified skills, completed tracks,
 * mastery summary, and learning recency. Used in CRM context rail,
 * employer pipeline, /jobs match panels, etc.
 */
export function TalentSignalPanel({ talentId, compact, className }: Props) {
  const { signal, loading } = useTalentOutcomeSignal(talentId);

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!signal) return null;

  const skills = signal.verified_skills.slice(0, compact ? 4 : 12);
  const tracks = signal.tracks_completed.slice(0, compact ? 2 : 6);
  const recent = signal.learning_recency_score >= 0.7;
  const ms = signal.mastery_summary;

  if (!skills.length && !tracks.length && !ms?.tracked_topics) {
    return null;
  }

  return (
    <div className={cn("space-y-3 text-sm", className)}>
      {recent && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-green/10 border border-success-green/30 text-success-green text-[11px]">
          <Activity className="h-3 w-3" />
          Active learner
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Verified skills
          </div>
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => {
              const Icon = LEVEL_ICON[s.level] ?? BadgeCheck;
              return (
                <span
                  key={s.id}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]",
                    LEVEL_TONE[s.level],
                  )}
                  title={`${s.level} — mastery ${(s.mastery_at_issue * 100).toFixed(0)}%`}
                >
                  <Icon className="h-3 w-3" />
                  {s.topic_tag}
                </span>
              );
            })}
            {signal.verified_skills.length > skills.length && (
              <span className="text-[11px] text-slate-400">
                +{signal.verified_skills.length - skills.length} more
              </span>
            )}
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Completed tracks
          </div>
          <ul className="space-y-1">
            {tracks.map((t) => (
              <li
                key={t.assignment_id}
                className="flex items-center gap-2 text-xs text-slate-200"
              >
                {t.sponsor_company_logo ? (
                  <img
                    src={t.sponsor_company_logo}
                    alt=""
                    className="h-4 w-4 rounded-sm object-cover"
                  />
                ) : (
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span className="truncate">{t.track_title}</span>
                {t.sponsor_company_name && (
                  <span className="text-slate-500 text-[11px] truncate">
                    · {t.sponsor_company_name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ms && ms.tracked_topics > 0 && !compact && (
        <div className="text-[11px] text-slate-400">
          <Sparkles className="inline h-3 w-3 mr-1 text-[#33E1E4]" />
          {ms.tracked_topics} topics tracked · avg mastery{" "}
          {(ms.avg_mastery * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
