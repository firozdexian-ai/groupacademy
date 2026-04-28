import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, FileText, ChevronRight, Sparkles, Zap, Clock, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Omni-Channel Discovery Node
 * CTO Reference: Authoritative hub for multi-origin content aggregation and discovery.
 */

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

const FILTER_OPTIONS: { value: ContentFilter; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "ALL_NODES", icon: Sparkles },
  { value: "courses", label: "CURRICULUM", icon: BookOpen },
  { value: "events", label: "ENGAGEMENTS", icon: Calendar },
  { value: "blog", label: "INTEL_POSTS", icon: FileText },
];

const COURSE_TYPES: ContentType[] = ["batch_class", "recorded_course", "free_video"];
const EVENT_TYPES: ContentType[] = ["live_webinar", "offline_seminar"];

const isCourseType = (type: string) => COURSE_TYPES.includes(type as ContentType);
const isEventType = (type: string) => EVENT_TYPES.includes(type as ContentType);

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
        .order("display_order")
        .limit(12);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        type: item.content_type as ContentType,
        thumbnail_url: item.thumbnail_url || item.cover_image_url,
        description: item.description,
        credit_cost: item.credit_cost,
        event_date: item.event_date,
      }));
    },
  });

  const { data: blogs = [], isLoading: blogsLoading } = useQuery({
    queryKey: ["discovery-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, featured_image, excerpt, reading_time_mins")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        type: "blog" as const,
        thumbnail_url: item.featured_image,
        description: item.excerpt,
        reading_time: item.reading_time_mins,
      }));
    },
  });

  const allItems: ContentItem[] = [...courses, ...blogs];
  const isLoading = coursesLoading || blogsLoading;

  const filteredItems =
    activeFilter === "all"
      ? allItems
      : allItems.filter((item) => {
          if (activeFilter === "courses") return isCourseType(item.type);
          if (activeFilter === "events") return isEventType(item.type);
          return item.type === activeFilter;
        });

  const counts: Record<ContentFilter, number> = {
    all: allItems.length,
    courses: courses.filter((c) => isCourseType(c.type)).length,
    events: courses.filter((c) => isEventType(c.type)).length,
    blog: blogs.length,
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary fill-current" /> Discovery_Matrix
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Synchronize with institutional knowledge artifacts
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="font-black uppercase italic text-[10px] tracking-widest hover:text-primary transition-all"
          onClick={() => navigate("/app/learning/courses")}
        >
          Audit_All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* TACTICAL_FILTERS */}
      <div className="flex flex-wrap gap-3 p-1">
        {FILTER_OPTIONS.map((option) => {
          const count = counts[option.value];
          const isActive = activeFilter === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase italic tracking-widest transition-all duration-300 border-2",
                isActive
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105"
                  : "bg-muted/30 border-border/40 hover:border-primary/20 text-muted-foreground hover:text-primary",
              )}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 text-[9px] px-2 py-0.5 rounded-lg border",
                    isActive ? "bg-white/20 border-white/30" : "bg-background border-border/40",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ARTIFACT_GRID */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-[32px] opacity-40" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed rounded-[40px] border-border/20 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
            Registry_Empty: Awaiting_Data_Ingress
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.slice(0, 12).map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer transition-all duration-500 rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95"
              onClick={() =>
                navigate(
                  item.type === "blog" ? `/app/learning/blog/${item.slug}` : `/app/learning/courses/${item.slug}`,
                )
              }
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden border-b-2 border-border/10">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <BookOpen className="h-10 w-10 text-primary/10" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge
                    variant="outline"
                    className="bg-background/80 backdrop-blur-md border-2 font-black italic text-[9px] uppercase px-3 py-1"
                  >
                    {item.type.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-3 text-left">
                <h3 className="font-black text-sm uppercase italic tracking-tighter leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground/60">
                  {item.type === "blog" ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.reading_time} MIN_READ
                    </span>
                  ) : isEventType(item.type) ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{" "}
                      {item.event_date ? new Date(item.event_date).toLocaleDateString() : "TBD"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-primary/70">
                      <Coins className="h-3 w-3" /> {item.credit_cost || "0"} CR
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
