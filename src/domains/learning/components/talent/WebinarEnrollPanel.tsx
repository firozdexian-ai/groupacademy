import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Calendar, Clock, Users, Coins, MessageCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useTalent } from "@/hooks/useTalent";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  course: {
    id: string;
    slug: string;
    title: string;
    content_type: string;
    event_date: string | null;
    event_timezone: string | null;
    event_duration_minutes: number | null;
    max_capacity: number | null;
    current_enrollment: number | null;
    whatsapp_group_link: string | null;
    price: number | null;
    credit_cost?: number | null;
  };
}

/**
 * GroUp Academy: Cohort Stream Ingress Reservation Controller (WebinarEnrollPanel)
 * An authoritative inline panel handling user registrations, capacity validations, and real-time ledger debit confirmations.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function WebinarEnrollPanel({ course }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();

  // Core Server State Hook Ingress
  const { enrollment, isLoading, enroll, isEnrolling } = useEnrollment(course.id);

  const creditCost = useMemo(() => {
    return getCourseCredits(Number(course.price ?? 0), course.credit_cost ?? null);
  }, [course.price, course.credit_cost]);

  const tz = course.event_timezone || DEFAULT_EVENT_TZ;

  const seatsLeft = useMemo(() => {
    if (course.max_capacity === null || course.max_capacity === undefined) return null;
    return course.max_capacity - (course.current_enrollment || 0);
  }, [course.max_capacity, course.current_enrollment]);

  // Monitor live cohort enrollment board views via telemetry logs
  useEffect(() => {
    if (course?.id) {
      trackEvent("webinar_enroll_panel_mounted", {
        courseId: course.id,
        isUserEnrolled: !!enrollment,
        availableSeats: seatsLeft,
      });
    }
  }, [course?.id, enrollment, seatsLeft]);

  const handleEnrollMutation = async () => {
    if (!talent?.id) {
      const calculatedRedirectUrl = `/auth?redirect=/app/learning/courses/${course.slug}`;
      trackEvent("webinar_enroll_unauthenticated_intercept", { targetRedirect: calculatedRedirectUrl });
      navigate(calculatedRedirectUrl);
      return;
    }

    if (seatsLeft !== null && seatsLeft <= 0) {
      toast.error(" Ecosytem Capacity Maximum: Selected synchronous channel is fully booked.");
      return;
    }

    trackEvent("webinar_enroll_mutation_requested", { courseId: course.id, talentId: talent.id });
    const toastId = toast.loading("Reserving synchronized session asset passage...");
    let isMounted = true;

    try {
      await enroll();

      if (isMounted) {
        // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
        queryClient.invalidateQueries({ queryKey: ["enrollment", course.id] });
        queryClient.invalidateQueries({ queryKey: ["discovery-courses"] });
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

        toast.success("Seat matrix allocated cleanly. Account token index balanced.", { id: toastId });
        trackEvent("webinar_enroll_mutation_success", { courseId: course.id });
      }
    } catch (err: any) {
      const exceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(exceptionMsg, {
        component: "WebinarEnrollPanel",
        action: "commit_enrollment_mutation_callback",
        courseId: course.id,
      });

      toast.error(`Ecosystem reservation timeout: ${exceptionMsg}`, { id: toastId });
    }
  };

  const handleWhatsAppRedirectHandshake = () => {
    trackEvent("webinar_whatsapp_sync_launched", { courseId: course.id });
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-emerald-500/[0.02] shadow-sm antialiased select-none sm:select-text transform-gpu overflow-hidden">
      <CardContent className="p-4 space-y-3.5 w-full min-w-0 flex flex-col font-bold text-xs tracking-tight">
        {/* HUD LEVEL 1: LIVE BROADCAST STATE CHANNELS TAG */}
        <Badge
          variant="outline"
          className="text-[9px] font-extrabold px-2 h-5 rounded uppercase tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 w-fit select-none leading-none shadow-sm gap-1 flex items-center"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
          <span>Live Synchronous Track</span>
        </Badge>

        {/* HUD LEVEL 2: CALENDAR TIMING CHRONO CONFIG MATRIX */}
        {course.event_date && (
          <div className="space-y-1 text-left select-none tabular-nums font-bold text-foreground/90 tracking-tight leading-none">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0 stroke-[2.2]" />
              <span className="truncate text-ellipsis block break-all">{formatEventTime(course.event_date, tz)}</span>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight truncate text-ellipsis pl-6 italic">
              {formatEventLocal(course.event_date)}
            </p>
          </div>
        )}

        {/* HUD LEVEL 3: CAPACITY RATIO & TRANSACTION COST ATTRIBUTES GRID */}
        <div className="flex flex-wrap items-center gap-3.5 pt-0.5 select-none font-bold text-[11px] text-muted-foreground/80 leading-none tabular-nums border-y border-border/5 py-2">
          {course.event_duration_minutes ? (
            <span className="flex items-center gap-1.5 shrink-0 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded">
              <Clock className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
              <span>{course.event_duration_minutes} mins duration</span>
            </span>
          ) : null}

          {seatsLeft !== null && (
            <span
              className={cn(
                "flex items-center gap-1.5 shrink-0 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide",
                seatsLeft <= 10 && seatsLeft > 0 ? "text-rose-600 bg-rose-500/5 border-rose-500/10 animate-pulse" : "",
              )}
            >
              <Users className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>{seatsLeft > 0 ? `${seatsLeft.toLocaleString()} seats left` : "Registration Full"}</span>
            </span>
          )}

          <span className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-full px-2 py-0.5 text-primary font-extrabold shadow-sm leading-none shrink-0 ml-auto text-xs lowercase normal-case tracking-tight">
            <Coins className="h-3.5 w-3.5 fill-primary/5 stroke-[2.2]" />
            <span className="font-black pr-0.5">{creditCost.toLocaleString()} cr asset</span>
          </span>
        </div>

        {/* HUD LEVEL 4: INTERACTIVE OPERATION ROUTE MODAL ACTIONS BUTTON */}
        {enrollment ? (
          <div className="space-y-2 pt-0.5 w-full select-none animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 pl-0.5 leading-none">
              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
              <span>Candidate Registration Confirmed Verified</span>
            </div>

            {course.whatsapp_group_link && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 rounded-xl text-xs font-bold px-4 gap-1.5 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
                asChild
              >
                <a
                  href={course.whatsapp_group_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppRedirectHandshake}
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.2]" />
                  <span>Cohort WhatsApp Network</span>
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            className="w-full h-10 rounded-xl text-xs font-bold px-4 gap-1.5 shadow-md select-none active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 mt-0.5"
            onClick={handleEnrollMutation}
            disabled={isEnrolling || isLoading || (seatsLeft !== null && seatsLeft <= 0)}
          >
            {isEnrolling ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Processing Verification Framework…</span>
              </>
            ) : (
              <>
                <span>{creditCost > 0 ? `Debit Framework & Lock Pass` : "Acquire Free Entry Pass"}</span>
                <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5] ml-0.5" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
