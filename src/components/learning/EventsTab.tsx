import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock, Users, Trophy, Gift, Globe, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isFuture } from "date-fns";
import { StudyAbroadSection } from "./StudyAbroadSection";
import { cn } from "@/lib/utils";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

export interface EventsTabProps {
  onOpenCompetition?: (slug: string) => void;
}

type EventFilter = "in_person" | "competitions" | "abroad";

const filterOptions: { key: EventFilter; icon: any; label: string }[] = [
  { key: "in_person", icon: MapPin, label: "In-person" },
  { key: "competitions", icon: Trophy, label: "Compete" },
  { key: "abroad", icon: Globe, label: "Study abroad" },
];

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  active: "Live now",
  judging: "Judging",
  completed: "Archived",
  cancelled: "Cancelled",
};

export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [eventType, setEventType] = useState<EventFilter>(
    (searchParams.get("kind") as EventFilter) === "abroad" ? "abroad" : "in_person",
  );

  useEffect(() => {
    const kind = searchParams.get("kind");
    if (kind === "abroad") setEventType("abroad");
  }, [searchParams]);

  const handleSetType = (key: EventFilter) => {
    setEventType(key);
    const next = new URLSearchParams(searchParams);
    if (key === "abroad") next.set("kind", "abroad");
    else next.delete("kind");
    next.set("tab", "events");
    setSearchParams(next, { replace: true });
  };

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["app-events-inperson"],
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
    enabled: eventType === "in_person",
  });

  const { data: competitions = [], isLoading: competitionsLoading } = useQuery({
    queryKey: ["app-competitions-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType === "competitions",
  });

  const isLoading = (eventType === "in_person" && eventsLoading) || (eventType === "competitions" && competitionsLoading);

  const todayEvents = events.filter((e) => e.event_date && isToday(new Date(e.event_date)));
  const upcomingEvents = events.filter((e) => e.event_date && isFuture(new Date(e.event_date)));

  const EventCard = ({ event }: { event: any }) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="overflow-hidden rounded-2xl border border-border/40 hover:border-primary/40 transition-all">
        <div className="relative h-32 overflow-hidden bg-muted">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-8 w-8 text-primary/20" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground border-0 text-[10px]">
            <MapPin className="w-3 h-3 mr-1 text-rose-500" /> In-person
          </Badge>
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{event.title}</h3>
          {event.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{event.description}</p>}

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
            {eventDate && (
              <span className="flex items-center gap-1" title={formatEventLocal(eventDate)}>
                <Calendar className="h-3 w-3" /> {formatEventTime(eventDate, event.event_timezone || DEFAULT_EVENT_TZ)}
              </span>
            )}
            {spotsLeft !== null && (
              <span className={cn("flex items-center gap-1", spotsLeft <= 5 && spotsLeft > 0 && "text-rose-600")}>
                <Users className="h-3 w-3" /> {spotsLeft > 0 ? `${spotsLeft} left` : "Full"}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-9 text-xs">Register</Button>
            {event.whatsapp_group_link && (
              <Button variant="outline" size="sm" className="h-9 text-xs border-emerald-500/30 text-emerald-600" asChild>
                <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <nav className="flex p-1 h-12 bg-muted/50 rounded-xl border border-border/50">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleSetType(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all",
              eventType === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {eventType === "abroad" && <StudyAbroadSection />}

      {eventType === "in_person" && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-2xl">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No in-person events yet.</p>
            </div>
          ) : (
            <>
              {todayEvents.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <h2 className="text-sm font-semibold text-rose-600">Happening today</h2>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {todayEvents.map((event) => <EventCard key={event.id} event={event} />)}
                  </div>
                </section>
              )}
              {upcomingEvents.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold px-1">Upcoming</h2>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {eventType === "competitions" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : competitions.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-2xl">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No competitions running.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {competitions.map((comp) => (
                <Card
                  key={comp.id}
                  className="cursor-pointer rounded-2xl border border-border/40 hover:border-primary/40 transition-all overflow-hidden"
                  onClick={() =>
                    onOpenCompetition ? onOpenCompetition(comp.slug) : navigate(`/app/learning/competitions/${comp.slug}`)
                  }
                >
                  <div className="relative h-28 bg-muted">
                    {comp.featured_image && (
                      <img src={comp.featured_image} className="w-full h-full object-cover opacity-80" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent p-3 flex flex-col justify-center">
                      <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px] w-fit mb-1">
                        {STATUS_LABEL[comp.status] || "Upcoming"}
                      </Badge>
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{comp.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{comp.category}</p>
                    </div>
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                      <Gift className="h-3.5 w-3.5" />
                      {Array.isArray(comp.prizes) ? `${comp.prizes.length} prizes` : "Prizes"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                      View <ArrowRight className="h-3 w-3" />
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
