import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, BookOpen, Calendar, Users, ArrowRight, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";
type FilterKey = "all" | "recorded_course" | "live_webinar" | "batch_class";

interface Course {
  id: string; title: string; slug: string; description: string;
  content_type: ContentType; price: number; instructor_name: string; cover_image_url: string | null;
}

const contentTypeConfig = {
  free_video: { icon: LayoutGrid, label: "Video" },
  recorded_course: { icon: BookOpen, label: "Course" },
  live_webinar: { icon: Calendar, label: "Webinar" },
  batch_class: { icon: Users, label: "Class" },
  offline_seminar: { icon: LayoutGrid, label: "Seminar" },
};

const filterOptions: { key: FilterKey; icon: typeof LayoutGrid; label: string }[] = [
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

  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: ["app-courses"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, description, content_type, price, instructor_name, cover_image_url")
        .eq("is_published", true).eq("is_private", false).order("display_order").abortSignal(signal);
      if (error) throw error;
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredCourses = selectedType === "all"
    ? courses.filter((c) => c.content_type !== "free_video")
    : courses.filter((c) => c.content_type === selectedType);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card><CardContent className="py-8 text-center">
        <p className="text-muted-foreground mb-4">Failed to load courses</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Icon category selector */}
      <div className="flex gap-4">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-colors",
              selectedType === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-xs font-medium",
              selectedType === key ? "text-foreground" : "text-muted-foreground"
            )}>{label}</span>
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No courses match this filter</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => {
            const config = contentTypeConfig[course.content_type];
            const Icon = config.icon;
            return (
              <Card key={course.id} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all overflow-hidden" onClick={() => onOpenCourse ? onOpenCourse(course.slug) : navigate(`/app/learning/courses/${course.slug}`)}>
                {course.cover_image_url ? (
                  <div className="h-32 overflow-hidden"><img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" loading="lazy" /></div>
                ) : (
                  <div className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Icon className="w-8 h-8 text-primary/50" /></div>
                )}
                <CardHeader className="pb-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                    {course.price === 0 ? (
                      <Badge variant="default" className="bg-green-500 text-xs">Free</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center gap-1"><Coins className="h-3 w-3" />{getCourseCredits(course.price)} credits</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {course.instructor_name && <span className="text-xs text-muted-foreground truncate">{course.instructor_name}</span>}
                    <Button variant="ghost" size="sm" className="gap-1 text-xs ml-auto">View <ArrowRight className="h-3 w-3" /></Button>
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
