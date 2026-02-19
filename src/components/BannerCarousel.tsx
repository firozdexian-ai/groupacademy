import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  image_url: string;
  link_content_id: string | null;
  display_order: number;
}

interface BannerCarouselProps {
  compact?: boolean;
}

export const BannerCarousel = ({ compact = false }: BannerCarouselProps) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentSlugs, setContentSlugs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Auto-rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Reset image loaded state when index changes
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .eq("placement", "carousel")
        .order("display_order");

      if (error) throw error;

      if (data && data.length > 0) {
        setBanners(data);

        // Fetch content slugs for linked banners
        const contentIds = data
          .map((b) => b.link_content_id)
          .filter((id): id is string => id !== null);

        if (contentIds.length > 0) {
          const { data: contentData } = await supabase
            .from("content")
            .select("id, slug")
            .in("id", contentIds);

          if (contentData) {
            const slugMap: Record<string, string> = {};
            contentData.forEach((c) => {
              slugMap[c.id] = c.slug;
            });
            setContentSlugs(slugMap);
          }
        }
      }
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_content_id && contentSlugs[banner.link_content_id]) {
      navigate(`/app/learning/courses/${contentSlugs[banner.link_content_id]}`);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (isLoading || banners.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "relative w-full rounded-xl overflow-hidden bg-muted group",
      compact ? "h-36 mb-3" : "h-48 sm:h-56 md:h-72 lg:h-[360px] mb-6"
    )}>
      {/* Banner Image with optimized loading */}
      <img
        src={banners[currentIndex].image_url}
        alt={`Banner ${currentIndex + 1}`}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onClick={() => handleBannerClick(banners[currentIndex])}
        style={{ cursor: banners[currentIndex].link_content_id ? 'pointer' : 'default' }}
      />

      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
