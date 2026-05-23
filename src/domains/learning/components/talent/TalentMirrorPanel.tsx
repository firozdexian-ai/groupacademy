import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTalentMirror, type TalentMirrorCourse, type TalentMirrorTopic } from "@/domains/profile/hooks/useTalentMirror";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ArrowRight, Sparkles, AlertTriangle, RefreshCw, Layers, Brain, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);

const tone = (v: number | null) => {
  if (v === null) return "text-muted-foreground/60";
  if (v < 0.4) return "text-rose-600 dark:text-rose-400 bg-rose-500/5 border border-rose-500/10";
  if (v < 0.7) return "text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10";
  return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10";
};

/**
 * GroUp Academy: Core Competency Map & Trajectory Telemetry Panel (TalentMirrorPanel)
 * An authoritative engine calculating macro-level average mastery matrices across multi-tenant course tracks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function TalentMirrorPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Server state data ingress lookup call pipeline
  const { data, loading, error, refresh } = useTalentMirror();

  // Monitor comprehensive mastery blueprint impressions safely via telemetry log indicators
  useEffect(() => {
    trackEvent("talent_mirror_panel_mounted");
  }, []);

  // Monitor internal database extraction exceptions transparently via central boundaries
  useEffect(() => {
    if (error) {
      trackError(error, {
        component: "TalentMirrorPanel",
        action: "fetch_useTalentMirror_hook_api",
      });
    }
  }, [error]);

  const handleSynchronizationReload = async () => {
    trackEvent("talent_mirror_refresh_requested");
    try {
      await queryClient.invalidateQueries({ queryKey: ["talent-mirror"] });
      await refresh();
    } catch (err) {
      trackError(err, {
        component: "TalentMirrorPanel",
        action: "execute_refresh_invalidation_callback",
      });
    }
  };

  const handleTargetReviewRedirectClick = async (destinationUrlPathStr: string, eventIdLabel: string) => {
    if (!destinationUrlPathStr) return;
    trackEvent("talent_mirror_redirection_executed", { actionLabel: eventIdLabel, targetUrl: destinationUrlPathStr });

    try {
      // Automated Efficiency: Synchronize cache indices globally to avoid state drift across shared loops
      await queryClient.invalidateQueries({ queryKey: ["talent-mirror"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(destinationUrlPathStr);
    } catch (err) {
      trackError(err, {
        component: "TalentMirrorPanel",
        action: "execute_target_redirect_navigation",
        targetUrl: destinationUrlPathStr,
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4 select-none w-full animate-pulse">
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
              Couldn't load
            </p>
            <p className="text-xs font-medium italic text-muted-foreground/80 leading-normal select-text selection:bg-rose-500/10 mt-1.5">
              {error || "Something went wrong. Please try again."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSynchronizationReload}
            className="h-8 rounded-xl border-border/60 hover:bg-accent font-bold uppercase text-[10px] tracking-wide gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 stroke-[2.5]" />
            <span>Re-establish Ingress Sync</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // COLD-START FALLBACK GRAPHIC STATE VIEW MODE PANEL
  if (Number(data.summary?.topics || 0) === 0) {
    return (
      <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-md mx-auto flex flex-col justify-center items-center animate-in fade-in duration-300 py-10">
        <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center mb-3.5 border border-primary/5 shadow-inner">
          <Sparkles className="w-5 h-5 text-primary/40 stroke-[2.2] animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
          Ecosystem Blueprints Empty
        </h3>
        <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic mb-4">
          No psychometric parameters are currently tracked. Execute an active module quiz or dynamic simulation inside
          your repository tracks to populate vectors.
        </p>
        <Button
          size="sm"
          type="button"
          onClick={() => handleTargetReviewRedirectClick("/app/learning?tab=my-courses", "cold_start_courses_redirect")}
          className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
        >
          <span>Activate Tracks Catalog</span>
        </Button>
      </Card>
    );
  }

  const summaryValuesModel = data.summary;

  return (
    <div className="space-y-4 text-left antialiased max-w-full w-full select-none sm:select-text transform-gpu">
      {/* HUD SECTION 1: SYSTEM CALIBRATION PLOTS GRID NODES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full select-none">
        <Stat label="Active Tracks" value={summaryValuesModel.courses || 0} />
        <Stat label="Tracked Knowledge Vectors" value={summaryValuesModel.topics || 0} />
        <Stat label="Mean Mastery Profile" value={pct(summaryValuesModel.avg_mastery)} />
        <Stat
          label="Tasks Outstanding"
          value={summaryValuesModel.due_now || 0}
          tone={summaryValuesModel.due_now > 0 ? "warn" : "default"}
        />
      </div>

      {/* METRIC HORIZON SIGNAL SUB-STRIP ACTIONS */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between gap-4 w-full select-none border-b border-border/10 pb-2.5 tabular-nums">
        <div className="flex items-center gap-2.5 truncate max-w-[70%]">
          <span className="bg-muted/30 px-1.5 py-0.5 border border-border/20 rounded font-semibold text-muted-foreground/90">
            {data.signal_split?.quiz || 0} quiz coefficients logged
          </span>
          <span className="opacity-40 font-normal">&bull;</span>
          <span className="bg-muted/30 px-1.5 py-0.5 border border-border/20 rounded font-semibold text-muted-foreground/90">
            {data.signal_split?.scenario || 0} simulated telemetry signals
          </span>
        </div>

        {Number(summaryValuesModel.due_now || 0) > 0 && (
          <Button
            size="sm"
            variant="link"
            type="button"
            className="ml-auto h-auto p-0 text-[11px] font-extrabold text-primary tracking-wide flex items-center gap-0.5 hover:underline cursor-pointer"
            onClick={() => handleTargetReviewRedirectClick("/app/learning/review", "overdue_review_panel_shortcut")}
          >
            <span>Execute Reconstitution</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        )}
      </div>

      {/* HUD SECTION 2: REVISION ANOMALY GAP MARKERS MATRIX LISTING */}
      {Array.isArray(data.weakest_topics) && data.weakest_topics.length > 0 && (
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
            <CardTitle className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 stroke-[2.2]" />
              <span>Critical Workspace Learning Revision Gaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 py-2 space-y-0.5 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90 tabular-nums">
            {data.weakest_topics.map((topicItem) => {
              if (!topicItem || !topicItem.topic_tag) return null;
              return <TopicRow key={`${topicItem.content_id}_${topicItem.topic_tag}_weak`} t={topicItem} />;
            })}
          </CardContent>
        </Card>
      )}

      {/* HUD SECTION 3: REPOSITORY COURSE COMPETENCY MATRIX SEGMENTS */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
          <CardTitle className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            <span>Integrated Specialization Tracks Masteries Ledger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 w-full min-w-0">
          {Array.isArray(data.courses) &&
            data.courses.map((courseItem) => {
              if (!courseItem || !courseItem.content_id) return null;
              return (
                <CourseRow
                  key={courseItem.content_id}
                  c={courseItem}
                  onOpen={() =>
                    handleTargetReviewRedirectClick(
                      `/content/${courseItem.slug ?? courseItem.content_id}`,
                      `course_row_hub_${courseItem.content_id}`,
                    )
                  }
                />
              );
            })}
        </CardContent>
      </Card>

      {/* HUD SECTION 4: DEMONSTRATED KNOWLEDGE STRENGTH BLOCKS MATRIX */}
      {Array.isArray(data.strongest_topics) && data.strongest_topics.length > 0 && (
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-3 px-4 border-b border-border/10 select-none bg-muted/20">
            <CardTitle className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.2]" />
              <span>Validated Strengths & Trajectory Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 py-2 space-y-0.5 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90 tabular-nums">
            {data.strongest_topics.map((topicItem) => {
              if (!topicItem || !topicItem.topic_tag) return null;
              return <TopicRow key={`${topicItem.content_id}_${topicItem.topic_tag}_strong`} t={topicItem} />;
            })}
          </CardContent>
        </Card>
      )}
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

