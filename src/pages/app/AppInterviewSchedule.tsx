import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmInterviewSlot } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface InterviewMetadata {
  id: string;
  mode: string;
  duration_min: number;
  note: string | null;
  status: string;
  selected_slot_id: string | null;
  meeting_link: string | null;
}

interface InterviewTimeSlot {
  id: string;
  interview_id: string;
  starts_at: string;
  is_booked: boolean;
}

interface SlotConfirmationPayload {
  interviewId: string;
  slotId: string;
  applicationId: string;
}

/**
 * GroUp Academy: Technical Interview Slot Scheduling Engine (AppInterviewSchedule)
 * Hardened responsive tracking wizard capturing parallel database handshakes and insulating lookups from undefined crash points.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppInterviewSchedule() {
  const { id: unverifiedApplicationIdStr, interviewId: unverifiedInterviewIdStr } = useParams<{
    id: string;
    interviewId: string;
  }>();
  const executeNavigationHook = useNavigate();
  const confirmInterviewSlotMutation = useConfirmInterviewSlot();

  const [interviewRecordData, setInterviewRecordData] = React.useState<InterviewMetadata | null>(null);
  const [availableTimeSlotsArray, setAvailableTimeSlotsArray] = React.useState<InterviewTimeSlot[]>([]);

  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
  const [activeSavingTargetSlotId, setActiveSavingTargetSlotId] = React.useState<string | null>(null);

  // =========================================================================
  // LIFECYCLE SECTOR 1: HARDENED DATA RETRIEVAL WATERFALL MATRIX
  // =========================================================================
  const synchronizeInterviewDossierState = React.useCallback(
    async (isThreadMountedFlag: { current: boolean }) => {
      if (!unverifiedInterviewIdStr) return;

      setIsDataLayerLoading(true);
      try {
        // Execute discrete queries concurrently to eliminate response latency waterfall blockages
        const [interviewDataResponse, slotsDataResponse] = await Promise.all([
          supabase.from("interviews").select("*").eq("id", unverifiedInterviewIdStr).maybeSingle(),
          supabase.from("interview_slots").select("*").eq("interview_id", unverifiedInterviewIdStr).order("starts_at"),
        ]);

        if (!isThreadMountedFlag.current) return;

        if (interviewDataResponse.error || !interviewDataResponse.data) {
          setInterviewRecordData(null);
          setAvailableTimeSlotsArray([]);
        } else {
          setInterviewRecordData(interviewDataResponse.data as unknown as InterviewMetadata);
          setAvailableTimeSlotsArray((slotsDataResponse.data as unknown as InterviewTimeSlot[]) ?? []);
        }
      } catch (fatalHandshakeExceptionPayload) {
        if (isThreadMountedFlag.current) {
          setInterviewRecordData(null);
          setAvailableTimeSlotsArray([]);
        }
      } finally {
        if (isThreadMountedFlag.current) {
          setIsDataLayerLoading(false);
        }
      }
    },
    [unverifiedInterviewIdStr],
  );

  React.useEffect(() => {
    const isThreadMountedFlag = { current: true };

    if (unverifiedInterviewIdStr) {
      synchronizeInterviewDossierState(isThreadMountedFlag);
    } else {
      setIsDataLayerLoading(false);
    }

    return () => {
      isThreadMountedFlag.current = false;
    };
  }, [unverifiedInterviewIdStr, synchronizeInterviewDossierState]);

  // =========================================================================
  // ACTION HOOKS: TRANSACTION SELECTION MUTATION INGRESS
  // =========================================================================
  const handleSlotSelectionSequence = React.useCallback(
    async (targetSlotIdStr: string) => {
      if (!unverifiedInterviewIdStr || !unverifiedApplicationIdStr || activeSavingTargetSlotId) return;

      setActiveSavingTargetSlotId(targetSlotIdStr);
      const isThreadMountedFlag = { current: true };

      try {
        await confirmInterviewSlotMutation.mutateAsync({
          interviewId: unverifiedInterviewIdStr,
          slotId: targetSlotIdStr,
          applicationId: unverifiedApplicationIdStr,
        });

        await synchronizeInterviewDossierState(isThreadMountedFlag);
      } catch (suppressedMutationException) {
        // Transaction fallback states handled natively within global validation interfaces
      } finally {
        if (isThreadMountedFlag.current) {
          setActiveSavingTargetSlotId(null);
        }
        isThreadMountedFlag.current = false;
      }
    },
    [
      unverifiedInterviewIdStr,
      unverifiedApplicationIdStr,
      activeSavingTargetSlotId,
      confirmInterviewSlotMutation,
      synchronizeInterviewDossierState,
    ],
  );

  const handleReturnToApplicationSnapshot = React.useCallback(() => {
    if (unverifiedApplicationIdStr) {
      executeNavigationHook(`/app/applications/${unverifiedApplicationIdStr}`);
    }
  }, [unverifiedApplicationIdStr, executeNavigationHook]);

  // =========================================================================
  // RENDERING CONTROLLERS: COMPOSITE INTERCEPT MEMOIZATIONS
  // =========================================================================
  const resolvedConfirmedSlotTimeNode = React.useMemo<InterviewTimeSlot | undefined>(() => {
    if (!interviewRecordData?.selected_slot_id || availableTimeSlotsArray.length === 0) return undefined;
    return availableTimeSlotsArray.find((slotItem) => slotItem.id === interviewRecordData.selected_slot_id);
  }, [interviewRecordData, availableTimeSlotsArray]);

  if (isDataLayerLoading) {
    return (
      <div
        role="status"
        className="w-full flex items-center justify-center py-16 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2.5"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        <span>Compiling Interview Slots...</span>
      </div>
    );
  }

  if (!interviewRecordData) {
    return (
      <div
        role="alert"
        className="min-h-[40vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Handshake Profile Absent</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The requested specialist invitation link or timeline data maps could not be resolved from standard system
              coordinates.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReturnToApplicationSnapshot}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3 shadow-2xs cursor-pointer"
          >
            Return to Dossier Detail
          </Button>
        </div>
      </div>
    );
  }

  const isInterviewConfirmedFlag = interviewRecordData.status === "confirmed";

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APP SHELL BACKWARD NAVIGATION LINK HUB */}
      <div className="block select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReturnToApplicationSnapshot}
          className="h-8 px-2.5 rounded-md font-bold uppercase tracking-wide text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Application Dossier</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: CALENDAR SELECTION DISPLAY MANAGEMENT CONTAINER */}
      <Card className="rounded-xl border border-border/60 bg-card/40 overflow-hidden block w-full shadow-none">
        <CardContent className="p-4 space-y-3.5 block w-full leading-none">
          <div className="flex items-center gap-2.5 select-none pointer-events-none leading-none w-full block shrink-0">
            <Calendar className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground pt-0.5">
              Select Evaluation Schedule Coordinate
            </h2>
          </div>

          <div className="select-none pointer-events-none block leading-none w-full shrink-0">
            <Badge
              variant="secondary"
              className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded pt-0.5 leading-none shrink-0 border border-border/5"
            >
              VARIANT: {interviewRecordData.mode.toUpperCase()} · DURATION:{" "}
              {interviewRecordData.duration_min.toString()} MIN
            </Badge>
          </div>

          {interviewRecordData.note && (
            <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed block select-text pr-2 pt-0.5">
              {interviewRecordData.note}
            </p>
          )}

          {/* HUD LEVEL 3: STATE SECTOR SELECTION VIEWPORTS ROUTER */}
          {isInterviewConfirmedFlag ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.01] p-3 leading-normal block w-full">
              <div className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-foreground leading-tight block w-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 block">
                  <span>Agenda Allocation Confirmed for: </span>
                  <strong className="font-mono text-xs font-black uppercase text-emerald-600 block sm:inline-block sm:pl-0.5 select-text tabular-nums">
                    {resolvedConfirmedSlotTimeNode?.starts_at
                      ? format(new Date(resolvedConfirmedSlotTimeNode.starts_at), "PPp").toUpperCase()
                      : "CHRONO INDEX VOIDED"}
                  </strong>
                </div>
              </div>

              {interviewRecordData.meeting_link && (
                <div className="mt-3 pt-2.5 border-t border-border/5 select-none leading-none w-full block shrink-0">
                  <a
                    href={interviewRecordData.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] font-black uppercase tracking-wide text-primary hover:underline inline-flex items-center gap-1.5 leading-none"
                  >
                    <span>Launch Encrypted Meeting Link Endpoint</span> <span>→</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 block w-full mt-1.5">
              {availableTimeSlotsArray.length === 0 ? (
                <p className="text-xs font-semibold text-muted-foreground/40 text-center select-none py-4 block">
                  No open schedule coordinate allocations verified under this invitation block.
                </p>
              ) : (
                availableTimeSlotsArray.map((slotNodeItem) => {
                  const isCurrentSlotSavingInFlight = activeSavingTargetSlotId === slotNodeItem.id;

                  return (
                    <Button
                      key={`time-slot-option-trigger-${slotNodeItem.id}`}
                      type="button"
                      variant="outline"
                      disabled={activeSavingTargetSlotId !== null}
                      onClick={() => handleSlotSelectionSequence(slotNodeItem.id)}
                      className="w-full h-10 rounded-lg justify-between border border-border/60 bg-background/50 hover:bg-accent cursor-pointer transition-colors px-3 font-mono text-[11px] sm:text-xs font-bold shadow-2xs select-none block flex items-center leading-none transform-gpu active:scale-[0.995] disabled:opacity-60"
                    >
                      <span className="tabular-nums block tracking-tight pt-0.5">
                        {format(new Date(slotNodeItem.starts_at), "PPp").toUpperCase()}
                      </span>

                      <div className="shrink-0 leading-none h-4 flex items-center block">
                        {isCurrentSlotSavingInFlight ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary stroke-[2.5]" />
                        ) : (
                          <span className="font-sans text-[10px] font-black uppercase tracking-wider text-primary pt-0.5 block">
                            Lock Time
                          </span>
                        )}
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
