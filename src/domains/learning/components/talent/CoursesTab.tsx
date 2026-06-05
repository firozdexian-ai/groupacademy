import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  listPublicCoursesPaged,
  listUpcomingOfflineSeminarsForTalent,
  listActiveCompetitions,
} from "@/domains/learning/repo/learningRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  BookOpen,
  Calendar,
  Users,
  ArrowRight,
  Coins,
  Layers,
  Clock,
  MapPin,
  Trophy,
  Gift,
  Loader2,
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
  pending: "Upcoming",
  upcoming: "Upcoming",
  active: "Live Now",
  judging: "Reviewing Results",
  completed: "Completed",
  cancelled: "Cancelled",
};

const filterOptions: { key: FilterKey; icon: any; label: string }[] = [
  { key: "all", icon: Layers, label: "All Items" },
  { key: "courses", icon: BookOpen, label: "Courses" },
  { key: "live", icon: Calendar, label: "Live Classes" },
  { key: "events", icon: MapPin, label: "In-Person" },
  { key: "compete", icon: Trophy, label: "Competitions" },
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

  // Monitor dynamic academy catalog filter interactions
  useEffect(() => {
    trackEvent("academy_courses_tab_mounted", { activeFilterSegment: selectedType });
  }, [selectedType]);

  const PAGE_SIZE = 12;

  // Infinite query pipeline to fetch published academy contents
  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesFetchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["app-academy-courses-infinite"],
    enabled: showCourses,
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const data = await listPublicCoursesPaged(from, to);
      return (data || []) as Course[];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE_SIZE ? undefined : allPages.length),
  });

  const courses = useMemo(() => coursesData?.pages.flat() ?? [], [coursesData]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // High-Performance Infinite Scrolling Intersection Observer
  useEffect(() => {
    if (!showCourses || !hasNextPage) return;
    const currentSentinelNode = sentinelRef.current;
    if (!currentSentinelNode) return;

    const intersectionObserverInstance = new IntersectionObserver(
      (entries) => {
        const primaryEntry = entries[0];
        if (primaryEntry?.isIntersecting && !isFetchingNextPage) {
          trackEvent("academy_courses_infinite_sentinel_triggered");
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }, // Proactive content pre-fetching boundary margin
    );

    intersectionObserverInstance.observe(currentSentinelNode);

    return () => {
      if (currentSentinelNode) intersectionObserverInstance.unobserve(currentSentinelNode);
      intersectionObserverInstance.disconnect();
    };
  }, [showCourses, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Query node to fetch active off-line seminars
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsFetchError,
  } = useQuery({
    queryKey: ["app-academy-events"],
    enabled: showEvents,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const data = await listUpcomingOfflineSeminarsForTalent(cutoff);
      return (data || []) as Course[];
    },
  });

  // Query node to fetch active skill challenges
  const {
    data: competitions = [],
    isLoading: competitionsLoading,
    error: competeFetchError,
  } = useQuery({
    queryKey: ["app-academy-competitions"],
    enabled: showCompete,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await listActiveCompetitions();
      return data || [];
    },
  });

  // Dispatch exceptions directly to telemetry collectors safely
  useEffect(() => {
    const primaryFetchError = coursesFetchError || eventsFetchError || competeFetchError;
    if (primaryFetchError) {
      trackError(primaryFetchError, {
        component: "CoursesTab",
        action: "fetch_academy_aggregated_datasets_api",
        selectedType,
      });
    }
  }, [coursesFetchError, eventsFetchError, competeFetchError, selectedType]);

  const liveCutoff = Date.now() - 2 * 60 * 60 * 1000;

  const isLiveActive = (c: Course) => {
    if (c.content_type !== "live_webinar" && c.content_type !== "batch_class") return true;
    if (!c.event_date) return true;
    return new Date(c.event_date).getTime() >= liveCutoff;
  };

  const filteredCourses = useMemo(() => {
    return courses
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
  }, [courses, selectedType]);

  const todayEvents = useMemo(() => events.filter((e) => e.event_date && isToday(new Date(e.event_date))), [events]);
  const upcomingEvents = useMemo(
    () => events.filter((e) => e.event_date && isFuture(new Date(e.event_date))),
    [events],
  );

  const isTabLoading =
    (showCourses && coursesLoading) || (showEvents && eventsLoading) || (showCompete && competitionsLoading);

  const renderCourseCard = (course: Course) => {
    if (!course || !course.id) return null;

    const isWebinar = course.content_type === "live_webinar";
    const isBatch = course.content_type === "batch_class";
    const isLive = isWebinar || isBatch;
    const typeLabel = isWebinar ? "Live Webinar" : isBatch ? "Cohort Batch" : "Self-Paced Course";
    const eventDate = course.event_date ? new Date(course.event_date) : null;
    const spotsLeft = course.max_capacity ? course.max_capacity - (course.current_enrollment || 0) : null;

    return (
      <Card
        key={course.id}
        className="group cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/80 hover:shadow-md outline-none focus-visible:ring-1 focus-visible:ring-ring w-full text-left overflow-hidden flex flex-col"
        onClick={() => {
          trackEvent("academy_course_card_selected", { slug: course.slug });
          if (onOpenCourse) onOpenCourse(course.slug);
          else navigate(`/app/learning/courses/${course.slug}`);
        }}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted border-b border-border/10 shrink-0 select-none">
          {course.cover_image_url ? (
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <BookOpen className="w-6 h-6 text-primary/30 stroke-[2.2]" />
            </div>
          )}
          <Badge className="absolute top-2.5 left-2.5 border border-transparent text-[9px] font-extrabold uppercase tracking-wide bg-background/95 text-foreground/90 rounded px-2 shadow-sm">
            {typeLabel}
          </Badge>
        </div>

        <CardContent className="p-3.5 space-y-2 w-full min-w-0 flex-1 flex flex-col justify-between">
          <div className="space-y-1 w-full min-w-0">
            <h3 className="text-xs sm:text-sm font-bold leading-snug tracking-tight text-foreground/90 line-clamp-1 truncate w-full group-hover:text-primary transition-colors pr-1 select-text">
              {course.title}
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground/80 line-clamp-2 leading-normal break-words pr-1 select-text">
              {course.description || "No summary description available."}
            </p>
          </div>

          <div className="space-y-2 w-full pt-1.5 mt-auto">
            {isLive && eventDate && (
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold text-muted-foreground/70 border-t border-border/10 pt-2 w-full select-none leading-none tabular-nums">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help hover:text-primary transition-colors">
                        <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
                        <span>
                          {isBatch
                            ? `Starts ${formatEventTime(eventDate, course.event_timezone || DEFAULT_EVENT_TZ, "MMM d")}`
                            : formatEventTime(eventDate, course.event_timezone || DEFAULT_EVENT_TZ)}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      className="text-xs bg-popover text-popover-foreground rounded-lg p-2 font-bold shadow-md border"
                    >
                      {formatEventLocal(eventDate)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {spotsLeft !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded uppercase tracking-wide text-[9px] font-extrabold",
                      spotsLeft <= 5 && spotsLeft > 0 && "text-destructive bg-destructive/5 border-destructive/10 animate-pulse",
                    )}
                  >
                    <Users className="h-3.5 w-3.5 stroke-[2.2]" />
                    <span>{spotsLeft > 0 ? `${spotsLeft} seats available` : "Registration Full"}</span>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 w-full select-none font-bold text-xs tracking-tight tabular-nums border-t border-border/5">
              {Number(course.price) === 0 ? (
                <Badge
                  variant="outline"
                  className="text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md text-success dark:text-success border-success/20 bg-success/5 shadow-sm"
                >
                  Free Access
                </Badge>
              ) : (
                <span className="flex items-center gap-1 text-primary font-extrabold bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-full">
                  <Coins className="h-3.5 w-3.5 fill-primary/5 stroke-[2.2]" />
                  <span>{getCourseCredits(course.price).toLocaleString()} Credits</span>
                </span>
              )}
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEventCard = (eventItem: Course) => {
    if (!eventItem || !eventItem.id) return null;

    const eventDate = eventItem.event_date ? new Date(eventItem.event_date) : null;
    const spotsLeft = eventItem.max_capacity ? eventItem.max_capacity - (eventItem.current_enrollment || 0) : null;

    return (
      <Card
        key={eventItem.id}
        className="overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transition-all duration-300 w-full flex flex-col text-left group hover:border-primary/30"
      >
        <div className="relative h-28 w-full overflow-hidden bg-muted border-b border-border/10 select-none shrink-0">
          {eventItem.cover_image_url ? (
            <img
              src={eventItem.cover_image_url}
              alt={eventItem.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-6 w-6 text-primary/20 stroke-[2.2]" />
            </div>
          )}
          <Badge className="absolute top-2.5 left-2.5 bg-background/95 text-foreground/90 border border-border/20 text-[9px] font-extrabold uppercase tracking-wide rounded shadow-sm gap-1 flex items-center px-2">
            <MapPin className="w-3 h-3 text-destructive stroke-[2.5]" />
            <span>In-Person Event</span>
          </Badge>
        </div>

        <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 flex-1 flex flex-col justify-between">
          <div className="space-y-0.5 w-full min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight truncate pr-1 select-text">
              {eventItem.title}
            </h3>
            {eventItem.description && (
              <p className="text-[11px] font-medium text-muted-foreground/80 line-clamp-2 leading-normal break-words select-text">
                {eventItem.description}
              </p>
            )}
          </div>

          <div className="space-y-2 w-full pt-1.5 border-t border-border/10 mt-auto select-none font-bold text-[10px] text-muted-foreground/70 leading-none tabular-nums">
            <div className="flex flex-wrap items-center gap-2.5 leading-none w-full">
              {eventDate && (
                <span
                  className="flex items-center gap-1 hover:text-primary transition-colors cursor-help"
                  title={formatEventLocal(eventDate)}
                >
                  <Calendar className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
                  <span>{formatEventTime(eventDate, eventItem.event_timezone || DEFAULT_EVENT_TZ)}</span>
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
                  <span>{spotsLeft > 0 ? `${spotsLeft} openings left` : "Registration Full"}</span>
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-1 w-full">
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  trackEvent("academy_event_registration_clicked", { slug: eventItem.slug });
                  navigate(`/app/learning/courses/${eventItem.slug}`);
                }}
                className="flex-1 h-8 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shadow-sm cursor-pointer active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Book Ticket
              </Button>
              {eventItem.whatsapp_group_link && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border-success/20 text-success hover:bg-success/5 shrink-0 shadow-sm transition-colors cursor-pointer"
                  asChild
                >
                  <a
                    href={eventItem.whatsapp_group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("academy_event_whatsapp_clicked", { slug: eventItem.slug })}
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

  const renderCompetitionCard = (compItem: any) => {
    if (!compItem || !compItem.id) return null;

    return (
      <Card
        key={compItem.id}
        className="cursor-pointer rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/80 outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-hidden group w-full text-left"
        onClick={() => {
          trackEvent("academy_competition_card_selected", { slug: compItem.slug });
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

        <CardContent className="p-3 px-3.5 flex items-center justify-between w-full select-none font-bold text-xs tracking-tight text-primary tabular-nums">
          <span className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-full text-[11px]">
            <Gift className="h-3.5 w-3.5 fill-primary/5 stroke-[2.2]" />
            <span>
              {Array.isArray(compItem.prizes) ? `${compItem.prizes.length} Rewards` : "Prizes Announced Soon"}
            </span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
            <span>View Briefing</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 w-full antialiased text-left select-none sm:select-text">
      {/* Category Navigation Bar */}
      <nav className="flex flex-wrap gap-1.5 p-1 bg-muted/30 border border-border/40 rounded-xl select-none w-full transform-gpu">
        {filterOptions.map(({ key, icon: Icon, label }) => {
          const isActive = selectedType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedType(key)}
              className={cn(
                "flex-1 min-w-[64px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-none",
                isActive
                  ? "bg-background shadow-sm text-primary font-extrabold border border-border/10"
                  : "text-muted-foreground/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Loading States */}
      {isTabLoading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 select-none w-full animate-pulse">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-52 w-full rounded-2xl opacity-60" />
          ))}
        </div>
      )}

      {/* Courses Display Grid */}
      {!isTabLoading && showCourses && filteredCourses.length > 0 && (
        <section className="space-y-2.5 w-full">
          {selectedType === "all" && (
            <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none mb-1">
              Courses & Live Cohorts
            </h2>
          )}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">{filteredCourses.map(renderCourseCard)}</div>

          {showCourses && hasNextPage && (
            <div ref={sentinelRef} className="py-4 flex justify-center items-center w-full select-none">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center text-[10px] font-bold text-primary animate-pulse tracking-wide">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 stroke-[2.5]" />
                  <span>Loading more content...</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/30 select-none animate-in fade-in duration-300">
                  Scroll down to load more
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Events Display Grid */}
      {!isTabLoading && showEvents && events.length > 0 && (
        <section className="space-y-4 w-full">
          {selectedType === "all" && (
            <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none mb-1">
              In-Person Events
            </h2>
          )}

          {todayEvents.length > 0 && (
            <div className="space-y-2 w-full">
              <div className="flex items-center gap-2 px-0.5 select-none leading-none animate-in fade-in duration-200">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-destructive dark:text-destructive">
                  Happening Today
                </h3>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">{todayEvents.map(renderEventCard)}</div>
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div className="space-y-2 w-full">
              {selectedType === "all" && todayEvents.length > 0 && (
                <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest pl-0.5 select-none leading-none pt-1">
                  Upcoming
                </div>
              )}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">{upcomingEvents.map(renderEventCard)}</div>
            </div>
          )}
        </section>
      )}

      {/* Competitions Display Grid */}
      {!isTabLoading && showCompete && competitions.length > 0 && (
        <section className="space-y-2.5 w-full">
          {selectedType === "all" && (
            <h2 className="text-xs font-bold text-foreground/80 uppercase tracking-wider pl-0.5 select-none leading-none mb-1">
              Competitions & Challenges
            </h2>
          )}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">{competitions.map(renderCompetitionCard)}</div>
        </section>
      )}

      {/* Graceful Blank Fallback Layout */}
      {!isTabLoading &&
        ((showCourses && filteredCourses.length === 0) || !showCourses) &&
        ((showEvents && events.length === 0) || !showEvents) &&
        ((showCompete && competitions.length === 0) || !showCompete) && (
          <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
            <Gift className="h-6 w-6 text-primary/40 mb-3 animate-pulse stroke-[2.2]" />
            <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-none uppercase tracking-wide">
              No programs here yet
            </p>
            <p className="text-[11px] font-medium text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5">
              There are no active listings matching this category right now. Please check back later.
            </p>
          </div>
        )}
    </div>
  );
}
