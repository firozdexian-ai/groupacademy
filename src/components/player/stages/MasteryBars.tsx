import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasteryRow {
  topic_tag: string;
  mastery: number;
  attempts: number;
}

interface MasteryBarsProps {
  moduleId: string | undefined;
  /** Max number of topics to show. Default 5. */
  topN?: number;
}

function masteryTone(m: number) {
  if (m >= 0.75) return "bg-emerald-500 dark:bg-emerald-400";
  if (m >= 0.5) return "bg-primary";
  if (m >= 0.3) return "bg-amber-500 dark:bg-amber-400";
  return "bg-rose-500 dark:bg-rose-400";
}

function masteryLabel(m: number) {
  if (m >= 0.85) return "Mastered";
  if (m >= 0.65) return "Proficient";
  if (m >= 0.4) return "Developing";
  return "Beginner";
}

/**
 * GroUp Academy: Psychometric Skill Vector Mastery Display (MasteryBars)
 * An authoritative engine visualizing granular candidate competency tiers and tracking attempt thresholds.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function MasteryBars({ moduleId, topN = 5 }: MasteryBarsProps) {
  // Monitor psychometric competency bar views via analytics telemetry indicators
  useEffect(() => {
    if (moduleId) {
      trackEvent("mastery_bars_panel_mounted", { moduleId, requestedLimit: topN });
    }
  }, [moduleId, topN]);

  // Hardened Query Ingress: Migrated lookups away from loose useEffects into cached TanStack query hooks
  const {
    data: rows = [],
    isLoading: loading,
    error: queryFetchError,
  } = useQuery<MasteryRow[]>({
    queryKey: ["talent-skill-mastery", moduleId],
    enabled: !!moduleId,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const data = await listTalentSkillMastery(moduleId, signal);
      return data as MasteryRow[];
    },
  });

  // Instrument continuous analytical tracking maps over internal server sub-query exceptions
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "MasteryBars",
        action: "fetch_talent_skill_mastery_query",
        moduleId,
      });
    }
  }, [queryFetchError, moduleId]);

  // Compute and sort metrics collection safely inside clean memo blocks to avoid calculation lag
  const topCalculatedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return [...rows].sort((a, b) => Number(b.mastery) - Number(a.mastery)).slice(0, topN);
  }, [rows, topN]);

  if (queryFetchError) {
    return (
      <Card className="border border-dashed border-rose-500/20 bg-rose-500/5 rounded-2xl text-left w-full">
        <CardContent className="p-5 text-center space-y-3 select-none w-full flex flex-col items-center justify-center">
          <AlertCircle className="h-5 w-5 text-rose-500 stroke-[2.2]" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
              Telemetry Ingress Exception
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 italic leading-tight mt-1">
              Could not serialize baseline skill vectors profile.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden">
      {/* HUD HEADER: CALIBRATION METRIC PLOTS TITLE SECTION */}
      <CardHeader className="p-4 pb-2 select-none border-b border-border/10 bg-muted/20">
        <CardTitle className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2 leading-none w-full">
          <Brain className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
          <span>Vector Mastery Distributions</span>
        </CardTitle>
      </CardHeader>

      {/* HUD CONTENT: TRACK INDICES MATRIX CONTAINER */}
      <CardContent className="p-4 space-y-3.5 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight text-foreground/90">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground select-none leading-none w-full">
            <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider pl-0.5 animate-pulse">
              Hydrating Psychometric Competency Ledger…
            </span>
          </div>
        ) : topCalculatedRows.length === 0 ? (
          <div className="flex items-start gap-2.5 py-4 text-muted-foreground select-none leading-snug w-full">
            <Sparkles className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] mt-0.5 shrink-0 animate-pulse" />
            <p className="text-[11px] font-semibold italic text-muted-foreground/70 pr-2">
              No baseline validation coefficients compiled. Execute an outstanding learning module quiz to seed
              competency variables.
            </p>
          </div>
        ) : (
          topCalculatedRows.map((competencyRowItem) => {
            if (!competencyRowItem || !competencyRowItem.topic_tag) return null;

            const dynamicMasteryPercentageValue = Math.max(
              0,
              Math.min(100, Math.round(Number(competencyRowItem.mastery) * 100)),
            );
            const normalizedTopicLabel = competencyRowItem.topic_tag.replace(/_/g, " ");

            return (
              <div
                key={competencyRowItem.topic_tag}
                className="space-y-1.5 w-full min-w-0 flex flex-col text-left font-semibold text-xs animate-in fade-in duration-200"
              >
                {/* METRIC INDEX LABELS LINE */}
                <div className="flex items-center justify-between gap-4 select-none leading-none w-full">
                  <span className="text-xs font-bold text-foreground/80 truncate text-ellipsis pr-1 flex-1 select-text selection:bg-primary/10">
                    {normalizedTopicLabel}
                  </span>

                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 tabular-nums shrink-0 leading-none">
                    <span className="text-foreground/90 font-mono font-extrabold bg-muted/40 border border-border/10 rounded-md h-4.5 px-1 flex items-center justify-center shadow-sm">
                      {dynamicMasteryPercentageValue}%
                    </span>
                    <span className="font-extrabold text-[9px] tracking-wide uppercase opacity-75">
                      {masteryLabel(Number(competencyRowItem.mastery))}
                    </span>
                  </div>
                </div>

                {/* METRIC BAR LINEAR GAUGE Environment TRACK */}
                <div className="h-1.5 w-full bg-muted/40 rounded-full border border-border/5 overflow-hidden shadow-inner select-none relative shrink-0 flex">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out border-none shrink-0",
                      masteryTone(Number(competencyRowItem.mastery)),
                    )}
                    style={{ width: `${dynamicMasteryPercentageValue}%` }}
                  />
                </div>

                {/* ATTENDANCE COUNTERS METADATA ROW STRIP */}
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/50 select-none leading-none tabular-nums pl-0.5">
                  {competencyRowItem.attempts.toLocaleString()} calibration attempt
                  {competencyRowItem.attempts === 1 ? "" : "s"} committed
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
