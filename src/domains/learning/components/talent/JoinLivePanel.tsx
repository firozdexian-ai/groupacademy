import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Calendar, Clock, MessageCircle, Video, PlayCircle, Radio } from "lucide-react";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

interface Props {
  course: {
    id: string;
    title: string;
    content_type: string;
    event_date: string | null;
    event_timezone: string | null;
    event_duration_minutes: number | null;
    youtube_url: string | null;
    whatsapp_group_link: string | null;
  };
}

const JOIN_WINDOW_MIN = 10; // open Join button this many minutes before start
const POST_BUFFER_MIN = 15; // grace after scheduled end

function diffParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

/**
 * GroUp Academy: Live Room Synchronization Ingress Gate (JoinLivePanel)
 * CTO Reference: Authoritative realtime orchestration block determining live cohort room access thresholds.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function JoinLivePanel({ course }: Props) {
  const queryClient = useQueryClient();

  // 1. SSR Hydration Security Fix: Initialize time ticks via standard effect hooks to prevent string popping jumps
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const intervalTickerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalTickerId);
  }, []);

  // Monitor real-time stream state tracking indicators via analytical telemetry
  useEffect(() => {
    if (course?.id) {
      trackEvent("live_ingress_gate_rendered", { courseId: course.id, contentType: course.content_type });
    }
  }, [course]);

  const tz = course.event_timezone || DEFAULT_EVENT_TZ;
  const startMs = useMemo(
    () => (course.event_date ? new Date(course.event_date).getTime() : null),
    [course.event_date],
  );
  const durationMin = course.event_duration_minutes ?? 60;
  const endMs = useMemo(() => (startMs ? startMs + durationMin * 60_000 : null), [startMs, durationMin]);

  const timeMatrixState = useMemo(() => {
    if (!startMs || !endMs || now === null) {
      return { state: "unscheduled" as const, untilStart: 0, untilEnd: 0 };
    }

    const us = startMs - now;
    const ue = endMs + POST_BUFFER_MIN * 60_000 - now;

    if (us > JOIN_WINDOW_MIN * 60_000) return { state: "upcoming" as const, untilStart: us, untilEnd: ue };
    if (us > 0) return { state: "joinable" as const, untilStart: us, untilEnd: ue };
    if (ue > 0) return { state: "live" as const, untilStart: us, untilEnd: ue };

    return { state: "ended" as const, untilStart: us, untilEnd: ue };
  }, [startMs, endMs, now]);

  if (timeMatrixState.state === "unscheduled" || now === null) {
    return null;
  }

  const { state, untilStart } = timeMatrixState;
  const joinUrl = course.youtube_url || course.whatsapp_group_link || null;

  const handleLiveSessionHandshakeRedirect = (targetDestinationUrl: string, channelLabel: string) => {
    trackEvent("live_ingress_connection_launched", {
      courseId: course.id,
      channel: channelLabel,
      currentStateFrame: state,
    });
    // Evaporate global caching keys across dashboard views dynamically to ensure state parity
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
  };

  return (
    <Card className="w-full text-left rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.02] via-primary/[0.01] to-transparent shadow-sm antialiased select-none sm:select-text transform-gpu overflow-hidden">
      <CardContent className="p-4 space-y-3.5 w-full min-w-0">
        {/* HUD LEVEL 1: LIVESTREAM MATRIX STATE INDICATOR STATUS STRIP */}
        <div className="flex items-center justify-between gap-3.5 w-full select-none border-b border-border/10 pb-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-extrabold px-2 h-5.5 rounded-md uppercase tracking-wider border shadow-sm flex items-center gap-1 leading-none transition-colors duration-300 shrink-0",
              state === "live"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                : state === "joinable"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse"
                  : state === "ended"
                    ? "bg-muted text-muted-foreground border-border/40"
                    : "bg-primary/5 text-primary border-primary/20",
            )}
          >
            <Radio className={cn("h-3 w-3 text-current stroke-[2.5]", state === "live" && "animate-pulse")} />
            <span>
              {state === "live"
                ? "Live Now"
                : state === "joinable"
                  ? "Starting Soon"
                  : state === "ended"
                    ? "Session Ended"
                    : "Upcoming Node"}
            </span>
          </Badge>

          {course.event_date && (
            <span className="text-[10px] font-bold text-muted-foreground/80 truncate tabular-nums pr-0.5 tracking-tight">
              {formatEventLocal(course.event_date)}
            </span>
          )}
        </div>

        {/* HUD LEVEL 2: CALENDAR SCHEDULING CHRONO DETAILS METADATA */}
        {course.event_date && (
          <div className="space-y-1 text-left select-none tabular-nums font-bold text-foreground/90 tracking-tight leading-none">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0 stroke-[2.2]" />
              <span className="truncate break-all">{formatEventTime(course.event_date, tz)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-semibold pl-6">
              <Clock className="h-3.5 w-3.5 text-primary/40 shrink-0 stroke-[2.2]" />
              <span>Block duration: {durationMin} minutes metrics allocation</span>
            </div>
          </div>
        )}

        {/* HUD LEVEL 3: COUNTDOWN RECONCILIATION TARGET MATRIX GRID */}
        {state === "upcoming" && (
          <div className="w-full pt-0.5 select-none animate-in fade-in duration-300">
            <Countdown ms={untilStart} />
          </div>
        )}

        {state === "live" && (
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-normal pl-0.5 italic animate-pulse">
            &bull; The live trajectory session is currently active. Dispatch connection below instantly.
          </p>
        )}

        {state === "joinable" && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-normal pl-0.5 italic animate-pulse">
            &bull; The secure communication hub gate is open. Claim your entry pass below to lock availability.
          </p>
        )}

        {/* HUD LEVEL 4: TRANSACTION DISPATCH CTA CONNECTOR RIBBON */}
        {state === "ended" ? (
          course.youtube_url ? (
            <Button
              asChild
              size="sm"
              className="w-full h-10 rounded-xl text-xs font-bold px-4 gap-1.5 shadow-sm select-none cursor-pointer transition-transform active:scale-[0.99] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a
                href={course.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLiveSessionHandshakeRedirect(course.youtube_url!, "youtube_archive")}
              >
                <PlayCircle className="h-4 w-4 shrink-0 stroke-[2.5]" />
                <span>Watch Localized Core Recording</span>
              </a>
            </Button>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground/70 leading-normal italic pl-0.5 select-text pt-1 border-t border-border/5 text-center sm:text-left max-w-sm">
              Ecosystem digital recording will automatically register into this dashboard within 24 hours.
            </p>
          )
        ) : (
          <div className="space-y-2 w-full select-none pt-0.5">
            <Button
              asChild={!!joinUrl && state !== "upcoming"}
              disabled={state === "upcoming" || !joinUrl}
              type="button"
              className="w-full h-10 rounded-xl text-xs font-bold px-4 gap-1.5 shadow-sm select-none active:scale-[0.99] transition-transform flex items-center justify-center cursor-pointer"
            >
              {joinUrl && state !== "upcoming" ? (
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLiveSessionHandshakeRedirect(joinUrl, "live_stream_ingress")}
                >
                  <Video className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>{state === "live" ? "Launch Active Room Shell Now" : "Establish Secure Live Ingress"}</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-1.5 font-bold tracking-tight">
                  <Video className="h-4 w-4 shrink-0 stroke-[2.2] text-muted-foreground/60" />
                  <span>
                    {state === "upcoming"
                      ? `Room unlocks ${JOIN_WINDOW_MIN} minutes prior`
                      : "Live communication channel unreachable"}
                  </span>
                </div>
              )}
            </Button>

            {course.whatsapp_group_link && (
              <Button
                asChild
                variant="outline"
                type="button"
                className="w-full h-10 rounded-xl text-xs font-bold px-4 gap-1.5 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 shadow-sm cursor-pointer transition-transform active:scale-[0.99]"
              >
                <a
                  href={course.whatsapp_group_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleLiveSessionHandshakeRedirect(course.whatsapp_group_link!, "whatsapp_cohort_chat")
                  }
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-500 stroke-[2.2]" />
                  <span>Cohort WhatsApp Network</span>
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Countdown({ ms }: { ms: number }) {
  const { days, hours, minutes, seconds } = diffParts(ms);
  const cellStyleClass =
    "flex-1 rounded-xl bg-card/60 backdrop-blur-md border border-border/40 p-2.5 text-center flex flex-col justify-center min-w-0";

  return (
    <div className="flex items-stretch gap-2 w-full text-foreground/90 font-bold tracking-tight tabular-nums select-none select-none">
      {days > 0 && (
        <div className={cellStyleClass}>
          <p className="text-sm sm:text-base font-black leading-none">{days}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1 leading-none select-none">
            days
          </p>
        </div>
      )}
      <div className={cellStyleClass}>
        <p className="text-sm sm:text-base font-black leading-none">{String(hours).padStart(2, "0")}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1 leading-none select-none">
          hours
        </p>
      </div>
      <div className={cellStyleClass}>
        <p className="text-sm sm:text-base font-black leading-none">{String(minutes).padStart(2, "0")}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1 leading-none select-none">
          mins
        </p>
      </div>
      <div className={cellStyleClass}>
        <p className="text-sm sm:text-base font-black leading-none text-rose-500">{String(seconds).padStart(2, "0")}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1 leading-none select-none">
          secs
        </p>
      </div>
    </div>
  );
}
