import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Flame,
  Trophy,
  Sparkles,
  AlertTriangle,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface SectionConfigItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StreakRecord {
  id: string;
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  xp_total: number;
  updated_at: string;
}

interface MockAttemptNode {
  id: string;
  section: "listening" | "reading" | "writing" | "speaking" | string;
  ai_band_score: number | null;
  created_at: string;
}

interface PromptRelationNode {
  id: string;
  prompt_text: string | null;
}

interface DailyChallengePayload {
  id: string;
  challenge_date: string;
  section: string;
  prompt_id: string;
  ielts_prompts: PromptRelationNode | null;
}

const MODULES_SECTIONS: SectionConfigItem[] = [
  {
    id: "listening",
    name: "Listening",
    icon: Headphones,
    color: "text-blue-600 border-blue-500/10 bg-blue-500/[0.01]",
  },
  {
    id: "reading",
    name: "Reading",
    icon: BookOpen,
    color: "text-emerald-600 border-emerald-500/10 bg-emerald-500/[0.01]",
  },
  { id: "writing", name: "Writing", icon: PenTool, color: "text-amber-600 border-amber-500/10 bg-amber-500/[0.01]" },
  { id: "speaking", name: "Speaking", icon: Mic, color: "text-rose-600 border-rose-500/10 bg-rose-500/[0.01]" },
];

const SKELETON_ROWS_ROSTER = [1, 2, 3];

