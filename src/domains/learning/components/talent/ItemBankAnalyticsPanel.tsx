import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useItemAnalytics, type QuizItemStat, type ScenarioItemStat } from "@/hooks/useItemAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { AlertTriangle, RefreshCw, Sparkles, Layers, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemRewriteSheet } from "./ItemRewriteSheet";

const FLAG_LABEL: Record<string, string> = {
  low_p_value: "Too hard",
  trivial: "Too easy",
  stale: "Stale",
  miscalibrated: "Miscalibrated",
  low_rubric: "Low rubric",
};

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);

const masteryTone = (v: number | null) => {
  if (v === null) return "text-muted-foreground";
  if (v < 0.4) return "text-rose-600 dark:text-rose-400";
  if (v < 0.7) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
};

export interface ItemBankAnalyticsPanelProps {
  moduleId: string;
}

/**
 * GroUp Academy: Psychometric Telemetry & Content Optimization Node (ItemBankAnalyticsPanel)
 * CTO Reference: Authoritative interface for monitoring curriculum items calibration and dispatching AI content rewrites.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ItemBankAnalyticsPanel({ moduleId }: ItemBankAnalyticsPanelProps) {
  const queryClient = useQueryClient();
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [rewrite, setRewrite] = useState<{ kind: "quiz" | "scenario"; itemId: string; flags: string[] } | null>(null);

  // Monitor psychometric analysis board views via analytics tracking endpoints
  useEffect(() => {
    if (moduleId) {
      trackEvent("item_bank_analytics_panel_mounted", { moduleId, onlyNeedsReviewFilter: onlyFlagged });
    }
  }, [moduleId, onlyFlagged]);

  // Core Server State Hook Ingress: Fetch psychometric content telemetry profiles
  const { data, isLoading: loading, error, refetch } = useItemAnalytics(moduleId);

  // Route internal database lookup processing exceptions straight to logging systems
  useEffect(() => {
    if (error) {
      trackError(error, {
        component: "ItemBankAnalyticsPanel",
        action: "fetch_useItemAnalytics_hook_api",
        moduleId,
      });
    }
  }, [error, moduleId]);

  const handleSynchronizationReload = async () => {
    trackEvent("item_bank_analytics_refresh_triggered", { moduleId });
    try {
      await queryClient.invalidateQueries({ queryKey: ["item-analytics", moduleId] });
      await refetch();
    } catch (err) {
      trackError(err, {
        component: "ItemBankAnalyticsPanel",
        action: "execute_refresh_invalidation_callback",
        moduleId,
      });
    }
  };

  const quizItems = useMemo(() => {
    if (!data?.quiz_items) return [];
    return onlyFlagged ? data.quiz_items.filter((q) => q.needs_review && q.needs_review.length > 0) : data.quiz_items;
  }, [data, onlyFlagged]);

  const scenarioItems = useMemo(() => {
    if (!data?.scenario_items) return [];
    return onlyFlagged
      ? data.scenario_items.filter((s) => s.needs_review && s.needs_review.length > 0)
      : data.scenario_items;
  }, [data, onlyFlagged]);

  if (loading && !data) {
    return (
      <div className="space-y-3.5 select-none w-full animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl opacity-60" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-2xl opacity-40" />
        <Skeleton className="h-40 w-full rounded-2xl opacity-20" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-rose-500/20 bg-rose-500/5 rounded-2xl text-left w-full max-w-full">
        <CardContent className="p-5 text-center space-y-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="h-5 w-5 text-rose-500 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
              Telemetry Channel Intercepted
            </p>
            <p className="text-xs font-medium italic text-muted-foreground/80 leading-normal select-text selection:bg-rose-500/10 mt-1.5">
              {error.message || "Ecosystem calibration connection link lost."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSynchronizationReload}
            className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Re-trigger Synchronizer</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;
  const summaryModelValues = data.summary;

  return (
    <div className="space-y-4 text-left antialiased max-w-full w-full select-none sm:select-text">
      {/* HUD SECTION 1: CALIBRATION METRIC PLOTS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full select-none">
        <Stat label="Active Quiz Items" value={summaryModelValues.quiz_items || 0} />
        <Stat label="Scenario Matrices" value={summaryModelValues.scenario_items || 0} />
        <Stat
          label="Avg P-Value Index"
          value={pct(summaryModelValues.avg_p_value)}
          tone={summaryModelValues.avg_p_value !== null && summaryModelValues.avg_p_value < 0.4 ? "warn" : "default"}
        />
        <Stat
          label="Requires Revision"
          value={summaryModelValues.items_needing_review || 0}
          tone={summaryModelValues.items_needing_review > 0 ? "warn" : "default"}
        />
      </div>

      {/* ACTION BAR: ROW FILTER CONFIGURATION STRIP */}
      <div className="flex items-center justify-between gap-4 w-full select-none border-y border-border/10 py-2.5 my-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            type="button"
            variant={onlyFlagged ? "default" : "outline"}
            onClick={() => {
              trackEvent("item_bank_analytics_filter_toggled", { nextFilterState: !onlyFlagged });
              setOnlyFlagged((v) => !v);
            }}
            className="h-7 px-3 text-[10px] font-extrabold uppercase tracking-wide rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <span>{onlyFlagged ? "Show Full Repository" : "Isolate Anomaly Gaps Only"}</span>
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={handleSynchronizationReload}
          className="h-7 text-[10px] px-2.5 font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-accent rounded-xl cursor-pointer shadow-none shrink-0 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3 stroke-[2.2]" />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* HUD SECTION 2: TOPIC CALIBRATION MATRIX GRID */}
      {Array.isArray(data.topics) && data.topics.length > 0 && (
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
            <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>Categorized Topic Matrix Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 py-2 space-y-0.5 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90 tabular-nums">
            {data.topics.map((topicNodeItem) => {
              if (!topicNodeItem || !topicNodeItem.topic_tag) return null;
              return (
                <div
                  key={topicNodeItem.topic_tag}
                  className="flex items-center justify-between gap-4 border-b border-border/10 last:border-0 py-2.5 w-full min-w-0 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 text-left select-none">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-extrabold px-2 h-5 rounded-md border-border/40 bg-background/50 text-muted-foreground truncate max-w-[130px] uppercase tracking-wide shadow-sm"
                    >
                      {topicNodeItem.topic_tag}
                    </Badge>
                    <span className="text-muted-foreground/70 font-semibold truncate text-[11px]">
                      {topicNodeItem.items || 0} target {topicNodeItem.items === 1 ? "node" : "nodes"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[11px] select-text">
                    <span
                      className="bg-muted/30 px-1.5 py-0.5 border border-border/20 rounded font-semibold text-muted-foreground/90"
                      title="Quiz item p-value response coefficient"
                    >
                      Quiz P: {pct(topicNodeItem.avg_p_value)}
                    </span>
                    <span
                      className="bg-muted/30 px-1.5 py-0.5 border border-border/20 rounded font-semibold text-muted-foreground/90"
                      title="Scenario baseline score alignment"
                    >
                      Sce S: {pct(topicNodeItem.avg_scenario_score)}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold bg-muted/40 px-2 py-0.5 border border-border/10 rounded-md shadow-sm",
                        masteryTone(topicNodeItem.learner_mastery_mean),
                      )}
                      title="Aggregated mean value user retention mastery profile"
                    >
                      Mast M: {pct(topicNodeItem.learner_mastery_mean)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* HUD SECTION 3: QUIZ EVALUATION repository PIPELINE */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
          <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            <span>Psychometric Quiz Items Repository</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 w-full min-w-0">
          {quizItems.length === 0 && (
            <p className="text-xs font-semibold text-muted-foreground/70 italic leading-normal py-6 text-center select-text max-w-xs mx-auto">
              {onlyFlagged
                ? "No anomalies flagged inside the psychometric evaluation indices matrix."
                : "No baseline evaluation items linked to this target module repository yet."}
            </p>
          )}
          {quizItems.map((q) => {
            if (!q || !q.id) return null;
            return (
              <QuizRow
                key={q.id}
                q={q}
                onRewrite={() => {
                  trackEvent("item_bank_analytics_rewrite_triggered", { kind: "quiz", itemId: q.id, moduleId });
                  setRewrite({ kind: "quiz", itemId: q.id, flags: q.needs_review || [] });
                }}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* HUD SECTION 4: SCENARIO WORKSPACE LOGS LIFECYCLE CONTAINER */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
          <CardTitle className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            <span>Interactive Operational Simulation Scenarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 w-full min-w-0">
          {scenarioItems.length === 0 && (
            <p className="text-xs font-semibold text-muted-foreground/70 italic leading-normal py-6 text-center select-text max-w-xs mx-auto">
              {onlyFlagged
                ? "No procedural simulations marked for generative structural repair bounds."
                : "No dynamic interactive simulations logged into this module pipeline yet."}
            </p>
          )}
          {scenarioItems.map((s) => {
            if (!s || !s.id) return null;
            return (
              <ScenarioRow
                key={s.id}
                s={s}
                onRewrite={() => {
                  trackEvent("item_bank_analytics_rewrite_triggered", { kind: "scenario", itemId: s.id, moduleId });
                  setRewrite({ kind: "scenario", itemId: s.id, flags: s.needs_review || [] });
                }}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* COGNITIVE AI REWRITE DRAW HOOK SHEET OVERLAY PANEL */}
      <ItemRewriteSheet
        open={!!rewrite}
        onOpenChange={(isOpenState) => {
          if (!isOpenState) {
            trackEvent("item_bank_analytics_rewrite_dismissed", { moduleId });
            setRewrite(null);
          }
        }}
        kind={rewrite?.kind ?? "quiz"}
        itemId={rewrite?.itemId ?? null}
        flags={rewrite?.flags ?? []}
        onApplied={handleSynchronizationReload}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 py-2.5 text-left w-full min-w-0 flex flex-col justify-center transition-colors shadow-sm",
        tone === "warn"
          ? "border-rose-500/20 bg-rose-500/[0.01] dark:bg-rose-500/[0.002]"
          : "border-border/40 bg-card/60 backdrop-blur-md",
      )}
    >
      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block select-none leading-none mb-1 truncate">
        {label}
      </span>
      <p
        className={cn(
          "text-base sm:text-lg font-black tracking-tight tabular-nums leading-none pt-0.5",
          tone === "warn" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FlagBadges({ flags }: { flags: string[] }) {
  const flagsCollectionBuffer = Array.isArray(flags) ? flags.filter(Boolean) : [];
  if (!flagsCollectionBuffer.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 select-none">
      {flagsCollectionBuffer.map((flagKeyItem) => (
        <Badge
          key={flagKeyItem}
          variant="destructive"
          className="text-[9px] font-extrabold h-4.5 px-1.5 rounded uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm leading-none flex items-center shrink-0"
        >
          {FLAG_LABEL[flagKeyItem] ?? flagKeyItem?.replace(/_/g, " ")}
        </Badge>
      ))}
    </div>
  );
}

function QuizRow({ q, onRewrite }: { q: QuizItemStat; onRewrite: () => void }) {
  const normalizedPValue = typeof q.p_value === "number" && !isNaN(q.p_value) ? q.p_value : null;

  const coefficientToneClass =
    normalizedPValue === null
      ? "text-muted-foreground/60"
      : normalizedPValue < 0.3
        ? "text-rose-600 dark:text-rose-400"
        : normalizedPValue > 0.9
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground/90";

  const isAnomalousNodeFlagged = Array.isArray(q.needs_review) && q.needs_review.filter(Boolean).length > 0;

  return (
    <div className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-sm p-3.5 space-y-2.5 w-full min-w-0 text-left transition-all duration-300 hover:border-border/60 shadow-sm">
      <p className="text-xs sm:text-sm font-bold text-foreground/90 leading-relaxed select-text line-clamp-3 break-words pr-1">
        {q.question || "Psychometric calibration text sequence missing error."}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] leading-none pt-0.5 border-t border-border/5 select-none font-bold tabular-nums text-muted-foreground/80">
        <div className="flex flex-wrap items-center gap-1 max-w-[65%] truncate">
          {Array.isArray(q.topic_tags) &&
            q.topic_tags.slice(0, 3).map((tagStrItem) => (
              <Badge
                key={tagStrItem}
                variant="outline"
                className="text-[9px] font-bold px-2 h-4.5 rounded uppercase tracking-wide border-border/40 bg-background/50 text-muted-foreground/80 truncate max-w-[90px]"
              >
                {tagStrItem}
              </Badge>
            ))}
          {q.difficulty && (
            <Badge
              variant="secondary"
              className="text-[9px] font-extrabold px-1.5 h-4.5 rounded uppercase tracking-wide border-none bg-muted text-muted-foreground shrink-0 select-none"
            >
              {q.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 tabular-nums text-[10px] sm:text-xs">
          <span>{Number(q.serves_lifetime || 0).toLocaleString()} exposures</span>
          <span
            className={cn(
              "font-extrabold bg-muted/40 px-1.5 py-0.5 rounded border border-border/20 shadow-sm leading-none inline-block",
              coefficientToneClass,
            )}
          >
            coeff p: {pct(normalizedPValue)}
          </span>
        </div>
      </div>

      {isAnomalousNodeFlagged && (
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/5 select-none w-full">
          <FlagBadges flags={q.needs_review} />
          <Button
            size="sm"
            type="button"
            onClick={onRewrite}
            className="h-6 rounded-lg text-[9px] font-extrabold uppercase tracking-wide px-2 border-border/60 hover:bg-accent text-primary shrink-0 cursor-pointer shadow-sm flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Sparkles className="h-2.5 w-2.5 text-primary fill-primary/10 stroke-[2.5]" />
            <span>Execute AI Calibration</span>
          </Button>
        </div>
      )}
    </div>
  );
}

function ScenarioRow({ s, onRewrite }: { s: ScenarioItemStat; onRewrite: () => void }) {
  const rubricsBufferKeysArray = s.avg_per_rubric ? Object.keys(s.avg_per_rubric).filter(Boolean) : [];
  const normalizedOverallScore = typeof s.avg_overall === "number" && !isNaN(s.avg_overall) ? s.avg_overall : null;

  const scoreIntensityToneClass =
    normalizedOverallScore === null
      ? "text-muted-foreground/60"
      : normalizedOverallScore < 0.4
        ? "text-rose-600 dark:text-rose-400"
        : normalizedOverallScore < 0.7
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400";

  const isAnomalousNodeFlagged = Array.isArray(s.needs_review) && s.needs_review.filter(Boolean).length > 0;

  return (
    <div className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-sm p-3.5 space-y-2.5 w-full min-w-0 text-left transition-all duration-300 hover:border-border/60 shadow-sm">
      <div className="flex items-start justify-between gap-4 w-full text-left leading-none">
        <p className="text-xs sm:text-sm font-bold text-foreground/90 select-text line-clamp-2 break-words flex-1 pr-1 leading-snug">
          {s.title || "Interactive simulation node identifier header missing."}
        </p>
        <span
          className={cn(
            "text-xs sm:text-sm font-extrabold tabular-nums bg-muted/40 px-1.5 py-0.5 border border-border/20 rounded shadow-sm shrink-0 leading-none inline-block",
            scoreIntensityToneClass,
          )}
        >
          mean score: {pct(normalizedOverallScore)}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] leading-none pt-0.5 border-t border-border/5 select-none font-bold tabular-nums text-muted-foreground/80">
        <div className="flex flex-wrap items-center gap-1 max-w-[60%] truncate">
          {Array.isArray(s.topic_tags) &&
            s.topic_tags.slice(0, 3).map((tagStrItem) => (
              <Badge
                key={tagStrItem}
                variant="outline"
                className="text-[9px] font-bold px-2 h-4.5 rounded uppercase tracking-wide border-border/40 bg-background/50 text-muted-foreground/80 truncate max-w-[90px]"
              >
                {tagStrItem}
              </Badge>
            ))}
        </div>
        <span className="text-muted-foreground/70 font-semibold text-[10px] sm:text-xs shrink-0">
          {Number(s.runs_lifetime || 0).toLocaleString()} runs completed &bull;{" "}
          {Number(s.runs_window || 0).toLocaleString()} recent tracking
        </span>
      </div>

      {rubricsBufferKeysArray.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border/5 select-none font-bold text-[10px] tracking-tight tabular-nums w-full">
          {rubricsBufferKeysArray.map((rubricKeyStr) => {
            const rawRubricPercentage = Math.round((s.avg_per_rubric[rubricKeyStr] || 0) * 100);
            return (
              <div key={rubricKeyStr} className="flex items-center gap-2 text-[10px] w-full min-w-0">
                <span className="capitalize text-muted-foreground/80 font-semibold truncate max-w-[45%] block leading-none">
                  {rubricKeyStr.trim()}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden border border-border/5 shadow-inner shrink-0 relative flex">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out shrink-0 border-none"
                    style={{ width: `${rawRubricPercentage}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/60 w-7 shrink-0 text-right">
                  {rawRubricPercentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isAnomalousNodeFlagged && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/5 select-none w-full">
          <FlagBadges flags={s.needs_review} />
          <Button
            size="sm"
            type="button"
            onClick={onRewrite}
            className="h-6 rounded-lg text-[9px] font-extrabold uppercase tracking-wide px-2 border-border/60 hover:bg-accent text-primary shrink-0 pointer-events-auto cursor-pointer shadow-sm flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Sparkles className="h-2.5 w-2.5 text-primary fill-primary/10 stroke-[2.5]" />
            <span>Execute AI Calibration</span>
          </Button>
        </div>
      )}
    </div>
  );
}
