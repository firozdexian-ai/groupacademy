import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Clock, Award, Loader2, ShieldAlert } from "lucide-react";
import { useMyTrackAssignments, useTrackProgress } from "@/hooks/useLearningTracks";
import { TrackProgressRing } from "@/components/learning/TrackProgressRing";
import { GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { IS_GRO10X } from "@/lib/host";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface TrackDetails {
  id: string;
  title: string | null;
  summary: string | null;
}

interface TrackAssignment {
  id: string;
  track_id: string;
  due_at: string | null;
  learning_tracks: TrackDetails | null;
}

interface ProgressItemNode {
  content_id: string;
  title: string;
  position: number;
  is_required: boolean;
  status: string | null;
  completed_at: string | null;
}

interface TrackProgressPayload {
  required_done: number;
  required_total: number;
  is_complete: boolean;
  items: ProgressItemNode[];
}

const ACADEMY_LEARN_HOME_ROUTER_PATH = IS_GRO10X ? "/gro10x/learn" : "/app/learning";

/**
 * GroUp Academy: Personal Career Track Progress Monitor (AppTrackDetail)
 * Hardened roadmap portal calculating structural course milestone dependencies and locking date intervals against localization drifts.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function AppTrackDetail() {
  const { trackId: unverifiedTrackIdStr } = useParams<{ trackId: string }>();

  const { data: trackAssignmentsPayload, isLoading: isAssignmentsCacheResolving } = useMyTrackAssignments();

  // Cast incoming query vectors securely to shield child components from type decay
  const typedAssignmentsArray = trackAssignmentsPayload as unknown as TrackAssignment[] | undefined;

  // Isolate current active track assignment using an isolated memo checkpoint
  const contextualActiveAssignment = React.useMemo(() => {
    if (!typedAssignmentsArray || !unverifiedTrackIdStr) return null;
    return typedAssignmentsArray.find((assignmentItem) => assignmentItem.track_id === unverifiedTrackIdStr) || null;
  }, [typedAssignmentsArray, unverifiedTrackIdStr]);

  const { data: progressPayloadResponse, isLoading: isProgressCacheResolving } = useTrackProgress(
    contextualActiveAssignment?.id,
  );
  const typedProgressPayload = progressPayloadResponse as unknown as TrackProgressPayload | undefined;

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: PROGRAMMATIC LEVEL MAP VECTOR PREREQUISITES
  // =========================================================================
  const calculatedPrerequisiteLocksArray = React.useMemo<boolean[]>(() => {
    if (!typedProgressPayload?.items || typedProgressPayload.items.length === 0) return [];

    const itemsCollection = typedProgressPayload.items;
    return itemsCollection.map((_, indexPosition) => {
      if (indexPosition === 0) return true; // Foundation block step initialization is consistently un-locked

      const upstreamSiblingNode = itemsCollection[indexPosition - 1];
      const isCompletedFlag = upstreamSiblingNode.status === "completed" || upstreamSiblingNode.completed_at !== null;
      return isCompletedFlag;
    });
  }, [typedProgressPayload]);

  if (isAssignmentsCacheResolving || isProgressCacheResolving) {
    return (
      <div
        role="status"
        className="min-h-[60vh] w-full grid place-items-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none antialiased"
      >
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span>Syncing Milestone Logs Matrix...</span>
        </div>
      </div>
    );
  }

  if (!contextualActiveAssignment) {
    return (
      <div
        role="alert"
        className="min-h-[50vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block leading-none">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Assignment Allocation Absent</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal mt-1">
              No continuous verification student ledger assignments were matched to this professional track parameter
              index.
            </p>
          </div>
          <Button
            type="button"
            asChild
            variant="outline"
            className="h-8 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider px-3 shadow-2xs cursor-pointer"
          >
            <Link to={ACADEMY_LEARN_HOME_ROUTER_PATH}>Back to Learn Hub</Link>
          </Button>
        </div>
      </div>
    );
  }

  const targetedTrackNodeDetails = contextualActiveAssignment.learning_tracks;

  return (
    <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 pb-32 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: HUB INTEGRATION TRACK DIRECTORY NAVIGATION HEADER */}
      <header className="block w-full select-none pb-3 border-b border-border/10 leading-none">
        <Link
          to={ACADEMY_LEARN_HOME_ROUTER_PATH}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors leading-none"
        >
          <ArrowLeft className="h-3 w-3 stroke-[2.5]" /> <span>Return to Matrix Index</span>
        </Link>

        <div className="mt-4 flex items-center gap-4 block w-full leading-none">
          <div className="shrink-0 pointer-events-none select-none">
            <TrackProgressRing
              done={typedProgressPayload?.required_done ?? 0}
              total={typedProgressPayload?.required_total ?? 0}
              size={56}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1 block">
            <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
              {targetedTrackNodeDetails?.title ?? "Specialty Curriculum Path"}
            </h1>
            {targetedTrackNodeDetails?.summary && (
              <p
                className={cn(
                  "text-xs leading-normal block select-text font-medium text-muted-foreground/80 line-clamp-2",
                  !IS_GRO10X && "text-muted-foreground/70",
                  GRO10X_MUTED,
                )}
              >
                {targetedTrackNodeDetails.summary}
              </p>
            )}
            {contextualActiveAssignment.due_at && (
              <p className="font-mono text-[9px] sm:text-[10px] font-extrabold text-amber-500 uppercase tracking-wide flex items-center gap-1 leading-none pt-0.5">
                <Clock className="h-3.5 w-3.5 stroke-[2] shrink-0" />
                <span>
                  Syllabus Dead-Line:{" "}
                  {new Date(contextualActiveAssignment.due_at)
                    .toLocaleDateString("en-US", { timeZone: "UTC" })
                    .toUpperCase()}
                </span>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* HUD LEVEL 2: DYNAMIC MINTED CREDENTIAL STATUS INDICATOR BANNER */}
      {typedProgressPayload?.is_complete && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.01] p-3 flex items-start gap-2.5 mt-4 select-none pointer-events-none leading-none w-full block animate-in fade-in duration-200">
          <Award className="h-5 w-5 text-emerald-600 stroke-[2.2] shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 leading-none space-y-0.5 block">
            <p className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
              Professional Track Fully Finalized
            </p>
            <p className="font-mono text-[9px] font-bold text-emerald-600/80 uppercase tracking-tight block leading-none">
              Your cryptographically signed completion certificate block has been minted.
            </p>
          </div>
        </div>
      )}

      {/* HUD LEVEL 3: DYNAMIC ROADMAP INSTRUCTIONAL PROGRESSION BLOCKS */}
      <section className="mt-6 space-y-3 block w-full">
        <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
          Syllabus Execution Milestones
        </h2>

        <div className="space-y-2 block w-full pt-1">
          {(typedProgressPayload?.items ?? []).map((itemNode, itemIndexNum) => {
            const isItemCompletedFlag = !!itemNode.completed_at;
            const isStepSequenceAccessibleFlag = calculatedPrerequisiteLocksArray[itemIndexNum] !== false;

            return (
              <div
                key={`track-sequence-item-node-${itemNode.content_id}`}
                className={cn(
                  "rounded-lg border border-border/60 bg-card/40 p-3 flex items-center justify-between gap-4 leading-none w-full block transform-gpu transition-colors duration-100 shadow-2xs",
                  !isStepSequenceAccessibleFlag && "opacity-50 bg-muted/10 border-border/20",
                  GRO10X_PANEL,
                )}
              >
                <div className="flex items-center gap-3.5 leading-none flex-1 min-w-0 block">
                  {/* Status Indicator Structural Icons Slots */}
                  <div className="h-9 w-9 rounded bg-background border border-border/40 grid place-items-center shrink-0 select-none pointer-events-none shadow-3xs">
                    {isItemCompletedFlag ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                    ) : !isStepSequenceAccessibleFlag ? (
                      <Lock className="h-4 w-4 text-muted-foreground/30 stroke-[2]" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-primary stroke-[2.2]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 block leading-none">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate block uppercase tracking-wide pt-0.5 select-text">
                      {itemNode.title}
                    </p>
                    <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex items-center gap-2 select-none pointer-events-none leading-none h-4">
                      <span>Syllabus Rank Step {(itemNode.position + 1).toString()}</span>
                      {!itemNode.is_required && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-[8px] font-extrabold px-1 h-3.5 bg-muted/60 text-muted-foreground/50 border border-transparent tracking-tight rounded-xs pt-0"
                        >
                          OPTIONAL DRAW
                        </Badge>
                      )}
                      {isItemCompletedFlag && (
                        <span className="text-emerald-600 font-extrabold font-mono select-none">✓ Verified Passed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
