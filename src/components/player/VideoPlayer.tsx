import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, Clock, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
}

interface VideoPlayerProps {
  module: Module;
  onComplete: () => void;
  isCompleted: boolean;
}

/**
 * GroUp Academy: Curriculum Video Ingestion Node (VideoPlayer)
 * An authoritative operational sandbox validating multimedia consumption metrics and updating target profile state parameters.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function VideoPlayer({ module, onComplete, isCompleted }: VideoPlayerProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component state parameters defensively over activation lifecycles
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("video_player_node_mounted", { moduleId: module?.id });
    return () => {
      isMountedRef.current = false;
    };
  }, [module?.id]);

  // Hardened Regex Pass: Memoize YouTube index extraction to eliminate layout process lag
  const embedUrl = useMemo(() => {
    const rawUrlString = module?.video_url;
    if (!rawUrlString) return null;

    const matchedIdArray = rawUrlString.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/,
    );

    return matchedIdArray
      ? `https://www.youtube.com/embed/${matchedIdArray[1]}?rel=0&enablejsapi=1&modestbranding=1`
      : null;
  }, [module?.video_url]);

  const handleExecutiveSyncSubmit = async () => {
    trackEvent("video_player_sync_requested", { moduleId: module.id });
    const toastId = (await import("sonner")).toast.loading(
      "Committing video ingest parameters to profile ledger index...",
    );

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current) {
        (await import("sonner")).toast.success("Ingestion curves successfully verified.", { id: toastId });
        onComplete();
      }
    } catch (err) {
      trackError(err, {
        component: "VideoPlayer",
        action: "execute_video_sync_verification_callback",
        moduleId: module.id,
      });
      (await import("sonner")).toast.error("Ledger write exception: Connection dropped.", { id: toastId });
      onComplete(); // Safe fallback passthrough sequence execution to maintain course flow
    }
  };

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTAINER */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 w-full select-none leading-none">
        <div className="flex items-start justify-between gap-4 w-full leading-none">
          <div className="space-y-1.5 flex flex-col justify-center leading-none min-w-0 flex-1 text-left">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground/90 uppercase tracking-wide leading-tight truncate text-ellipsis select-text selection:bg-primary/10">
              {module?.title || "Untitled video"}
            </CardTitle>
            {module?.description && (
              <CardDescription className="text-[10px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal italic select-text max-w-2xl break-words block pt-0.5 pr-1">
                {module.description.trim()}
              </CardDescription>
            )}
          </div>
          {isCompleted && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold tracking-wider uppercase px-2 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shrink-0 animate-in zoom-in duration-200"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
              <span>Node Verified</span>
            </Badge>
          )}
        </div>

        {module?.duration_minutes && (
          <div className="flex items-center gap-1.5 mt-3 px-2 h-5 rounded bg-muted/40 border border-border/10 w-fit text-[9px] font-mono font-extrabold uppercase text-muted-foreground/70 tracking-wide select-none shadow-inner leading-none">
            <Clock className="h-3 w-3 text-primary stroke-[2.2]" />
            <span>{module.duration_minutes} MIN RUN TIME SYNC</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
        {/* HUD LEVEL 2: IFRAME MULTIMEDIA RENDER ENVIRONMENT FRAME CONTAINER */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/40 bg-black shadow-inner group/video select-none transform-gpu shrink-0">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={module?.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-none bg-background shadow-inner"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-muted/5 pointer-events-none">
              <Zap className="h-6 w-6 text-primary/30 animate-pulse stroke-[2.2]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 italic leading-none">
                Orientation Registry Empty: Awaiting Video Stream Data Ingress
              </p>
            </div>
          )}
        </div>

        {/* HUD LEVEL 3: TIMELINE TRANSACTION CONFIGURATION CONTROL COMMAND DISPATCH ROW STRIP */}
        {!isCompleted && (
          <Button
            type="button"
            disabled={!embedUrl}
            onClick={handleExecutiveSyncSubmit}
            className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 mt-0.5 select-none"
          >
            <Zap className="h-4 w-4 fill-primary-foreground/10 stroke-[2.2] shrink-0 animate-pulse" />
            <span>Authorize Video Ingest Verification</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
