import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, BookOpen, Calendar, Users, ArrowRight, Coins, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Academic Content Hub (CoursesTab)
 * CTO Reference: Authoritative discovery node for institutional learning artifacts.
 */

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
  free_video: { icon: Sparkles, label: "NEURAL_VIDEO", color: "bg-blue-500/10 text-blue-500" },
  recorded_course: { icon: BookOpen, label: "EVERGREEN_TRACK", color: "bg-indigo-500/10 text-indigo-500" },
  live_webinar: { icon: Calendar, label: "LIVE_SESSION", color: "bg-rose-500/10 text-rose-500" },
  batch_class: { icon: Users, label: "BATCH_PROTOCOL", color: "bg-amber-500/10 text-amber-500" },
  offline_seminar: { icon: LayoutGrid, label: "INSTITUTIONAL_OFFLINE", color: "bg-emerald-500/10 text-emerald-500" },
};

const filterOptions: { key: FilterKey; icon: any; label: string }[] = [
  { key: "all", icon: LayoutGrid, label: "ALL_NODES" },
  { key: "recorded_course", icon: BookOpen, label: "COURSES" },
  { key: "live_webinar", icon: Calendar, label: "WEBINARS" },
  { key: "batch_class", icon: Users, label: "CLASSES" },
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
        .eq("is_ready", true)
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
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-[32px] opacity-40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border-2 border-dashed rounded-[32px] bg-destructive/5 border-destructive/20 text-center space-y-4">
        <p className="text-[10px] font-black uppercase italic tracking-widest text-destructive">Registry_Sync_Fault</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-xl font-black uppercase italic text-[10px] tracking-widest border-destructive/20 text-destructive"
        >
          Force_Manual_Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* TACTICAL_SELECTOR: High-Density Segmentation */}
      <div className="grid grid-cols-4 gap-4 p-2 bg-muted/20 backdrop-blur-md rounded-[28px] border-2 border-border/40">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-[20px] flex items-center justify-center transition-all duration-500 border-2",
                "group-hover:scale-110 group-active:scale-95",
                selectedType === key
                  ? "bg-primary border-primary text-white shadow-[0_10px_25px_rgba(var(--primary),0.3)]"
                  : "bg-background/50 border-border/10 text-muted-foreground/60 hover:text-primary hover:border-primary/20",
              )}
            >
              <Icon className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors italic",
                selectedType === key ? "text-primary" : "text-muted-foreground/40",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-border/20 rounded-[40px] bg-muted/5 px-6">
          <Zap className="h-12 w-12 text-muted-foreground/20 mx-auto animate-pulse" />
          <p className="text-sm font-bold text-foreground mt-6">Our team is finishing this academy</p>
          <p className="text-[11px] text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            New courses unlock the moment they're 100% ready. Check back soon — or browse Pathways to see what's coming.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {filteredCourses.map((course) => {
            const config = contentTypeConfig[course.content_type] || contentTypeConfig.recorded_course;
            const Icon = config.icon;

            return (
              <Card
                key={course.id}
                className="group relative cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/40 transition-all duration-500 overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl"
                onClick={() =>
                  onOpenCourse ? onOpenCourse(course.slug) : navigate(`/app/learning/courses/${course.slug}`)
                }
              >
                {/* NODE_THUMBNAIL: Asset Layer */}
                <div className="relative aspect-[16/9] overflow-hidden bg-muted border-b-2 border-border/10">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                      <Icon className="w-12 h-12 text-primary/10" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-2 font-black italic text-[9px] uppercase tracking-widest px-3 py-1 bg-background/80 backdrop-blur-md",
                        config.color,
                      )}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-6 pb-2 text-left">
                  <div className="flex items-center justify-between mb-4">
                    {course.price === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500">
                        <ShieldCheck className="h-3 w-3 fill-current" />
                        <span className="text-[9px] font-black uppercase italic tracking-widest">Protocol_Free</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-primary">
                        <Coins className="h-4 w-4 fill-primary/20" />
                        <span className="text-sm font-black tabular-nums tracking-tighter">
                          {getCourseCredits(course.price)} CR
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-black tracking-tighter leading-tight line-clamp-1 uppercase italic group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-[11px] font-bold italic leading-relaxed mt-2 text-muted-foreground/60 uppercase">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6 pt-4 flex items-center justify-between border-t border-border/5 mt-2">
                  <div className="flex items-center gap-2 text-muted-foreground/40">
                    <Users className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[140px]">
                      {course.instructor_name || "ACADEMY_CORE"}
                    </span>
                  </div>
                  <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-[0.2em] gap-2 group-hover:translate-x-1 transition-transform italic">
                    SYNC_NOW <ArrowRight className="h-3 w-3" />
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
