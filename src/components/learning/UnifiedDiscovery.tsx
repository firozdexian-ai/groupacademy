import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, FileText, ChevronRight, Sparkles } from "lucide-react";
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
  cover_image_url?: string | null;
  description?: string | null;
  credit_cost?: number | null;
  price?: number | null;
  reading_time?: number | null;
  event_date?: string | null;
}

const FILTER_OPTIONS: { value: ContentFilter; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "courses", label: "Courses", icon: BookOpen },
  { value: "events", label: "Events", icon: Calendar },
  { value: "blog", label: "Articles", icon: FileText },
];

const COURSE_TYPES: ContentType[] = ["batch_class", "recorded_course", "free_video"];
const EVENT_TYPES: ContentType[] = ["live_webinar", "offline_seminar"];

function isCourseType(type: string): boolean {
  return COURSE_TYPES.includes(type as ContentType);
}

function isEventType(type: string): boolean {
  return EVENT_TYPES.includes(type as ContentType);
}

function getTypeIcon(type: string) {
  if (isCourseType(type)) return BookOpen;
  if (isEventType(type)) return Calendar;
  if (type === "blog") return FileText;
  return BookOpen;
}

function getTypeBadgeColor(type: string) {
  if (isCourseType(type)) return "bg-primary/10 text-primary";
  if (isEventType(type)) return "bg-accent/10 text-accent-foreground";
  if (type === "blog") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function getTypeLabel(type: string): string {
  if (type === "recorded_course" || type === "free_video") return "Video";
  if (type === "batch_class") return "Course";
  if (type === "live_webinar") return "Webinar";
  if (type === "offline_seminar") return "Event";
  if (type === "blog") return "Article";
  return type;
}

export function UnifiedDiscovery() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["discovery-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, thumbnail_url, cover_image_url, description, credit_cost, price, content_type, event_date")
        .eq("is_published", true)
        .in("content_type", ["batch_class", "recorded_course", "free_video", "live_webinar", "offline_seminar"])
        .order("display_order")
        .limit(12);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        type: item.content_type as ContentType,
        thumbnail_url: item.thumbnail_url || item.cover_image_url,
        cover_image_url: item.cover_image_url,
        description: item.description,
        credit_cost: item.credit_cost,
        price: item.price,
        event_date: item.event_date,
      }));
    },
  });

  // Fetch blog posts
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
  
  const filteredItems = activeFilter === "all"
    ? allItems
    : allItems.filter((item) => {
        if (activeFilter === "courses") return isCourseType(item.type);
        if (activeFilter === "events") return isEventType(item.type);
        return item.type === activeFilter;
      });

  const isLoading = coursesLoading || blogsLoading;

  const handleItemClick = (item: ContentItem) => {
    if (item.type === "blog") {
      navigate(`/app/learning/blog/${item.slug}`);
    } else {
      navigate(`/app/learning/courses/${item.slug}`);
    }
  };

  const counts: Record<ContentFilter, number> = {
    all: allItems.length,
    courses: courses.filter((c) => isCourseType(c.type)).length,
    events: courses.filter((c) => isEventType(c.type)).length,
    blog: blogs.length,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Explore & Learn</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => navigate("/app/learning/courses")}
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const count = counts[option.value];
          const isActive = activeFilter === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-primary-foreground/20" : "bg-background"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No content found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.slice(0, 8).map((item) => {
            const Icon = getTypeIcon(item.type);
            
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                onClick={() => handleItemClick(item)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <Icon className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  {/* Type badge overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge className={cn("text-[10px]", getTypeBadgeColor(item.type))}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {item.type === "blog" && item.reading_time && (
                      <span>{item.reading_time} min read</span>
                    )}
                    {isCourseType(item.type) && (
                      <span>
                        {item.credit_cost && item.credit_cost > 0
                          ? `${item.credit_cost} credits`
                          : "Free"}
                      </span>
                    )}
                    {isEventType(item.type) && item.event_date && (
                      <span>{new Date(item.event_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
