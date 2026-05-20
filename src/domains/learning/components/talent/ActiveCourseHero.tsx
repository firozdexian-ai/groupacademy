import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, ChevronRight, BookOpen, Sparkles, Zap, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ActiveEnrollment } from "@/hooks/useLearningStats";
import { cn } from "@/lib/utils";

interface ActiveCourseHeroProps {
  enrollment: ActiveEnrollment;
  upNextEnrollments?: ActiveEnrollment[];
}

/**
 * GroUp Academy: Learning Continuity Terminal (ActiveCourseHero)
 * CTO Reference: Authoritative resume-node orchestrating talent trajectory development tracking.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ActiveCourseHero({ enrollment, upNextEnrollments = [] }: ActiveCourseHeroProps) {
  const navigate = useNavigate();

  // Monitor curriculum continuity element impressions safely via telemetry logs
  useEffect(() => {
    if (enrollment?.id) {
      trackEvent("learning_hero_terminal_rendered", {
        enrollmentId: enrollment.id,
        courseSlug: enrollment.content?.slug,
        progressPercentage: enrollment.progress || 0,
      });
    }
  }, [enrollment]);

  if (!enrollment || !enrollment.content) {
    return null;
  }

  const { content, progress = 0, modules = [] } = enrollment;

  // 1. Hardened Protocol: Defensive Indexing Guard tracking structural lookup omissions cleanly
  const currentModuleIndex = useMemo(() => {
    if (!enrollment.current_module_id || !modules.length) return 0;

    const calculatedIndex = modules.findIndex((m) => m.id === enrollment.current_module_id);

    if (calculatedIndex === -1) {
      trackError(`Active curriculum module missing or deleted: [${enrollment.current_module_id}]`, {
        component: "ActiveCourseHero",
        action: "calculate_current_module_index",
        enrollmentId: enrollment.id,
      });
      return 0; // Fallback gracefully to seed state parameter block
    }

    return Math.max(0, calculatedIndex);
  }, [enrollment.current_module_id, modules, enrollment.id]);

  const currentModule = modules[currentModuleIndex];
  const nextModules = modules.slice(currentModuleIndex + 1, currentModuleIndex + 3);

  const handleResumeProtocol = () => {
    if (!content.slug) return;
    trackEvent("learning_hero_resume_triggered", { courseSlug: content.slug, moduleId: currentModule?.id });
    navigate(`/app/learn/${content.slug}`);
  };

  const handleAuditCurriculum = () => {
    if (!content.slug) return;
    trackEvent("learning_hero_registry_audit_triggered", { courseSlug: content.slug });
    navigate(`/app/learning/courses/${content.slug}`);
  };

  const handleParallelTrackNavigation = (targetSlug: string | undefined, targetEnrollmentId: string) => {
    if (!targetSlug) return;
    trackEvent("learning_hero_parallel_track_selected", { targetSlug, targetEnrollmentId });
    navigate(`/app/learning/courses/${targetSlug}`);
  };

  return (
    <section className="space-y-5 antialiased text-left select-none sm:select-text max-w-full w-full">
      {/* HUD HEADER: TELEMETRY INDICATOR LABEL */}
      <div className="flex items-center justify-between px-0.5 select-none w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="h-4.5 w-4.5 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide">
              Ecosystem Mission Control
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
              Active Trajectory Resume Pipeline
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr,300px] items-start w-full min-w-0">
        {/* ARTIFACT LAYER: MAIN COMMAND CARD BOARD */}
        <Card className="group relative overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl transition-all duration-300 hover:border-primary/30 w-full min-w-0">
          <div className="grid md:grid-cols-[240px,1fr] h-full w-full min-w-0">
            {/* SUB-COMPONENT A: VISUAL PROGRESS NODE DISPLAY */}
            <div className="relative overflow-hidden bg-muted aspect-video md:aspect-auto border-r border-border/10 select-none transform-gpu shrink-0">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={`${content.title} curriculum thumbnail snapshot track`}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 border-none"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <BookOpen className="h-10 w-10 text-primary/20 stroke-[2.2]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="flex items-center justify-between mb-2 font-bold tabular-nums tracking-tight">
                  <span className="text-[9px] text-white/70 uppercase tracking-wider italic">
                    Trajectory Sync Progression
                  </span>
                  <span className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-md px-1.5 py-0.5 shadow-sm">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5 rounded-full bg-white/10 shadow-inner" />
              </div>
            </div>

            {/* SUB-COMPONENT B: COMMAND CONTROL INTERFACE PANEL */}
            <CardContent className="p-5 sm:p-6 flex flex-col justify-between text-left relative min-w-0 flex-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
                <GraduationCap className="h-24 w-24 rotate-12 text-primary" />
              </div>

              <div className="space-y-4 relative z-10 w-full min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 select-none leading-none">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 border-primary/20 text-primary text-[9px] font-extrabold uppercase tracking-wide px-2 h-5 rounded-md shadow-sm"
                  >
                    {content.content_type ? content.content_type.replace(/_/g, " ") : "Specialized Track"}
                  </Badge>
                  {progress > 50 && (
                    <Badge className="bg-emerald-500/10 border-none text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wide px-2 h-5 rounded-md shadow-sm gap-1 flex items-center animate-pulse">
                      <Sparkles className="h-3 w-3 shrink-0 stroke-[2.5]" />
                      <span>High Yield Potential</span>
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold leading-snug tracking-tight line-clamp-2 uppercase italic text-foreground/90 break-words w-full select-all selection:bg-primary/20">
                  {content.title}
                </h3>

                {currentModule && (
                  <div className="space-y-1 p-3 rounded-xl border border-border/40 bg-muted/20 text-left w-full min-w-0 shadow-inner">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-primary select-none block leading-none pl-0.5">
                      Staged Core Module Target
                    </p>
                    <p className="text-xs font-bold text-foreground/90 line-clamp-1 italic break-all w-full pr-1 select-text leading-tight mt-0.5">
                      {currentModule.title}
                    </p>
                    {currentModule.estimated_time_minutes && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide leading-none pt-1 select-none tabular-nums">
                        <Clock className="h-3 w-3 text-primary stroke-[2.2] shrink-0" />
                        <span>~{currentModule.estimated_time_minutes} minutes remaining bounds</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Ribbon Intercept Control Trigger Strip */}
              <div className="flex flex-wrap items-center gap-3 mt-6 select-none w-full">
                <Button
                  onClick={handleResumeProtocol}
                  type="button"
                  className="h-10 px-5 font-bold text-xs tracking-wide rounded-xl shadow-sm active:scale-[0.99] transition-transform gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <PlayCircle className="h-4 w-4 fill-primary-foreground/10 stroke-[2.5]" />
                  <span>Resume Deployment</span>
                </Button>

                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleAuditCurriculum}
                  className="h-10 px-3.5 font-bold text-xs tracking-tight rounded-xl border border-border/60 text-muted-foreground/80 hover:text-foreground hover:bg-accent transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <span>Curriculum Matrix</span>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* COMPONENT MODULE C: ACTIVE UP-NEXT QUEUE STACK BLOCK */}
        <div className="flex flex-col text-left h-full w-full min-w-0 select-none">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2.5 px-0.5 italic block select-none leading-none">
            Subsequent Module Queue Stack
          </h3>

          <div className="flex lg:flex-col gap-2.5 overflow-x-auto no-scrollbar lg:overflow-visible pb-2.5 lg:pb-0 snap-x w-full">
            {nextModules.length > 0 ? (
              nextModules.map((moduleItem, sequenceIndex) => {
                if (!moduleItem || !moduleItem.id) return null;
                return (
                  <Card
                    key={moduleItem.id}
                    className="p-3.5 border border-border/40 hover:border-primary/20 hover:bg-primary/[0.01] dark:hover:bg-primary/[0.001] transition-all duration-200 rounded-xl shadow-sm shrink-0 w-[240px] lg:w-full snap-start group/node cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring text-left"
                    onClick={handleResumeProtocol}
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 font-extrabold text-[11px] text-muted-foreground/80 border border-border/30 group-hover/node:border-primary/20 group-hover/node:text-primary tracking-tighter shadow-inner tabular-nums transition-colors">
                        {String(currentModuleIndex + sequenceIndex + 2).padStart(2, "0")}
                      </div>

                      <div className="min-w-0 flex-1 text-left space-y-0.5 flex flex-col justify-center leading-none">
                        <p className="text-xs font-bold line-clamp-1 leading-tight uppercase italic text-foreground/80 group-hover/node:text-primary transition-colors pr-1">
                          {moduleItem.title}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/60 tracking-wider uppercase tabular-nums">
                          Duration block: {moduleItem.estimated_time_minutes || 5}m
                        </p>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/30 group-hover/node:translate-x-0.5 group-hover/node:text-primary transition-all stroke-[2.5]" />
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="flex-1 flex flex-col items-center justify-center p-5 border border-dashed border-primary/20 bg-primary/5 rounded-xl text-center select-none w-full py-6 animate-in fade-in duration-300">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center mb-2.5 shadow-inner">
                  <Sparkles className="h-5 w-5 text-primary stroke-[2.2] animate-pulse" />
                </div>
                <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider italic leading-none">
                  Graduation Core Locked
                </p>
                <p className="text-[9px] text-muted-foreground/80 font-bold mt-1.5 uppercase tracking-wide leading-normal">
                  Terminal sequence threshold active. Complete task.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRY FOOTER: PARALLEL CURRICULUM DEVELOPMENT TRACKS */}
      {upNextEnrollments.length > 0 && (
        <div className="pt-6 border-t border-border/10 text-left select-none w-full">
          <h3 className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-4 px-0.5 italic block select-none leading-none">
            Parallel Workspace Learning Horizons
          </h3>

          <ScrollArea className="w-full whitespace-nowrap overflow-visible">
            <div className="flex gap-4 pb-3.5 w-full">
              {upNextEnrollments.map((enrollmentItem) => {
                if (!enrollmentItem || !enrollmentItem.id || !enrollmentItem.content) return null;

                const currentCourseId = enrollmentItem.id;
                const coursePayload = enrollmentItem.content;
                const trajectoryProgress = Math.round(Number(enrollmentItem.progress || 0));

                return (
                  <Card
                    key={currentCourseId}
                    className="w-[240px] shrink-0 border border-border/40 bg-card/40 backdrop-blur-md rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/20 group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring text-left"
                    onClick={() => handleParallelTrackNavigation(coursePayload.slug, currentCourseId)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden border-b border-border/10 select-none transform-gpu shrink-0">
                      <img
                        src={coursePayload.thumbnail_url || "/placeholder.jpg"}
                        alt={`${coursePayload.title} track index image`}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 border-none"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-10">
                        <PlayCircle className="text-white h-8 w-8 drop-shadow-md stroke-[2.2] transform-gpu scale-95 group-hover:scale-100 transition-transform duration-300" />
                      </div>
                    </div>

                    <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 text-left flex flex-col justify-center">
                      <p className="text-xs font-bold line-clamp-2 whitespace-normal leading-snug tracking-tight uppercase italic text-foreground/90 group-hover:text-primary transition-colors break-words select-text">
                        {coursePayload.title}
                      </p>

                      <div className="flex items-center gap-2 select-none w-full leading-none tabular-nums text-[10px] font-bold text-primary tracking-tight">
                        <Progress
                          value={trajectoryProgress}
                          className="h-1.5 flex-1 rounded-full bg-primary/10 shadow-inner"
                        />
                        <span className="shrink-0 pl-0.5 italic">{trajectoryProgress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5 opacity-60 hover:opacity-100" />
          </ScrollArea>
        </div>
      )}
    </section>
  );
}
