import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  CheckCircle,
  Download,
  X,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceViewerProps {
  type: "video" | "slides" | "infographic" | "mindmap" | "audio_podcast";
  url: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: (total_yield?: number) => void;
  className?: string;
}

/**
 * GroUp Academy: Multi-Modal Instructional Ingestion Engine (ResourceViewer)
 * An authoritative operational pipeline processing visual assets, audio waveforms, and external embedding matrices safely.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ResourceViewer({ type, url, title, onProgress, onComplete, className }: ResourceViewerProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("resource_viewer_initialized", { type, contentTitle: title });
    return () => {
      isMountedRef.current = false;
    };
  }, [type, title]);

  const isPDF = useMemo(() => url?.toLowerCase().includes(".pdf"), [url]);

  const viewerUrl = useMemo(() => {
    if (!url) return "";
    if (isPDF || type === "slides") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  }, [url, isPDF, type]);

  const youtubeVideoId = useMemo(() => {
    if (type !== "video" || !url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }, [url, type]);

  const handleManualVerificationVerification = async () => {
    trackEvent("resource_manual_verification_triggered", { type, title });
    try {
      // Automated Efficiency: Invalidate metric states immediately across adjacent workspace viewports
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (isMountedRef.current && onComplete) {
        onComplete(100);
      }
    } catch (err) {
      trackError(err, { component: "ResourceViewer", action: "execute_manual_completion" });
      if (onComplete) onComplete(100);
    }
  };

  const handleAudioSyncUpdate = () => {
    if (!audioRef.current || !isMountedRef.current) return;
    const currentDuration = audioRef.current.duration;

    if (!currentDuration || isNaN(currentDuration)) return;

    const progressValue = (audioRef.current.currentTime / currentDuration) * 100;
    setAudioProgress(progressValue);

    if (onProgress) {
      onProgress(progressValue);
    }

    // Spaced Recall Threshold: 80% Synchronization for Auto-Verification
    if (progressValue >= 80) {
      trackEvent("resource_audio_threshold_passed", { title });
      if (onComplete) {
        onComplete(100);
      }
    }
  };

  const toggleAudioHandshake = () => {
    if (!audioRef.current) return;
    trackEvent("resource_audio_playback_toggled", { nextState: !audioPlaying });

    try {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      if (isMountedRef.current) {
        setAudioPlaying(!audioPlaying);
      }
    } catch (playbackErr) {
      trackError(playbackErr, { component: "ResourceViewer", action: "toggle_audio_playback" });
    }
  };

  // =========================================================================
  // NODE A: VIDEO MULTIMEDIA TRACK ENGINE INTERFACE
  // =========================================================================
  if (type === "video") {
    if (!youtubeVideoId) {
      return (
        <Card
          className={cn(
            "w-full border border-dashed border-rose-500/20 bg-rose-500/5 rounded-xl p-6 text-center select-none flex flex-col justify-center items-center",
            className,
          )}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2.5">
            <Zap className="h-5 w-5 text-rose-500 shrink-0 stroke-[2.2] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-none">
              Artifact Ingestion Fault: Invalid Video Matrix Resource Link Key
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        className={cn(
          "w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transform-gpu text-left",
          className,
        )}
      >
        <div className="aspect-video bg-black/10 w-full overflow-hidden relative shadow-inner">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&enablejsapi=1&modestbranding=1`}
            title={title || "Ecosystem Synchronized Video Stream"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-none"
          />
        </div>
        <CardContent className="p-4 flex items-center justify-between gap-4 bg-muted/10 border-t border-border/10 select-none leading-none w-full shrink-0">
          <span className="text-xs sm:text-sm font-bold text-foreground/80 truncate text-ellipsis select-text selection:bg-primary/10 flex-1 pr-2 leading-none block">
            {title}
          </span>
          {onComplete && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleManualVerificationVerification}
              className="h-8 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-primary hover:border-primary/20 uppercase text-[10px] tracking-wide shrink-0 shadow-sm gap-1 flex items-center cursor-pointer transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-current stroke-[2.5]" />
              <span>Lock Progress</span>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // =========================================================================
  // NODE B: DOCUMENT PRESENTATION SLIDE EMBED CARRIER INTERFACE
  // =========================================================================
  if (type === "slides") {
    return (
      <>
        <Card
          className={cn(
            "w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transform-gpu text-left group/slides relative flex flex-col",
            className,
          )}
        >
          <div className="aspect-video bg-muted relative w-full overflow-hidden shadow-inner">
            <iframe
              src={viewerUrl}
              title={title || "Ecosystem Interactive Slide Deck Document"}
              className="w-full h-full border-none"
              allowFullScreen
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/slides:opacity-100 transition-opacity duration-300 backdrop-blur-sm flex items-center justify-center gap-3 select-none z-20">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  trackEvent("resource_fullscreen_audit_expanded", { title });
                  setFullscreenOpen(true);
                }}
                className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wide shadow-md bg-background text-foreground hover:bg-muted"
              >
                <Maximize className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                <span>Fullscreen Analysis</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                asChild
                className="h-9 w-9 rounded-xl shadow-md p-0 bg-background text-foreground hover:bg-muted flex items-center justify-center shrink-0"
              >
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("resource_slides_downloaded", { title })}
                >
                  <Download className="h-4 w-4 stroke-[2.2]" />
                </a>
              </Button>
            </div>
          </div>

          <CardContent className="p-4 flex items-center justify-between gap-4 border-t border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
            <span className="text-xs sm:text-sm font-bold text-foreground/80 truncate text-ellipsis select-text selection:bg-primary/10 flex-1 pr-2 leading-none block">
              {title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              asChild
              className="h-7 font-bold uppercase text-[10px] tracking-wider border border-transparent text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("resource_slides_external_opened", { title })}
              >
                <span>External Ingress</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1 stroke-[2.2]" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* FULL PAGE SUB-TRACK DIALOG FOR PRESENTATION READING */}
        <Dialog
          open={fullscreenOpen}
          onOpenChange={(vState) => {
            setFullscreenOpen(vState);
            if (!vState) trackEvent("resource_fullscreen_audit_collapsed");
          }}
        >
          <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 border-0 bg-background/95 backdrop-blur-3xl rounded-none select-none sm:select-text flex flex-col justify-between overflow-hidden">
            <DialogTitle className="sr-only font-bold text-sm select-none">{title} Analysis Modal</DialogTitle>
            <div className="relative w-full h-full flex flex-col select-none min-w-0">
              <div className="flex items-center justify-between gap-4 p-4 bg-muted/10 border-b border-border/10 leading-none shrink-0 w-full">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary select-none block leading-none font-mono">
                  Fullscreen Audit Workspace Session Active
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
                  onClick={() => setFullscreenOpen(false)}
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </div>

              <iframe
                src={viewerUrl}
                title={title}
                className="w-full flex-1 border-none bg-background shadow-inner"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // =========================================================================
  // NODE C: VISUAL SCHEMATIC CONTENT BLOCK DECK INTERFACE
  // =========================================================================
  if (type === "infographic" || type === "mindmap") {
    return (
      <Card
        className={cn(
          "w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transform-gpu text-left group/visual relative flex flex-col",
          className,
        )}
      >
        <CardContent className="p-0 w-full min-w-0 flex flex-col justify-center">
          <div
            className="relative cursor-zoom-in overflow-hidden w-full h-full block"
            onClick={() => {
              trackEvent("resource_visual_matrix_zoom_triggered", { type, title });
              window.open(url, "_blank");
            }}
          >
            <img
              src={url}
              alt={`${title || "Cognitive reference data asset graphic sheet overview mapping pointer"}`}
              className="w-full h-auto transition-transform duration-1000 ease-out transform group-hover/visual:scale-102 object-cover block shadow-inner"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/visual:opacity-100 transition-opacity duration-300 backdrop-blur-xs flex items-center justify-center select-none z-10">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wide shadow-md bg-background text-foreground hover:bg-muted"
              >
                <Maximize className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                <span>Ingest Complete Structural Node</span>
              </Button>
            </div>
          </div>

          <div className="p-4 border-t border-border/10 bg-muted/10 select-none leading-none w-full shrink-0 text-left">
            <span className="text-xs sm:text-sm font-bold text-foreground/80 truncate text-ellipsis select-text block break-words pr-1 leading-none">
              {title}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =========================================================================
  // NODE D: AUDITORY WAVEFORM TRACK PLAYER STRIP INTERFACE
  // =========================================================================
  if (type === "audio_podcast") {
    return (
      <Card
        className={cn(
          "w-full rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transform-gpu text-left flex flex-col justify-center",
          className,
        )}
      >
        <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 select-none leading-none w-full shrink-0 truncate">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner select-none">
              <Zap className="h-4 w-4 fill-primary/10 stroke-[2.2] animate-pulse" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground/80 truncate text-ellipsis block pt-0.5 select-text selection:bg-primary/10 pr-2 leading-none">
              {title}
            </span>
          </div>

          <audio
            ref={audioRef}
            src={url}
            onTimeUpdate={handleAudioSyncUpdate}
            onEnded={() => {
              if (isMountedRef.current) {
                trackEvent("resource_audio_stream_fully_ended", { title });
                setAudioPlaying(false);
                if (onComplete) onComplete(100);
              }
            }}
            className="hidden pointer-events-none select-none sr-only"
            aria-hidden="true"
          />

          <div className="flex items-center gap-4 w-full min-w-0 font-bold text-xs leading-none">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={toggleAudioHandshake}
              className="h-12 w-12 rounded-xl border border-primary/15 bg-primary/[0.02] text-primary hover:bg-primary hover:text-primary-foreground shrink-0 shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center cursor-pointer"
              aria-label={
                audioPlaying
                  ? `Halt dynamic auditory content output playback for ${title}`
                  : `Launch sequential voice track execution stream for ${title}`
              }
            >
              {audioPlaying ? (
                <Pause className="h-5 w-5 fill-primary/10 stroke-[2.5]" />
              ) : (
                <Play className="h-5 w-5 fill-primary/10 stroke-[2.2] ml-0.5" />
              )}
            </Button>

            <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-center leading-none select-none">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider font-mono leading-none w-full">
                <span>Auditory Progression Flux</span>
                <span className="tabular-nums text-primary font-black bg-primary/5 px-1.5 py-0.5 border border-primary/5 rounded shadow-xs">
                  {Math.round(audioProgress)}% verified
                </span>
              </div>
              <div className="h-2 bg-primary/10 border border-border/5 rounded-full overflow-hidden shadow-inner relative flex w-full">
                <div
                  className="h-full bg-primary rounded-full border-none shrink-0"
                  style={{ width: `${Math.round(audioProgress)}%` }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-9 w-9 rounded-xl text-muted-foreground/70 hover:bg-muted transition-colors shrink-0 cursor-pointer flex items-center justify-center shadow-none"
              onClick={() => {
                if (audioRef.current && isMountedRef.current) {
                  const targetMuteState = !audioMuted;
                  audioRef.current.muted = targetMuteState;
                  setAudioMuted(targetMuteState);
                  trackEvent("resource_audio_mute_swapped", { muted: targetMuteState });
                }
              }}
              aria-label={
                audioMuted
                  ? "Activate structural loudspeaker output filters"
                  : "Deafen current audio socket stream mapping"
              }
            >
              {audioMuted ? (
                <VolumeX className="h-4.5 w-4.5 text-rose-500 stroke-[2.5]" />
              ) : (
                <Volume2 className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
