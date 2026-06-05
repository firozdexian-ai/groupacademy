import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  listUpcomingOfflineSeminarsForTalent,
  listActiveCompetitions,
} from "@/domains/learning/repo/learningRepo";
import { Calendar, MapPin, Users, Trophy, Gift, Globe, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isToday, isFuture } from "date-fns";
import { StudyAbroadSection } from "./StudyAbroadSection";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

export interface EventsTabProps {
  onOpenCompetition?: (slug: string) => void;
}

type EventFilter = "in_person" | "competitions" | "abroad";

const filterOptions: { key: EventFilter; icon: any; label: string }[] = [
  { key: "in_person", icon: MapPin, label: "In-Person Seminars" },
  { key: "competitions", icon: Trophy, label: "Challenges" },
  { key: "abroad", icon: Globe, label: "Study Abroad" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Upcoming",
  upcoming: "Upcoming",
  active: "Live Now",
  judging: "Reviewing Results",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * GroUp Academy: Events & Interactive Catalog Surface
 * Main talent-facing entry viewport routing student pathways into experiential workshops.
 */
export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Single Source of Truth URL State Strategy to synchronize link parameters cleanly
  const eventType: EventFilter = useMemo(() => {
    const kindParam = searchParams.get("kind");
    if (kindParam === "abroad") return "abroad";
    if (kindParam === "competitions") return "competitions";
    return "in_person";
  }, [searchParams]);

  // Monitor current event view filtering path tracking signals
  useEffect(() => {
    trackEvent("academy_events_tab_viewed", { activeTrackSegment: eventType });
  }, [eventType]);

  const handleSetType = (key: EventFilter) => {
    trackEvent("academy_events_filter_changed", { selectionTarget: key });

    const nextParams = new URLSearchParams(searchParams);
    if (key === "in_person") {
      nextParams.delete("kind");
    } else {
      nextParams.set("kind", key);
    }
    // Safeguard routing loop states cleanly by maintaining baseline params without overhead
    nextParams.set("tab", "events");
    setSearchParams(nextParams, { replace: true });
  };

  // Structural Query Node A: Retrieve published physical off-line workshops data
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsQueryError,
  } = useQuery({
    queryKey: ["app-events-inperson"],
    enabled: eventType === "in_person",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const data = await listUpcomingOfflineSeminarsForTalent(cutoff);
      return data || [];
    },
  });

  // Structural Query Node B: Retrieve active community tournament data records
  const {
    data: competitions = [],
    isLoading: competitionsLoading,
    error: competitionsQueryError,
  } = useQuery({
    queryKey: ["app-competitions-v2"],
    enabled: eventType === "competitions",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await listActiveCompetitions();
      return data || [];
    },
  });

  // Pipe internal server query response exceptions to standard diagnostic log collectors
  useEffect(() => {
    const combinedFetchError = eventsQueryError || competitionsQueryError;
    if (combinedFetchError) {
      trackError(combinedFetchError, {
        component: "EventsTab",
        action: "fetch_experiential_datasets_api",
        currentFilterType: eventType,
      });
    }
  }, [eventsQueryError, competitionsQueryError, eventType]);

  const todayEvents = useMemo(() => events.filter((e) => e.event_date && isToday(new Date(e.event_date))), [events]);
  const upcomingEvents = useMemo(
    () => events.filter((e) => e.event_date && isFuture(new Date(e.event_date))),
    [events],
  );

  const isLoading =
    (eventType === "in_person" && eventsLoading) || (eventType === "competitions" && competitionsLoading);

  const EventCard = ({ event }: { event: any }) => {
    if (!event || !event.id) return null;

    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="group border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-sm transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/80 flex flex-col overflow-hidden text-left w-full min-w-0">
        <div className="relative h-32 w-full overflow-hidden bg-muted border-b border-border/10 select-none shrink-0">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-6 w-6 text-primary/30 stroke-[2.2]" />
            </div>
          )}
          <Badge className="absolute top-2.5 left-2.5 bg-background/95 text-foreground/90 border border-border/20 text-[9px] font-extrabold uppercase tracking-wide px-2 rounded shadow-sm gap-1 flex items-center">
            <MapPin className="w-3 h-3 text-destructive stroke-[2.5]" />
            <span>In-Person Seminar</span>
          </Badge>
        </div>

        <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 flex-1 flex flex-col justify-between">
          <div className="space-y-0.5 w-full min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-snug truncate pr-1 group-hover:text-primary transition-colors select-text w-full">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-[11px] font-medium text-muted-foreground/80 line-clamp-2 leading-normal break-words pr-1 select-text">
                {event.description}
              </p>
            )}
          </div>

          <div className="space-y-2.5 w-full pt-1.5 border-t border-border/10 mt-auto select-none font-bold text-[10px] text-muted-foreground/70 leading-none tabular-nums">
            <div className="flex flex-wrap items-center gap-2.5 leading-none w-full">
              {eventDate && (
                <span
                  className="flex items-center gap-1 hover:text-primary transition-colors cursor-help"
                  title={formatEventLocal(eventDate)}
                >
                  <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
                  <span>{formatEventTime(eventDate, event.event_timezone || DEFAULT_EVENT_TZ)}</span>
                </span>
              )}
              {spotsLeft !== null && (
                <span
                  className={cn(
                    "flex items-center gap-1 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded uppercase tracking-wide text-[9px] font-extrabold",
                    spotsLeft <= 5 && spotsLeft > 0 && "text-destructive bg-destructive/5 border-destructive/10 animate-pulse",
                  )}
                >
                  <Users className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>{spotsLeft > 0 ? `${spotsLeft} seats left` : "Registration Full"}</span>
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-0.5 w-full">
              <Button
                size="sm"
                type="button"
                className="flex-1 h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shadow-sm cursor-pointer active:scale-[0.99] transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  trackEvent("academy_event_enroll_triggered", { slug: event.slug });
                  navigate(`/app/learning/courses/${event.slug}`);
                }}
              >
                Get Free Ticket
              </Button>
              {event.whatsapp_group_link && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border-success/20 text-success hover:bg-success/5 shrink-0 shadow-sm transition-colors cursor-pointer"
                  asChild
                >
                  <a
                    href={event.whatsapp_group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("academy_event_whatsapp_sync_clicked", { slug: event.slug })}
                  >
                    Join Chat
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 w-full antialiased text-left select-none sm:select-text">
      {/* Category Tab Selector Navigation Menu Layout */}
      <nav className="flex p-1 h-11 bg-muted/30 border border-border/40 rounded-xl select-none w-full transform-gpu max-w-full overflow-x-auto no-scrollbar">
        {filterOptions.map(({ key, icon: Icon, label }) => {
          const isButtonActive = eventType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSetType(key)}
              className={cn(
                "flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-none whitespace-nowrap px-2",
                isButtonActive
                  ? "bg-background shadow-sm text-primary font-extrabold border border-border/10"
                  : "text-muted-foreground/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span className="hidden xs:inline">{label}</span>
              <span className="xs:hidden">{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {eventType === "abroad" && <StudyAbroadSection />}

      {/* VIEW GRID A: IN-PERSON WORKSHOPS */}
      {eventType === "in_person" && (
        <div className="space-y-5 w-full">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 select-none w-full animate-pulse">
              {[1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-52 w-full rounded-2xl opacity-60" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
              <Calendar className="h-6 w-6 text-primary/40 mb-2.5 animate-pulse stroke-[2.2]" />
              <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none uppercase tracking-wide">
                No events found
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1">
                There are no live seminars scheduled at this time. Please check back later.
              </p>
            </div>
          ) : (
            <>
              {todayEvents.length > 0 && (
                <section className="space-y-2.5 w-full">
                  <div className="flex items-center gap-2 px-0.5 select-none leading-none animate-in fade-in duration-200">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
                    <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-destructive dark:text-destructive">
                      Happening Today
                    </h2>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
                    {todayEvents.map((eventItem) => (
                      <EventCard key={eventItem.id} event={eventItem} />
                    ))}
                  </div>
                </section>
              )}

              {upcomingEvents.length > 0 && (
                <section className="space-y-2.5 w-full">
                  <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none mb-1">
                    Upcoming Seminars
                  </h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
                    {upcomingEvents.map((eventItem) => (
                      <EventCard key={eventItem.id} event={eventItem} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW GRID B: TOURNAMENTS & CHALLENGES */}
      {eventType === "competitions" && (
        <div className="space-y-3 w-full">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 select-none w-full animate-pulse">
              {[1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-40 w-full rounded-2xl opacity-60" />
              ))}
            </div>
          ) : competitions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
              <Trophy className="h-6 w-6 text-primary/40 mb-2.5 animate-pulse stroke-[2.2]" />
              <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none uppercase tracking-wide">
                No active challenges
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1">
                There are no open challenges active right now. New hackathons launch soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
              {competitions.map((compItem) => (
                <Card
                  key={compItem.id}
                  className="cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/80 outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden group w-full text-left flex flex-col"
                  onClick={() => {
                    trackEvent("academy_competition_selected", { slug: compItem.slug });
                    if (onOpenCompetition) onOpenCompetition(compItem.slug);
                    else navigate(`/app/learning/competitions/${compItem.slug}`);
                  }}
                >
                  <div className="relative h-28 w-full bg-muted select-none border-b border-border/10 shrink-0">
                    {compItem.featured_image && (
                      <img
                        src={compItem.featured_image}
                        alt={compItem.title}
                        className="w-full h-full object-cover opacity-80"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent p-3.5 flex flex-col justify-center text-left">
                      <Badge className="bg-warning/10 text-warning border-none text-[9px] font-extrabold px-2 py-0.5 rounded h-4.5 w-fit mb-1.5 uppercase tracking-wide">
                        {STATUS_LABEL[compItem.status] || "Upcoming"}
                      </Badge>
                      <h3 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate w-full group-hover:text-primary transition-colors select-text pr-1">
                        {compItem.title}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 select-none leading-none">
                        {compItem.category || "Skill Challenge"}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-3 px-3.5 flex items-center justify-between w-full select-none font-bold text-xs tracking-tight text-primary tabular-nums mt-auto border-t border-border/5">
                    <span className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-full text-[11px]">
                      <Gift className="h-3.5 w-3.5 fill-primary/5 stroke-[2.2]" />
                      <span>
                        {Array.isArray(compItem.prizes)
                          ? `${compItem.prizes.length} Prizes Available`
                          : "Prizes Announced Soon"}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform text-primary">
                      <span>View Guidelines</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
