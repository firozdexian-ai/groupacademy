/**
 * JoinLivePanel — countdown + Join-live CTA for enrolled live sessions.
 * Visible only when the user already has an enrollment.
 *
 * States:
 *   - upcoming (>10 min away)  : countdown, disabled "Join live" button
 *   - joinable (<=10 min away) : enabled "Join live" button (deep links to youtube/whatsapp)
 *   - live (within duration)   : pulsing "Join now"
 *   - ended (past + buffer)    : "Recording coming soon" / "Watch recording" if present
 */
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MessageCircle, Video, PlayCircle, Radio } from "lucide-react";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

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

export function JoinLivePanel({ course }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const tz = course.event_timezone || DEFAULT_EVENT_TZ;
  const startMs = course.event_date ? new Date(course.event_date).getTime() : null;
  const durationMin = course.event_duration_minutes ?? 60;
  const endMs = startMs ? startMs + durationMin * 60_000 : null;

  const { state, untilStart, untilEnd } = useMemo(() => {
    if (!startMs || !endMs) return { state: "unscheduled" as const, untilStart: 0, untilEnd: 0 };
    const us = startMs - now;
    const ue = endMs + POST_BUFFER_MIN * 60_000 - now;
    if (us > JOIN_WINDOW_MIN * 60_000) return { state: "upcoming" as const, untilStart: us, untilEnd: ue };
    if (us > 0) return { state: "joinable" as const, untilStart: us, untilEnd: ue };
    if (ue > 0) return { state: "live" as const, untilStart: us, untilEnd: ue };
    return { state: "ended" as const, untilStart: us, untilEnd: ue };
  }, [startMs, endMs, now]);

  if (state === "unscheduled") return null;

  const joinUrl = course.youtube_url || course.whatsapp_group_link || null;

  return (
    <Card className="rounded-2xl border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className="bg-rose-500/10 text-rose-600 border-0 text-[10px]">
            <Radio className={`h-3 w-3 mr-1 ${state === "live" ? "animate-pulse" : ""}`} />
            {state === "live" ? "Live now" : state === "joinable" ? "Starting soon" : state === "ended" ? "Session ended" : "Upcoming"}
          </Badge>
          {course.event_date && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {formatEventLocal(course.event_date)}
            </span>
          )}
        </div>

        {course.event_date && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold">{formatEventTime(course.event_date, tz)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
              <Clock className="h-3 w-3" /> {durationMin} minutes
            </div>
          </div>
        )}

        {state === "upcoming" && (
          <Countdown ms={untilStart} />
        )}

        {state === "live" && (
          <p className="text-xs text-rose-600 font-medium">
            The session is happening now — join below.
          </p>
        )}

        {state === "joinable" && (
          <p className="text-xs text-emerald-600 font-medium">
            The room is open. Join now to secure your spot.
          </p>
        )}

        {state === "ended" ? (
          course.youtube_url ? (
            <Button asChild className="w-full rounded-xl">
              <a href={course.youtube_url} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="h-4 w-4 mr-2" /> Watch recording
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">Recording will be posted here within 24 hours.</p>
          )
        ) : (
          <div className="space-y-2">
            <Button
              asChild={!!joinUrl && state !== "upcoming"}
              disabled={state === "upcoming" || !joinUrl}
              className="w-full rounded-xl"
            >
              {joinUrl && state !== "upcoming" ? (
                <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  {state === "live" ? "Join live now" : "Join live"}
                </a>
              ) : (
                <span>
                  <Video className="h-4 w-4 mr-2 inline" />
                  {state === "upcoming" ? "Join opens 10 min before" : "Join link unavailable"}
                </span>
              )}
            </Button>
            {course.whatsapp_group_link && (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-emerald-500/30 text-emerald-600"
              >
                <a href={course.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp group
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
  const cell = "flex-1 rounded-lg bg-card/60 border border-border/40 p-2 text-center";
  return (
    <div className="flex items-stretch gap-2">
      {days > 0 && (
        <div className={cell}>
          <p className="text-lg font-black tabular-nums leading-none">{days}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">d</p>
        </div>
      )}
      <div className={cell}>
        <p className="text-lg font-black tabular-nums leading-none">{String(hours).padStart(2, "0")}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">hr</p>
      </div>
      <div className={cell}>
        <p className="text-lg font-black tabular-nums leading-none">{String(minutes).padStart(2, "0")}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">min</p>
      </div>
      <div className={cell}>
        <p className="text-lg font-black tabular-nums leading-none text-primary">{String(seconds).padStart(2, "0")}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">sec</p>
      </div>
    </div>
  );
}
