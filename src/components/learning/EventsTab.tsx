import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock, Users, Video, ExternalLink, LayoutGrid, Trophy, Gift, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, isFuture, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type EventFilter = "all" | "live_webinar" | "offline_seminar" | "competitions";

const filterOptions: { key: EventFilter; icon: any; label: string }[] = [
  { key: "all", icon: LayoutGrid, label: "All" },
  { key: "live_webinar", icon: Video, label: "Webinars" },
  { key: "offline_seminar", icon: MapPin, label: "In-Person" },
  { key: "competitions", icon: Trophy, label: "Compete" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  upcoming: { label: "Upcoming", variant: "secondary" },
  active: { label: "Live Now", variant: "default" },
  judging: { label: "Judging", variant: "outline" },
  completed: { label: "Ended", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface EventsTabProps {
  onOpenCompetition?: (slug: string) => void;
}

export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventFilter>("all");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["app-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, description, content_type, event_date, event_duration_minutes, venue_name, venue_address, max_capacity, current_enrollment, cover_image_url, thumbnail_url, slug, whatsapp_group_link",
        )
        .eq("is_published", true)
        .in("content_type", ["live_webinar", "offline_seminar"])
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType !== "competitions",
  });

  const { data: competitions = [], isLoading: competitionsLoading } = useQuery({
    queryKey: ["app-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType === "all" || eventType === "competitions",
  });

  const isLoading = eventsLoading || (eventType === "competitions" && competitionsLoading);

  const filteredEvents =
    eventType === "all" || eventType === "competitions" ? events : events.filter((e) => e.content_type === eventType);

  const upcomingEvents = filteredEvents.filter((e) => e.event_date && isFuture(new Date(e.event_date)));
  const todayEvents = filteredEvents.filter((e) => e.event_date && isToday(new Date(e.event_date)));
  const pastEvents = filteredEvents.filter(
    (e) => e.event_date && isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date)),
  );

  const EventCard = ({ event }: { event: any }) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const isWebinar = event.content_type === "live_webinar";
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="group overflow-hidden rounded-[24px] border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-xl hover:border-primary/30">
        <div className="relative h-40 overflow-hidden bg-muted">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-10 w-10 text-primary/20" />
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md text-foreground border-none">
            {isWebinar ? (
              <Video className="w-3 h-3 mr-1.5 text-blue-500" />
            ) : (
              <MapPin className="w-3 h-3 mr-1.5 text-rose-500" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isWebinar ? "Webinar" : "Seminar"}
            </span>
          </Badge>
        </div>
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm font-black leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="text-xs font-medium line-clamp-2 mt-1">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <div className="space-y-2">
            {eventDate && (
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{format(eventDate, "PPP")}</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {format(eventDate || new Date(), "p")}
              </div>
              {spotsLeft !== null && (
                <div className={cn("flex items-center gap-1.5", spotsLeft <= 5 ? "text-rose-500" : "")}>
                  <Users className="h-3 w-3" /> {spotsLeft > 0 ? `${spotsLeft} Spots` : "Sold Out"}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest" size="sm">
              Register
            </Button>
            {event.whatsapp_group_link && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                asChild
              >
                <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  Group
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[320px] w-full rounded-[24px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Category Grid */}
      <div className="grid grid-cols-4 gap-3">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setEventType(key)}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                eventType === key
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-primary/10",
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                eventType === key ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Sections */}
      <div className="space-y-10">
        {todayEvents.length > 0 && eventType !== "competitions" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Happening Today</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {(eventType === "all" || eventType === "competitions") && competitions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Major Competitions
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {competitions.map((comp) => (
                <Card
                  key={comp.id}
                  className="group cursor-pointer rounded-[24px] border-border/40 bg-card/50 overflow-hidden hover:border-primary/40 transition-all"
                  onClick={() =>
                    onOpenCompetition
                      ? onOpenCompetition(comp.slug)
                      : navigate(`/app/learning/competitions/${comp.slug}`)
                  }
                >
                  <div className="flex h-32 bg-muted relative">
                    {comp.featured_image && (
                      <img
                        src={comp.featured_image}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent p-5 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase tracking-widest">
                          {STATUS_CONFIG[comp.status]?.label || "Upcoming"}
                        </Badge>
                      </div>
                      <h3 className="font-black text-sm tracking-tight leading-tight line-clamp-1">{comp.title}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                        {comp.category}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter">
                      <Gift className="h-3.5 w-3.5 text-primary" />
                      <span>{Array.isArray(comp.prizes) ? comp.prizes.length : 0} Prizes</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase">
                      Enter Hub
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {upcomingEvents.length > 0 && eventType !== "competitions" && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Upcoming Schedule</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>

      {events.length === 0 && competitions.length === 0 && (
        <div className="py-24 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            No events currently listed
          </p>
        </div>
      )}
    </div>
  );
}
