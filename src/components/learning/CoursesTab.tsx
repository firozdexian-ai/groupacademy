import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Users, ArrowRight, Coins, Layers, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseCredits } from "@/lib/creditPricing";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";
type FilterKey = "all" | "courses" | "live";

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
  event_duration_minutes?: number | null;
  max_capacity?: number | null;
  current_enrollment?: number | null;
}

const filterOptions: { key: FilterKey; icon: any; label: string }[] = [
  { key: "all", icon: Layers, label: "All" },
  { key: "courses", icon: BookOpen, label: "Courses" },
  { key: "live", icon: Calendar, label: "Live programs" },
];

interface CoursesTabProps {
  onOpenCourse?: (slug: string) => void;
}

export function CoursesTab({ onOpenCourse }: CoursesTabProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FilterKey>("all");

  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: ["app-courses-v2"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, content_type, price, instructor_name, cover_image_url, event_date, event_duration_minutes, max_capacity, current_enrollment",
        )
        .eq("is_published", true)
        .eq("is_private", false)
        .eq("is_ready", true)
        .in("content_type", ["recorded_course", "live_webinar", "batch_class"])
        .order("display_order")
        .abortSignal(signal);

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredCourses = courses.filter((c) => {
    if (selectedType === "all") return true;
    if (selectedType === "courses") return c.content_type === "recorded_course";
    if (selectedType === "live") return c.content_type === "live_webinar" || c.content_type === "batch_class";
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-dashed rounded-2xl bg-destructive/5 border-destructive/20 text-center space-y-3">
        <p className="text-sm text-destructive">Couldn't load courses.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex p-1 h-12 bg-muted/50 rounded-xl border border-border/50">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all",
              selectedType === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 rounded-2xl">
          <p className="text-sm font-medium text-foreground">Nothing here yet</p>
          <p className="text-xs text-muted-foreground mt-1">New programs unlock as soon as they're ready.</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {filteredCourses.map((course) => {
            const isWebinar = course.content_type === "live_webinar";
            const isBatch = course.content_type === "batch_class";
            const isLive = isWebinar || isBatch;
            const typeLabel = isWebinar ? "Webinar" : isBatch ? "Batch class" : "Course";
            const typeStyle = isWebinar
              ? "bg-rose-500/10 text-rose-600"
              : isBatch
                ? "bg-amber-500/10 text-amber-600"
                : "bg-indigo-500/10 text-indigo-600";

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
                  <Badge className={cn("absolute top-2 left-2 border-0 text-[10px] font-medium", typeStyle)}>
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
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isBatch ? `Batch starts ${format(eventDate, "MMM d")}` : format(eventDate, "MMM d, p")}
                      </span>
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
          })}
        </div>
      )}
    </div>
  );
}
