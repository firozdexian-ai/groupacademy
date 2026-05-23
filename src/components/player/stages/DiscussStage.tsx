import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceViewer } from "../ResourceViewer";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { CheckCircle, MessageSquare, Headphones, Bot, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface DiscussStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
  moduleId: string;
  instructorName?: string;
}

/**
 * GroUp Academy: Knowledge Synthesis Bimodal Discussion Controller (DiscussStage)
 * An authoritative operational hub managing auditory processing artifacts and AI instruction dialogue.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function DiscussStage({
  resources = [],
  onComplete,
  isCompleted,
  professionLineId,
  moduleId,
  instructorName = "AI_INSTRUCTOR_V3",
}: DiscussStageProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [audioListened, setAudioListened] = useState(false);
  const [aiMessageCount, setAiMessageCount] = useState(0);

  // Synchronize component mounting bounds cleanly to catch dangling thread mutations
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("discuss_stage_node_mounted", { moduleId, totalResources: resources.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [moduleId, resources.length]);

  const audioResource = useMemo(() => {
    if (!Array.isArray(resources)) return undefined;
    return resources.find((r) => r?.resource_type === "audio_podcast");
  }, [resources]);

  // Bimodal Completion Logic: Audio verification milestone met OR threshold AI message counter reached
  const canComplete = useMemo(() => {
    return audioListened || aiMessageCount >= 3 || resources.length === 0;
  }, [audioListened, aiMessageCount, resources.length]);

  const handleAudioSync = () => {
    trackEvent("discuss_stage_audio_artifact_synced", { moduleId, resourceId: audioResource?.id });
    setAudioListened(true);
  };

  const handleExecutiveCompletionSubmit = async () => {
    if (!canComplete) return;
    trackEvent("discuss_stage_completion_requested", { moduleId, audioListened, aiMessageCount });

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
        component: "DiscussStage",
        action: "execute_discuss_stage_completion_callback",
        moduleId,
      });
      // Safe fallback passthrough execution to secure timeline progression
      onComplete();
    }
  };

  return (
    <div className="space-y-5 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: STAGE HEADER METADATA PANEL */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
            <span>Stage 03: Knowledge Synthesis Matrix</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Deepen core discipline comprehension via Auditory Artifact processing OR Neural Dialogue execution
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

      {/* HUD LEVEL 2: CONDITIONAL FALLBACK GRID OR CONTENT GRID DISPLAY */}
      {!resources.length && !professionLineId ? (
        <Card className="border border-dashed border-border/60 bg-card/40 backdrop-blur-md rounded-2xl p-6 text-center select-none w-full max-w-full flex flex-col justify-center items-center py-12 animate-in fade-in duration-300">
          <Zap className="h-6 w-6 text-primary/30 mb-3 animate-pulse stroke-[2.2]" />
          <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-wide leading-none">
            Synthesis Ledger Empty
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic mb-4">
            No bimodal verification parameters are registered for this learning node timeline.
          </p>
          <Button
            type="button"
            onClick={handleExecutiveCompletionSubmit}
            className="h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide px-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <span>Bypass Synthesis Vector</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
          {/* COMPONENT STREAM ROW A: AUDITORY TRACK ANALYSIS CONTAINER */}
          <div className="space-y-2.5 w-full min-w-0 flex flex-col justify-start">
            <div className="flex items-center gap-2 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
              <Headphones className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>Auditory Artifact Pipeline</span>
            </div>

            {audioResource ? (
              <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center transition-colors hover:border-border/60">
                <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none w-full">
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate flex items-center justify-between gap-4 w-full pr-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Headphones className="h-3.5 w-3.5 text-primary stroke-[2.2] shrink-0" />
                      <span className="truncate text-ellipsis">{audioResource.title}</span>
                    </div>
                    {audioListened && (
                      <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in shrink-0 stroke-[2.5]" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 w-full min-w-0">
                  {audioResource.resource_url && (
                    <ResourceViewer
                      type="audio_podcast"
                      url={audioResource.resource_url}
                      title={audioResource.title}
                      onComplete={handleAudioSync}
                    />
                  )}
                  {audioResource.description && (
                    <p className="text-[11px] font-semibold leading-relaxed text-muted-foreground/70 max-w-full select-text mt-3 pt-3 border-t border-border/5 italic pr-1 break-words">
                      {audioResource.description.trim()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed border-border/40 bg-background/40 backdrop-blur-sm rounded-2xl p-6 text-center select-none w-full flex flex-col items-center justify-center py-10 shrink-0">
                <Headphones className="h-5 w-5 text-muted-foreground/20 mb-2 stroke-[2.2]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 italic leading-none">
                  No Auditory Node Active For This Track
                </p>
              </Card>
            )}

            {/* TELEMETRY ASSISTANCE HIGHLIGHT FRAME */}
            <Card className="border border-primary/10 bg-primary/[0.015] rounded-xl text-left w-full select-none shadow-sm shrink-0">
              <CardContent className="p-4 space-y-3 font-bold text-xs tracking-tight">
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wide italic">
                  <span className="text-primary font-black">Executive Guidance:</span> Calibrate this knowledge segment
                  by listening to the Auditory Podcast artifact OR dispatching minimum queries into the neural agent
                  framework.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 font-mono text-[9px] uppercase tracking-wider font-extrabold leading-none pt-0.5 tabular-nums">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      audioListened ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-md border text-[10px] flex items-center justify-center font-mono shrink-0 shadow-sm leading-none",
                        audioListened
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold"
                          : "bg-muted border-border/40 text-muted-foreground",
                      )}
                    >
                      {audioListened ? "✓" : ""}
                    </div>
                    <span>Auditory Track Logged</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      aiMessageCount >= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-md border text-[10px] flex items-center justify-center font-mono shrink-0 shadow-sm leading-none",
                        aiMessageCount >= 3
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold"
                          : "bg-muted border-border/40 text-muted-foreground",
                      )}
                    >
                      {aiMessageCount >= 3 ? "✓" : ""}
                    </div>
                    <span>Neural Burst Balance: {aiMessageCount} / 3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COMPONENT STREAM ROW B: NEURAL DIALOGUE CHAT PANEL SECTOR CONTAINER */}
          <div className="space-y-2.5 w-full min-w-0 flex flex-col h-full justify-start">
            <div className="flex items-center gap-2 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
              <Bot className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>Neural Dialogue Sequence</span>
            </div>

            <Card className="flex-1 min-h-[440px] border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:border-border/60 w-full">
              <CardHeader className="bg-muted/10 border-b border-border/10 p-3.5 px-4 select-none leading-none shrink-0 w-full">
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide flex items-center gap-2 leading-none block">
                  <Bot className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
                  <span>Synchronize With {instructorName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 relative w-full min-w-0 flex flex-col">
                <AIChatPanel
                  professionLineId={professionLineId}
                  contextType="module"
                  contextId={moduleId}
                  instructorName={instructorName}
                  placeholder="Initiate specific knowledge evaluation query matrices..."
                  className="h-full border-0 rounded-none bg-transparent flex-1"
                  onMessageSent={() => {
                    if (isMountedRef.current) {
                      setAiMessageCount((prev) => prev + 1);
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* HUD LEVEL 3: TIMELINE TRANSACTION COMPLETION COMMAND ACTIONS BAR */}
      {!isCompleted && (
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
              <Bot className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>
              {canComplete ? "Continue" : "Ask the AI or play the audio to continue"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