function TopicRow({ t }: { t: TalentMirrorTopic }) {
  const calculatedMasteryPercentValue = Number(t.mastery || 0);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/10 last:border-0 py-2.5 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90 tabular-nums animate-in fade-in duration-150">
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2 select-none leading-none">
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold px-2 h-5 rounded-md border-border/40 bg-background/50 text-muted-foreground truncate max-w-[140px] uppercase tracking-wide shadow-sm"
          >
            {t.topic_tag}
          </Badge>
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground/60 truncate tracking-tight mt-1 pl-0.5 max-w-full select-text selection:bg-primary/10">
          {t.course_title}
          {t.module_title ? ` &bull; ${t.module_title}` : ""}
        </p>
      </div>

      <span
        className={cn(
          "text-xs sm:text-sm font-extrabold bg-muted/40 px-2 py-0.5 border border-border/10 rounded-md shadow-sm shrink-0 select-all leading-none tabular-nums",
          tone(calculatedMasteryPercentValue).split(" ")[0],
        )}
      >
        {pct(calculatedMasteryPercentValue)}
      </span>
    </div>
  );
}

function CourseRow({ c, onOpen }: { c: TalentMirrorCourse; onOpen: () => void }) {
  const calculatedCourseMasteryPercentValue = Number(c.avg_mastery || 0);
  const formattedProgressBarPercent = Math.round(calculatedCourseMasteryPercentValue * 100);

  return (
    <div className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-sm p-3.5 space-y-2.5 w-full min-w-0 text-left transition-all duration-300 hover:border-border/60 shadow-sm group">
      <div className="flex items-start justify-between gap-4 w-full text-left leading-none">
        <div className="min-w-0 flex-1 space-y-1 text-left leading-none">
          <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight line-clamp-1 truncate w-full group-hover:text-primary transition-colors select-text pr-1">
            {c.title}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none leading-none pt-0.5 tabular-nums">
            {c.modules || 0} core modules &bull; {c.topics || 0} criteria metrics logged
            {Number(c.due_now || 0) > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-extrabold px-1">
                &bull; {c.due_now} parameters outstanding
              </span>
            )}
          </p>
        </div>

        <span
          className={cn(
            "text-sm sm:text-base font-black tabular-nums bg-muted/40 px-2 py-0.5 border border-border/10 rounded-md shadow-sm shrink-0 leading-none inline-block",
            tone(calculatedCourseMasteryPercentValue).split(" ")[0],
          )}
        >
          {pct(calculatedCourseMasteryPercentValue)}
        </span>
      </div>

      {/* Linear spatial mastery percentage tracking gauge */}
      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/5 shadow-inner select-none relative shrink-0 flex">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out shrink-0 border-none"
          style={{ width: `${formattedProgressBarPercent}%` }}
        />
      </div>

      {/* Target revision anomaly highlights badge loop */}
      {Array.isArray(c.weakest) && c.weakest.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none w-full max-w-full">
          {c.weakest.map((weakTopicItem) => {
            if (!weakTopicItem || !weakTopicItem.topic_tag) return null;
            return (
              <Badge
                key={weakTopicItem.topic_tag}
                variant="outline"
                className="text-[9px] font-extrabold px-2 h-4.5 bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10 shadow-sm uppercase tracking-wide rounded max-w-[40%] truncate text-ellipsis"
              >
                <span className="truncate text-ellipsis">
                  {weakTopicItem.topic_tag} &bull; {pct(weakTopicItem.mastery)}
                </span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Action redirect button ribbon alignment */}
      <div className="flex justify-end pt-1 border-t border-border/5 select-none w-full">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onOpen}
          className="h-7 text-[10px] sm:text-[11px] px-2.5 font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-accent rounded-xl shadow-none shrink-0 cursor-pointer flex items-center gap-1"
        >
          <span>Open Track Folder</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
