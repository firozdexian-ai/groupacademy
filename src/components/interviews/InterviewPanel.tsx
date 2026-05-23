import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApplicationHireState } from "@/hooks/useInterviews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Calendar, FileText, Video, Phone, MapPin, Loader2, Link2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ScheduleInterviewSheet } from "./ScheduleInterviewSheet";
import { cn } from "@/lib/utils";

interface Props {
  applicationId: string;
  companyId?: string;
  talentId?: string;
  actorRole: "talent" | "recruiter" | "admin";
}

/**
 * GroUp Academy: Pipeline Progression Node (InterviewPanel)
 * CTO Reference: Authoritative component orchestrating interview lifecycles and offer issuance logic.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function InterviewPanel({ applicationId, companyId, talentId, actorRole }: Props) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Monitor recruitment infrastructure view tracking paths via telemetry logs
  useEffect(() => {
    if (applicationId) {
      trackEvent("interview_panel_viewed", { applicationId, actorRole });
    }
  }, [applicationId, actorRole]);

  // 1. Core Server State Query Hook Sync Configuration
  const { data, isLoading, error, refetch } = useApplicationHireState(applicationId);

  const interview = data?.interview ?? null;
  const offer = data?.offer ?? null;

  // Intercept data pipeline anomalies cleanly via central telemetry monitors
  useEffect(() => {
    if (error) {
      trackError(error, {
        component: "InterviewPanel",
        action: "fetch_application_hire_state",
        applicationId,
      });
    }
  }, [error, applicationId]);

  if (!applicationId) {
    trackError("InterviewPanel mounted without valid tracking application identity tags.", {
      component: "InterviewPanel",
      action: "null_pointer_assertion",
    });
    return null;
  }

  // Automated Efficiency: Synchronize precise state cache loops instantly across viewports
  const handleSynchronizationReload = async () => {
    trackEvent("interview_panel_cache_reload_triggered", { applicationId });

    try {
      await queryClient.invalidateQueries({ queryKey: ["application-hire-state", applicationId] });
      await refetch();
    } catch (err) {
      trackError(err, {
        component: "InterviewPanel",
        action: "execute_cache_reload_callback",
        applicationId,
      });
    }
  };

  // 2. Defensive Structural Slot Date Formatter: Removes unsafe TypeScript bang shortcuts
  const renderScheduledTimeSafe = (): string => {
    if (!interview || !interview.selected_slot_id || !interview.slots) return "";

    try {
      const activeSlotMatch = interview.slots.find((slotItem: any) => slotItem?.id === interview.selected_slot_id);
      if (!activeSlotMatch || !activeSlotMatch.starts_at) {
        throw new Error(`Target slot allocation reference token [${interview.selected_slot_id}] missing.`);
      }
      return format(new Date(activeSlotMatch.starts_at), "PPp");
    } catch (formatErr) {
      trackError(formatErr, {
        component: "InterviewPanel",
        action: "render_scheduled_time_safe",
        applicationId,
        interviewId: interview.id,
      });
      return "Schedule context sync mismatch";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 select-none w-full animate-pulse">
        <Skeleton className="h-24 w-full rounded-2xl opacity-60" />
        <Skeleton className="h-24 w-full rounded-2xl opacity-40" />
      </div>
    );
  }

  const isTalentUser = actorRole === "talent";
  const formattedScheduledTimeString = renderScheduledTimeSafe();

  return (
    <div className="space-y-3.5 text-left antialiased max-w-full w-full">
      {/* CARD 1: INTERVIEW LIFECYCLE MANAGEMENT BLOCK */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm transition-all duration-300 relative overflow-hidden">
        <CardContent className="p-4 space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between gap-4 w-full select-none border-b border-border/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground/90 uppercase tracking-wider min-w-0">
              <Calendar className="h-4 w-4 text-primary stroke-[2.2]" />
              <span className="truncate">Interview Schedule Matrix</span>
            </div>
            {!isTalentUser && (
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="h-7 px-3 text-[10px] font-bold tracking-wide uppercase rounded-xl border-border/60 hover:bg-accent transition-all cursor-pointer shadow-sm shrink-0"
                onClick={() => {
                  trackEvent("interview_schedule_modal_toggled", {
                    applicationId,
                    action: interview ? "reschedule" : "schedule",
                  });
                  setSheetOpen(true);
                }}
              >
                <span>{interview ? "Reschedule" : "Schedule"}</span>
              </Button>
            )}
          </div>

          {!interview ? (
            <p className="text-xs font-medium text-muted-foreground/80 leading-normal py-1 pl-0.5 select-text">
              No professional evaluation interviews mapped to this application pipeline block.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs font-bold text-foreground/90 tracking-tight w-full min-w-0">
              <div className="flex items-center gap-2 flex-wrap select-none leading-none">
                <div className="h-6 w-6 rounded-lg bg-muted/30 border border-border/10 flex items-center justify-center text-muted-foreground/80 shrink-0 shadow-inner">
                  {interview.mode === "video" && <Video className="h-3.5 w-3.5 stroke-[2.2]" />}
                  {interview.mode === "phone" && <Phone className="h-3.5 w-3.5 stroke-[2.2]" />}
                  {interview.mode === "onsite" && <MapPin className="h-3.5 w-3.5 stroke-[2.2]" />}
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-extrabold px-2 py-0 h-5.5 rounded-md uppercase tracking-wider bg-background/50 border-border/40 text-muted-foreground/80 shadow-sm tabular-nums"
                >
                  Status: {interview.status || "Pending"}
                </Badge>
              </div>

              {interview.selected_slot_id ? (
                <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 select-text animate-in fade-in duration-200">
                  <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block mb-0.5 select-none">
                    Confirmed Allocation Lock
                  </span>
                  <p className="font-extrabold text-xs sm:text-sm text-foreground/90 tracking-tight tabular-nums leading-none">
                    {formattedScheduledTimeString || "Data verification lookup ongoing..."}
                  </p>
                </div>
              ) : isTalentUser ? (
                <div className="pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold px-4 gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    <a
                      href={`/app/applications/${applicationId}/interview/${interview.id}`}
                      onClick={() =>
                        trackEvent("talent_pick_time_clicked", { applicationId, interviewId: interview.id })
                      }
                    >
                      <span>Pick Evaluation Time</span>
                      <ExternalLink className="h-3.5 w-3.5 stroke-[2.2]" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground/80 font-semibold italic pl-0.5 leading-normal select-text animate-pulse">
                  Awaiting candidate availability slot conversion selection
                </p>
              )}

              {interview.meeting_link && interview.status === "confirmed" && (
                <div className="pt-1 select-none">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto h-8 rounded-xl text-xs font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 px-4 gap-1.5 shrink-0 shadow-sm"
                  >
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackEvent("interview_meeting_link_clicked", { applicationId, interviewId: interview.id })
                      }
                    >
                      <Link2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 stroke-[2.2]" />
                      <span>Launch Verified Meeting Shell</span>
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 2: OFFICIAL LEDGER OFFER COMPLIANCE BLOCK */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm transition-all duration-300 relative overflow-hidden">
        <CardContent className="p-4 space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between gap-4 w-full select-none border-b border-border/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground/90 uppercase tracking-wider min-w-0">
              <FileText className="h-4 w-4 text-primary stroke-[2.2]" />
              <span className="truncate">Compensation Ledger Offer</span>
            </div>
            {!isTalentUser && !offer && (
              <Button
                size="sm"
                variant="outline"
                asChild
                type="button"
                className="h-7 px-3 text-[10px] font-bold tracking-wide uppercase rounded-xl border-border/60 hover:bg-accent transition-all cursor-pointer shadow-sm shrink-0"
              >
                <a
                  href={`/gro10x/work/applications/${applicationId}/offer/new`}
                  onClick={() => trackEvent("recruiter_create_offer_clicked", { applicationId })}
                >
                  <span>Create Offer</span>
                </a>
              </Button>
            )}
          </div>

          {!offer ? (
            <p className="text-xs font-medium text-muted-foreground/80 leading-normal py-1 pl-0.5 select-text">
              No formal deployment offers logged for this matching pipeline target context.
            </p>
          ) : (
            <div className="text-xs font-bold text-foreground/90 tracking-tight space-y-2.5 w-full min-w-0 text-left">
              <div className="min-w-0 space-y-0.5 flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider select-none leading-none pl-0.5">
                  Designated Title Target
                </span>
                <p className="font-extrabold text-sm sm:text-base text-foreground/90 tracking-tight leading-tight truncate pr-1 select-all break-all">
                  {offer.title || "Untitled offer"}
                </p>
              </div>

              <div className="min-w-0 space-y-0.5 flex flex-col border-y border-border/10 py-2.5 my-1 w-full select-text selection:bg-primary/20">
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider select-none leading-none pl-0.5 mb-1">
                  Financial Settlement Breakdown
                </span>
                <p className="font-extrabold text-xs sm:text-sm text-primary tabular-nums tracking-wide leading-none flex items-center gap-1.5">
                  <span className="bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-md text-[11px] uppercase tracking-wider font-mono">
                    {offer.currency || "USD"}
                  </span>
                  <span>{Number(offer.base_amount || 0).toLocaleString()} base package value</span>
                  {offer.start_date && (
                    <span className="text-muted-foreground/70 font-semibold tracking-tight normal-case text-xs block sm:inline select-none sm:pl-1">
                      &bull; settles {format(new Date(offer.start_date), "PP")}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 justify-between w-full pt-0.5 select-none">
                <Badge
                  variant={offer.status === "accepted" ? "default" : "secondary"}
                  className={cn(
                    "text-[9px] font-extrabold px-2.5 h-5.5 rounded-md uppercase tracking-wider shadow-sm select-none border border-transparent",
                    offer.status === "accepted"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border/40",
                  )}
                >
                  {offer.status || "Staged"}
                </Badge>

                {isTalentUser && offer.status === "sent" && (
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold px-4 gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer ml-auto"
                  >
                    <a
                      href={`/app/applications/${applicationId}/offer/${offer.id}`}
                      onClick={() => trackEvent("talent_review_offer_clicked", { applicationId, offerId: offer.id })}
                    >
                      <span>Review Offer Structural Terms</span>
                      <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* POLYMORPHIC DRAWERS SHEET HOOK CONTEXT TRACK */}
      {!isTalentUser && companyId && talentId && (
        <ScheduleInterviewSheet
          open={sheetOpen}
          onOpenChange={(isOpenState) => {
            setSheetOpen(isOpenState);
            if (!isOpenState) {
              trackEvent("interview_schedule_modal_dismissed", { applicationId });
            }
          }}
          applicationId={applicationId}
          companyId={companyId}
          talentId={talentId}
          onCreated={handleSynchronizationReload}
        />
      )}
    </div>
  );
}