/**
 * GroUp Academy: AI IELTS Coach & Language Evaluation Core (IELTSCoach)
 * Hardened preparation center isolating user metric deltas and guarding inline aggregations from thread re-paint thrashes.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function IELTSCoach() {
  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: userStreakRecord, isLoading: isStreakCacheResolving } = useQuery<StreakRecord | null>({
    queryKey: ["app-ielts-attendance-streak"],
    queryFn: async (): Promise<StreakRecord | null> => {
      const { data: authUserResponse, error: authUserError } = await supabase.auth.getUser();
      if (authUserError || !authUserResponse?.user) return null;

      const { data: dbStreakRow, error: queryHandshakeError } = await supabase
        .from("ielts_streaks")
        .select("id, user_id, current_streak_days, longest_streak_days, xp_total, updated_at")
        .eq("user_id", authUserResponse.user.id)
        .maybeSingle();

      if (queryHandshakeError) throw queryHandshakeError;
      return dbStreakRow as unknown as StreakRecord | null;
    },
  });

  const { data: recentAttemptsCollection = [], isLoading: isRecentCacheResolving } = useQuery<MockAttemptNode[]>({
    queryKey: ["app-ielts-historical-mock-attempts"],
    queryFn: async (): Promise<MockAttemptNode[]> => {
      const { data: dbAttemptsPayload, error: queryHandshakeError } = await supabase
        .from("ielts_mock_attempts")
        .select("id, section, ai_band_score, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (queryHandshakeError) throw queryHandshakeError;
      return (dbAppealsPayload as unknown as MockAttemptNode[]) ?? [];
    },
  });

  const { data: dailyChallengePayload, isLoading: isDailyChallengeCacheResolving } =
    useQuery<DailyChallengePayload | null>({
      queryKey: ["app-ielts-daily-synchronized-challenge"],
      queryFn: async (): Promise<DailyChallengePayload | null> => {
        // Pin localized timestamp vectors cleanly avoiding local machine offsets execution variations
        const compiledSystemDateString = new Date().toISOString().slice(0, 10);

        const { data: dbChallengeRow, error: queryHandshakeError } = await supabase
          .from("ielts_daily_challenges")
          .select("id, challenge_date, section, prompt_id, ielts_prompts(id, prompt_text)")
          .eq("challenge_date", compiledSystemDateString)
          .maybeSingle();

        if (queryHandshakeError) throw queryHandshakeError;
        return dbChallengeRow as unknown as DailyChallengePayload | null;
      },
    });

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: SECURE SECTOR FILTER ANALYSIS MATRICES
  // =========================================================================
  const calculatedWeakestSectionItem = React.useMemo<MockAttemptNode | null>(() => {
    if (!recentAttemptsCollection || recentAttemptsCollection.length === 0) return null;

    return recentAttemptsCollection.reduce((accMinimumNode: MockAttemptNode | null, currentAttemptItem) => {
      if (currentAttemptItem.ai_band_score === null) return accMinimumNode;
      if (!accMinimumNode || accMinimumNode.ai_band_score === null) return currentAttemptItem;

      return currentAttemptItem.ai_band_score < accMinimumNode.ai_band_score ? currentAttemptItem : accMinimumNode;
    }, null);
  }, [recentAttemptsCollection]);

  const isCohesiveLayoutLoading = isStreakCacheResolving || isRecentCacheResolving || isDailyChallengeCacheResolving;

  if (isCohesiveLayoutLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 select-none pointer-events-none w-full block animate-pulse">
        <Skeleton className="h-9 w-44 rounded-lg block" />
        <Skeleton className="h-28 w-full rounded-lg bg-card/10 block border border-transparent shadow-none" />
        <div className="grid grid-cols-2 gap-2.5 w-full block">
          {SKELETON_ROWS_ROSTER.slice(0, 2).map((idx) => (
            <Skeleton key={`ielts-skeleton-card-cell-${idx}`} className="h-24 w-full rounded-lg block" />
          ))}
        </div>
      </div>
    );
  }

  const fallbackStreakCountInt = userStreakRecord?.current_streak_days ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-5 text-left antialiased block transform-gpu w-full pb-32">
      {/* HUD LEVEL 1: ADMINISTRATIVE DIRECTORY CONTROLS MODULE PANELS */}
      <header className="flex items-center justify-between gap-4 select-none pointer-events-none leading-none w-full shrink-0 border-b border-border/5 pb-2.5">
        <div className="min-w-0 flex-1 leading-none space-y-1 block">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground leading-none m-0">
            AI IELTS Training Cockpit
          </h1>
          <p className="font-mono text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight block leading-none pt-0.5">
            Execute language performance verification modules synchronized to CEFR scoring matrices.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="font-mono text-[9px] font-black uppercase px-2 h-5.5 rounded border border-orange-500/10 bg-orange-500/5 text-orange-600 tracking-wide pt-0.5 leading-none shrink-0"
        >
          <Flame className="h-3 w-3 mr-1 text-orange-500 fill-orange-500/20 inline-block align-middle" />
          <span className="inline-block align-middle pt-0.5 font-mono tabular-nums">
            {fallbackStreakCountInt.toString()} Day Streak
          </span>
        </Badge>
      </header>

      {/* HUD LEVEL 2: CHROMATIC COMPLIANCE ATTENDANCE RECORD BANNER */}
      <Card className="rounded-lg border border-primary/20 bg-linear-to-br from-primary/5 via-cyan-500/[0.01] to-transparent shadow-none overflow-hidden block w-full select-none pointer-events-none">
        <CardContent className="p-4 flex items-center gap-4 block w-full leading-none">
          <div className="text-4xl shrink-0 leading-none block select-none pointer-events-none filter drop-shadow-sm rotate-2">
            🔥
          </div>
          <div className="flex-1 leading-none space-y-1 block">
            <span className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide block leading-none">
              Attendance Log Metric
            </span>
            <p className="text-base font-black text-foreground font-mono leading-none tabular-nums pt-0.5">
              {fallbackStreakCountInt.toString()} Consecutive Days Active
            </p>
            <div className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight flex items-center gap-2.5 pt-0.5 tabular-nums">
              <span>
                Cumulative Reward: {userStreakRecord?.xp_total ? userStreakRecord.xp_total.toLocaleString() : "0"} Total
                XP
              </span>
              <span className="opacity-30 select-none">•</span>
              <span>
                Personal Horizon Record:{" "}
                {userStreakRecord?.longest_streak_days ? userStreakRecord.longest_streak_days.toString() : "0"} Days
              </span>
            </div>
          </div>
          <Trophy className="h-6 w-6 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 ml-auto" />
        </CardContent>
      </Card>

      {/* HUD LEVEL 3: DAILY CHALLENGE SYLLABUS DIRECTORY CARD SEGMENT */}
      {dailyChallengePayload && dailyChallengePayload.ielts_prompts?.prompt_text && (
        <Card className="rounded-lg border border-primary/30 bg-primary/[0.01] shadow-none overflow-hidden block w-full animate-in fade-in duration-200">
          <CardContent className="p-4 block w-full leading-none">
            <div className="flex items-start gap-2.5 block w-full leading-none">
              <Sparkles className="h-4 w-4 text-primary fill-current stroke-[1.5] mt-0.5 shrink-0 select-none pointer-events-none animate-pulse" />
              <div className="flex-1 leading-none space-y-1.5 block min-w-0">
                <span className="font-mono text-[9px] font-black text-primary uppercase tracking-wider block leading-none p-0">
                  Daily Synchronized Challenge (Fee Dismissed)
                </span>
                <p className="text-xs font-semibold text-foreground/80 leading-normal block select-text pt-0.5 whitespace-normal break-words italic">
                  &ldquo;{dailyChallengePayload.ielts_prompts.prompt_text.slice(0, 140).trim()}&hellip;&rdquo;
                </p>

                <div className="block pt-1 select-none w-full leading-none shrink-0">
                  <Button
                    asChild
                    type="button"
                    size="sm"
                    className="h-7.5 rounded font-mono text-[10px] font-extrabold uppercase tracking-wide px-3 shadow-2xs transform-gpu active:scale-95 cursor-pointer"
                  >
                    <Link
                      to={`/app/abroad/ielts/mock/${dailyChallengePayload.section}?prompt=${dailyChallengePayload.prompt_id}`}
                    >
                      Commit Daily Ingress Run
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 4: WEAKEST METRICS CRITERIA DETECTOR INSIGHT HIGHLIGHT */}
      {calculatedWeakestSectionItem && calculatedWeakestSectionItem.ai_band_score !== null && (
        <Card className="rounded-lg border border-amber-200/60 bg-amber-500/[0.01] shadow-none overflow-hidden block w-full select-none pointer-events-none animate-in fade-in duration-150">
          <CardContent className="p-3 flex items-start gap-2.5 block w-full leading-none">
            <AlertTriangle className="h-4 w-4 text-amber-600 stroke-[2.2] shrink-0 mt-0.5" />
            <div className="flex-1 leading-normal block pt-0.5 font-sans text-xs font-semibold text-foreground/80 tracking-normal">
              Continuous vetting reveals capacity variance drift in{" "}
              <strong className="text-amber-700 capitalize font-bold">{calculatedWeakestSectionItem.section}</strong>{" "}
              settling at baseline{" "}
              <strong className="font-mono font-black text-foreground">
                Band {Number(calculatedWeakestSectionItem.ai_band_score).toFixed(1)}
              </strong>
              . Deploy practice variables down-stream to normalize performance distributions.
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 5: FOUR CORE SPECIALTY CAPABILITY EVALUATION TILES GRID */}
      <div className="grid grid-cols-2 gap-2 w-full block select-none">
        {MODULES_SECTIONS.map((sectionNodeItem) => {
          const SubtaskIconComponent = sectionNodeItem.icon;

          return (
            <Link
              key={`ielts-capability-gate-tile-${sectionNodeItem.id}`}
              to={`/app/abroad/ielts/mock/${sectionNodeItem.id}`}
              className="outline-none focus:outline-none block leading-none"
            >
              <Card
                className={cn(
                  "rounded-lg border border-border/50 p-4 text-center hover:border-primary/30 transition-all shadow-none overflow-hidden block w-full transform-gpu active:scale-[0.985]",
                  sectionNodeItem.color,
                )}
              >
                <CardContent className="p-0 space-y-1 block w-full leading-none pointer-events-none">
                  <SubtaskIconComponent className="h-6 w-6 mx-auto mb-1 stroke-[2.2] text-inherit" />
                  <div className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wide pt-0.5">
                    {sectionNodeItem.name}
                  </div>
                  <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight tabular-nums block">
                    1 Credit Fee Charge • ~10 Min Duration
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* HUD LEVEL 6: CUMULATIVE ASSESSMENT MACRO DISPATCH TRIGGER CONTAINER */}
      <div className="block select-none leading-none w-full shrink-0">
        <Button
          asChild
          type="button"
          className="w-full h-10 rounded-lg font-bold uppercase text-xs tracking-wider cursor-pointer shadow-xs transform-gpu active:scale-[0.985] block text-center"
        >
          <Link to="/app/abroad/ielts/mock/full">
            <Trophy className="h-4 w-4 stroke-[2.2] mr-1.5 inline-block text-primary-foreground fill-primary-foreground/10" />
            <span className="inline-block pt-0.5">Initialize Cumulative Mock Evaluation Exam (4 Credits)</span>
          </Link>
        </Button>
      </div>

      {/* HUD LEVEL 7: TIMELINE HISTORICAL ATTEMPTS OUTPUT HOOK VIEWPORTS */}
      {recentAttemptsCollection.length > 0 && (
        <section className="space-y-2 block w-full">
          <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5 px-0.5">
            Recent Examination Submissions
          </h2>

          <div className="space-y-2 block w-full mt-2.5">
            {recentAttemptsCollection.map((attemptRowNode) => {
              const formattedAttemptDateStr = attemptRowNode.created_at
                ? new Date(attemptRowNode.created_at)
                    .toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    .toUpperCase()
                : "UNRESOLVED TIMELOG COORDINATE";

              return (
                <Link
                  key={`examination-attempt-result-row-link-${attemptRowNode.id}`}
                  to={`/app/abroad/ielts/results/${attemptRowNode.id}`}
                  className="block outline-none focus:outline-none block leading-none w-full"
                >
                  <Card className="rounded-lg border border-border/60 bg-card/40 hover:border-border-foreground/10 transition-colors shadow-none overflow-hidden block w-full">
                    <CardContent className="p-3.5 flex items-center justify-between gap-4 block w-full leading-none">
                      <div className="leading-none space-y-1 block min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5 truncate pt-0.5">
                          <span>Section Assignment Focus: </span>
                          <span className="text-primary font-mono font-black">
                            {attemptRowNode.section.toUpperCase()}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight select-none pointer-events-none flex items-center gap-1 leading-none tabular-nums">
                          <Clock className="h-3.5 w-3.5 stroke-[2] shrink-0 text-muted-foreground/30" />
                          <span>{formattedAttemptDateStr}</span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className="font-mono text-xs font-black uppercase px-2 h-7 rounded border border-border bg-background shadow-3xs text-foreground shrink-0 leading-none pt-0.5 tabular-nums"
                      >
                        BAND{" "}
                        {attemptRowNode.ai_band_score !== null ? Number(attemptRowNode.ai_band_score).toFixed(1) : "—"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
