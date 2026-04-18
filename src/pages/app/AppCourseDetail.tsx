import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, FileText, ChevronRight, Sparkles, Clock, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ContentType = "batch_class" | "free_video" | "live_webinar" | "offline_seminar" | "recorded_course";
type ContentFilter = "all" | "courses" | "events" | "blog";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType | "blog";
  thumbnail_url?: string | null;
  description?: string | null;
  credit_cost?: number | null;
  reading_time?: number | null;
  event_date?: string | null;
}

const FILTER_OPTIONS: { value: ContentFilter; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "courses", label: "Courses", icon: BookOpen },
  { value: "events", label: "Events", icon: Calendar },
  { value: "blog", label: "Articles", icon: FileText },
];

const COURSE_TYPES: ContentType[] = ["batch_class", "recorded_course", "free_video"];
const EVENT_TYPES: ContentType[] = ["live_webinar", "offline_seminar"];

const getTheme = (type: string) => {
  if (COURSE_TYPES.includes(type as any))
    return { icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10", label: "Course" };
  if (EVENT_TYPES.includes(type as any))
    return { icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Event" };
  return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", label: "Article" };
};

export function UnifiedDiscovery() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["discovery-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, thumbnail_url, cover_image_url, description, credit_cost, content_type, event_date")
        .eq("is_published", true)
        .limit(12);
      if (error) throw error;
      return data.map((i) => ({
        ...i,
        type: i.content_type as ContentType,
        thumbnail_url: i.thumbnail_url || i.cover_image_url,
      }));
    },
  });

  const { data: blogs = [], isLoading: blogsLoading } = useQuery({
    queryKey: ["discovery-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, featured_image, reading_time_mins")
        .eq("status", "published")
        .limit(6);
      if (error) throw error;
      return data.map((i) => ({
        id: i.id,
        title: i.title,
        slug: i.slug,
        type: "blog" as const,
        thumbnail_url: i.featured_image,
        reading_time: i.reading_time_mins,
      }));
    },
  });

  const filteredItems = useMemo(() => {
    const all = [...courses, ...blogs];
    if (activeFilter === "all") return all;
    if (activeFilter === "courses") return all.filter((i) => COURSE_TYPES.includes(i.type as any));
    if (activeFilter === "events") return all.filter((i) => EVENT_TYPES.includes(i.type as any));
    return all.filter((i) => i.type === "blog");
  }, [courses, blogs, activeFilter]);

  if (coursesLoading || blogsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-[24px]" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Discovery Hub</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tailored for your career
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/courses")}
          className="text-xs font-black uppercase tracking-widest"
        >
          Explore All <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
              activeFilter === opt.value
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.slice(0, 8).map((item) => {
          const theme = getTheme(item.type);
          return (
            <Card
              key={item.id}
              className="group cursor-pointer rounded-[24px] overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:-translate-y-1"
              onClick={() =>
                navigate(
                  item.type === "blog" ? `/app/learning/blog/${item.slug}` : `/app/learning/courses/${item.slug}`,
                )
              }
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                <img
                  src={item.thumbnail_url || ""}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <Badge
                  className={cn(
                    "absolute top-3 left-3 border-none backdrop-blur-md bg-black/40 text-white text-[9px] font-black uppercase tracking-widest",
                  )}
                >
                  {theme.label}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-xs tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                    {item.type === "blog" ? (
                      <>
                        <Clock className="h-3 w-3" /> {item.reading_time}m Read
                      </>
                    ) : EVENT_TYPES.includes(item.type as any) ? (
                      <>
                        <Calendar className="h-3 w-3" />{" "}
                        {item.event_date ? new Date(item.event_date).toLocaleDateString() : "TBD"}
                      </>
                    ) : (
                      <>
                        <Coins className="h-3 w-3" /> {item.credit_cost || "Free"}
                      </>
                    )}
                  </div>
                  <theme.icon className={cn("h-3 w-3", theme.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
