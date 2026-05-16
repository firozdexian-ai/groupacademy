import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BannerLightbox } from "@/components/feed/BannerLightbox";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ChevronLeft, ChevronRight, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "image" | "gif" | "video";

interface Banner {
  id: string;
  image_url: string;
  media_type: MediaType | null;
  media_url: string | null;
  poster_url: string | null;
  link_url: string | null;
  link_content_id: string | null;
  cta_label: string | null;
  focal_point: string | null;
  display_order: number;
  start_at: string | null;
  end_at: string | null;
}

interface BannerCarouselProps {
  compact?: boolean;
  placement?: string;
  className?: string;
}

const FOCAL_TO_OBJECT_POSITION_MAP: Record<string, string> = {
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
};

/**
 * GroUp Academy: Authoritative Promotional Banner Carousel Ledger (BannerCarousel)
 * Operational component processing admin-managed media banners, asset formatting, and structural redirect handshakes.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function BannerCarousel({ compact = false, placement = "carousel", className }: BannerCarouselProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentSlugs, setContentSlugs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("banner_carousel_mounted", { placement });
    return () => {
      isMountedRef.current = false;
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [placement]);

  const loadBannersLedgerRegistry = async () => {
    if (isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const { data: bannersPayloadData, error: bannersQueryError } = await supabase
        .from("banners")
        .select(
          "id, image_url, media_type, media_url, poster_url, link_url, link_content_id, cta_label, focal_point, display_order, start_at, end_at",
        )
        .eq("is_active", true)
        .eq("placement", placement)
        .order("display_order", { ascending: true });

      if (bannersQueryError) throw bannersQueryError;

      const continuousCurrentEpochTimestampNum = Date.now();
      const synchronizedFilteredBannersList = (bannersPayloadData || []).filter((bannerItem: any) => {
        const isChronologyStartValidBool =
          !bannerItem.start_at || new Date(bannerItem.start_at).getTime() <= continuousCurrentEpochTimestampNum;
        const isChronologyEndValidBool =
          !bannerItem.end_at || new Date(bannerItem.end_at).getTime() >= continuousCurrentEpochTimestampNum;
        return isChronologyStartValidBool && isChronologyEndValidBool;
      }) as Banner[];

      // Invalidate target carousel configuration streams to avoid data layout drift cross-windows
      await queryClient.invalidateQueries({ queryKey: ["banners", placement] });

      if (!isMountedRef.current) return;
      setBanners(synchronizedFilteredBannersList);

      // Relational Extraction Pass: Gather mapped slugs concurrently to eliminate inline database waterfall delays
      const collectiveCourseRelationContentIdsArray = synchronizedFilteredBannersList
        .map((bItem) => bItem.link_content_id)
        .filter((idItem): idItem is string => !!idItem);

      if (collectiveCourseRelationContentIdsArray.length > 0) {
        const { data: coursesSlugPayloadData, error: coursesQueryError } = await supabase
          .from("content")
          .select("id, slug")
          .in("id", collectiveCourseRelationContentIdsArray);

        if (coursesQueryError) throw coursesQueryError;

        if (isMountedRef.current && coursesSlugPayloadData) {
          const structuredSlugsRegistryMap: Record<string, string> = {};
          coursesSlugPayloadData.forEach((courseRowItem) => {
            if (courseRowItem?.id && courseRowItem?.slug) {
              structuredSlugsRegistryMap[courseRowItem.id] = String(courseRowItem.slug).trim();
            }
          });
          setContentSlugs(structuredSlugsRegistryMap);
        }
      }
    } catch (caughtPipelineExceptionErr) {
      trackError(caughtPipelineExceptionErr, {
        component: "BannerCarousel",
        action: "load_banners_ledger_registry",
        placement,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBannersLedgerRegistry();
  }, [placement]);

  // Telemetry Rotation Loop Management: Self-correcting interval setup to isolate active sliders
  useEffect(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }

    if (banners.length > 1) {
      rotationTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setCurrentIndex((prevIndexNum) => (prevIndexNum + 1) % banners.length);
        }
      }, 5000);
    }

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [banners.length]);

  const handleNextBannerSlideTransition = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (banners.length > 0) {
        setCurrentIndex((prevIndexNum) => (prevIndexNum + 1) % banners.length);
      }
    },
    [banners.length],
  );

  const handlePrevBannerSlideTransition = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (banners.length > 0) {
        setCurrentIndex((prevIndexNum) => (prevIndexNum === 0 ? banners.length - 1 : prevIndexNum - 1));
      }
    },
    [banners.length],
  );

  const activeBannerObjectNode = useMemo(() => {
    return banners[currentIndex] || null;
  }, [banners, currentIndex]);

  if (isLoading || !activeBannerObjectNode) return null;

  const currentMediaFormatTypeStr: MediaType = (activeBannerObjectNode.media_type as MediaType) || "image";
  const compiledAssetTargetUrlStr = activeBannerObjectNode.media_url || activeBannerObjectNode.image_url;
  const synchronizedObjectFocalPositionCSSStr =
    FOCAL_TO_OBJECT_POSITION_MAP[activeBannerObjectNode.focal_point || "center"] || "center";

  const isInteractiveActionNodeBool =
    !!activeBannerObjectNode.link_url ||
    !!activeBannerObjectNode.link_content_id ||
    currentMediaFormatTypeStr === "video";

  const handleTapInteractionHandshake = () => {
    if (!activeBannerObjectNode) return;
    trackEvent("banner_carousel_tap_triggered", { id: activeBannerObjectNode.id, format: currentMediaFormatTypeStr });

    if (currentMediaFormatTypeStr === "video") {
      setLightboxOpen(true);
      return;
    }

    if (activeBannerObjectNode.link_url) {
      window.open(activeBannerObjectNode.link_url, "_blank", "noopener,noreferrer");
      return;
    }

    const associatedContentIdStr = activeBannerObjectNode.link_content_id;
    if (associatedContentIdStr && contentSlugs[associatedContentIdStr]) {
      navigate(`/app/learning/courses/${contentSlugs[associatedContentIdStr]}`);
      return;
    }

    // Default system backup track
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted group/carousel border border-border/40 transition-all select-none shadow-xs transform-gpu",
          compact ? "aspect-[4/1] sm:aspect-[4/1]" : "aspect-[2.5/1] sm:aspect-[3/1]",
          className,
        )}
      >
        {/* MEDIA INGRESS: DYNAMIC ROUTING ACCORDING TO SCHEMA SPECIFICATIONS */}
        {currentMediaFormatTypeStr === "video" ? (
          <video
            src={compiledAssetTargetUrlStr}
            poster={activeBannerObjectNode.poster_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onClick={handleTapInteractionHandshake}
            style={{ objectPosition: synchronizedObjectFocalPositionCSSStr }}
            className={cn(
              "w-full h-full object-cover select-none pointer-events-auto transform-gpu transition-transform duration-500 hover:scale-[1.005]",
              isInteractiveActionNodeBool && "cursor-pointer",
            )}
          />
        ) : (
          <img
            src={compiledAssetTargetUrlStr}
            alt=""
            loading="eager"
            onClick={handleTapInteractionHandshake}
            style={{ objectPosition: synchronizedObjectFocalPositionCSSStr }}
            className={cn(
              "w-full h-full object-cover select-none transform-gpu transition-transform duration-500 hover:scale-[1.005]",
              isInteractiveActionNodeBool && "cursor-pointer",
            )}
          />
        )}

        {/* HUD OVERLAY LEVEL 1: CALL TO ACTION FLOATING INTERACTION SECTOR */}
        {activeBannerObjectNode.cta_label && (
          <button
            type="button"
            onClick={handleTapInteractionHandshake}
            className="absolute bottom-3 left-3 px-3 h-7 rounded-full bg-background/90 backdrop-blur-md text-foreground font-bold text-[10px] sm:text-xs uppercase tracking-wide shadow-xs border border-border/10 transition-colors hover:bg-background cursor-pointer z-10"
          >
            {activeBannerObjectNode.cta_label}
          </button>
        )}

        {/* HUD OVERLAY LEVEL 2: NAVIGATION TRIGGER DECISION VECTOR CONTROLS */}
        {banners.length > 1 && (
          <>
            <Button
              size="icon"
              type="button"
              variant="ghost"
              onClick={handlePrevBannerSlideTransition}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border/20 bg-background/40 backdrop-blur-md text-foreground hidden md:flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-background/80"
              aria-label="Load prior promotional catalog slide node parameters"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </Button>

            <Button
              size="icon"
              type="button"
              variant="ghost"
              onClick={handleNextBannerSlideTransition}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border/20 bg-background/40 backdrop-blur-md text-foreground hidden md:flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-background/80"
              aria-label="Load proceeding promotional catalog slide node parameters"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </Button>

            {/* HUD OVERLAY LEVEL 3: SECTOR CAROUSEL SEQUENCE INDICATION CHIPS */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 select-none pointer-events-auto h-2">
              {banners.map((_, dotIndex) => {
                const isDotIndexActiveBool = dotIndex === currentIndex;
                return (
                  <button
                    key={dotIndex}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("banner_carousel_dot_selected", { index: dotIndex });
                      setCurrentIndex(dotIndex);
                    }}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300 border-none outline-none p-0 cursor-pointer",
                      isDotIndexActiveBool ? "bg-white w-4" : "bg-white/40 w-1.5 shadow-xs",
                    )}
                    aria-label={`Jump display frame focus view to banner slot index matrix ${dotIndex + 1}`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* FULL-SCREEN EXPANSION LIGHTBOX CANVAS PORTAL */}
      <BannerLightbox
        open={lightboxOpen}
        onClose={() => {
          trackEvent("banner_carousel_lightbox_closed");
          setLightboxOpen(false);
        }}
        mediaType={currentMediaFormatTypeStr}
        mediaUrl={compiledAssetTargetUrlStr}
        posterUrl={activeBannerObjectNode.poster_url}
      />
    </>
  );
}

export default BannerCarousel;
