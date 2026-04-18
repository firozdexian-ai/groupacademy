import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, BookOpen, Calendar, Users, ArrowRight, Coins, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";
type FilterKey = "all" | "recorded_course" | "live_webinar" | "batch_class";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  price: number;
  instructor_name: string;
  cover_image_url: string | null;
}

const contentTypeConfig = {
  free_video: { icon: Sparkles, label: "Video", color: "bg-blue-500/10 text-blue-600" },
  recorded_course: { icon: BookOpen, label: "Course", color: "bg-violet-500/10 text-violet-600" },
  live_webinar: { icon: Calendar, label: "Webinar", color: "bg-rose-500/10 text-rose-600" },
  batch_class: { icon: Users, label: "Class", color: "bg-amber-500/10 text-amber-600" },
  offline_seminar: { icon: LayoutGrid, label: "Seminar", color: "bg-emerald-500/10 text-emerald-600" },
};

const filterOptions: { key: FilterKey; icon: any; label: string }[] = [
  { key: "all", icon: LayoutGrid, label: "All" },
  { key: "recorded_course", icon: BookOpen, label: "Courses" },
  { key: "live_webinar", icon: Calendar, label: "Webinars" },
  { key: "batch_class", icon: Users, label: "Classes" },
];

interface CoursesTabProps {
  onOpenCourse?: (slug: string) => void;
}

export function CoursesTab({ onOpenCourse }: CoursesTabProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FilterKey>("all");

  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["app-courses"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, description, content_type, price, instructor_name, cover_image_url")
        .eq("is_published", true)
        .eq("is_private", false)
        .order("display_order")
        .abortSignal(signal);

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredCourses = courses.filter((c) => {
    if (selectedType === "all") return c.content_type !== "free_video";
    return c.content_type === selectedType;
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[280px] w-full rounded-[24px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed bg-destructive/5 border-destructive/20 rounded-[32px]">
        <CardContent className="py-12 text-center">
          <p className="text-sm font-bold text-destructive mb-4 tracking-tight">
            Sync interrupted. Check your connection.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl font-bold">
            Retry Sync
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Visual Category Selector */}
      <div className="grid grid-cols-4 gap-3">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                "group-hover:scale-110 active:scale-90",
                selectedType === key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                selectedType === key ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/20 mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            No matching programs found
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {filteredCourses.map((course) => {
            const config = contentTypeConfig[course.content_type] || contentTypeConfig.recorded_course;
            const Icon = config.icon;

            return (
              <Card
                key={course.id}
                className="group cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden rounded-[24px] border-border/40 bg-card/50 backdrop-blur-sm"
                onClick={() =>
                  onOpenCourse ? onOpenCourse(course.slug) : navigate(`/app/learning/courses/${course.slug}`)
                }
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                      <Icon className="w-10 h-10 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={cn("border-none text-[9px] font-black uppercase tracking-widest", config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    {course.price === 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest">
                        Free Enrollment
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-primary">
                        <Coins className="h-3 w-3" />
                        <span className="text-xs font-black">{getCourseCredits(course.price)}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-sm font-black tracking-tight leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs font-medium leading-relaxed mt-1 text-muted-foreground/80">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                    {course.instructor_name || "Academy Faculty"}
                  </span>
                  <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform">
                    Explore <ArrowRight className="h-3 w-3" />
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
