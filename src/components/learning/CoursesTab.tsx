import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Calendar, Users, ArrowRight, Coins, Layers, Clock, MapPin, Trophy, Gift,
} from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";
type FilterKey = "all" | "courses" | "live" | "events" | "compete";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  price: number;
  instructor_name: string;
  cover_image_url: string | null;
  event_date?: string | null;
  event_timezone?: string | null;
  event_duration_minutes?: number | null;
  max_capacity?: number | null;
  current_enrollment?: number | null;
  venue_name?: string | null;
  whatsapp_group_link?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  active: "Live now",
  judging: "Judging",
  completed: "Archived",
  cancelled: "Cancelled",
};

const filterOptions: { key: FilterKey; icon: any; label: string }[] = [
  { key: "all", icon: Layers, label: "All" },
  { key: "courses", icon: BookOpen, label: "Courses" },
  { key: "live", icon: Calendar, label: "Live" },
  { key: "events", icon: MapPin, label: "Events" },
  { key: "compete", icon: Trophy, label: "Compete" },
];

interface CoursesTabProps {
  onOpenCourse?: (slug: string) => void;
  onOpenCompetition?: (slug: string) => void;
}

export function CoursesTab({ onOpenCourse, onOpenCompetition }: CoursesTabProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FilterKey>("all");

  const showCourses = selectedType === "all" || selectedType === "courses" || selectedType === "live";
  const showEvents = selectedType === "all" || selectedType === "events";
  const showCompete = selectedType === "all" || selectedType === "compete";

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["app-academy-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, content_type, price, instructor_name, cover_image_url, event_date, event_timezone, event_duration_minutes, max_capacity, current_enrollment",
        )
        .eq("is_published", true)
        .eq("is_private", false)
        .eq("is_ready", true)
        .in("content_type", ["recorded_course", "live_webinar", "batch_class"])
        .order("display_order");
      if (error) throw error;
      return (data || []) as Course[];
    },
    enabled: showCourses,
    staleTime: 5 * 60 * 1000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["app-academy-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, content_type, cover_image_url, event_date, event_timezone, event_duration_minutes, max_capacity, current_enrollment, venue_name, whatsapp_group_link, price, instructor_name",
        )
        .eq("is_published", true)
        .eq("content_type", "offline_seminar")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Course[];
    },
    enabled: showEvents,
  });

  const { data: competitions = [], isLoading: competitionsLoading } = useQuery({
    queryKey: ["app-academy-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: showCompete,
  });

  // Hide live programs whose event is more than 2 hours past
  const liveCutoff = Date.now() - 2 * 60 * 60 * 1000;
  const isLiveActive = (c: Course) => {
    if (c.content_type !== "live_webinar" && c.content_type !== "batch_class") return true;
    if (!c.event_date) return true;
    return new Date(c.event_date).getTime() >= liveCutoff;
  };

  const filteredCourses = courses
    .filter(isLiveActive)
    .filter((c) => {
      if (selectedType === "courses") return c.content_type === "recorded_course";
      if (selectedType === "live") return c.content_type === "live_webinar" || c.content_type === "batch_class";
      return true;
    })
    .sort((a, b) => {
      const ad = a.event_date ? new Date(a.event_date).getTime() : Infinity;
      const bd = b.event_date ? new Date(b.event_date).getTime() : Infinity;
      return ad - bd;
    });

  const todayEvents = events.filter((e) => e.event_date && isToday(new Date(e.event_date)));
  const upcomingEvents = events.filter((e) => e.event_date && isFuture(new Date(e.event_date)));

  const isLoading =
    (showCourses && coursesLoading) || (showEvents && eventsLoading) || (showCompete && competitionsLoading);

  const renderCourseCard = (course: Course) => {
    const isWebinar = course.content_type === "live_webinar";
    const isBatch = course.content_type === "batch_class";
    const isLive = isWebinar || isBatch;
    const typeLabel = isWebinar ? "Webinar" : isBatch ? "Batch" : "Course";
    const eventDate = course.event_date ? new Date(course.event_date) : null;
    const spotsLeft = course.max_capacity ? course.max_capacity - (course.current_enrollment || 0) : null;

    return (
      <Card
        key={course.id}
        className="group cursor-pointer hover:border-primary/40 transition-all overflow-hidden rounded-2xl border border-border/40"
        onClick={() => (onOpenCourse ? onOpenCourse(course.slug) : navigate(`/app/learning/courses/${course.slug}`))}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {course.cover_image_url ? (
            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <BookOpen className="w-8 h-8 text-primary/20" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 border-0 text-[10px] font-medium bg-background/90 text-foreground">
            {typeLabel}
          </Badge>
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{course.description}</p>

          {isLive && eventDate && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <Calendar className="h-3 w-3" />
                      {isBatch
                        ? `Starts ${formatEventTime(eventDate, course.event_timezone || DEFAULT_EVENT_TZ, "MMM d")}`
                        : formatEventTime(eventDate, course.event_timezone || DEFAULT_EVENT_TZ)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{formatEventLocal(eventDate)}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {spotsLeft !== null && (
                <span className={cn("flex items-center gap-1", spotsLeft <= 5 && spotsLeft > 0 && "text-rose-600")}>
                  <Users className="h-3 w-3" />
                  {spotsLeft > 0 ? `${spotsLeft} left` : "Full"}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {course.price === 0 ? (
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Free</Badge>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                <Coins className="h-3 w-3" />
                {getCourseCredits(course.price)} cr
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEventCard = (event: Course) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;
    return (
      <Card key={event.id} className="overflow-hidden rounded-2xl border border-border/40 hover:border-primary/40 transition-all">
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
                <Calendar className="h-3 w-3" />
                {formatEventTime(eventDate, event.event_timezone || DEFAULT_EVENT_TZ)}
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

  const renderCompetitionCard = (comp: any) => (
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
  );

  return (
    <div className="space-y-4">
      {/* Sub-pills: wraps on mobile, no horizontal scroll */}
      <nav className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
        {filterOptions.map(({ key, icon: Icon, label }) => {
          const isActive = selectedType === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={cn(
                "flex-1 min-w-[64px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all",
                isActive ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {isLoading && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      )}

      {/* Courses & Live */}
      {!isLoading && showCourses && filteredCourses.length > 0 && (
        <section className="space-y-2">
          {selectedType === "all" && <h2 className="text-sm font-semibold px-1">Courses & Live programs</h2>}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {filteredCourses.map(renderCourseCard)}
          </div>
        </section>
      )}

      {/* Events */}
      {!isLoading && showEvents && events.length > 0 && (
        <section className="space-y-3">
          {selectedType === "all" && <h2 className="text-sm font-semibold px-1">In-person events</h2>}
          {todayEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-rose-600">Happening today</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">{todayEvents.map(renderEventCard)}</div>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">{upcomingEvents.map(renderEventCard)}</div>
          )}
        </section>
      )}

      {/* Competitions */}
      {!isLoading && showCompete && competitions.length > 0 && (
        <section className="space-y-2">
          {selectedType === "all" && <h2 className="text-sm font-semibold px-1">Competitions</h2>}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">{competitions.map(renderCompetitionCard)}</div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading &&
        ((showCourses && filteredCourses.length === 0) || !showCourses) &&
        ((showEvents && events.length === 0) || !showEvents) &&
        ((showCompete && competitions.length === 0) || !showCompete) && (
          <div className="py-16 text-center border border-dashed border-border/40 rounded-2xl">
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon — new programs unlock often.</p>
          </div>
        )}
    </div>
  );
}
