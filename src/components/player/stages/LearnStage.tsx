import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceViewer } from "../ResourceViewer";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, BookOpen, FileText, Network, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface LearnStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
}

/**
 * GroUp Academy: Core Knowledge Ingestion Node (LearnStage)
 * An authoritative operational hub managing structured slides and cognitive mindmap ingestion pipelines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function LearnStage({ resources = [], onComplete, isCompleted }: LearnStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [slidesViewed, setSlidesViewed] = useState(false);
  const [mindmapViewed, setMindmapViewed] = useState(false);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("learn_stage_node_mounted", { totalResources: resources.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [resources.length]);

  const slidesResource = useMemo(() => {
    if (!Array.isArray(resources)) return undefined;
    return resources.find((r) => r?.resource_type === "slides");
  }, [resources]);

  const mindmapResource = useMemo(() => {
    if (!Array.isArray(resources)) return undefined;
    return resources.find((r) => r?.resource_type === "mindmap");
  }, [resources]);

  // Engagement Validation Protocol: Slides completed OR mindmap checked if slides are missing
  const canComplete = useMemo(() => {
    return slidesViewed || (!slidesResource && mindmapViewed) || resources.length === 0;
  }, [slidesViewed, slidesResource, mindmapViewed, resources.length]);

  const handleSlidesSyncView = () => {
    if (!slidesViewed && isMountedRef.current) {
      trackEvent("learn_stage_slides_artifact_viewed", { resourceId: slidesResource?.id });
      setSlidesViewed(true);
    }
  };

  const handleMindmapSyncView = () => {
    if (!mindmapViewed && isMountedRef.current) {
      trackEvent("learn_stage_mindmap_artifact_viewed", { resourceId: mindmapResource?.id });
      setMindmapViewed(true);
    }
  };

  const handleExecutiveCompletionSubmit = async () => {
    if (!canComplete) return;
    trackEvent("learn_stage_completion_requested", { slidesViewed, mindmapViewed });

    try {
      // Automated Efficiency: Invalidate tracker states immediately across adjacent workspace viewports
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onComplete();
      }
    } catch (err) {
      trackError(err, {
        component: "LearnStage",
        action: "execute_learn_stage_completion_callback",
      });
      // Safe fallback passthrough validation execution to protect platform timeline flow
      onComplete();
    }
  };

  return (
    <div className="space-y-5 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: STAGE HEADER METADATA OVERVIEW */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Stage 02: Knowledge Ingestion Portal</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Synchronize workspace profiles with structured slide decks and interactive cognitive mindmaps
          </p>
        </div>
        {isCompleted && (
          <Badge
            variant="outline"
            className="text-[9px] font-extrabold tracking-wider uppercase px-2 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shrink-0 select-none"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
            <span>Node Verified</span>
          </Badge>
        )}
      </div>

      {/* HUD LEVEL 2: DYNAMIC BRANCH SELECTION DISPLAY BLOCK */}
      {resources.length === 0 ? (
        <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-full flex flex-col justify-center items-center py-12 animate-in fade-in duration-300">
          <Zap className="h-6 w-6 text-primary/30 mb-3 animate-pulse stroke-[2.2]" />
          <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-wide leading-none">
            Ingestion Registry Vacant
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic mb-4">
            No core learning artifacts are currently configured for this instructional node block.
          </p>
          <Button
            type="button"
            onClick={handleExecutiveCompletionSubmit}
            className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <span>Bypass Ingestion Vector</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 w-full min-w-0">
          {/* COMPONENT ELEMENT A: STRUCTURED SLIDE DECK VIEW LAYER */}
          {slidesResource && (
            <Card
              className={cn(
                "border rounded-2xl bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-300 w-full min-w-0 flex flex-col shadow-sm",
                slidesViewed
                  ? "border-emerald-500/20 shadow-emerald-500/[0.02]"
                  : "border-border/40 hover:border-border/60 hover:shadow-md",
              )}
            >
              <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate flex items-center justify-between gap-4 w-full pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
                    <span className="truncate text-ellipsis">{slidesResource.title}</span>
                  </div>
                  {slidesViewed && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in shrink-0 stroke-[2.5]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full min-w-0">
                {slidesResource.resource_url && (
                  <div
                    onClick={handleSlidesSyncView}
                    className="cursor-pointer outline-none w-full border-none"
                  >
                    <ResourceViewer type="slides" url={slidesResource.resource_url} title={slidesResource.title} />
                  </div>
                )}
                {slidesResource.description && (
                  <div className="p-4 bg-muted/5 border-t border-border/10 w-full text-left leading-normal font-medium text-[11px] sm:text-xs text-muted-foreground/70 italic select-text pr-2 break-words">
                    {slidesResource.description.trim()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* COMPONENT ELEMENT B: COGNITIVE MINDMAP MATRIX ARTIFACT VIEW LAYER */}
          {mindmapResource && (
            <Card
              className={cn(
                "border rounded-2xl bg-card/40 backdrop-blur-md overflow-hidden transition-all duration-300 w-full min-w-0 flex flex-col shadow-sm",
                mindmapViewed
                  ? "border-emerald-500/20 shadow-emerald-500/[0.02]"
                  : "border-border/40 hover:border-border/60 hover:shadow-md",
              )}
            >
              <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate flex items-center justify-between gap-4 w-full pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Network className="h-4 w-4 text-violet-500 dark:text-violet-400 stroke-[2.2] shrink-0" />
                    <span className="truncate text-ellipsis">{mindmapResource.title}</span>
                  </div>
                  {mindmapViewed && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in shrink-0 stroke-[2.5]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full min-w-0">
                {mindmapResource.resource_url && (
                  <div
                    onClick={handleMindmapSyncView}
                    className="cursor-pointer outline-none w-full border-none"
                  >
                    <ResourceViewer type="mindmap" url={mindmapResource.resource_url} title={mindmapResource.title} />
                  </div>
                )}
                {mindmapResource.description && (
                  <div className="p-4 bg-muted/5 border-t border-border/10 w-full text-left leading-normal font-medium text-[11px] sm:text-xs text-muted-foreground/70 italic select-text pr-2 break-words">
                    {mindmapResource.description.trim()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* HUD LEVEL 3: TIMELINE COMPLETION COMMAND INTERACTION BAR */}
      {!isCompleted && resources.length > 0 && (
        <div className="flex justify-end pt-3 border-t border-border/10 select-none w-full shrink-0">
          <Button
            onClick={handleExecutiveCompletionSubmit}
            disabled={!canComplete}
            type="button"
            className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.99] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {canComplete ? (
              <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] animate-pulse" />
            ) : (
              <FileText className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>
              {canComplete
                ? "Authorize Continuing Track Passage"
                : "Ingestion Steps Required: Inspect Primary Resource Elements"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
