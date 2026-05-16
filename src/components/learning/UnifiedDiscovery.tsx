import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calendar, FileText, ChevronRight, Sparkles, Zap, Clock, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Omni-Channel Discovery Node (UnifiedDiscovery)
 * An authoritative hub managing multi-origin content aggregation, filter segmentation, and predictive catalog routing.
 * Version: Launch Candidate · Phase Z0 Hardened
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
  { value: "all", label: "All Assets", icon: Sparkles },
  { value: "courses", label: "Curriculums", icon: BookOpen },
  { value: "events", label: "Engagements", icon: Calendar },
  { value: "blog", label: "Intel Posts", icon: FileText },
];

const COURSE_TYPES: ContentType[] = ["batch_class", "recorded_course", "free_video"];
const EVENT_TYPES: ContentType[] = ["live_webinar", "offline_seminar"];

const isCourseType = (type: string) => COURSE_TYPES.includes(type as ContentType);
const isEventType = (type: string) => EVENT_TYPES.includes(type as ContentType);

export function UnifiedDiscovery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");

  // Monitor macro discovery matrix panel tracking logs via analytics paths
  useEffect(() => {
    trackEvent("discovery_matrix_mounted", { activeFilterSegment: activeFilter });
  }, [activeFilter]);

  // 1. Ingress Pipeline Track A: Query active institutional content directories
  const {
    data: courses = [],
    isLoading: coursesLoading,
    error: coursesQueryError,
  } = useQuery({
    queryKey: ["discovery-courses"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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

  // 2. Ingress Pipeline Track B: Query active multi-tenant technical blog resources
  const {
    data: blogs = [],
    isLoading: blogsLoading,
    error: blogsQueryError,
  } = useQuery({
    queryKey: ["discovery-blogs"],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
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

  // Instrument continuous analytical tracking maps over internal server sub-query exceptions
  useEffect(() => {
    const primaryDiscoveryFetchError = coursesQueryError || blogsQueryError;
    if (primaryDiscoveryFetchError) {
      trackError(primaryDiscoveryFetchError, {
        component: "UnifiedDiscovery",
        action: "fetch_discovery_aggregated_datasets_api",
      });
    }
  }, [coursesQueryError, blogsQueryError]);

  // 3. High-Performance Memory Allocations: Enforce hard memoization over multi-origin array merging
  const allItems = useMemo<ContentItem[]>(() => {
    return [...courses, ...blogs];
  }, [courses, blogs]);

  const isLoading = coursesLoading || blogsLoading;

  const filteredItems = useMemo<ContentItem[]>(() => {
    if (activeFilter === "all") return allItems;
    return allItems.filter((item) => {
      if (activeFilter === "courses") return isCourseType(item.type);
      if (activeFilter === "events") return isEventType(item.type);
      return item.type === activeFilter;
    });
  }, [allItems, activeFilter]);

  const counts = useMemo<Record<ContentFilter, number>>(() => {
    return {
      all: allItems.length,
      courses: courses.filter((c) => isCourseType(c.type)).length,
      events: courses.filter((c) => isEventType(c.type)).length,
      blog: blogs.length,
    };
  }, [allItems.length, courses, blogs.length]);

  const handleDiscoveryRoutingProtocol = async (itemPayload: ContentItem) => {
    if (!itemPayload || !itemPayload.slug) return;

    const calculatedTargetUrlPathStr =
      itemPayload.type === "blog"
        ? `/app/learning/blog/${itemPayload.slug}`
        : `/app/learning/courses/${itemPayload.slug}`;

    trackEvent("discovery_matrix_item_executed", {
      itemId: itemPayload.id,
      itemType: itemPayload.type,
      targetUrl: calculatedTargetUrlPathStr,
    });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(calculatedTargetUrlPathStr);
    } catch (err) {
      trackError(err, {
        component: "UnifiedDiscovery",
        action: "execute_discovery_routing_callback",
        targetUrl: calculatedTargetUrlPathStr,
      });
    }
  };

  const handleAuditFullCatalogClick = () => {
    trackEvent("discovery_matrix_audit_all_clicked");
    navigate("/app/learning/courses");
  };

  if (isLoading) {
    return (
      <section className="space-y-4 px-0.5 select-none w-full animate-pulse text-left">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-6 w-44 rounded-lg opacity-60" />
          <Skeleton className="h-4 w-14 rounded opacity-30" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {[1, 2, 3, 4].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="aspect-[4/5] rounded-2xl opacity-40" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 antialiased text-left select-none sm:select-text max-w-full w-full">
      {/* HUD HEADER COVER BANNER CONTROL BAR STRIP */}
      <div className="flex items-center justify-between px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase tracking-wide flex items-center gap-2">
            <Zap className="h-4.5 w-4.5 text-primary fill-primary/10 animate-pulse stroke-[2.2]" />
            <span>Ecosystem Discovery Matrix</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1 leading-none">
            Synchronize workspace components with specialized institutional knowledge artifacts
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
         
          className="h-8 px-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider text-muted-foreground/80 hover:text-primary hover:bg-primary/5 cursor-pointer shadow-none shrink-0 flex items-center gap-0.5"
          onClick={handleAuditFullCatalogClick}
        >
          <span>Audit Full Matrix</span>
          <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </Button>
      </div>

      {/* TACTICAL PILLS FILTER RIG SECTOR SELECTION LAYER */}
      <div className="flex flex-wrap items-center gap-2 select-none w-full max-w-full">
        {FILTER_OPTIONS.map((optionItem) => {
          const countValueNum = counts[optionItem.value];
          const isFilterActive = activeFilter === optionItem.value;

          return (
            <button
              key={optionItem.value}
             
              onClick={() => setActiveFilter(optionItem.value)}
              className={cn(
                "h-8 px-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center gap-2 shadow-sm border transform-gpu active:scale-95",
                isFilterActive
                  ? "bg-primary border-transparent text-primary-foreground font-extrabold shadow-inner shadow-primary/10"
                  : "border-border/40 text-muted-foreground bg-background/50 hover:border-primary/20 hover:text-foreground",
              )}
            >
              <optionItem.icon className="h-3.5 w-3.5 stroke-[2.2] shrink-0" />
              <span>{optionItem.label}</span>
              {countValueNum > 0 && (
                <span
                  className={cn(
                    "ml-0.5 text-[9px] font-extrabold h-4 px-1.5 rounded-md border flex items-center justify-center font-mono leading-none tabular-nums shadow-sm select-none",
                    isFilterActive
                      ? "bg-primary-foreground/15 border-transparent text-primary-foreground"
                      : "bg-muted/60 border-border/20 text-muted-foreground",
                  )}
                >
                  {countValueNum}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ARTIFACT COMPILATION PRESENTATION VIEW GRID TRACK */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 select-none w-full max-w-full flex flex-col justify-center items-center animate-in fade-in duration-300">
          <FileText className="h-6 w-6 text-primary/40 mb-3 animate-pulse stroke-[2.2]" />
          <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide leading-none">
            Discovery Ledger Ingress Empty
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-xs mx-auto leading-normal mt-1.5 italic">
            No operational knowledge modules conform to this active validation sub-filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {filteredItems.slice(0, 12).map((itemRecord) => {
            if (!itemRecord || !itemRecord.id) return null;

            const isBlogTypeNode = itemRecord.type === "blog";
            const displayBadgeLabel = itemRecord.type ? itemRecord.type.replace(/_/g, " ") : "Specialized Target";

            return (
              <Card
                key={itemRecord.id}
               
                className="group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring w-full overflow-hidden flex flex-col justify-between transition-all duration-300 transform-gpu hover:border-primary/20 hover:bg-card/80 hover:shadow-md"
                onClick={() => handleDiscoveryRoutingProtocol(itemRecord)}
              >
                {/* Visual Imagery Snapshot Container Section Block */}
                <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden border-b border-border/10 select-none shrink-0 transform-gpu">
                  {itemRecord.thumbnail_url ? (
                    <img
                      src={itemRecord.thumbnail_url}
                      alt={`${itemRecord.title} profile cover illustration track snapshot`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102 border-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="h-6 w-6 text-primary/20 stroke-[2.2]" />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <Badge
                      variant="outline"
                      className="bg-background/95 backdrop-blur-sm border border-border/40 font-extrabold text-[9px] uppercase tracking-wide px-2 h-5 rounded shadow-sm text-foreground/90 select-none"
                    >
                      {displayBadgeLabel}
                    </Badge>
                  </div>
                </div>

                {/* Text Taxonomy Metadata Field Rows Panel */}
                <CardContent className="p-3.5 space-y-2.5 w-full min-w-0 flex-1 flex flex-col justify-between mt-auto">
                  <h3 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight leading-snug line-clamp-2 w-full group-hover:text-primary transition-colors pr-1 select-text">
                    {itemRecord.title}
                  </h3>

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/5 select-none font-bold text-[9px] tracking-wider uppercase text-muted-foreground/70 leading-none tabular-nums mt-auto w-full">
                    {isBlogTypeNode ? (
                      <span className="flex items-center gap-1 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded leading-none shrink-0">
                        <Clock className="h-3 w-3 text-primary stroke-[2.2]" />
                        <span>{itemRecord.reading_time || 3} min read insight</span>
                      </span>
                    ) : isEventType(itemRecord.type) ? (
                      <span className="flex items-center gap-1 bg-muted/40 border border-border/20 px-1.5 py-0.5 rounded leading-none shrink-0">
                        <Calendar className="h-3 w-3 text-primary stroke-[2.2]" />
                        <span>
                          {itemRecord.event_date
                            ? new Date(itemRecord.event_date).toLocaleDateString()
                            : "staged schedule bounds"}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-full px-2 py-0.5 text-primary font-extrabold shadow-sm leading-none shrink-0">
                        <Coins className="h-3 w-3 fill-primary/5 stroke-[2.2]" />
                        <span>{Number(itemRecord.credit_cost || 0).toLocaleString()} cr asset</span>
                      </span>
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
