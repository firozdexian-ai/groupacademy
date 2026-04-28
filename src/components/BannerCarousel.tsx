import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Visual Engagement Ingress (BannerCarousel)
 * CTO Reference: Authoritative node for high-frequency promotional assets.
 */

interface Banner {
  id: string;
  image_url: string;
  link_content_id: string | null;
  display_order: number;
}

interface BannerCarouselProps {
  compact?: boolean;
  placement?: string;
  className?: string;
}

export const BannerCarousel = ({ compact = false, placement = "carousel", className }: BannerCarouselProps) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentSlugs, setContentSlugs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    executeBannerSync();
  }, [placement]);

  // PROTOCOL: Neural Rotation (5s Interval)
  useEffect(() => {
    if (banners.length > 1) {
      const pulse = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(pulse);
    }
  }, [banners.length]);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  const executeBannerSync = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .eq("placement", placement)
        .order("display_order");

      if (error) throw error;

      if (data && data.length > 0) {
        setBanners(data);

        // SYNC: Slug Registry Handshake
        const contentIds = data.map((b) => b.link_content_id).filter((id): id is string => id !== null);
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
      }
    } catch (err) {
      console.error("INGRESS_FAULT: Carousel sync failed.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtifactSync = (banner: Banner) => {
    if (banner.link_content_id && contentSlugs[banner.link_content_id]) {
      navigate(`/app/learning/courses/${contentSlugs[banner.link_content_id]}`);
    }
  };

  if (isLoading || banners.length === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full rounded-[32px] overflow-hidden bg-muted group shadow-2xl transition-all duration-700 border-2 border-border/10",
        compact ? "aspect-[4/1]" : "aspect-[3/1]",
        className,
      )}
    >
      {/* HUD: BANNER_VIEWPORT */}
      <img
        src={banners[currentIndex].image_url}
        alt={`Institutional_Asset_${currentIndex + 1}`}
        className={cn(
          "w-full h-full object-cover transition-all duration-700 ease-in-out",
          imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          banners[currentIndex].link_content_id ? "cursor-pointer hover:scale-[1.02]" : "cursor-default",
        )}
        onLoad={() => setImageLoaded(true)}
        onClick={() => handleArtifactSync(banners[currentIndex])}
      />

      {/* COMPONENT: LOADING_GLOW */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-card/40 backdrop-blur-xl flex items-center justify-center">
          <Zap className="h-8 w-8 text-primary animate-pulse" />
        </div>
      )}

      {/* COMPONENT: NAVIGATION_OVERLAY */}
      {banners.length > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-background/20 backdrop-blur-xl border border-white/20 text-white hidden md:flex opacity-0 group-hover:opacity-100 transition-all hover:bg-background/40"
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-background/20 backdrop-blur-xl border border-white/20 text-white hidden md:flex opacity-0 group-hover:opacity-100 transition-all hover:bg-background/40"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* HUD: NEURAL_INDICATORS */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  index === currentIndex
                    ? "bg-primary w-8 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    : "bg-white/40 w-1.5 hover:bg-white/60",
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}

      {/* DECORATIVE: SYNC_STATUS */}
      <div className="absolute top-4 right-6 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-white" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Registry_Verified</span>
      </div>
    </div>
  );
};
