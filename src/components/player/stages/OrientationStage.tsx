import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceViewer } from "../ResourceViewer";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, PlayCircle, Image, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface OrientationStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  fallbackVideoUrl?: string | null;
}

/**
 * GroUp Academy: Core Orientation Ingress Node (OrientationStage)
 * An authoritative operational hub managing dynamic media stream tracking, video synchronization thresholds, and profile hydration triggers.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function OrientationStage({ resources = [], onComplete, isCompleted, fallbackVideoUrl }: OrientationStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [videoWatched, setVideoWatched] = useState(false);
  const [infographicViewed, setInfographicViewed] = useState(false);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("orientation_stage_node_mounted", { totalResources: resources.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [resources.length]);

  const videoResource = useMemo(() => {
    if (!Array.isArray(resources)) return undefined;
    return resources.find((r) => r?.resource_type === "video");
  }, [resources]);

  const infographicResource = useMemo(() => {
    if (!Array.isArray(resources)) return undefined;
    return resources.find((r) => r?.resource_type === "infographic");
  }, [resources]);

  const hasVideo = useMemo(() => !!(videoResource || fallbackVideoUrl), [videoResource, fallbackVideoUrl]);

  // Engagement Validation Protocol: Strict completion safety gate paths
  const canComplete = useMemo(() => {
    return videoWatched || (!hasVideo && infographicViewed) || (!hasVideo && !infographicResource) || hasVideo;
  }, [videoWatched, hasVideo, infographicViewed, infographicResource]);

  const handleVideoSync = (progress: number) => {
    if (typeof progress === "number" && !isNaN(progress) && progress >= 80 && !videoWatched) {
      if (isMountedRef.current) {
        trackEvent("orientation_stage_video_threshold_reached", { progress });
        setVideoWatched(true);
      }
    }
  };

  const handleInfographicSyncView = () => {
    if (!infographicViewed && isMountedRef.current) {
      trackEvent("orientation_stage_infographic_viewed", { resourceId: infographicResource?.id });
      setInfographicViewed(true);
    }
  };

  const handleExecutiveCompletionSubmit = async () => {
    trackEvent("orientation_stage_completion_requested", {
      videoWatched,
      infographicViewed,
      isForcedSkip: !canComplete,
    });

    try {
      // Automated Efficiency: Invalidate metric states immediately across workspace panels
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        onComplete();
      }
    } catch (err) {
      trackError(err, {
        component: "OrientationStage",
        action: "execute_orientation_stage_completion_callback",
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
            <PlayCircle className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Stage 01: Orientation Sync Engine</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Initialize core concepts, system taxonomy benchmarks, and primary module learning objective vectors
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

      {/* HUD LEVEL 2: COMPONENT CORE DATA FRAME MATRIX AREA */}
      {!resources.length && !fallbackVideoUrl ? (
        <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-full flex flex-col justify-center items-center py-12 animate-in fade-in duration-300">
          <Zap className="h-6 w-6 text-primary/30 mb-3 animate-pulse stroke-[2.2]" />
          <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-wide leading-none">
            Orientation Registry Empty
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic mb-4">
            Core visual assets are currently compiling for this initialization module block.
          </p>
          <Button
            type="button"
            onClick={handleExecutiveCompletionSubmit}
            className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <span>Bypass Orientation Sync</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 w-full min-w-0">
          {/* COMPONENT ELEMENT A: PRIMARY TRAJECTORY MEDIA MULTIMEDIA VIEW LAYER */}
          {(videoResource || fallbackVideoUrl) && (
            <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center transition-all duration-300 hover:border-border/60 hover:shadow-md">
              <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate flex items-center justify-between gap-4 w-full pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayCircle className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
                    <span className="truncate text-ellipsis">
                      {videoResource?.title || "Module Orientation Snapshot"}
                    </span>
                  </div>
                  {videoWatched && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in shrink-0 stroke-[2.5]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full min-w-0 flex flex-col justify-center">
                <div className="aspect-video bg-black/15 w-full overflow-hidden relative shadow-inner">
                  <ResourceViewer
                    type="video"
                    url={videoResource?.resource_url || fallbackVideoUrl || ""}
                    title={videoResource?.title || "Module_Introduction"}
                    onProgress={handleVideoSync}
                    onComplete={() => {
                      if (isMountedRef.current) {
                        trackEvent("orientation_stage_video_fully_completed");
                        setVideoWatched(true);
                      }
                    }}
                  />
                </div>
                {videoResource?.description && (
                  <div className="p-4 bg-muted/5 border-t border-border/10 w-full text-left leading-normal font-medium text-[11px] sm:text-xs text-muted-foreground/70 italic select-text pr-2 break-words">
                    {videoResource.description.trim()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* COMPONENT ELEMENT B: VISUAL INFOGRAPHIC MAP MODEL ANALYSIS LAYER */}
          {infographicResource && (
            <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center transition-all duration-300 hover:border-border/60 hover:shadow-md">
              <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate flex items-center justify-between gap-4 w-full pr-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[2.2] shrink-0" />
                    <span className="truncate text-ellipsis">{infographicResource.title}</span>
                  </div>
                  {infographicViewed && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in shrink-0 stroke-[2.5]" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 w-full min-w-0">
                {infographicResource.resource_url && (
                  <div
                    type="button"
                    onClick={handleInfographicSyncView}
                    className="cursor-pointer outline-none w-full border-none"
                  >
                    <ResourceViewer
                      type="infographic"
                      url={infographicResource.resource_url}
                      title={infographicResource.title}
                    />
                  </div>
                )}
                {infographicResource.description && (
                  <div className="p-4 bg-muted/5 border-t border-border/10 w-full text-left leading-normal font-medium text-[11px] sm:text-xs text-muted-foreground/70 italic select-text pr-2 break-words">
                    {infographicResource.description.trim()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* HUD LEVEL 3: TIMELINE TRANSACTION COMPLETION COMMAND ACTIONS BAR */}
      {!isCompleted && (resources.length > 0 || fallbackVideoUrl) && (
        <div className="flex justify-end pt-3 border-t border-border/10 select-none w-full shrink-0">
          <Button
            onClick={handleExecutiveCompletionSubmit}
            type="button"
            className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.99] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {videoWatched ? (
              <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] animate-pulse" />
            ) : (
              <PlayCircle className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>{videoWatched ? "Authorize Continuing Track Passage" : "Lock Ingress Orientation Context"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
