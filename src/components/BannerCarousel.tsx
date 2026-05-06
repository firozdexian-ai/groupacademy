import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BannerLightbox } from "@/components/feed/BannerLightbox";

/**
 * BannerCarousel — admin-managed promotional banners.
 * Supports static images, animated GIFs and muted auto-loop video,
 * each rendered inside a 3:1 frame with a configurable focal point.
 * Tap to expand into a full-bleed lightbox at the media's native ratio.
 */

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

const focalToObjectPosition: Record<string, string> = {
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
};

export const BannerCarousel = ({ compact = false, placement = "carousel", className }: BannerCarouselProps) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentSlugs, setContentSlugs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  useEffect(() => {
    if (banners.length > 1) {
      const t = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(t);
    }
  }, [banners.length]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select(
          "id, image_url, media_type, media_url, poster_url, link_url, link_content_id, cta_label, focal_point, display_order, start_at, end_at",
        )
        .eq("is_active", true)
        .eq("placement", placement)
        .order("display_order");

      if (error) throw error;

      const now = Date.now();
      const filtered = (data || []).filter((b: any) => {
        const startsOk = !b.start_at || new Date(b.start_at).getTime() <= now;
        const endsOk = !b.end_at || new Date(b.end_at).getTime() >= now;
        return startsOk && endsOk;
      }) as Banner[];

      setBanners(filtered);

      const contentIds = filtered.map((b) => b.link_content_id).filter((id): id is string => !!id);
      if (contentIds.length > 0) {
        const { data: contentData } = await supabase.from("content").select("id, slug").in("id", contentIds);
        if (contentData) {
          const registry: Record<string, string> = {};
          contentData.forEach((c) => {
            registry[c.id] = c.slug;
          });
          setContentSlugs(registry);
        }
      }
    } catch (err) {
      console.error("[BannerCarousel] load failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || banners.length === 0) return null;

  const banner = banners[currentIndex];
  const mediaType: MediaType = (banner.media_type as MediaType) || "image";
  const mediaUrl = banner.media_url || banner.image_url;
  const objectPosition = focalToObjectPosition[banner.focal_point || "center"] || "center";

  const handleTap = () => {
    // For video banners, open lightbox to play with sound at native ratio
    if (mediaType === "video") {
      setLightboxOpen(true);
      return;
    }
    if (banner.link_url) {
      window.open(banner.link_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (banner.link_content_id && contentSlugs[banner.link_content_id]) {
      navigate(`/app/learning/courses/${contentSlugs[banner.link_content_id]}`);
      return;
    }
    // No action defined → expand
    setLightboxOpen(true);
  };

  const isInteractive = !!banner.link_url || !!banner.link_content_id || mediaType === "video";

  return (
    <>
      <div
        className={cn(
          "relative w-full rounded-2xl overflow-hidden bg-muted group border border-border/40",
          compact ? "aspect-[4/1]" : "aspect-[3/1]",
          className,
        )}
      >
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            poster={banner.poster_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={cn("w-full h-full object-cover", isInteractive && "cursor-pointer")}
            style={{ objectPosition }}
            onClick={handleTap}
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className={cn("w-full h-full object-cover", isInteractive && "cursor-pointer")}
            style={{ objectPosition }}
            onClick={handleTap}
          />
        )}

        {/* CTA chip */}
        {banner.cta_label && (
          <button
            onClick={handleTap}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur text-foreground text-xs font-semibold shadow-sm hover:bg-background"
          >
            {banner.cta_label}
          </button>
        )}

        {/* Nav arrows (desktop) */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/40 backdrop-blur text-foreground hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((p) => (p === 0 ? banners.length - 1 : p - 1));
              }}
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/40 backdrop-blur text-foreground hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((p) => (p + 1) % banners.length);
              }}
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentIndex ? "bg-white w-5" : "bg-white/50 w-1.5",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BannerLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        posterUrl={banner.poster_url}
      />
    </>
  );
};
