import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  Briefcase,
  Building2,
  Code,
  HeartPulse,
  Megaphone,
  DollarSign,
  Palette,
  Gavel,
  Zap,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { listActiveProfessionCategoriesPreview } from "@/domains/learning/repo/learningRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Career Specialization Router (CareerTracksPreview)
 * Mid-ingress point for professional track segmentation.
 */

const PROFESSION_ICONS: Record<string, React.ElementType> = {
  sales: Megaphone,
  marketing: Megaphone,
  banking: Building2,
  finance: DollarSign,
  tech: Code,
  dev: Code,
  software: Code,
  healthcare: HeartPulse,
  medical: HeartPulse,
  design: Palette,
  creative: Palette,
  legal: Gavel,
  abroad: Globe,
  default: Briefcase,
};

function getIconForCategory(name: string = ""): React.ElementType {
  const lowerName = name.toLowerCase().trim();
  const match = Object.keys(PROFESSION_ICONS).find((key) => lowerName.includes(key));
  return match ? PROFESSION_ICONS[match] : PROFESSION_ICONS.default;
}

const TRACK_STYLES = [
  {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "group-hover:border-primary/30",
    shadow: "shadow-blue-500/5",
  },
  {
    bg: "bg-success/10",
    text: "text-success",
    border: "group-hover:border-success/30",
    shadow: "shadow-emerald-500/5",
  },
  {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "group-hover:border-accent/30",
    shadow: "shadow-violet-500/5",
  },
  {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "group-hover:border-warning/30",
    shadow: "shadow-amber-500/5",
  },
  {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "group-hover:border-destructive/30",
    shadow: "shadow-rose-500/5",
  },
];

export function CareerTracksPreview() {
  const navigate = useNavigate();

  // TanStack Server State Synchronization Query Hook (1-hour stale data configuration)
  const {
    data: tracks = [],
    isLoading,
    error: queryFetchError,
  } = useQuery({
    queryKey: ["career-tracks-preview"],
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug, icon, description")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      return data || [];
    },
  });

  // Instrument Incident Telemetry Metrics Over Query Exceptions
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "CareerTracksPreview",
        action: "fetch_profession_categories_preview",
      });
    }
  }, [queryFetchError]);

  // Log active visualization compilation parameters safely over metric streams
  useEffect(() => {
    if (tracks.length > 0) {
      trackEvent("career_tracks_preview_compiled", { renderedCount: tracks.length });
    }
  }, [tracks.length]);

  if (isLoading) {
    return (
      <section className="space-y-4 px-1 select-none w-full animate-pulse">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-5 w-36 rounded-lg opacity-60" />
          <Skeleton className="h-4 w-12 rounded opacity-30" />
        </div>
        <div className="flex gap-4 overflow-hidden w-full">
          {[1, 2, 3, 4, 5].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="h-32 w-[110px] rounded-2xl shrink-0 opacity-50" />
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  const handleTrackNavigationClick = (trackId: string, trackSlug: string) => {
    if (!trackSlug) return;
    trackEvent("career_tracks_preview_item_clicked", { trackId, trackSlug });
    navigate(`/app/learning/tracks/${trackSlug}`);
  };

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-full w-full select-none sm:select-text antialiased">
      {/* Navigation Section Header */}
      <div className="px-0.5 select-none w-full">
        <SectionHeader icon={Target} title="Career Tracks" viewAllPath="/app/learning/tracks" />
      </div>

      {/* Horizontal Multi-Track Portal Scroll Area Container */}
      <ScrollArea className="w-full whitespace-nowrap overflow-visible">
        <div className="flex gap-3.5 pb-4 pt-0.5 px-0.5 w-full">
          {tracks.map((trackItem, index) => {
            if (!trackItem || !trackItem.id) return null;

            const Icon = getIconForCategory(trackItem.name || "");
            const style = TRACK_STYLES[index % TRACK_STYLES.length];
            const displayLabel = trackItem.name ? trackItem.name.trim() : "Career Track";

            return (
              <Card
                key={trackItem.id}
                className={cn(
                  "group relative cursor-pointer transition-all duration-300 shrink-0 min-w-[110px] sm:w-[125px] rounded-2xl border border-border/40 overflow-hidden bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transform-gpu text-center",
                  "hover:shadow-md hover:-translate-y-1 active:scale-95",
                  style.border,
                  style.shadow,
                )}
                onClick={() => handleTrackNavigationClick(trackItem.id, trackItem.slug)}
              >
                {/* Decorative Backdrop Glow */}
                <div
                  className={cn(
                    "absolute -top-12 -right-12 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none select-none",
                    style.bg,
                  )}
                />

                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3.5 w-full">
                  {/* Mapped Graphic Icon Shield */}
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shadow-inner border border-background/5 transition-transform duration-500 group-hover:rotate-3 shrink-0 select-none",
                      style.bg,
                      style.text,
                    )}
                  >
                    <Icon className="h-5 w-5 stroke-[2.2]" />
                  </div>

                  {/* Metadata Text Layout Container */}
                  <div className="space-y-1.5 min-w-0 w-full flex flex-col justify-center">
                    <p className="font-bold text-[11px] sm:text-xs tracking-tight text-foreground/90 truncate max-w-full block leading-none pr-0.5 select-text selection:bg-primary/10">
                      {displayLabel}
                    </p>
                    <div className="flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0.5 select-none leading-none">
                      <Zap className={cn("h-3 w-3 fill-current stroke-[2.2]", style.text)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar
          orientation="horizontal"
          className="h-1.5 opacity-0 group-hover:opacity-100 transition-opacity invisible"
        />
      </ScrollArea>
    </section>
  );
}
