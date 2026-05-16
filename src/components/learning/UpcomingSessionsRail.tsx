import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Calendar, Radio, Video } from "lucide-react";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { useUpcomingSessions } from "@/hooks/useCohorts";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Upcoming Live Cohort Sessions Rail (UpcomingSessionsRail)
 * An authoritative rail orchestrating near-term live workspace engagements and deep link joins.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function UpcomingSessionsRail() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error: queryFetchError } = useUpcomingSessions(6);

  // 1. SSR Hydration Security Fix: Initialize time blocks safely through state hooks to defeat structural popping
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setNowTimestamp(Date.now());
    const clockTimerId = setInterval(() => setNowTimestamp(Date.now()), 30000); // 30s ticks sufficient for cohort countdowns
    return () => clearInterval(clockTimerId);
  }, []);

  // Monitor live cohort stream registrations safely via analytical metrics paths
  useEffect(() => {
    if (data && data.length > 0) {
      trackEvent("live_cohort_rail_mounted", { sessionsCount: data.length });
    }
  }, [data]);

  // Intercept data orchestration errors transparently across logging streams
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "UpcomingSessionsRail",
        action: "fetch_useUpcomingSessions_hook",
      });
    }
  }, [queryFetchError]);

  if (isLoading || !data || data.length === 0 || nowTimestamp === null) {
    return null;
  }

  const handleSessionActionClick = (sessionId: string, isLiveSession: boolean) => {
    trackEvent("live_cohort_action_clicked", { sessionId, isLiveAction: isLiveSession });
    // Automated Efficiency: Evaporate stale query structures upon path dispatch
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
  };

  return (
    <section className="space-y-2.5 max-w-full w-full text-left select-none sm:select-text antialiased transform-gpu">
      {/* HUD HEADER TITLE BAR METADATA */}
      <div className="flex items-center justify-between px-0.5 select-none w-full leading-none">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80 inline-flex items-center gap-1.5 leading-none">
          <Radio className="h-3.5 w-3.5 text-rose-500 shrink-0 stroke-[2.2]" />
          <span>Upcoming Live Synchronous Channels</span>
        </h2>
        <Badge
          variant="secondary"
          className="text-[10px] font-extrabold h-4.5 px-1.5 rounded tabular-nums select-none bg-muted/60 text-muted-foreground/80 border-none shadow-sm"
        >
          {data.length} scheduled
        </Badge>
      </div>

      {/* DYNAMIC CARD STACK LAYER VIEW */}
      <div className="space-y-2 w-full min-w-0">
        {data.map((sessionItem: any) => {
          if (!sessionItem || !sessionItem.session_id) return null;

          const scheduleStartTimeMs = new Date(sessionItem.scheduled_date).getTime();
          const temporalDifferenceDelta = scheduleStartTimeMs - nowTimestamp;

          // Evaluate interactive room parameters against precise window limits defensive pass
          const isLiveActiveNode =
            temporalDifferenceDelta <= 0 && temporalDifferenceDelta > -(sessionItem.duration_minutes ?? 60) * 60_000;

          const localizedDisplayKind = sessionItem.kind ? String(sessionItem.kind).replace(/_/g, " ") : "Live Class";

          return (
            <Card
              key={sessionItem.session_id}
              className="p-3.5 border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between text-left group w-full min-w-0"
            >
              <div className="flex items-start justify-between gap-4 w-full min-w-0 leading-none">
                <div className="min-w-0 flex-1 space-y-1 text-left leading-none">
                  <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-snug line-clamp-1 truncate w-full group-hover:text-primary transition-colors select-text pr-1">
                    {sessionItem.title}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight select-text w-full italic pr-1">
                    {sessionItem.course_title}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground/70 select-none leading-none tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.2]" />
                    <span className="pt-0.5">{formatEventTime(sessionItem.scheduled_date, DEFAULT_EVENT_TZ)}</span>
                  </div>
                </div>

                {isLiveActiveNode ? (
                  <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-extrabold px-2 h-5 rounded uppercase tracking-wide shrink-0 shadow-sm gap-0.5 flex items-center select-none leading-none animate-pulse">
                    <Radio className="h-2.5 w-2.5 text-current stroke-[2.5]" />
                    <span>Live</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-extrabold px-2 h-5 rounded uppercase tracking-wide border-border/40 text-muted-foreground bg-background/50 truncate max-w-[30%] shrink-0 select-none shadow-sm leading-none"
                  >
                    {localizedDisplayKind}
                  </Badge>
                )}
              </div>

              {/* ACTION COMMAND INGRESS DISPATCH BUTTON TRIGGER */}
              <Button
                asChild
                size="sm"
                type="button"
                className="w-full h-8.5 rounded-xl font-bold text-[11px] uppercase tracking-wide shadow-sm select-none mt-3 cursor-pointer transition-transform active:scale-[0.99]"
              >
                <Link
                  to={`/app/sessions/${sessionItem.session_id}/join`}
                  onClick={() => handleSessionActionClick(sessionItem.session_id, isLiveActiveNode)}
                  className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Video className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                  <span>{isLiveActiveNode ? "Initialize Room Connection" : "Audit Session Matrix"}</span>
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
