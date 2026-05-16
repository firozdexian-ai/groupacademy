import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Trophy, Gift, Globe, ArrowRight, Loader2 } from "lucide-react";
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
  { key: "competitions", icon: Trophy, label: "Ecosystem Battles" },
  { key: "abroad", icon: Globe, label: "Study Abroad Track" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Upcoming",
  upcoming: "Upcoming",
  active: "Live now",
  judging: "Judging",
  completed: "Archived",
  cancelled: "Cancelled",
};

/**
 * GroUp Academy: Events & Interactive Match Matrix (EventsTab)
 * CTO Reference: Authoritative micro-ingress viewport segment directing user trajectories into experiential learning nodes.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Single Source of Truth URL State Strategy: Removes layout race vectors completely
  const eventType: EventFilter = useMemo(() => {
    const kindParam = searchParams.get("kind");
    if (kindParam === "abroad") return "abroad";
    if (kindParam === "competitions") return "competitions";
    return "in_person";
  }, [searchParams]);

  // Monitor campaign directory sub-tier item impressions safely via analytical telemetry
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
    nextParams.set("tab", "events");
    setSearchParams(nextParams, { replace: true });
  };

  // 2. Structural Query Node A: In-Person Physical Seminars Ingress
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
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, description, content_type, event_date, event_timezone, event_duration_minutes, venue_name, venue_address, max_capacity, current_enrollment, cover_image_url, slug, whatsapp_group_link",
        )
        .eq("is_published", true)
        .eq("is_ready", true)
        .eq("content_type", "offline_seminar")
        .not("event_date", "is", null)
        .gte("event_date", cutoff)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // 3. Structural Query Node B: Hackathons & Competitions Curation Hub
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
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, slug, status, category, prizes, is_featured, featured_image, start_date")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Instrument continuous analytical diagnostics tracking maps over internal query exceptions
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
              alt={`${event.title} program thumbnail track`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-6 w-6 text-primary/30 stroke-[2.2]" />
            </div>
          )}
          <Badge className="absolute top-2.5 left-2.5 bg-background/95 text-foreground/90 border border-border/20 text-[9px] font-extrabold uppercase tracking-wide px-2 rounded shadow-sm gap-1 flex items-center">
            <MapPin className="w-3 h-3 text-rose-500 stroke-[2.5]" />
            <span>Physical In-Person</span>
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
                    spotsLeft <= 5 && spotsLeft > 0 && "text-rose-600 bg-rose-500/5 border-rose-500/10 animate-pulse",
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
                Claim Entry Pass
              </Button>
              {event.whatsapp_group_link && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 shrink-0 shadow-sm transition-colors cursor-pointer"
                  asChild
                >
                  <a
                    href={event.whatsapp_group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("academy_event_whatsapp_sync_clicked", { slug: event.slug })}
                  >
                    WhatsApp
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
      {/* Sub-Pills Selection Navigation Context Ribbon Wrapper */}
      <nav className="flex p-1 h-11 bg-muted/30 border border-border/40 rounded-xl select-none w-full transform-gpu">
        {filterOptions.map(({ key, icon: Icon, label }) => {
          const isButtonActive = eventType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSetType(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-none",
                isButtonActive
                  ? "bg-background shadow-sm text-primary font-extrabold border border-border/10"
                  : "text-muted-foreground/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {eventType === "abroad" && <StudyAbroadSection />}

      {/* VIEW COMPILATION TRACK A: PHYSICAL IN-PERSON SEMINAR SERIES */}
      {eventType === "in_person" && (
        <div className="space-y-5 w-full">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 select-none w-full animate-pulse">
              {[1, 2, 3, 4].map((skeletonIndex) => (
                <Skeleton key={skeletonIndex} className="h-52 w-full rounded-2xl opacity-60" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
              <Calendar className="h-6 w-6 text-primary/40 mb-2.5 animate-pulse stroke-[2.2]" />
              <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide">
                Ecosystem Seminars Vacant
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1 italic">
                No physical encounters logged. Recheck parameters down the line.
              </p>
            </div>
          ) : (
            <>
              {todayEvents.length > 0 && (
                <section className="space-y-2.5 w-full">
                  <div className="flex items-center gap-2 px-0.5 select-none leading-none animate-in fade-in duration-200">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
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
                    Subsequent Upcoming Encounters
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

      {/* VIEW COMPILATION TRACK B: CAMPAIGN HACKATHONS CHALLENGES LISTS */}
      {eventType === "competitions" && (
        <div className="space-y-3 w-full">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 select-none w-full animate-pulse">
              {[1, 2, 3, 4].map((skeletonIndex) => (
                <Skeleton key={skeletonIndex} className="h-40 w-full rounded-2xl opacity-60" />
              ))}
            </div>
          ) : competitions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
              <Trophy className="h-6 w-6 text-primary/40 mb-2.5 animate-pulse stroke-[2.2]" />
              <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide">
                Ecosystem Challenges Staged Empty
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1 italic">
                No active structural battles mapped. Code freeze window lock.
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
                        alt="Campaign presentation theme context banner illustration"
                        className="w-full h-full object-cover opacity-80"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent p-3.5 flex flex-col justify-center text-left">
                      <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-extrabold px-2 py-0.5 rounded h-4.5 w-fit mb-1.5 uppercase tracking-wide">
                        {STATUS_LABEL[compItem.status] || "Staged Pipeline"}
                      </Badge>
                      <h3 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate w-full group-hover:text-primary transition-colors select-text pr-1">
                        {compItem.title}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 select-none leading-none">
                        {compItem.category || "Ecosystem Battle Track"}
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-3 px-3.5 flex items-center justify-between w-full select-none font-bold text-xs tracking-tight text-primary tabular-nums mt-auto">
                    <span className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-full text-[11px]">
                      <Gift className="h-3.5 w-3.5 fill-primary/5 stroke-[2.2]" />
                      <span>
                        {Array.isArray(compItem.prizes)
                          ? `${compItem.prizes.length} baseline awards`
                          : "Prizes Enlisted"}
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Audit Brief</span>
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
